/**
 * Make an arbitrary http request
 *
 * @param method	(required) http method (GET, POST, PUT, DELETE, etc)
 * @param url	(required) url or path of the resource
 * @param body	(optional) body of the request
 */
const fetch = require("node-fetch");
module.exports = async function ({ method, url, body }) {
    let twitter = url.indexOf('api.twitter.com') !== -1
    let headers = {}
    if (typeof body === 'object') {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(body)
    }
    if(twitter) {
      headers['Authorization'] = ` Bearer ${process.env.BEARER_TOKEN}`
    }
    let resp
    if(method === 'GET') {
      resp = await fetch(url, { method, headers })
    } else {
      resp = await fetch(url, { method, headers, body })
    }
    if (!resp.ok) {
      let error = new Error('server responded with an http error')
      error.code = resp.status
      error.original = resp
      throw error
    }
    const respContentType = [...resp.headers.entries()].find(([k, v]) => k === 'content-type')
    if (/json/.test(respContentType)) {
      return await resp.json()
    }
    if (/text/.test(respContentType)) {
      return await resp.text()
    }
    return resp
  }