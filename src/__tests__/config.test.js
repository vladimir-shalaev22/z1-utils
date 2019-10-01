import getConfig from '../config'

describe('getConfig(package[, config])', () => {
  test('Имеет конфигурацию по-умолчанию', () => {
    expect(() => {
      const actual = getConfig('test')
    }).not.toThrow()
  })

  test('Возвращает "{}", если пакет не найден', () => {
    const actual = getConfig('test', {})
    expect(actual).toEqual({})
  })

  test('Возвращает пакет, если он присутствует в конфигурации', () => {
    const test = {
      moon: 'satellite',
      sun: 'star'
    }
    const actual = getConfig('test', {test})
    expect(actual).toEqual(test)
  })
})
