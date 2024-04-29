import { once } from 'node:events'
import { IncomingMessage, ServerResponse } from 'node:http'

import {
  CONTENT_TYPE, CONTROLLER_PAGE, HOME_PAGE, LOCATION
} from './config.js'
import Controller from './controller.js'
import { logger } from './util.js'


const controller = new Controller()


/**
 * @param {IncomingMessage} request 
 * @param {ServerResponse} response 
 */
export function requestListener (request, response) {
  return routes(request, response)
    .catch(error => errorHandler(request, response, error))
}


/**
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
async function routes (request, response) {
  const method = request.method.toLowerCase()
  const route = Methods[method] || Responses.notFound
  return route(request, response)
}


/**
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 * @param {Error} error
 */
function errorHandler (request, response, error) {
  const codes = {
    'BAD_REQUEST': Responses.badRequest,
    'ENOENT': Responses.notFound,
    'ERR_STREAM_PREMATURE_CLOSE': Responses.ok
  }
  const handler = codes[error.code] || function () {
    logger.error(error.message)
    logger.error(error.stack)
    return Responses.internalError(request, response)
  }
  return handler(request, response)
}


class Methods {

  /**
   * @param {IncomingMessage} request 
   * @param {ServerResponse} response 
   */
  static get (request, response) {
    const { url } = request
    const paths = {
      '/': () => {
        response.writeHead(302, { location: LOCATION.HOME })
        return response.end()
      },
      '/controller': async () => {
        const { stream } = await controller.getFileStream(CONTROLLER_PAGE)
        return stream.pipe(response)
      },
      '/home': async () => {
        const { stream } = await controller.getFileStream(HOME_PAGE)
        return stream.pipe(response)
      },
      '/stream': async () => {
        const { stream, onClose } = controller.createClientStream()
        request.once('close', onClose)
        response.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Accpept-Ranges': 'bytes',
          'Cache-Control': 'no-cache'
        })
        return stream.pipe(response)
      }
    }
    const path = paths[url] || function () {
      return serveFile(request, response)
    }
    return path()
  }


  /**
   * @param {IncomingMessage} request 
   * @param {ServerResponse} response 
   */
  static post (request, response) {
    const { url } = request
    const paths = {
      '/controller': async () => {
        const data = JSON.parse(await once(request, 'data'))
        await controller.handleCommand(data)
        return Responses.ok(request, response)
      }
    }
    const path = paths[url] || function () {
      return Responses.notFound(request, response)
    }
    return path()
  }

}


class Responses {

  /**
   * @param {IncomingMessage} request 
   * @param {ServerResponse} response 
   */
  static badRequest (request, response) {
    response.writeHead(400)
    return response.end()
  }


  /**
   * @param {IncomingMessage} request 
   * @param {ServerResponse} response 
   */
  static internalError (request, response) {
    response.writeHead(500)
    return response.end()
  }


  /**
   * @param {IncomingMessage} request 
   * @param {ServerResponse} response 
   */
  static notFound (request, response) {
    response.writeHead(404)
    return response.end()
  }


  /**
   * @param {IncomingMessage} request 
   * @param {ServerResponse} response 
   */
  static ok (request, response) {
    response.writeHead(200)
    return response.end()
  }

}


/**
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
async function serveFile (request, response) {
  const { stream, type } = await controller.getFileStream(request.url)
  response.writeHead(200, { 'Content-Type': CONTENT_TYPE[type] })
  return stream.pipe(response)
}