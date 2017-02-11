const kinoi = require('./')

function* a (req) {
  return yield kinoi.json(req)
}

function handler (req, res) {
  return kinoi.async(a(req))
}

kinoi.serve(handler).listen(3000)
