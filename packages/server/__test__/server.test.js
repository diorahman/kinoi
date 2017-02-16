/* eslint-env jest */

const serve = require('../lib/server')
const listen = require('./listen')
const request = require('tarik')
const path = require('path')
const fs = require('fs')

const {send, json} = serve

function getUrl (fn) {
  const server = serve(fn)
  return listen(server)
}

test('return <String>', async () => {
  const fn = async () => {
    return 'ok'
  }
  const url = await getUrl(fn)
  const {body, statusCode, headers} = await request.get(url)

  expect(body).toBe('ok')
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('text/plain')
})

test('send(200, <String>)', async () => {
  const fn = async (req, res) => {
    send(res, 200, 'ok')
  }
  const url = await getUrl(fn)
  const {body, statusCode, headers} = await request.get(url)

  expect(body).toBe('ok')
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('text/plain')
})

test('return <Object>', async () => {
  const fn = async () => {
    return {ok: true}
  }
  const url = await getUrl(fn)
  const {body, statusCode, headers} = await request.get(url)

  expect(body.ok).toBe(true)
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/json')
})

test('send(200, <Object>)', async () => {
  const fn = async (req, res) => {
    send(res, 200, {ok: true})
  }
  const url = await getUrl(fn)
  const {body, statusCode, headers} = await request.get(url)

  expect(body.ok).toBe(true)
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/json')
})

test('return <Stream>', async () => {
  const fn = async () => {
    return fs.createReadStream(path.join(__dirname, 'listen.js'))
  }
  const url = await getUrl(fn)
  const {statusCode, headers} = await request.get(url)

  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/octet-stream')
})

test('send(200, <Stream>)', async () => {
  const fn = async (req, res) => {
    send(res, 200, fs.createReadStream(path.join(__dirname, 'listen.js')))
  }
  const url = await getUrl(fn)
  const {statusCode, headers} = await request.get(url)

  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/octet-stream')
})

test('return <Buffer>', async () => {
  const fn = async () => {
    return fs.readFileSync(path.join(__dirname, 'listen.js'))
  }
  const url = await getUrl(fn)
  const {statusCode, headers} = await request.get(url)

  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/octet-stream')
})

test('send(200, <Buffer>)', async () => {
  const fn = async (req, res) => {
    send(res, 200, fs.readFileSync(path.join(__dirname, 'listen.js')))
  }
  const url = await getUrl(fn)
  const {statusCode, headers} = await request.get(url)

  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/octet-stream')
})

test('echo JSON object, via return', async () => {
  const fn = async (req, res) => {
    return await json(req)
  }
  const url = await getUrl(fn)
  const {statusCode, headers, body} = await request.post(url, {ok: true}, {json: true})

  expect(body.ok).toBe(true)
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/json')
})

test('echo JSON object, via send(200, <Object>)', async () => {
  const fn = async (req, res) => {
    return await json(req)
  }
  const url = await getUrl(fn)
  const {statusCode, headers, body} = await request.post(url, {ok: true}, {json: true})

  expect(body.ok).toBe(true)
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/json')
})
