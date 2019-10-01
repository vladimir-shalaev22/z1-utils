import mainConfig from '../../config.js'

// Возвращает конфигурацию пакета "packageName", а в случае если
// конфигурация не найдена, то возвращает пустой объект ({})
// Параметр: {String} packageName - имя запрашиваемого пакета
// Параметр: {Object} config - используется только для тестов

function getConfig(packageName, config = mainConfig) {
  return config[packageName] || {}
}

export default getConfig
