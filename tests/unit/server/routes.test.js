import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { CONTENT_TYPE, CONTROLLER_PAGE, HOME_PAGE, LOCATION } from '../../../server/config.js'
import Controller from '../../../server/controller.js'
import { BAD_REQUEST_ERROR } from '../../../server/errors.js'
import { requestListener } from '../../../server/routes.js'
import TestUtil from '../../_util/testUtil.js'


describe('#Routes - test suite for api response', () => {

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('GET / - should redirect to home page', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'
    await requestListener(...params.values())
    expect(params.response.writeHead).toBeCalledWith(302, {
      location: LOCATION.HOME
    })
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`GET /home - should respond with ${HOME_PAGE} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'
    const stream = TestUtil.generateReadableStream(['data'])
    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({ stream })
    jest.spyOn(stream, 'pipe').mockReturnValue()
    await requestListener(...params.values())
    expect(Controller.prototype.getFileStream).toBeCalledWith(HOME_PAGE)
    expect(stream.pipe).toHaveBeenCalledWith(params.response)
  })

  test(`GET /controller - should respond with ${CONTROLLER_PAGE} file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'
    const stream = TestUtil.generateReadableStream(['data'])
    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({ stream })
    jest.spyOn(stream, 'pipe').mockReturnValue()
    await requestListener(...params.values())
    expect(Controller.prototype.getFileStream).toBeCalledWith(CONTROLLER_PAGE)
    expect(stream.pipe).toHaveBeenCalledWith(params.response)
  })

  test('GET /stream - should respond with a writable stream', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/stream'
    const writable = await requestListener(...params.values())
    expect(writable).toBeInstanceOf(TestUtil.Writable)
    expect(params.request.once).toHaveBeenCalledWith('close', expect.any(Function))
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'audio/mpeg',
      'Accpept-Ranges': 'bytes',
      'Cache-Control': 'no-cache'
    })
  })

  test(`GET /index.html - should respond with file stream`, async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/index.html'
    const type = '.html'
    const stream = TestUtil.generateReadableStream(['data'])
    jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({ stream, type })
    jest.spyOn(stream, 'pipe').mockReturnValue()
    await requestListener(...params.values())
    expect(Controller.prototype.getFileStream).toBeCalledWith(params.request.url)
    expect(params.response.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': CONTENT_TYPE[type]
    })
    expect(stream.pipe).toHaveBeenCalledWith(params.response)
  })

  test('POST /controller - should respond ok', async () => {
    const params = TestUtil.defaultHandleParams()
    params.request.method = 'POST'
    params.request.url = '/controller'
    params.request.once = jest.fn((event, callback) => {
      if (event === 'data') callback('{"command":"applause"}')
    })
    jest.spyOn(Controller.prototype, 'handleCommand').mockResolvedValue()
    await requestListener(...params.values())
    expect(Controller.prototype.handleCommand).toHaveBeenCalledWith({ command: 'applause' })
    expect(params.response.writeHead).toHaveBeenCalledWith(200)
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('#Exceptions', () => {

    test(`GET /bad-request - given wrong data should respond 400`, async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/bad-request'
      jest.spyOn(Controller.prototype, 'getFileStream').mockRejectedValue(BAD_REQUEST_ERROR)
      await requestListener(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(400)
      expect(params.response.end).toHaveBeenCalled()
    })

    test(`GET /internal-server-error - given an error should respond 500`, async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/internal-server-error'
      jest.spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error('500 Internal Server Error'))
      await requestListener(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(500)
      expect(params.response.end).toHaveBeenCalled()
    })

    test(`GET /not-found - given a non-existent route should respond 404`, async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'GET'
      params.request.url = '/not-found'
      await requestListener(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

    test(`NOT_FOUND / - given a non-existent method should respond 404`, async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'NOT_FOUND'
      params.request.url = '/'
      await requestListener(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

    test(`POST /not-found - given a non-existent route should respond 404`, async () => {
      const params = TestUtil.defaultHandleParams()
      params.request.method = 'POST'
      params.request.url = '/not-found'
      await requestListener(...params.values())
      expect(params.response.writeHead).toHaveBeenCalledWith(404)
      expect(params.response.end).toHaveBeenCalled()
    })

  })

})