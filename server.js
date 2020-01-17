const Koa = require('koa')
const Router = require('koa-router')
const mysql = require('promise-mysql')

let app = new Koa()
let router = new Router()

router.get('/', async ctx=>{
	ctx.body = 'inde333333x'
})

router.get('/db', async ctx=>{
	let db = await mysql.createPool({
		host: 'mysql',
		port: 3306,
		user: 'root',
		password: '123456'
	})
	let res = await db.query('SHOW DATABASES')
	ctx.body = res
})

app.use(router.routes())
app.listen(3000)


