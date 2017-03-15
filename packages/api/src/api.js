const id = require('shortid')
const create = require('uniloc')
const {json, send} = require('kinoi')

const DEV = process.env.NODE_ENV === 'development'

class HttpError extends Error {
  constructor (message, statusCode, internal) {
    super(message)
    this.name = 'HttpError'
    this.internal = internal
    this.statusCode = statusCode
  }
}

function unhandled () { throw new HttpError('Not Implemented', '501', '0000') }

module.exports = exports = serve
exports.HttpError = HttpError

const prepared = {}
const handlers = new Map()
let settings = {}
let router = null

const handler = async function (req, res) {
  const {name, options} = router.lookup(req.url, req.method)
  // FIXME: use promise
  if (/json/.test(req.headers['content-type'])) {
    try {
      req.body = await json(req)
    } catch (err) {
      // allocate this empty body if failed to parse
      // FIXME: should get the raw body instead?
      // anyway, since the client said it sends json
      req.body = {}
    }
  }
  req.options = options
  try {
    const fn = handlers.get(name)
    if (!fn) {
      throw new HttpError('Not found', 404, '0000')
    }
    const result = await fn(req, res)
    if (result === null || result === undefined) {
      // sends back no-content
      return send(res, 204)
    }
    return result
  } catch (err) {
    const {renderError} = settings
    if (typeof renderError === 'function') {
      let message = renderError(err, req, res)
      if (DEV) {
        if (typeof message === 'object') {
          if (Array.isArray(message)) {
            message.push({stack: err.stack})
          } else {
            message.stack = err.stack
          }
        } else {
          message += ' TRACE:' + err.stack
        }
      }
      return send(res, err.statusCode || 500, message)
    }
    throw err
  }
}

function serve (routes, options = {}) {
  for (let route of routes) {
    const name = id.generate()
    prepared[name] = `${route.method} ${route.path}`
    handlers.set(name, route.handler || unhandled)
  }
  settings = options
  router = create(prepared)
  return handler
}
