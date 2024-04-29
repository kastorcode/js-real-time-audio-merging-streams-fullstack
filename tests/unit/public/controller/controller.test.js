import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import Controller from '../../../../public/controller/js/controller.js'


describe('#Controller - test suite for the intermediary between the presentation layer and the business layer', () => {

  const props = {
    service: {
      makeRequest: jest.fn()
    },
    view: {
      onLoad: jest.fn(),
      setButtonsOnClick: jest.fn()
    }
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test('init - should return a controller', () => {
    const controller = Controller.init(props)
    expect(controller).toBeInstanceOf(Controller)
  })

  test('commandReceived - should make a request passing a command', async () => {
    const controller = Controller.init(props)
    await controller.commandReceived('applause')
    expect(controller.service.makeRequest).toHaveBeenCalledWith('applause')
  })

  test('onLoad - should be called on init', () => {
    const controller = Controller.init(props)
    expect(controller.view.onLoad).toHaveBeenCalled()
    expect(controller.view.setButtonsOnClick).toHaveBeenCalledWith(expect.any(Function))
    const commandReceived = controller.view.setButtonsOnClick.mock.calls[0][0]
    expect(commandReceived.name).toBe('bound commandReceived')
    expect(commandReceived.length).toBe(controller.commandReceived.bind(controller).length)
  })

})