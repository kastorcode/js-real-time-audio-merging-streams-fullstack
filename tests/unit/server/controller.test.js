import { ReadStream } from 'node:fs'
import { PassThrough } from 'node:stream'
import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { HOME_PAGE } from '../../../server/config'
import Controller from '../../../server/controller.js'


describe('#Controller - test suite for the intermediary between the presentation layer and the business layer', () => {

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('createClientStream - should create a client stream', () => {
    const controller = new Controller()
    const { stream, onClose } = controller.createClientStream()
    expect(stream).toBeInstanceOf(PassThrough)
    expect(onClose).toBeInstanceOf(Function)
    jest.spyOn(controller.service, 'removeClientStream').mockReturnValue()
    onClose()
    expect(controller.service.removeClientStream).toHaveBeenCalled()
  })

  test('getFileStream - should get a file stream', async () => {
    const controller = new Controller()
    const { stream, type } = await controller.getFileStream(HOME_PAGE)
    expect(stream).toBeInstanceOf(ReadStream)
    expect(type).toStrictEqual('.html')
  })

  test('handleCommand - should handle radio controller commands', async () => {
    const controller = new Controller()
    jest.spyOn(controller.service, 'appendFxStream').mockReturnValue()
    await controller.handleCommand({ command: 'applause' })
    expect(controller.service.appendFxStream).toHaveBeenCalledWith('applause')
    jest.spyOn(controller.service, 'startStream').mockResolvedValue()
    await controller.handleCommand({ command: 'start' })
    expect(controller.service.startStream).toHaveBeenCalled()
    jest.spyOn(controller.service, 'stopStream').mockResolvedValue()
    await controller.handleCommand({ command: 'stop' })
    expect(controller.service.stopStream).toHaveBeenCalled()
  })

})