import cuid from 'cuid'

// Статусы для многоэтапных экшенов (например для fetch-запросов)
// Константы начинаются с префикса "status/" для того чтобы можно
// было их отличить от значений обычных переменных

export const SUCCESS = 'status/success'
export const ERROR = 'status/error'

// Функция для создания экшн-креаторов (функции создающие экшены)
// Параметр: {string} type - тип экшена
// Параметр: {Array} params - имена параметров, необходимо для того
// чтобы именовать переданные экшен креатору аргументы. Пример:
// const actionCreator = makeActionCreator('test/creator', ['sun', 'moon'])
// console.log(actionCreator('star', 'satellite'))
// >> {
// >>   type: 'test/creator',
// >>   payload: {
// >>     sun: 'start',
// >>     moon: 'satellite'
// >>   }
// >> }
// !!!ПРИМЕЧАНИЕ!!! Если params не задан, то в качестве payload передаётся
// первый аргумент. Остальные будут игнорироваться! Если и первый аргумент
// не задан, то тогда payload в экшене будет отсутствовать!
// --------------------------------------------------------------------------
// Пример использования экшн-креатора со статусом:
// console.log(actionCreator(SUCCESS, {location: 'universe'}))
// >> {
// >>   type: 'test/creator',
// >>   payload: {
// >>     location: 'universe'
// >>   }
// >> }
// В данном случае в качестве полезной нагрузки (payload) идёт
// второй параметр. Первый параметр - статус.
// Все последующие параметры игнорируются

export function makeActionCreator(type, params, withId = false) {
  return (...args) => {
    const payload = makeActionPayload(args, params, withId)
    return isStatusParam(args[0])
      ? {type, status: args[0], ...payload}
      : {type, ...payload}
  }
}

// Функция возвращающая функцию для проверки экшенов
// на соответствии заданным типу (type) и статусу (status)
// Проверяющая функция возвращает "true" только в том случае,
// если и тип и статус соответствуют заданным (соответствия только одного
// параметра недостаточно). Используется в эпиках (Epics)

export function withTypeAndStatus(type, status) {
  return (action) => (
    action.status === status &&
    action.type === type
  )
}

// Функция возвращающая функцию для проверки экшенов
// на соответствие заданному типу (type) и отсутствие статуса
// Проверяющая функция возвращает "true" только в том случае,
// если тип соответствует заданному, а статус не задан.
// Используется в эпиках (Epics)

export function withTypeWithoutStatus(type) {
  return (action) => (
    typeof action.status === 'undefined' &&
    action.type === type
  )
}

// ======================= Вспомогательные функции ========================= //

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
