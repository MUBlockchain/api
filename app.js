let Koa = require('koa')
let Router = require('@koa/router')
let app = new Koa()
let router = new Router()
let {OAuth2Client} = require('google-auth-library')
let oauth = new OAuth2Client(process.env.OAUTH)

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

router.get('/api/test', auth, async (ctx, next) => {
    try {
        ctx.response.status = 200
        ctx.body = "Hello World!"
    } catch (err) {
        ctx.response.status = 500
        ctx.body = err.message
    }
});

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);