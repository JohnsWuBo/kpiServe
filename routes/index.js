const router = require('koa-router')()

// router.get('/', async (ctx, next) => {
//   await ctx.render('index', {
//     title: 'Hello Koa 2!'
//   })
// })

// router.get('/string', async (ctx, next) => {
//   ctx.body = 'koa2 string'
// })

// router.get('/json', async (ctx, next) => {
//   ctx.body = {
//     title: 'koa2 json'
//   }
// })

const main = (ctx,next) => {
  ctx.response.body = "here is main page"
};

const about = (ctx,next) => {
  ctx.response.body = "here is about page";
}



module.exports = {
  "GET /" : main,
  "GET /about" : about
}
