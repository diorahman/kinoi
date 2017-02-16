const compile = require('async-to-gen')
const optimize = require('gen-optim')
const path = require('path')
const fs = require('fs')

const source = fs.readFileSync(path.join(__dirname, 'src', 'api.js'), 'utf8')
const compiled = compile(source).toString()
const optimized = optimize(compiled)
fs.writeFileSync(path.join(__dirname, 'lib', 'api.js'), optimized)
