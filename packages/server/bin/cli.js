#!/usr/bin/env node

global.Promise = require('bluebird')

const fs = require('fs')
const path = require('path')
const parse = require('minimist')
const optimize = require('gen-optim')
const compile = require('async-to-gen')

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

const source = fs.readFileSync(file, 'utf8')
const compiled = compile(source)
const optimized = optimize(compiled.toString())
file = file.indexOf('.compiled.js') > 0
  ? file : path.join(path.dirname(file), path.basename(file, '.js') + '.compiled.js')
fs.writeFileSync(file, optimized)

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
