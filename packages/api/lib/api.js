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

const handler = function (req, res) {return __async(__0(req,res))}

function* __0(req,res){
  const {name, options} = router.lookup(req.url, req.method)
  if (req.headers['content-type'] && /json/.test(req.headers['content-type'])) {
    try {
      req.body = yield json(req)
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
    const result = yield fn(req, res)
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

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a)}catch(e){j(e);return}r.done?s(r.value):Promise.resolve(r.value).then(c,d)}function d(e){c(e,1)}c()})}
