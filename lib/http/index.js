const native = require(`./uws_${process.platform}_${process.versions.modules}`)
const EventEmitter = require('events')

function noop () {}
native.setNoop(noop)

class HttpServer extends EventEmitter {
  constructor (reqCb) {
    super()
    this.serverGroup = native.server.group.create()
    native.server.group.onHttpRequest(this.serverGroup, reqCb)
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

module.exports = HttpServer
