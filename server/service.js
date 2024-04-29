import child_process from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import { extname, join } from 'node:path'
import { PassThrough, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import Throttle from 'throttle'

import { FX_DIR, PUBLIC_DIR, SOX } from './config.js'
import { BAD_REQUEST_ERROR } from './errors.js'
import { logger } from './util.js'


export default class Service {

  constructor () {
    this.bitrate = 0
    this.clientStreams = new Map()
    this.readStream = null
    this.songPath = SOX.CONVERSATION
    this.throttle = null
  }


  appendFxStream (command) {
    const fxPath = this.getFxPath(command)
    const newThrottle = new Throttle(this.bitrate)
    pipeline(newThrottle, this.broadcast())
    this.throttle.on('unpipe', () => this.appendFxStreamOnUnpipe(fxPath, newThrottle))
    this.throttle.pause()
    this.readStream.unpipe(this.throttle)
  }


  appendFxStreamOnUnpipe (fxPath, newThrottle) {
    const newReadStream = this.mergeAudioStreams(fxPath, this.readStream)
    this.readStream = newReadStream
    this.throttle = newThrottle
    this.readStream.removeListener('unpipe', () => this.appendFxStreamOnUnpipe(fxPath, newThrottle))
    pipeline(newReadStream, newThrottle)
  }


  broadcast () {
    return new Writable({
      write: (chunk, encoding, callback) => {
        for (const [id, stream] of this.clientStreams) {
          if (stream.writableEnded) {
            this.clientStreams.delete(id)
            continue
          }
          stream.write(chunk)
        }
        callback()
      }
    })
  }


  createClientStream () {
    const id = randomUUID()
    const stream = new PassThrough()
    this.clientStreams.set(id, stream)
    return {
      id, stream
    }
  }


  /** @param {string} fileName */
  createFileStream (fileName) {
    return fs.createReadStream(fileName)
  }


  executeSoxCommand (args) {
    return child_process.spawn('sox', args)
  }


  async getBitrate (filePath) {
    try {
      const args = ['--i', '-B', filePath]
      const { stdout, stderr } = this.executeSoxCommand(args)
      await Promise.all([once(stdout, 'readable'), once(stderr, 'readable')])
      const [success, error] = [stdout, stderr].map(stream => stream.read())
      if (error) await Promise.reject(error)
      return success.toString().trim().replace(/k/, '000')
    }
    catch (error) {
      logger.error(error)
      return SOX.FALLBACK_BITRATE
    }
  }


  /** @param {string} fileName */
  async getFileInfo (fileName) {
    const name = join(PUBLIC_DIR, fileName)
    await fsPromises.access(name)
    const type = extname(name)
    return {
      name, type
    }
  }


  /** @param {string} fileName */
  async getFileStream (fileName) {
    const { name, type } = await this.getFileInfo(fileName)
    const stream = this.createFileStream(name)
    return {
      stream, type
    }
  }


  /** @param {string} fileName */
  getFxPath (fileName) {
    const filePath = join(FX_DIR, `${fileName}.mp3`)
    if (!fs.existsSync(filePath)) throw BAD_REQUEST_ERROR
    return filePath
  }


  mergeAudioStreams (fxPath, readStream) {
    const transform = new PassThrough()
    const args = [
      '-t', SOX.AUDIO_MEDIA_TYPE,
      '-v', SOX.SONG_VOLUME,
      '-m', '-',
      '-t', SOX.AUDIO_MEDIA_TYPE,
      '-v', SOX.FX_VOLUME,
      fxPath,
      '-t', SOX.AUDIO_MEDIA_TYPE,
      '-'
    ]
    const { stdin, stdout } = this.executeSoxCommand(args)
    pipeline(readStream, stdin)
    pipeline(stdout, transform)
    return transform
  }


  /** @param {`${string}-${string}-${string}-${string}-${string}`} id */
  removeClientStream (id) {
    this.clientStreams.delete(id)
  }


  async startStream () {
    const bitrate = this.bitrate = await this.getBitrate(this.songPath) / SOX.BITRATE_DIVISOR
    const throttle = this.throttle = new Throttle(bitrate)
    const readStream = this.readStream = this.createFileStream(this.songPath)
    return pipeline(readStream, throttle, this.broadcast())
  }


  async stopStream () {
    // this.throttle?.end?.()
    this.readStream.destroy()
  }

}