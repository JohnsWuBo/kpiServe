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
//查询商品列表
const goodsList = async (ctx, next) => {
    const { page, pageSize, name } = ctx.query;
    try {
        //page 当前页数
        //pageSize 一页多少条
        let token = ctx.header.authorization;
        let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
        //lat签发时间 exp 过期时间
        //拿到 权限字段
        let id = payload.id;
        console.log(id)
        let start = (page - 1) * pageSize;
        //查到店铺id
        let list = await query(`select id,examine from store where userId=${id}`);
        if (list.length > 0) {
            if (list[0].id) {
                if (list[0].examine == 3) {
                    let storeId = list[0].id;
                    let listData = '';
                    let listTotal = '';
                    console.log(`storeId---------------->`)
                    console.log(storeId)
                    console.log(name)
                    if (name == '') {
                        listData = await query(`SELECT * FROM goods WHERE storeId=${storeId} order by id asc LIMIT ${start},${pageSize}`);
                        //总数
                        listTotal = await query(`SELECT COUNT(*) AS total FROM goods WHERE storeId=${storeId}`);
                    } else {
                        listData = await query(`SELECT *  FROM  goods WHERE storeId=${storeId} and name LIKE '%${name}%' order by id asc LIMIT ${start},${pageSize}`);
                        listTotal = await query(`SELECT COUNT(*) AS total FROM goods WHERE name LIKE '%${name}%' and storeId=${storeId}`);
                    }
                    console.log(listData)
                    let total = 0;
                    if (!listTotal[0]) {
                        total = 0;
                    } else {
                        total = listTotal[0].total;
                    }
                    if (listData) {
                        ctx.response.body = {
                            code: 200,
                            msg: '查询成功！',
                            data: listData,
                            total,
                        }
                    } else {
                        ctx.response.body = {
                            code: 202,
                            msg: '系统错误！'
                        }
                    }
                } else {
                    ctx.response.body = {
                        code: 204,
                        msg: '您的商铺审核还没有通过！',
                    }
                }
                
            } else {
                ctx.response.body = {
                    code: 201,
                    msg: '您还没有注册过商铺！'
                }
            }
        } else {
            console.log('list')
            ctx.response.body = {
                code: 203,
                msg: '您还没有注册商铺！'
            }
        }
    } catch (error) {
        catchError(error)
    }
}
//新增商品
const goodsInsert = async (ctx, next) => {
    // name: "",
    //     imageUrl: "",
    //     price: 0,
    //     description: "",
    //     type: [],
    //     stock: 0,
    //     content: "",
    let { name, imageUrl, price, description, type, stock, content } = ctx.request.body;
    try {
        let token = ctx.header.authorization;
        let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
        //lat签发时间 exp 过期时间
        //拿到 权限字段
        let id = payload.id;
        //查询商品id
        let list = await query(`select id,examine from store where userId=${id}`);
        console.log(list)
        if (list.length > 0) {
            if (list[0].id) {
                if (list[0].examine == 3) {
                    //商铺id
                    let storeId = list[0].id;
                    //创建时间 更改时间
                    let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                    let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                    // name,type,headline,description,storeId,sn,content,price,stock,is_on_sale,is_del,sell_count,
                    let sn = new Date().getTime() + String(storeId);
                    let goodsLists = await query(INSERT_DATA('goods', 'name,type,headline,description,storeId,sn,content,price,stock,is_on_sale,is_del,sell_count,createdAt,updatedAt', `'${name}','${type}','${imageUrl}','${description}',${storeId},${sn},'${content}',${price},${stock},${Number(0)},${Number(0)},${Number(0)},'${create}','${update}'`));
                    if (goodsLists.affectedRows == 1) {
                        ctx.response.body = {
                            code: 200,
                            msg: '插入成功！'
                        }
                    } else {
                        ctx.response.body = {
                            code: 201,
                            msg: '系统错误！',
                        }
                    }
                } else {
                    ctx.response.body = {
                        code: 204,
                        msg: '您的商铺审核还没有通过！',
                    }
                }
            } else {
                ctx.response.body = {
                    code: 201,
                    msg: '您还没有注册过商铺！',
                }
            }
        } else {
            ctx.response.body = {
                code: 403,
                msg: '系统错误！'
            }
        }
    } catch (error) {
        catchError(error);
    }
}

//上架下架商品
const putAndOffGoods = async (ctx, next) => {
    //商品id 
    let { goodsId,putAndOff } = ctx.request.body;
    try {
        let queryData = '';
        console.log(goodsId)
        console.log(putAndOff)
        console.log(queryData)
        if (putAndOff == 1) {
            //上架
            queryData = await query(`UPDATE goods SET is_on_sale=${Number(1)} WHERE id=${goodsId}`);
        } else if (putAndOff == 2){
            //下架
            queryData = await query(`UPDATE goods SET is_on_sale=${Number(0)} WHERE id=${goodsId}`);
        }
        if (queryData) {
            ctx.response.body = {
                code: 200,
                msg: '修改成功！'
            }
        } else {
            ctx.response.body = {
                code: 201,
                msg: '系统错误！'
            }
        }
    } catch(error) {
        catchError(error);
    }
}

//删除商品
const delGoods = async (ctx, next) => {
    //商品id 
    let { goodsId } = ctx.request.body;
    try {
        let delGoodsList = await query(`delete from goods where id=${goodsId}`);
        // console.log(delGoodsList)
        if (delGoodsList.affectedRows == 1) {
            ctx.response.body = {
                code: 200,
                msg: '删除商品成功！'
            }
        } else {
            ctx.response.body = {
                code: 203,
                msg: '系统错误！'
            }
        }
    } catch(error) {
        catchError(error);
    }
}

//凭借goodsid 查看商品
const goodsIdGetGoods = async (ctx, next) => {
    let { goodsId } = ctx.request.body;
    try {
        let goods = await query(`select * from goods where id=${goodsId}`);
        if (goods) {
            ctx.response.body = {
                code: 200,
                msg: '查找成功！',
                data: goods,
            }
        } else {
            ctx.response.body = {
                code: 203,
                msg: '系统错误！'
            }
        }
    } catch(error) {
        catchError(error)
    }
}

//编辑商品
const upDateGoods = async (ctx, next) => {
    let { goodsId,name, imageUrl, price, description, type, stock, content } = ctx.request.body;
    try {
        // name,type,headline,description,storeId,sn,content,price,stock,is_on_sale,is_del,sell_count,createdAt,updatedAt
        let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let upDateList = await query(`UPDATE goods SET name='${name}',headline='${imageUrl}',description='${description}',price=${price},type='${type}',stock=${stock},content='${content}',updatedAt='${update}' WHERE id=${goodsId}`);
        if (upDateList) {
            ctx.response.body = {
                code: 200,
                msg: '修改成功！',
            }
        } else {
            ctx.response.body = {
                code: 201,
                msg: '系统错误！'
            }
        }
    } catch(error) {
        catchError(error);
    }
}

module.exports = {
    'GET /goods/goodsList': goodsList,
    'POST /goods/goodsInsert': goodsInsert,
    'POST /goods/putAndOffGoods': putAndOffGoods,
    'POST /goods/delGoods': delGoods,
    'POST /goods/goodsIdGetGoods': goodsIdGetGoods,
    'POST /goods/upDateGoods': upDateGoods,
}