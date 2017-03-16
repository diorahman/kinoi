#!/usr/bin/env node

global.Promise = require('bluebird')

const path = require('path')
const parse = require('minimist')

const getPort = require('../lib/port')
const kinoi = require('../lib/server')

const args = parse(process.argv.slice(2), {
  alias: {h: 'host', p: 'port'},
  default: {h: '0.0.0.0', p: process.env.PORT || 3000},
  boolean: ['help']
})

let fn = null
let file = args._.pop()

if (!file) {
  // FIXME: read package.json
  const pkg = require(path.join(process.cwd(), 'package.json'))
  file = path.join(process.cwd(), pkg.main || 'index.js')
}

file = path.resolve(file)

try {
  fn = require(file)
} catch (err) {
  console.error(err.message)
}

getPort(args.port)
  .then(function (port) {
    kinoi(fn).listen(port)
    if (port !== args.port) {
      console.warn(`* ${args.port} is not available`)
    }
    console.log(`> Starting on ${port}`)
  })
