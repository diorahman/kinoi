const {json} = require('../lib/server')

module.exports = async (req, res) => {
  return await json(req)
}
