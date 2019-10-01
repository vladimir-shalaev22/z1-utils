import cuid from 'cuid'

/** @module utils/actions */

// Status constants for multistage actions (i.e. fetch-requests)
// All consts starts with prefix "status/". Method makeActionCreator
// need the way to distinguish status values from other

/** @typedef {string} ActionStatus */

/** @const {ActionStatus} - Declarates that operation done */
export const SUCCESS = 'status/success'

/** @const {ActionStatus} - Declarates that operation failed */
export const ERROR = 'status/error'

/**
 * @callback actionCreator
 * @param {(ActionStatus|...*)} statusOrParams - статус или параметры
 * @param {*} [payload] - полезная нагрузка (если указан статус)
 */

/**
 * Function that make action creator with a given type and params
 * @param {string} type - redux action type
 * @param {string[]} params - a list of params' names
 * @param {boolean} [withId] - generate id or not
 * @return {actionCreator} action creator
 * @example <caption>Make action creator with params</caption>
 * const actionCreator = makeActionCreator('test/creator', ['sun', 'moon'])
 * actionCreator('star', 'satellite')
 * // Returns:
 * // {
 * //   type: 'test/creator',
 * //   payload: {
 * //     sun: 'start',
 * //     moon: 'satellite'
 * //   }
 * // }
 * @example <caption>Make action creator without params</caption>
 * const actionCreator = makeActionCreator('test/creator')
 * actionCreator('star', 'satellite')
 * // Returns:
 * // {
 * //   type: 'test/creator',
 * //   payload: 'star'
 * // }
 * @example <caption>Make action creator with status</caption>
 * const actionCreator = makeActionCreator('test/creator', ['sun', 'moon'])
 * actionCreator('status/success', {items: [1, 2, 3], total: 3})
 * // Returns:
 * // {
 * //   type: 'test/creator',
 * //   status: 'status/success',
 * //   payload: {items: [1, 2, 3], total: 3}
 * // }
 */

export function makeActionCreator(type, params, withId = false) {
  return (...args) => {
    const payload = makeActionPayload(args, params, withId)
    return isStatusParam(args[0])
      ? {type, status: args[0], ...payload}
      : {type, ...payload}
  }
}

// =========================== Helper functions ============================ //

function isStatusParam(param) {
  return typeof param === 'string' && param.startsWith('status/')
}

function withId(payload, idParam) {
  return idParam
    ? typeof payload === 'object'
      ? {payload: {...payload, [idParam]: cuid()}}
      : typeof payload !== 'undefined'
        ? {payload: {value: payload, [idParam]: cuid()}}
        : {payload: cuid()}
    : typeof payload !== 'undefined'
      ? {payload}
      : {}
}

function makeActionPayload(args, params, idParam) {
  const payload = !isStatusParam(args[0])
    ? args.length > 0
      ? fromArgs(args, params)
      : undefined
    : args[1]
  return withId(payload, idParam)
}

function fromArgs(args, params) {
  return Array.isArray(params)
    ? args.reduce(withParams(params), {})
    : args[0]
}

function withParams(params) {
  return (result, value, index) => {
    const param = params[index]
    return param !== undefined
      ? {...result, [param]: value}
      : result
  }
}
