const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const koaBody = require('koa-body')
const koajwt = require('koa-jwt')
const jsonwebtoken = require('jsonwebtoken')
const routes = require("./src/routes.js")

// const index = require('./routes/index')
// const users = require('./routes/users')

// error handler
onerror(app)
//token签名
const SECRST = 'johnwu'
// middlewares
app.use(koaBody({
  multipart: true,
  strict: false,
  formidable: {
    maxFileSize: 20 * 1024 * 1024
  }
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

Array.prototype.clean = function(deleteValue) {
  console.log(deleteValue)
  for (var i = 0; i < this.length; i++) {
      if (this[i] == '') {
          this.splice(i, 1);//返回指定的元素
          i--;
      }
  }
  return this;
};

app.use(async (ctx, next)=> {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild,token,content-type');
  ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  if (ctx.method == 'OPTIONS') {
    ctx.body = 200; 
  } else {
    await next();
  }
});

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

//中间件对token的使用
app.use(async (ctx, next) => {
  // console.log(ctx)
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        msg: err.message
      }
    } else {
      throw err;
    }
  })
});

//登录注册接口不需要验证token
app.use(koajwt({ secret: SECRST}).unless({
  path: [/^\/users\/login/, /^\/users\/reg/,/^\/imgs\/upload/]
}))

// routes
app.use(routes());
// app.use(index.routes(), index.allowedMethods())
// app.use(users.routes(), users.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
