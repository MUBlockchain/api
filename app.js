require('dotenv').config()
const Koa = require('koa')
const Router = require('@koa/router')
const cors = require('@koa/cors')
const bodyParser = require('koa-body')
const app = new Koa()
const router = new Router()
const { OAuth2Client } = require('google-auth-library')
const oauth = new OAuth2Client(process.env.OAUTH)
const fs = require('file-system')
const path = require('path')
const https = require('https')
const util = require('util')
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const readFile = util.promisify(fs.readFile);
const fetch = require("node-fetch");
let request = require('./request')
const { utils }, ethers = require('ethers')

let verify = async (_token) => {
    let ticket = await oauth.verifyIdToken({
        idToken: _token,
        audience: process.env.OAUTH
    })
    return payload = ticket.getPayload()
}

let auth = async (ctx, next) => {
    const token = ctx.request.headers['X-Authentication'] || ctx.request.headers['x-authentication']

    if (typeof token !== 'undefined') {
        try {
            ctx.token = await verify(token)
            await next();
        } catch (err) {
            ctx.status = 403
            ctx.body = err.message
        }
    } else {
        ctx.status = 403
    }
}

let s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
})

let uploadToS3 = async (data) => {
    const name = uuidv4() + '.jpg'
    await s3.putObject({
        Key: name,
        Bucket: process.env.AWS_BUCKET_NAME,
        ContentType: 'test-imagejpg',
        Body: data,
        ACL: 'public-read',
    }).promise()
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${name}`
}

let getTwitterId = async username => {
    const url = process.env.TWITTER_URL + username
    try {
        let headers = { 'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
        let resp = await fetch(url, { method: 'GET', headers })
        return resp.json()
    } catch (err) {
        console.log("Error", err.message)
    }
}

router.get('/api/signin', async (ctx) => {
    const { token } = ctx.request.query
    const address = ctx.request.headers['X-Address'] || ctx.request.headers['x-address'] //relay-cheat
    try {
        ctx.token = await verify(token)
        // if (!(ctx.token.email.substring(ctx.token.email.indexOf("@") + 1) === "miamioh.edu")) {
        //     throw new Error("Email domain should be miamioh.edu")
        // }
        if (typeof address !== 'undefined') { //relay-cheat
            let balance = await provider.getBalance(address)
            let minimum = utils.parseEther('0.1')
            if (balance.lte(minimum)) {
                let provider = ethers.getDefaultProvider('kovan')
                let wallet = new ethers.Wallet(process.env.RELAY_CHEAT_KEY, provider)
                let tx = await wallet.sendTransaction({
                    to: address,
                    value: ethers.utils.parseEther('0.2')
                })
                tx.wait() //don't need to wait for response
            }
        }
        ctx.body = "Success"
        ctx.status = 200
    } catch (err) {
        ctx.status = 403
        ctx.body = "Error"
    }
});

router.post('/api/image', auth, async (ctx, next) => {
    try {
        let data = await readFile(ctx.request.files.image.path)
        let url = await uploadToS3(data)
        ctx.body = url
        ctx.status = 200
    } catch (err) {
        ctx.status = 403
        ctx.body = "Error"
    }
});

router.get('/api/home', auth, async (ctx, next) => {
    try {
        ctx.status = 200
        ctx.body = "Hello World"
    } catch (err) {
        ctx.status = 403
        ctx.body = "Error"
    }
});

router.get('/api/twitterid', async (ctx, next) => {
    try {
        const { username } = ctx.request.query
        let ret = await getTwitterId(username)
        ctx.status = 200
        ctx.body = ret.data.id
    } catch (err) {
        ctx.status = 403
        ctx.body = "Error"
    }
});

app.use(cors({ origin: '*', allowHeaders: ['X-Authentication'] }))
app.use(bodyParser({ multipart: true, includeUnparsed: true, jsonLimit: '12mb' }))
app.use(router.routes());
app.use(router.allowedMethods());

let server

if (process.env.PRODUCTION === 'true') {
    let config = {
        domain: 'app.mubc.io',
        https: {
            port: 8080,
            options: {
                key: fs.readFileSync(path.resolve(process.cwd(), 'certs/privkey.pem'), 'utf8').toString(),
                cert: fs.readFileSync(path.resolve(process.cwd(), 'certs/fullchain.pem'), 'utf8').toString()
            }
        }
    }
    server = (https.createServer(config.https.options, app.callback())).listen(config.https.port)
    console.log("Running HTTPS API")
} else {
    server = app.listen(8080)
    console.log("Running HTTP API")
}


module.exports = server
