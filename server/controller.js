import Service from './service.js'


export default class Controller {

  constructor () {
    this.service = new Service()
  }


  createClientStream () {
    const { id, stream } = this.service.createClientStream()
    const onClose = () => {
      this.service.removeClientStream(id)
    }
    return {
      stream, onClose
    }
  }


  /** @param {string} fileName */
  async getFileStream (fileName) {
    return this.service.getFileStream(fileName)
  }


  async handleCommand ({ command }) {
    const commands = {
      'fx': () => this.service.appendFxStream(command),
      'start': () => this.service.startStream(),
      'stop': () => this.service.stopStream()
    }
    const exec = commands[command] || commands.fx
    return await exec()
  }

}