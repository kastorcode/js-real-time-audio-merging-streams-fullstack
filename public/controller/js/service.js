export default class Service {

  constructor ({ url }) {
    this.url = url
  }


  async makeRequest (command) {
    const response = await fetch(this.url, {
      method: 'POST',
      body: JSON.stringify({ command })
    })
    return response
  }

}