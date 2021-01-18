const Koa = require('koa')
const Router = require('@koa/router')
const cors = require('@koa/cors')
const bodyParser = require('koa-body')
const app = new Koa()
const router = new Router()
const {OAuth2Client} = require('google-auth-library')
const oauth = new OAuth2Client(process.env.OAUTH)
const BUCKET_NAME = 'mubc-api-image';
const fs = require('file-system')
const path = require('path')
const https = require('https')
const util = require('util')
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
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
        ContentType: 'test-imagejpg',
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
            throw new Error("Email domain should be miamioh.edu")
        }
        ctx.body = "Success"
        ctx.status = 200
    } catch (err) {
        ctx.status = 403
        ctx.body = "Error"
    }
});

router.post('/api/image', async (ctx, next) => {
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

app.use(cors({ origin: '*', allowHeaders: ['Content-Type'], exposeHeaders: ['content-type'] }))
app.use(bodyParser({ multipart: true, includeUnparsed: true, jsonLimit: '12mb' }))
app.use(router.routes());
app.use(router.allowedMethods());

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

const server = https.createServer(config.https.options, app.callback())

module.exports = server.listen(config.https.port)
