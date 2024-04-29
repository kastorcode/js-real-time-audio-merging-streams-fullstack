import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import Service from '../../../../public/controller/js/service.js'


describe('#Service - test suite for the processing/business rule layer', () => {

  const props = {
    url: ''
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test('makeRequest - should make a API request', async () => {
    global.fetch = jest.fn().mockResolvedValue('response')
    const service = new Service(props)
    const response = await service.makeRequest('applause')
    expect(global.fetch).toHaveBeenCalledWith(props.url, {
      method: 'POST', body: '{"command":"applause"}'
    })
    expect(response).toBe('response')
  })

})