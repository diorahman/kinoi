const native = require(`./uws_${process.platform}_${process.versions.modules}`)
const EventEmitter = require('events')
const status = require('./status')

function noop () {}
native.setNoop(noop)

// FIXME: all of this should be implemented in addon
class HttpServer extends EventEmitter {
  constructor (reqCb) {
    super()
    this.serverGroup = native.server.group.create()
    native.server.group.onHttpRequest(this.serverGroup, (req, res) => {
      res.setHeader = (key, val) => {
        if (!res.headers) {
          res.headers = []
        }
        res.headers.push(`${key}: ${val}\r\n`)
      }
      res.end = (str) => {
        const {statusCode, headers} = res
        let response = `HTTP/1.1 ${statusCode} ${status[statusCode]}\r\n`
        for (var i = 0; i < headers.length; i++) {
          response += headers[i]
        }
        response = response + '\r\n' + str
        res.supposeToBeEnd(response)
      }
      reqCb(req, res)
    })

    native.server.group.onCancelledHttpRequest(this.serverGroup, (res) => {
        // emit abort or something here
    })
  }

  static createServer (reqCb) {
    return new HttpServer(reqCb)
  }

  listen (port) {
    // return bool and emit error on listen error!
    native.server.group.listen(this.serverGroup, port)
  }
}

module.exports = exports = HttpServer
exports.Server = HttpServer.createServer
