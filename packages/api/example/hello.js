const API = require('../lib/api')

const handler = async function () {
  return 'hello!'
}

module.exports = API([
  {
    method: 'GET',
    path: '/',
    handler
  }
])
