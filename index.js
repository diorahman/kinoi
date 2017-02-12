const server = require('./lib/http').Server
const co = require('bluebird').coroutine
const Stream = require('stream').Stream
const run = co(start)
const isStream = obj => obj instanceof Stream
const isBuffer = Buffer.isBuffer
const DEV = process.env.NODE_ENV === 'development'

module.exports = exports = serve
exports.json = co(json)
exports.send = send
exports.sendError = sendError
exports.createError = createError

function raw (req, cb) {
  // turns out this one is really slow
  return new Promise(function (resolve, reject) {
    var data = []
    req.on('data', function (chunk) {
      data.push(Buffer.from(chunk))
      chunk = null
    })
    req.on('end', function () {
      resolve(Buffer.concat(data))
      data = null
    })
  })
}

function * json (req) {
  var str = ''
  try {
    str = yield raw(req)
  } catch (err) {
    throw createError('Invalid body', 500, err)
  }

  try {
    return JSON.parse(str)
  } catch (err) {
    throw new Error('Invalid JSON body', 500, err)
  }
}

function send (res, code, obj) {
  if (typeof obj === 'object') {
    res.statusCode = code
    res.setHeader('Content-Type', 'application/json')
    // FIXME: it can be failed for cyclic object
    const str = JSON.stringify(obj)
    res.setHeader('Content-Length', Buffer.byteLength(str))
    return res.end(str)
  }

  if (typeof obj === 'string') {
    res.statusCode = code
    res.setHeader('Content-Type', 'application/json')
    // FIXME: it can be failed for cyclic object
    res.setHeader('Content-Length', Buffer.byteLength(obj))
    return res.end(obj)
  }

  if (!obj) {
    res.setHeader('Content-Length', 0)
    return res.end()
  }

  if (isStream(obj)) {
    // FIXME: implement this
    // stream, not sure it is supported by lib/http
  }

  if (isBuffer(obj)) {
    // FIXME: implement this
    // buffer, not sure it is supported by lib/http
  }
}

function * start (req, res, fn) {
  try {
    const val = yield fn(req, res)
    if (!val) {
      return send(res, 204, null)
    }
    send(res, res.statusCode || 200, val)
  } catch (err) {
    // send error
  }
}

function serve (fn) {
  const cb = co(fn)
  function handler (req, res) {
    run(req, res, cb)
  }
  return server(handler)
}

function createError (code, message, original) {
  const err = new Error(message)
  err.originalError = original
  err.statusCode = code
  return err
}

function sendError (req, res, err) {
  const obj = DEV ? err.stack : err.statusCode
    ? err.message : 'Internal Server Error'
  send(res, err.statusCode || 500, obj)
}
