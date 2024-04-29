import { Transform } from 'node:stream'
import { setTimeout } from 'node:timers/promises'
import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import portfinder from 'portfinder'
import supertest from 'supertest'

import { SOX } from '../../../server/config.js'
import CreateServer from '../../../server/server.js'


const RETENTION_DATA_PERIOD = 100


function commandSender (testServer) {
  return async (command) => {
    return testServer.server.post('/controller').send({ command })
  }
}


async function getTestServer () {
  const port = await portfinder.getPortPromise()
  return new Promise((resolve, reject) => {
    const server = CreateServer().listen(port).once('error', reject).once('listening', () => {
      const response = {
        server: supertest(`http://localhost:${port}`),
        kill () {
          server.close()
        }
      }
      return resolve(response)
    })
  })
}


function pipeAndReadStreamData (stream, onChunk) {
  const transform = new Transform({
    transform: (chunk, encoding, callback) => {
      onChunk(chunk)
      callback(null, chunk)
    }
  })
  return stream.pipe(transform)
}


describe('#API E2E Suite Test', () => {

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  describe('client workflow', () => {

    test('GET /stream - should not receive data stream if the process is not playing', async () => {
      const testServer = await getTestServer()
      const onChunk = jest.fn()
      pipeAndReadStreamData(testServer.server.get('/stream'), onChunk)
      await setTimeout(RETENTION_DATA_PERIOD)
      testServer.kill()
      expect(onChunk).not.toBeCalled()
    })

    test('GET /stream - should receive data stream if the process is playing', async () => {
      const testServer = await getTestServer()
      const onChunk = jest.fn()
      const sender = commandSender(testServer)
      pipeAndReadStreamData(testServer.server.get('/stream'), onChunk)
      sender(SOX.COMMANDS.START)
      await setTimeout(RETENTION_DATA_PERIOD)
      sender(SOX.COMMANDS.STOP)
      await setTimeout(RETENTION_DATA_PERIOD)
      testServer.kill()
      const [[buffer]] = onChunk.mock.calls
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(1000)
    })

    test('POST /controller - should not break API if audio is not playing', async () => {
      const testServer = await getTestServer()
      const sender = commandSender(testServer)
      sender(SOX.COMMANDS.STOP)
      await setTimeout(RETENTION_DATA_PERIOD)
      sender('applause')
      await setTimeout(RETENTION_DATA_PERIOD)
      testServer.kill()
    })

  })

})