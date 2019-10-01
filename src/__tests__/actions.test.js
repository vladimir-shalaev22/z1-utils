import {withTypeAndStatus, withTypeWithoutStatus} from '../actions'
import {makeActionCreator} from '../actions'
import {SUCCESS, ERROR} from '../actions'

jest.mock('cuid', () => ({
  __esModule: true,
  default: jest.fn(() => 1618)
}))

describe('makeActionCreator(type, params, withId)', () => {
  test('Возвращает функцию (экшн-креатор)', () => {
    const actual = typeof makeActionCreator('test', [])
    expect(actual).toBe('function')
  })

  test('Экшн-креатор работает с заданным статусом', () => {
    const actionCreator = makeActionCreator('test', [])
    const actual = actionCreator(SUCCESS, {one: 'two'})
    expect(actual).toEqual({
      type: 'test',
      status: SUCCESS,
      payload: {one: 'two'}
    })
  })

  test('Экшн-креатор работает без статуса', () => {
    const actionCreator = makeActionCreator('test', ['one', 'two'])
    const actual = actionCreator(10, 50)
    expect(actual).toEqual({
      type: 'test',
      payload: {one: 10, two: 50}
    })
  })

  test('Экшн-креатор работает с одним параметром', () => {
    const actionCreator = makeActionCreator('test')
    const actual = actionCreator(100)
    expect(actual).toEqual({
      type: 'test',
      payload: 100
    })
  })

  test('Экшн-креатор работает без параметров', () => {
    const actionCreator = makeActionCreator('test')
    const actual = actionCreator()
    expect(actual).toEqual({type: 'test'})
    expect(actual).not.toHaveProperty('payload')
  })

  test('Экшн-креатор работает без параметров со статусом', () => {
    const actionCreator = makeActionCreator('test')
    const actual = actionCreator(SUCCESS)
    expect(actual).toEqual({type: 'test', status: SUCCESS})
    expect(actual).not.toHaveProperty('payload')
  })

  test('Добавляет в payload сгенерированный withId', () => {
    const acOnlyId = makeActionCreator('test', null, 'id')
    const acWithParams = makeActionCreator('test', ['gravity'], 'id')
    expect(acOnlyId()).toEqual({type: 'test', payload: 1618})
    expect(acOnlyId(ERROR)).toEqual({type: 'test', status: ERROR, payload: 1618})
    expect(acOnlyId(SUCCESS, {gravity: 1000}))
      .toEqual({type: 'test', status: SUCCESS, payload: {gravity: 1000, id: 1618}})
    expect(acOnlyId(100)).toEqual({type: 'test', payload: {value: 100, id: 1618}})
    expect(acWithParams(true)).toEqual({type: 'test', payload: {gravity: true, id: 1618}})
  })
})

describe('withTypeAndStatus(type, status)', () => {
  test('Возвращает функцию', () => {
    const actual = typeof withTypeAndStatus('test', SUCCESS)
    expect(actual).toBe('function')
  })

  test('Проверяет, что тип совпадает', () => {
    const test = withTypeAndStatus('test', SUCCESS)
    expect(test({type: 'test', status: SUCCESS})).toBe(true)
    expect(test({type: 'fail', status: SUCCESS})).toBe(false)
  })

  test('Проверяет, что статус совпадает', () => {
    const test = withTypeAndStatus('test', SUCCESS)
    expect(test({type: 'test', status: SUCCESS})).toBe(true)
    expect(test({type: 'test', status: ERROR})).toBe(false)
  })
})

describe('withTypeWithoutStatus(type)', () => {
  test('Возвращает функцию', () => {
    const actual = typeof withTypeWithoutStatus('test')
    expect(actual).toBe('function')
  })

  test('Проверяет, что тип совпадает', () => {
    const test = withTypeWithoutStatus('test')
    expect(test({type: 'test'})).toBe(true)
    expect(test({type: 'fail'})).toBe(false)
  })

  test('Проверяет, что тип статус не задан', () => {
    const test = withTypeWithoutStatus('test')
    expect(test({type: 'test'})).toBe(true)
    expect(test({type: 'test', status: SUCCESS})).toBe(false)
  })
})
