import {encodeQueryParams, encodeBodyParams, withRouteParams} from '../api'
import {makeQuery, makeQueryUrl, makeStubQuery} from '../api'
import {from, Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {ajax} from 'rxjs/ajax'

jest.mock('rxjs/ajax', () => {
  const {from} = require('rxjs')
  const {map} = require('rxjs/operators')
  return {
    ajax: jest.fn(() => from([{response: {status: 'done'}}]))
  }
})

jest.useFakeTimers()

jest.mock('../config', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      host: 'http://localhost:8080',
      endpoints: {
        stars: {
          sun: '/stars/sun',
          other: '/stars/other/:name'
        },
        moon: {
          main: '/moon'
        }
      }
    }))
  }
})

describe('encodeQueryParams(params)', () => {
  test('Возвращает пустую строку, если параметры пусты', () => {
    const actual = encodeQueryParams({})
    expect(actual).toBe('')
  })

  test('Кодирует простые параметры', () => {
    const actual = encodeQueryParams({
      sun: 'star',
      moon: 'satellite'
    })
    expect(actual).toBe('sun=star&moon=satellite')
  })

  test('Кодирует "опасные параметры" параметры', () => {
    const actual = encodeQueryParams({
      sun: 'star & light',
      moon: 'satellite & night'
    })
    expect(actual).toBe('sun=star%20%26%20light&moon=satellite%20%26%20night')
  })

  test('Кодирует массивы', () => {
    const actual = encodeQueryParams({
      sun: 'star',
      otherStars: [
        'Proxima Centauri',
        'Epsilon Eridani'
      ]
    })
    expect(actual).toBe(
      'sun=star&otherStars[]=Proxima%20Centauri&' +
      'otherStars[]=Epsilon%20Eridani'
    )
  })
})

describe('encodeBodyParams(params)', () => {
  test('Кодирует параметры в JSON', () => {
    const params = {
      sun: {
        isStar: true,
        value: 4.83
      }
    }
    const actual = encodeBodyParams(params)
    expect(actual).toEqual(JSON.stringify(params))
  })
})

describe('withRouteParams(path, params)', () => {
  test('Возвращает строку без изменений, если нет параметров', () => {
    const actual = withRouteParams('/test', {})
    expect(actual).toBe('/test')
  })

  test('Подставляет значения параметров в строку', () => {
    const params = {name: 'centaurus', id: 'lft-1110'}
    const actual = withRouteParams('/test/:name/:id', params)
    expect(actual).toBe('/test/centaurus/lft-1110')
  })

  test('Возвращает ошибку, если требуемый параметр не задан', () => {
    expect(() => {
      const params = {name: 'centaurus'}
      const actual = withRouteParams('/test/:name/:id', params)
    }).toThrow()
  })
})

describe('makeQueryUrl(route, params)', () => {
  test('Возвращает Url для роутов без параметров', () => {
    const actual = makeQueryUrl('stars.sun')
    expect(actual).toBe('http://localhost:8080/stars/sun')
  })

  test('Возвращает Url для роутов с параметрами', () => {
    const actual = makeQueryUrl('stars.other', {name: 123})
    expect(actual).toBe('http://localhost:8080/stars/other/123')
  })

  test('Возвращает Url с query-параметрами', () => {
    const actual = makeQueryUrl('stars.sun', null, {name: 123})
    expect(actual).toBe('http://localhost:8080/stars/sun?name=123')
  })
})

describe('makeQuery(method, route, mapParams)', () => {
  test('Возвращает функцию', () => {
    const actual = typeof makeQuery('GET', 'stars.sun', jest.fn())
    expect(actual).toBe('function')
  })

  test('Возвращенная функция: запрашивает GET с queryParams', () => {
    const mapParams = (params) => ({queryParams: params})
    makeQuery('GET', 'stars.sun', mapParams)({is_bright: true})
    expect(ajax).toBeCalledWith({
      url: 'http://localhost:8080/stars/sun?is_bright=true',
      method: 'GET'
    })
  })

  test('Возвращенная функция: запрашивает GET с routeParams', () => {
    const mapParams = (params) => ({routeParams: params})
    makeQuery('GET', 'stars.other', mapParams)({name: '345'})
    expect(ajax).toBeCalledWith({
      url: 'http://localhost:8080/stars/other/345',
      method: 'GET'
    })
  })

  test('Возвращенная функция: запрашивает GET с токеном', () => {
    makeQuery('GET', 'stars.sun')(null, 'authToken')
    expect(ajax).toBeCalledWith({
      url: 'http://localhost:8080/stars/sun',
      headers: {
        'Authorization': 'Bearer authToken'
      },
      method: 'GET'
    })
  })

  test('Возвращенная функция: запрашивает POST с JSON', () => {
    const mapParams = (params) => ({bodyParams: params})
    makeQuery('POST', 'stars.sun', mapParams)({planet: 'Earth'})
    expect(ajax).toBeCalledWith({
      url: 'http://localhost:8080/stars/sun',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        planet: 'Earth'
      }
    })
  })

  test('Возвращенная функция: запрашивает PUT с JSON', () => {
    const mapParams = (params) => ({
      bodyParams: params,
      routeParams: {name: params.id}
    })
    const query = makeQuery('PUT', 'stars.other', mapParams)
    query({id: 345, star: 'Proxima'}, 'authToken')
    expect(ajax).toBeCalledWith({
      url: 'http://localhost:8080/stars/other/345',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer authToken'
      },
      body: {
        id: 345,
        star: 'Proxima'
      }
    })
  })

  test('Полученный Observable возвращает response', () => {
    const query = makeQuery('GET', 'stars.sun')
    const handleResult = jest.fn()
    query({is_bright: true}).subscribe(handleResult)
    expect(handleResult).toBeCalledWith({status: 'done'})
  })
})

describe('makeStubQuery(method, route, response)', () => {
  test('Возвращает функцию', () => {
    const actual = typeof makeStubQuery('GET', 'stars.all', {})
    expect(actual).toBe('function')
  })

  test('Сконструированная функция возвращает Observable', () => {
    const query = makeStubQuery('GET', 'stars.all', {})
    expect(query()).toBeInstanceOf(Observable)
  })

  test('Возвращает response по истечении некоторого времени', () => {
    const response = {status: 'ok'}
    const query = makeStubQuery('GET', 'stars.all', response)
    const callback = jest.fn()
    query().subscribe(callback)
    expect(callback).not.toBeCalled()
    jest.runAllTimers()
    expect(callback).toBeCalledWith(response)
  })
})
