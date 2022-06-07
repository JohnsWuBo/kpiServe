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

//按照id查询examine
const storeExamine = async (ctx, next) => {
    try {
        let token = ctx.header.authorization;
        let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
        //lat签发时间 exp 过期时间
        //拿到 权限字段
        let id = Number(payload.id);
        let ExamineArr = await query(`select examine from store where userId=${id}`);
        if (ExamineArr.length <= 0) {
            ctx.response.body = {
                code: 201,
                msg: '该用户没有注册过商铺！',
            };
        } else {
            ctx.response.body = {
                code: 200,
                msg: '查询成功！',
                data: ExamineArr[0],
            };
        }
    } catch (error) {
        catchError(error);
    }
}

//添加商铺
const addStore = async (ctx, next) => {
    /*
        name: "",
        address: "",
        phone: "",
        introduce: "",
        imageUrl: "",
    */
    let { name, address, phone, introduce, imageUrl } = ctx.request.body;
    // console.log(name)
    try {
        let token = ctx.header.authorization;
        let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
        //lat签发时间 exp 过期时间
        //拿到 权限字段
        let id = Number(payload.id);
        let nameArr = await query(`select * from store where name='${name}'`);
        if (nameArr.length > 0) {
            ctx.response.body = {
                code: 201,
                msg: '店铺名重名，请重新命名！',
            };
            return;
        };
        let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        //INSERT INTO tableName(col1,col2,col3) VALUES (1,2,3)    
        // let flag = await query(INSERT_DATA('user', 'username,pwd,headline,value,phone,type,remarks,createdAt,updatedAt', `'${username}','${pwd}','',${Number(3)},'${phone}',${Number(1)},'${remarks}','${create}','${update}'`));
        //examine 1审核中  2不通过  3通过
        let flag = await query(INSERT_DATA('store', 'name,address,phone,introduce,headline,userId,examine,createdAt,updatedAt', `'${name}','${address}','${phone}','${introduce}','${imageUrl}',${id},${1},'${create}','${update}'`));
        if (flag) {
            ctx.response.body = {
                code: 200,
                msg: '店铺插入成功！'
            }
        } else {
            ctx.response.body = {
                code: 201,
                msg: '系统错误！'
            }
        }
    } catch (error) {
        catchError(error)
    }
}

//删除店铺
const deletStore = async (ctx, next) => {
    let token = ctx.header.authorization;
    let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
    //lat签发时间 exp 过期时间
    //拿到 权限字段
    let id = Number(payload.id);
    try {
        let deletData = await query(`delete from store where userId=${id}`);
        if (deletData.affectedRows == 1) {
            ctx.response.body = {
                code: 200,
                msg: '删除成功！'
            }
        } else {
            ctx.response.body = {
                code: 201,
                msg: '系统错误！'
            }
        }
    } catch (error) {
        catchError(error)
    }
}

//查看商铺列表
const storeList = async (ctx, next) => {
    let { date, name, phone, examine, pagesize, page } = ctx.request.body;
    console.log(date)
    try {
        let start = (page - 1) * pagesize;
        // (`SELECT  id,username,headline,type,value,createdAt  FROM  user order by id asc LIMIT ${start},${pageSize}`)
        let count = 0;
        //初始 分页语句
        let queryList = 'SELECT  *  FROM  store';
        //初始查看条数语句
        let totalMy = `SELECT COUNT(*) AS total FROM store`;
        if (name != '' || phone != '' || examine != '' || date != '') {
            queryList = queryList.concat(' WHERE');
            totalMy = totalMy.concat(' WHERE');
            let arr = [
                {
                    value: name,
                    str: 'name'
                },
                {
                    value: phone,
                    str: 'phone'
                }
            ]
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].value != '') {
                    if (count == 0) {
                        if (typeof arr[i].str == 'string') {
                            queryList = queryList.concat(` ${arr[i].str} LIKE '%${arr[i].value}%'`);
                            totalMy = totalMy.concat(` ${arr[i].str} LIKE '%${arr[i].value}%'`)
                        }
                    } else {
                        if (typeof arr[i].str == 'string') {
                            queryList = queryList.concat(` and ${arr[i].str} LIKE '%${arr[i].value}%'`);
                            totalMy = totalMy.concat(` and ${arr[i].str} LIKE '%${arr[i].value}%'`)
                        }
                    }
                    count++;
                }
            };
            //审核
            if (examine != '') {
                if (name == '' && phone == '') {
                    queryList = queryList.concat(` examine=${examine}`);
                    totalMy = totalMy.concat(` examine=${examine}`)
                } else {
                    queryList = queryList.concat(` and examine=${examine}`)
                    totalMy = totalMy.concat(` and examine=${examine}`)
                }
            };
            //时间段
            //datetimecolumn>='2010-03-01 00:00:00' and datetimecolumn<'2010-03-02 00:00:00'
            console.log(date)
            if (date != '' && date != null) {
                if (name == '' && phone == '' && examine == '') {
                    queryList = queryList.concat(` createdAt>='${date[0]}' and createdAt<'${date[1]}'`)
                    totalMy = totalMy.concat(` createdAt>='${date[0]}' and createdAt<'${date[1]}'`)
                } else {
                    queryList = queryList.concat(` and createdAt>='${date[0]}' and createdAt<'${date[1]}'`)
                    totalMy = totalMy.concat(` and createdAt>='${date[0]}' and createdAt<'${date[1]}'`)
                }
            }
        }
        queryList = queryList.concat(` order by id asc LIMIT ${start},${pagesize}`);
        // totalMy = totalMy.concat(` order by id asc`);
        // console.log(queryList);
        let querys = await query(queryList);
        if (querys && querys !== undefined && querys !== null) {
            console.log(queryList)
            let totals = await query(totalMy);
            console.log(totals)
            ctx.response.body = {
                data: querys,
                msg: '查询成功！',
                code: 200,
                total: totals[0].total,
            }
        } else {
            ctx.response.body = {
                data: [],
                msg: '没有数据！',
                code: 203,
                total: 0,
            }
        }
        // queryList = await query(`SELECT  *  FROM  store where name='${name}' and phone='${phone}' and examine=${examine} order by id asc LIMIT ${start},${pagesize}`);
        console.log(querys)

    } catch (error) {
        catchError(error);
    }
}

//审核结果改变
const changeExamine = async (ctx, next) => {
    let { id, examine} = ctx.request.body;
    try {
        let querydate = await query(`select * from store where id=${id}`);
        if (!querydate) {
            ctx.response.body = {
                code: 203,
                msg: '系统错误，没有该商铺！',
            };
            return;
        } else {
            // UPDATE goods SET name='${name}',headline='${imageUrl}',description='${description}',price=${price},type='${type}',stock=${stock},content='${content}',updatedAt='${update}' WHERE id=${goodsId}
            let querys = await query(`UPDATE store SET examine=${examine} WHERE id=${id}`);
            if (querys) {
                ctx.response.body = {
                    code: 200,
                    msg: '修改成功！'
                }
            } else {
                ctx.response.body = {
                    code: 202,
                    msg: '系统错误，修改失败！'
                }
            }
        }
    } catch(error) {
        catchError(error)
    }
}

module.exports = {
    'POST /stores/addStore': addStore,
    'POST /stores/storeExamine': storeExamine,
    'POST /stores/deletStore': deletStore,
    'POST /stores/storeList': storeList,
    'POST /stores/changeExamine': changeExamine,
}