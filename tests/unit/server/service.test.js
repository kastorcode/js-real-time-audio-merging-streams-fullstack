import { join } from 'node:path'
import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { FX_DIR, HOME_PAGE, PUBLIC_DIR, SOX } from '../../../server/config.js'
import { BAD_REQUEST_ERROR } from '../../../server/errors.js'
import Service from '../../../server/service.js'
import TestUtil from '../../_util/testUtil.js'


describe('#Service - test suite for business rules and processing', () => {

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('appendFxStream - should append audio effect in a stream', () => {
    const service = new Service()
    service.throttle = {
      on: jest.fn(),
      pause: jest.fn()
    }
    service.readStream = {
      unpipe: jest.fn()
    }
    jest.spyOn(service, 'getFxPath').mockReturnValue('fxPath')
    jest.spyOn(service, 'broadcast').mockReturnValue(TestUtil.generateWritableStream())
    jest.spyOn(service.throttle, 'on').mockReturnValue()
    jest.spyOn(service.throttle, 'pause').mockReturnValue()
    jest.spyOn(service.readStream, 'unpipe').mockReturnValue()
    service.appendFxStream('applause')
    expect(service.getFxPath).toHaveBeenCalledWith('applause')
    expect(service.broadcast).toHaveBeenCalled()
    expect(service.throttle.on).toHaveBeenCalledWith('unpipe', expect.any(Function))
    expect(service.throttle.pause).toHaveBeenCalled()
    expect(service.readStream.unpipe).toHaveBeenCalledWith(service.throttle)
  })

  test('appendFxStreamOnUnpipe - should be called on throttle unpipe', () => {
    const service = new Service()
    const transform = TestUtil.generateTransformStream()
    jest.spyOn(service, 'mergeAudioStreams').mockReturnValue(transform)
    service.appendFxStreamOnUnpipe('fxPath', transform)
    expect(service.mergeAudioStreams).toHaveBeenCalledWith('fxPath', null)
    expect(service.readStream).toBe(transform)
    expect(service.throttle).toBe(transform)
  })

  test('broadcast - should return a writable stream', () => {
    const service = new Service()
    const writable = service.broadcast()
    expect(writable).toBeInstanceOf(TestUtil.Writable)
  })

  test('broadcast.write - should write chunk on stream', () => {
    const service = new Service()
    const { stream } = service.createClientStream()
    const writable = service.broadcast()
    writable.on('finish', () => {
      expect(stream.writableEnded).toBe(true)
      expect(writable.writableEnded).toBe(true)
    })
    writable.write('chunk', 'utf8', () => {
      stream.end()
      writable.end('last_chunk')
    })
  })

  test('createClientStream - should create a client stream', () => {
    const service = new Service()
    const { id, stream } = service.createClientStream()
    expect(service.clientStreams.size).toBe(1)
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(stream).toBeInstanceOf(TestUtil.PassThrough)
  })

  test('createFileStream - should create a file stream', () => {
    const service = new Service()
    const readStream = service.createFileStream(join(PUBLIC_DIR, HOME_PAGE))
    expect(readStream).toBeInstanceOf(TestUtil.ReadStream)
  })

  test('executeSoxCommand - should execute a sox command', () => {
    const service = new Service()
    const result = service.executeSoxCommand(['--help'])
    expect(result).toBeInstanceOf(TestUtil.ChildProcess)
  })

  test('getBitrate - should get a bitrate', async () => {
    const service = new Service()
    const bitrate = await service.getBitrate(join(FX_DIR, 'applause.mp3'))
    expect(bitrate).toBe(SOX.FALLBACK_BITRATE)
  })

  test('getBitrate.error - given an error should get a bitrate', async () => {
    const service = new Service()
    const bitrate = await service.getBitrate(null)
    expect(bitrate).toBe(SOX.FALLBACK_BITRATE)
  })

  test('getFileInfo - should get a file info', async () => {
    const service = new Service()
    const fileInfo = await service.getFileInfo(HOME_PAGE)
    expect(fileInfo).toMatchObject({
      name: join(PUBLIC_DIR, HOME_PAGE), type: '.html'
    })
  })

  test('getFileStream - should get a file stream', async () => {
    const service = new Service()
    const { stream, type } = await service.getFileStream(HOME_PAGE)
    expect(stream).toBeInstanceOf(TestUtil.ReadStream)
    expect(type).toBe('.html')
  })

  test('getFxPath - should get a fx file path', () => {
    const service = new Service()
    const fxPath = service.getFxPath('applause')
    expect(fxPath).toBe(join(FX_DIR, 'applause.mp3'))
  })

  test('getFxPath.error - should throw a bad request error', () => {
    const service = new Service()
    expect(() => service.getFxPath(null)).toThrow(BAD_REQUEST_ERROR)
  })

  test('mergeAudioStreams - should merge two audio streams', () => {
    const service = new Service()
    const passThrough = service.mergeAudioStreams(service.getFxPath('applause'), TestUtil.generateReadableStream(['0']))
    expect(passThrough).toBeInstanceOf(TestUtil.PassThrough)
  })

  test('removeClientStream - should remove a client stream', () => {
    const service = new Service()
    const { id } = service.createClientStream()
    expect(service.clientStreams.size).toBe(1)
    service.removeClientStream(id)
    expect(service.clientStreams.size).toBe(0)
  })

  test('startStream - should start broadcasting the stream', async () => {
    const service = new Service()
    const pipeline = service.startStream()
    expect(pipeline).toBeInstanceOf(Promise)
    await TestUtil.sleep(100)
    expect(service.bitrate).toBe(await service.getBitrate(SOX.CONVERSATION) / SOX.BITRATE_DIVISOR)
    expect(service.throttle).toBeInstanceOf(TestUtil.Transform)
    expect(service.readStream).toBeInstanceOf(TestUtil.ReadStream)
  })

  test('stopStream - should stop broadcasting the stream', async () => {
    const service = new Service()
    service.readStream = {
      destroy: jest.fn()
    }
    await service.stopStream()
    expect(service.readStream.destroy).toHaveBeenCalled()
  })

})