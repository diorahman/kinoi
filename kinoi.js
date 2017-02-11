var http = require('./lib/http')
var status = require('./status')
var isStream = require('isstream')

module.exports = {
  serve, json, send, async: __async
}

function raw (req, cb) {
  return new Promise(function (resolve, reject) {
    var data = []
    req.on('data', function (chunk) {
      data.push(Buffer.from(chunk))
    })
    req.on('end', function () {
      resolve(Buffer.concat(data).toString())
    })
  })
}

function serve (fn) {
  function handler (req, res) {
    // FIXME: should be in uws http server
    res.setHeader = function (key, val) {
      res.headers = res.headers || []
      res.headers.push(`${key}: ${val}\r\n`)
    }
    run(req, res, fn)
  }
  return http.createServer(handler)
  // return server(handler)
}

function* start (req, res, fn) {
  try {
    var val = yield fn(req, res)
    return send(res, !val ? 204 : 200, val)
  } catch (err) {
    return send(res, err.code || 500, err.message)
  }
}

function run (req, res, fn) {
  return __async(start(req, res, fn))
}

function* parse (req) {
  var str = ''
  try {
    str = yield raw(req)
  } catch (err) {
    // parsing error
    throw new Error(err.message)
  }

  try {
    return JSON.parse(str)
  } catch (err) {
    throw new Error(err.message)
  }
}

function json (req, options) {
  return __async(parse(req, options))
}

function send (res, code, obj = null) {
  // FIXME: should be in uws http server
  if (!obj) {
    res.setHeader('Content-Length', 0)
    return res.end()
  }

  // FIXME: not sure if this one works
  if (Buffer.isBuffer(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }

    res.setHeader('Content-Length', obj.length)
    return res.end(obj)
  }

  // FIXME: not sure if this one works
  if (isStream(obj)) {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/octet-stream')
    }

    return obj.pipe(res)
  }

  if (typeof obj === 'object') {
    var str = JSON.stringify(obj)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Length', Buffer.byteLength(str))

    // FIXME: this is should be in uws since this is slow
    return res.end(create(code, res.headers, str))
  }

  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Content-Length', Buffer.byteLength('' + obj))
  return res.end(create(code, res.headers, obj))
}

function create (code, headers, body) {
  var response = `HTTP/1.1 ${code} ${status[code]}\r\n`
  for (var i = 0; i < headers.length; i++) {
    response += headers[i]
  }
  return response + '\r\n' + body
}

function __async (g) {
  return new Promise(function (resolve, reject) {
    function c (a, x) {
      try {
        var r = g[x ? 'throw' : 'next'](a)
      } catch (e) {
        return reject(e)
      }
      r.done ? resolve(r.value) : Promise.resolve(r.value).then(c, d)
    }

    function d (e) {
      c(e, 1)
    }
    c()
  })
}
