const net = require('net')

function ok (port) {
  return new Promise(function (resolve, reject) {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(port, function (err) {
      server.close(function () {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  })
}

function get () {
  return new Promise(function (resolve, reject) {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)

    server.listen(0, function () {
      const port = server.address().port
      server.close(function () {
        resolve(port)
      })
    })
  })
}

module.exports = function (port) {
  return ok(port)
    .then(function () {
      return port
    })
    .catch(function (err) {
      return get(err)
    })
}
