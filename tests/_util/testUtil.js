import { ChildProcess } from 'node:child_process'
import { ReadStream } from 'node:fs'
import { PassThrough, Readable, Transform, Writable } from 'node:stream'
import { jest } from '@jest/globals'


export default class TestUtil {

  static ChildProcess = ChildProcess
  static PassThrough = PassThrough
  static ReadStream = ReadStream
  static Transform = Transform
  static Writable = Writable


  static defaultHandleParams () {
    const readable = TestUtil.generateReadableStream(['request body'])
    const writable = TestUtil.generateWritableStream(() => {})
    const data = {
      request: Object.assign(readable, {
        headers: {},
        method: '',
        once: jest.fn(),
        url: ''
      }),
      response: Object.assign(writable, {
        writeHead: jest.fn(),
        end: jest.fn()
      })
    }
    return {
      values: () => Object.values(data),
      ...data
    }
  }


  static generateReadableStream (data) {
    return new Readable({
      read () {
        for (const item of data) {
          this.push(item)
        }
        this.push(null)
      }
    })
  }


  static generateTransformStream () {
    return new Transform()
  }


  static generateWritableStream (onData) {
    return new Writable({
      write (chunk, encoding, callback) {
        onData(chunk)
        callback(null, chunk)
      }
    })
  }


  static sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

}