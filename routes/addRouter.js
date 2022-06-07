const _cookies = require('../lib/utils.js');
const { password } = require("../mysql/mysql_config");
const query = require("../mysql/query"); //引入异步查询方法
const koajwt = require('koa-jwt');
const util = require('util');
const { SHOW_ALL_DB, INSERT_DATA } = require("../mysql/sql"); //部分引入sql库
//token签名
const SECRST = 'johnwu'
const jsonwebtoken = require('jsonwebtoken');


const catchError = (ctx, err) => {
    console.log(`提示了${err}`);
    console.log(err)
    ctx.resError = err;
};
const list = async (ctx, next) => {
    try {
        const list = query.toString();
        ctx.response.status = 200;
        ctx.response.body = list;
        // console.log(`请求成功 ${list}`);
    } catch (error) {
        catchError(error);
    }
};

//添加路由 一级
const addRouter = async (ctx, next) => {
    let { name, icon, parentId, href, spread ,component } = ctx.request.body;
    if (!component) {
        component = '';
    }
    try {
        /*
            首选验证name值在数据库中是否重复
        */
            let nameArr = await query(`select * from addRouter where name='${name}'`);
            if (nameArr.length > 0) {
                ctx.response.body = {
                    code: 201,
                    message: '该用户名已被收录！',
                };
                return;
            };
            //创建时间 更改时间
            let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            //进行插入到数据库中！
            //await query(INSERT_DATA('roles', 'name,count,routerIds,remarks,level,createdAt,updatedAt', `'${name}',${_idArr.length},'${_routerIdArr.join(',')}','${remarks}',${level},'${create}','${update}'`))
            let INSERTArr = await query(INSERT_DATA('addRouter', 'icon,name, parentId, sorting, value,hidden,href,components,spread,createdAt,updatedAt', `'${icon}','${name}','${parentId}',1,'${1}',0,'${href}','${component}',${spread},'${create}','${update}'`));
            if (INSERTArr.affectedRows === 1) {
                ctx.response.body = {
                    code: 200,
                    msg: '新建路由成功！',
                }
            } else {
                ctx.response.body = {
                    code: 203,
                    msg: '系统错误！',
                }
            }
    } catch (error) {
        catchError(error);
    }
}

//获取第一级所有的路由
const getFirstRouter = async (ctx, next) => {
    try {
        let firstRouter = await query('select name,id from addRouter where parentId=0');
        if (firstRouter.length > 0) {
            ctx.response.body = {
                code: 200,
                msg: '一级路由获取成功！',
                data: firstRouter,
            }
        } else {
            ctx.response.body = {
                code: 203,
                msg: '系统错误！',
            }
        }
    } catch(error) {
        catchError(error);
    }
}

//按照id 获取路由
const getRouterById = async (ctx, next) => {
    console.log(ctx.query)
    let { id } = ctx.query;
    console.log(id)
    try {
        let queryById = await query(`select * from addRouter where id=${id}`);
        if (queryById.length > 0) {
            ctx.response.body = {
                code: 200,
                msg: '查找成功！',
                data: queryById[0],
            }
        } else {
            ctx.response.body = {
                code: 202,
                msg: '查找失败！',
                data: [],
            }
        }
    } catch(error) {
        catchError(error);
    }
}

//按照id 修改 内容
const updateRouterById = async (ctx, next) => {
    let {
        name,
        icon,
        spread,
        href,
        id,
    } = ctx.request.body;
    try {
        let nameArr = await query(`select * from addRouter where name='${name}' and id not in (${id})`);
        if (nameArr.length > 0) {
            ctx.response.body = {
                code: 201,
                msg: '已存在该用户名！'
            };
            return ;
        };
        //await query(`UPDATE roles SET name='${name}',level=${level},remarks='${remarks}',updatedAt='${update}' WHERE id=${id}`)
        let updateArr = await query(`UPDATE addRouter SET name='${name}',icon='${icon}',spread=${spread},href='${href}' WHERE id=${id}`);
        if (updateArr) {
            ctx.response.body = {
                msg: '修改成功！',
                code: 200,
            }
        } else {
            ctx.response.body = {
                msg: '系统错误！',
                code: 201
            }
        }
    } catch(error) {
        catchError(error);
    }
}

module.exports = {
    'POST /addRouter/addRouter': addRouter,
    'GET /addRouter/getFirstRouter': getFirstRouter,
    'GET /addRouter/getRouterById': getRouterById,
    'POST /addRouter/updateRouterById': updateRouterById,
}