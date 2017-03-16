const server = require('http').Server
const Stream = require('stream').Stream

// on parsing payload of a req
// needs to check
// - encoding
// - length
// - charset
// in order to get the content right
const typer = require('media-typer')
const getRawBody = require('raw-body')

const DEV = process.env.NODE_ENV === 'development'

module.exports = exports = serve
exports.send = send
exports.json = json

exports.sendError = sendError
exports.createError = createError

function serve (fn) {
  return server(function (req, res) {
    run(req, res, fn)
  })
}

async function wait (req, res, fn) {
  try {
    const val = await fn(req, res)
    // this is a hack, not sure for 100 continue
    if (!res.headersSent) {
      send(res, 200, val)
    }
  } catch (err) {
    sendError(req, res, err)
  }
}

function run (req, res, fn) {
  return wait(req, res, fn)
}

async function parse (req, {limit = '1mb'} = {}) {
  try {
    const type = req.headers['content-type']
    const length = req.headers['content-length']
    const encoding = typer.parse(type).parameters.charset
    const str = await getRawBody(req, {limit, length, encoding})

    try {
      return JSON.parse(str)
    } catch (err) {
      throw createError(400, 'Invalid JSON', err)
    }
  } catch (err) {
    if (err.type === 'entity.too.large') {
      throw createError(413, `Body exceeded ${limit} limit`, err)
    } else {
      throw createError(400, 'Invalid body', err)
    }
  }
}

function json (req, options) {
  return parse(req, options)
}

function send (res, code, obj = null) {
  let str = obj
  res.statusCode = code

  if (obj === null) {
    str = ''
    res.statusCode = code
  }

  if (obj && isStream(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }
    obj.pipe(res)
    return res.end()
  }

  if (obj && Buffer.isBuffer(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }
    res.setHeader('Content-Length', Buffer.byteLength(obj))
    return res.end(obj)
  }

  if (obj && typeof obj === 'object') {
    str = JSON.stringify(obj)
    res.setHeader('Content-Type', 'application/json')
    return res.end(str)
  }

  res.setHeader('Content-Length', Buffer.byteLength(str))
  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'text/plain')
  }

  res.end(str)
}

function sendError (req, res, err) {
  const obj = DEV ? err.stack : err.statusCode
    ? err.message : 'Internal Server Error'
  send(res, err.statusCode || 500, obj)
}

function createError (code, msg, orig) {
  const err = new Error(msg)
  err.statusCode = code
  err.originalError = orig
  return err
}

function isStream (obj) {
  return obj instanceof Stream
}
