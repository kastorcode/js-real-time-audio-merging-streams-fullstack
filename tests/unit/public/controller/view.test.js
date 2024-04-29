import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import { JSDOM } from 'jsdom'

import View from '../../../../public/controller/js/view.js'


describe('#View - test suite for visualization layer', () => {

  const dom = new JSDOM()
  global.window = dom.window
  global.document = dom.window.document

  function makeButtonElement (props = {}) {
    return {
      classList: {
        add: jest.fn(),
        contains: jest.fn(),
        remove: jest.fn()
      },
      id: props.id || null,
      innerText: props.innerText || '',
      onclick: jest.fn()
    }
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    jest.spyOn(document, 'getElementById')
      .mockReturnValue(makeButtonElement())
  })

  test('changeCommandButtonsVisibility - given hide=true should add unassigned class and reset onclick', () => {
    const view = new View()
    const button = makeButtonElement()
    jest.spyOn(document, 'querySelectorAll')
      .mockReturnValue([button])
    view.changeCommandButtonsVisibility(true)
    expect(button.classList.add).toHaveBeenCalledWith('unassigned')
    expect(() => button.onclick()).not.toThrow()
  })

  test('changeCommandButtonsVisibility - given hide=false should remove unassigned class and reset onclick', () => {
    const view = new View()
    const button = makeButtonElement()
    jest.spyOn(document, 'querySelectorAll')
      .mockReturnValue([button])
    view.changeCommandButtonsVisibility(false)
    expect(button.classList.add).not.toHaveBeenCalled()
    expect(button.classList.remove).toHaveBeenCalledWith('unassigned')
    expect(() => button.onclick()).not.toThrow()
  })

  test('onLoad', () => {
    const view = new View()
    jest.spyOn(view, view.changeCommandButtonsVisibility.name).mockReturnValue()
    view.onLoad()
    expect(view.changeCommandButtonsVisibility).toHaveBeenCalled()
  })

  test('setButtonsOnClick - given button with id should set onclick', () => {
    const applauseButton = makeButtonElement({ id: 'applause' })
    const startButton = makeButtonElement({ id: 'start' })
    const stopButton = makeButtonElement({ id: 'stop' })
    jest.spyOn(document, 'querySelectorAll')
      .mockReturnValue([applauseButton, startButton, stopButton])
    const view = new View()
    jest.spyOn(view, 'changeCommandButtonsVisibility').mockReturnValue()
    jest.spyOn(view, 'toggleButtonStart').mockReturnValue()
    jest.spyOn(view, 'toggleDisableButton').mockReturnValue()
    view.setButtonsOnClick(buttonId => {
      expect(['applause', 'start', 'stop'].includes(buttonId)).toBe(true)
    })
    applauseButton.onclick()
    expect(view.toggleDisableButton).toHaveBeenCalledWith(applauseButton.classList)
    startButton.onclick()
    expect(view.toggleButtonStart).toHaveBeenCalledWith(true)
    expect(view.changeCommandButtonsVisibility).toHaveBeenCalledWith(false)
    stopButton.onclick()
    expect(view.toggleButtonStart).toHaveBeenCalledWith(false)
    expect(view.changeCommandButtonsVisibility).toHaveBeenCalledWith(true)
  })

  test('toggleButtonStart - should hide/show start/stop buttons', () => {
    const view = new View()
    jest.spyOn(view.buttonStart.classList, 'add').mockReturnValue()
    jest.spyOn(view.buttonStart.classList, 'remove').mockReturnValue()
    jest.spyOn(view.buttonStop.classList, 'add').mockReturnValue()
    jest.spyOn(view.buttonStop.classList, 'remove').mockReturnValue()
    view.toggleButtonStart(true)
    expect(view.buttonStart.classList.add).toHaveBeenCalledWith('hidden')
    expect(view.buttonStop.classList.remove).toHaveBeenCalledWith('hidden')
    view.toggleButtonStart(false)
    expect(view.buttonStop.classList.add).toHaveBeenCalledWith('hidden')
    expect(view.buttonStart.classList.remove).toHaveBeenCalledWith('hidden')
  })

  test('toggleDisableButton - should add/remove active button class', () => {
    const view = new View()
    const buttonTrue = makeButtonElement()
    jest.spyOn(buttonTrue.classList, 'contains').mockReturnValue(true)
    view.toggleDisableButton(buttonTrue.classList)
    expect(buttonTrue.classList.remove).toHaveBeenCalledWith('active')
    expect(buttonTrue.classList.add).not.toHaveBeenCalled()
    const buttonFalse = makeButtonElement()
    jest.spyOn(buttonFalse.classList, 'contains').mockReturnValue(false)
    view.toggleDisableButton(buttonFalse.classList)
    expect(buttonFalse.classList.add).toHaveBeenCalledWith('active')
    expect(buttonFalse.classList.remove).not.toHaveBeenCalled()
  })

  test('unassignedButton - should return true if button has unassigned class', () => {
    const view = new View()
    const buttonTrue = makeButtonElement()
    const buttonFalse = makeButtonElement()
    buttonTrue.classList = ['unassigned']
    expect(view.unassignedButton(buttonTrue)).toBe(true)
    expect(view.unassignedButton(buttonFalse)).toBe(false)
  })

})