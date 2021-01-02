let Koa = require('koa')
let Router = require('@koa/router')
let app = new Koa()
let router = new Router()
let {OAuth2Client} = require('google-auth-library')
let oauth = new OAuth2Client(process.env.OAUTH)
const BUCKET_NAME = 'mubc-api-image';
let fs = require('file-system')
let util = require('util')
let { v4: uuidv4 } = require('uuid');
let AWS = require('aws-sdk');
let dotenv = require('dotenv');
const readFile = util.promisify(fs.readFile);


let verify = async (_token) => {
    let ticket = await oauth.verifyIdToken({
        idToken: _token,
        audience: process.env.OAUTH
    })
    return payload = ticket.getPayload()
}

let auth = async (ctx, next) => {
    const token = ctx.request.headers['X-Authentication'] || ctx.request.headers['x-authentication']

    if(typeof token !== 'undefined') {
        try {
            ctx.token = await verify(token)
            next();
        } catch (err) {
            ctx.status = 403
            ctx.body = err.message
        }
    } else {
        ctx.status = 403
    }
}

dotenv.config()
let s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
})

let uploadToS3 = async (data) => {
    const name = uuidv4() + '.jpg'
    await s3.putObject({
        Key: name,
        Bucket: BUCKET_NAME,
        ContentType: 'test-image.jpg',
        Body: data,
        ACL: 'public-read',
    }).promise()
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${name}`
}

router.get('/api/signin', async (ctx, next) => {
    const { token } = ctx.request.query
    try {
        ctx.token = await verify(token)
        if (!(ctx.token.email.substring(ctx.token.email.indexOf("@") + 1) === "miamioh.edu")){
            throw new Error("Email domain should be miamioh.edu!")
        }
        console.log("Success", ctx.token)
        ctx.status = 200
    } catch (err) {
        ctx.status = 403
        ctx.body = err.message
    }
});

router.post('/api/image', async (ctx, next) => {
    try {
        let data = await readFile('./test-image.jpg')
        let url = await uploadToS3(data)
        ctx.body = url
        ctx.status = 200
    } catch (err) {
        ctx.status = 403
        ctx.body = "Error"
    }
});

router.get('/api/test', auth, async (ctx, next) => {
    try {
        ctx.response.status = 200
        ctx.body = "Hello World!"
    } catch (err) {
        ctx.response.status = 500
        ctx.body = err.message
    }
});

const request = async ({ method, url, body }) => {
    let headers = {}
    if (typeof body === 'object' && !(body instanceof File)) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(body)
    }
    const resp = await fetch(url, { method, headers, body })
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

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);