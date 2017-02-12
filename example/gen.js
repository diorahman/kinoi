const kinoi = require('../')

module.exports = handler

function * handler (req) {
  return yield kinoi.json(req)
}
