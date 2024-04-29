export default class Controller {

  constructor ({ service, view }) {
    this.service = service
    this.view = view
  }


  static init (props) {
    const controller = new Controller(props)
    controller.onLoad()
    return controller
  }


  async commandReceived (command) {
    return this.service.makeRequest(command)
  }


  onLoad () {
    this.view.onLoad()
    this.view.setButtonsOnClick(this.commandReceived.bind(this))
  }

}