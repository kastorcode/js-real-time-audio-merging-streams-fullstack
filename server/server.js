import { createServer } from 'node:http'

import { requestListener } from './routes.js'


export default () => createServer(requestListener)