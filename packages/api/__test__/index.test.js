/* eslint-env jest */

const listen = require('./listen')
const API = require('../lib/api')
const request = require('tarik')
const serve = require('kinoi')

function getUrl (fn) {
  const server = serve(fn)
  return listen(server)
}

test('return <String>', async () => {
  const api = API([
    {
      method: 'GET',
      path: '/ok',
      handler: function () {
        return 'ok'
      }
    }
  ])

  const url = await getUrl(api)
  const {body, statusCode, headers} = await request.get(`${url}/ok`)

  expect(body).toBe('ok')
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('text/plain')
})

test('return await <String>', async () => {
  function delay (duration) {
    return new Promise(function (resolve) {
      setTimeout(resolve, duration)
    })
  }

  const api = API([
    {
      method: 'GET',
      path: '/ok',
      handler: async function () {
        await delay(100)
        return 'ok'
      }
    }
  ])

  const url = await getUrl(api)
  const {body, statusCode, headers} = await request.get(`${url}/ok`)

  expect(body).toBe('ok')
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('text/plain')
})

test('echo payload', async () => {
  const api = API([
    {
      method: 'POST',
      path: '/ok',
      handler: function (req) {
        return req.body
      }
    }
  ])

  const url = await getUrl(api)
  const {body, statusCode, headers} = await request.post(`${url}/ok`, {ok: true}, {json: true})

  expect(body.ok).toBe(true)
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toBe('application/json')
})

test('return 204 no content', async () => {
  const api = API([
    {
      method: 'GET',
      path: '/ok',
      handler: function (req) {
        return null
      }
    }
  ])

  const url = await getUrl(api)
  const {statusCode, body} = await request.get(`${url}/ok`)

  expect(body).toBe('')
  expect(statusCode).toBe(204)
})
