import getConfig from './config'
import {of} from 'rxjs'
import {ajax} from 'rxjs/ajax'
import {map, delay} from 'rxjs/operators'

// Подготавливает параметры для строки запроса
// Параметр: {Object} params - входные параметры
// Возвращаемое значение: {String}
// Пример: encodeQueryParams({sun: 1000, moon: 70})
// >> "sun=1000&moon=70"

export function encodeQueryParams(params) {
  return Object.getOwnPropertyNames(params)
    .map(stringifyParam(params))
    .join('&')
}

// Подготавливает параметры для тела запроса в JSON-формате,
// по сути это просто псевдоним для JSON.stringify()
// Параметр: {Object} params - входные параметры
// Возвращаемое значение: {String}

export function encodeBodyParams(params) {
  return JSON.stringify(params)
}

// Подставляет параметры вместо плейсхолдеров в строке path
// Параметр: {String} path - строка запроса
// Параметр: {Object} params - параметры
// Пример: withRouteParams('/test/:id', {id: 400})
// >> "/test/400"

export function withRouteParams(path, params) {
  return '/' + path.split('/')
    .map(trim)
    .filter(notEmpty)
    .map(replaceParams(params, path))
    .join('/')
}

export function makeQueryUrl(route, routeParams = {}, queryParams) {
  const {host, endpoints} = getConfig('api')
  const chunks = route.split('.')
  const endpoint = chunks.length > 1
    ? endpoints[chunks[0]][chunks[1]]
    : chunks.length > 0
      ? endpoints[chunks[0]]
      : null
  if (!endpoint) {
    throw new Error(`makeQueryUrl(): неправильный роут "${route}"!`)
  }
  const base = withRouteParams(endpoint, routeParams)
  const params = queryParams ? encodeQueryParams(queryParams) : null
  return host + base + (params ? `?${params}` : '')
}

// Возвращает функцию для осуществления RxJS AJAX-запросов
// Параметр: {String} method - GET | POST | PUT | DELETE
// Параметр: {String} route - имя маршрута из конфигурации
// Параметр: {Function} mapParams - необязательный параметр,
// функция для отображения params => {queryParams, routeParams, bodyParams}
// Возвращает: ([{Object} params[, {String} token]]) => {Observable}

export function makeQuery(method, route, mapParams) {
  return (params, token) => {
    const typedParams = getTypedParams(method, params, mapParams)
    const {queryParams, routeParams, bodyParams} = typedParams
    const url = makeQueryUrl(route, routeParams, queryParams)
    const headers = makeHeaders(method, token, bodyParams)
    const body = makeBody(bodyParams)
    return ajax({url, method, ...headers, ...body})
      .pipe(map(onlyResponse))
  }
}

// Конструктор API-заглушек
// Возвращает функцию, осуществляющую запрос-заглушку
// Заглушка возвращает ответ response спустя 200 мс
// Все параметры - пустышки кроме response

export function makeStubQuery(method, route, response) {
  return () => of(response).pipe(delay(200))
}

// Функции-сокращения для упрощения работы с makeQuery()
// Выносит параметр "method" в название функции

export const getQuery = (route, map) => makeQuery('GET', route, map)
export const postQuery = (route, map) => makeQuery('POST', route, map)
export const putQuery = (route, map) => makeQuery('PUT', route, map)
export const deleteQuery = (route, map) => makeQuery('DELETE', route, map)

// ======================= Вспомогательный функции ========================= //

function stringifyParam(params) {
  return (param) => {
    const value = params[param]
    if (Array.isArray(value)) {
      return value.map(encodeParamMap(param)).join('&')
    }
    return encodeParam(param, value)
  }
}

function encodeParam(name, value, isArray = false) {
  const encodedName = encodeURIComponent(name) + (isArray ? '[]' : '')
  const encodedValue = encodeURIComponent(value)
  return `${encodedName}=${encodedValue}`
}

function encodeParamMap(name) {
  return (value) => encodeParam(name, value, true)
}

function replaceParams(params, path) {
  return (chunk) => {
    if (chunk.startsWith(':')) {
      const chunkName = chunk.slice(1)
      if (typeof params[chunkName] !== 'undefined') {
        return params[chunkName]
      }
      throw new Error(
        `withRouteParams(): не задан параметр "${chunkName}"` +
        `для пути ${path}.\n Проверьте, что вы правильно подготовили параметры`
      )
    }
    return chunk
  }
}

function makeHeaders(method, token, bodyParams) {
  const authHeader = token ? {'Authorization': `Bearer ${token}`} : null
  const contentHeader = withContent(method, bodyParams)
    ? {'Content-Type': 'application/json'} : null
  return authHeader || contentHeader
    ? {headers:{...authHeader, ...contentHeader}}
    : null
}

function makeBody(bodyParams) {
  return bodyParams
    ? {body: bodyParams}
    : null
}

function withContent(method, bodyParams) {
  return bodyParams && (
    method === 'POST' ||
    method === 'PUT'
  )
}

function getTypedParams(method, params, mapParams) {
  if (typeof mapParams === 'function') {
    const mapped = mapParams(params)
    return typeof mapped === 'object'
      ? mapped
      : {}
  }
  return method === 'GET'
    ? {queryParams: params}
    : {bodyParams: params}
}

function onlyResponse(xhr) {
  return xhr.response
}

function notEmpty(str) {
  return str.length > 0
}

function trim(str) {
  return str.trim()
}
