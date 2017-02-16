module.exports = listen

function listen (server) {
  return new Promise((resolve, reject) => {
    server.listen((err) => {
      if (err) {
        return reject(err)
      }
      const {port} = server.address()
      resolve(`http://localhost:${port}`)
    })
  })
}
