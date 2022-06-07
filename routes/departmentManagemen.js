const _cookies = require('../lib/utils.js');
const { transformTree } = require('../lib/utils');
const {
    password
} = require("../mysql/mysql_config");
const query = require("../mysql/query"); //引入异步查询方法
const koajwt = require('koa-jwt');
const util = require('util');
const {
    SHOW_ALL_DB,
    INSERT_DATA
} = require("../mysql/sql"); //部分引入sql库
//token签名
const SECRST = 'johnwu'
const jsonwebtoken = require('jsonwebtoken');
const catchError = (ctx, err) => {
    console.log(`提示了${err}`);
    console.log(err)
    ctx.resError = err;
};

// 获取全部地址接口
const allHistory = async (ctx, next) => {
    try {
        let list = await query(`select id,cityName,parentId,longitude,latitude,depth from s_provinces`);
        if (list && list !== undefined && list !== null) {
            if (list.length > 0) {
                ctx.response.body = {
                    data: transformTree(list),
                    code: 200,
                    msg: '请求成功！'
                };
                ctx.response.status = 200;
            } else {
                ctx.response.body = {
                    code: 203,
                    msg: '当前没有数据！'
                };
                ctx.response.status = 203;
            }
        } else {
            ctx.response.body = {
                code: 403,
                msg: '请求错误！'
            };
            ctx.response.status = 403;
        };

    } catch (error) {
        catchError(error)
    }
};

// 展示医院数据
const getHospital = async (ctx, next) => {
    //id orgLevel
    let { id, orgLevel } = ctx.request.body;
    try {
        // 利用orgLevel值 请求到当前表的字段
        let orgList = await query(`select orgName from managemen where id='${orgLevel}'`);
        if (!orgList[0]) {
            ctx.response.status = 203;
            ctx.response.body = {
                code: 203,
                msg: '没有当前的医院岗位！',
            };
            return;
        }
        console.log(orgList[0])
        // 当前表字段
        let orgName = orgList[0].orgName;
        let historyList = await query(`select * from ${orgName} where id='${id}'`);
        if (historyList[0]) {
            ctx.response.status = 200;
            ctx.response.body = {
                code: 200,
                msg: '请求成功！',
                data: historyList[0]
            }
        } else {
            ctx.response.status = 203;
            ctx.response.body = {
                code: 203,
                msg: '没有该数据！',
            }
        }
    } catch (error) {
        catchError(error)
    }
}

// 新建 或者 修改分院数据库
const updateHospitalTwo = async (ctx, next) => {
    // 获取分院id，医院id，分院名称！
    let { id, hospitalId, name, orgLevel } = ctx.request.body;
    try {
        if (id == 0) {

            // 判断分院院名字是否重复！
            let nameArr = await query(`select * from hospitalTwo where name='${name}'`);
            if (nameArr.length > 0) {
                //存在分院名字重复
                ctx.response.status = 203;
                ctx.response.body = {
                    msg: "当前分院已经被注册过！",
                    code: 203
                };
                return;
            }
            // 插入分院表！
            // 获取当前时间
            let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            let queryData = await query(INSERT_DATA('hospitalTwo', 'name,hospitalId,orgLevel,createTime,destoryTime', `'${name}',${hospitalId},${orgLevel + 1},'${create}','${update}'`));
            if (queryData) {
                ctx.response.status = 200;
                ctx.response.body = {
                    msg: '新建分院成功！',
                    code: 200,
                }
            } else {
                ctx.response.status = 203;
                ctx.response.body = {
                    code: 203,
                    msg: '新建分院失败！'
                }
            }


        } else {
            // 修改
            // 首先获取地区值
            let historyList = await query(`select mergerName,longitude,latitude from s_provinces where id='${historyId[historyId.length - 1]}'`);
            if (historyList[0].longitude) {
                // 保存经纬度，地区文字
                // 获取成功地区值
                let historyArr = {
                    mergerName: historyList[0].mergerName,
                    longitude: historyList[0].longitude,
                    latitude: historyList[0].latitude
                };
                // 判断医院名字是否重复！
                let nameArr = await query(`select * from hospital where name='${name}' not in (${id})`);
                if (nameArr.length > 0) {
                    //存在医院名字重复
                    ctx.response.status = 203;
                    ctx.response.body = {
                        msg: "当前医院已经被注册过！",
                        code: 203
                    };
                    return;
                }
                // 插入医院表！
                // 获取当前时间
                let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                let queryData = await query(`UPDATE hospital SET name='${name}',historyId='${historyId.join(',')}',longitude='${historyArr.longitude}',latitude='${historyArr.latitude}',historyName='${historyArr.mergerName}',mergerName='${historyArr.mergerName}',destoryTime='${update}' WHERE id=${id}`)

                if (queryData) {
                    ctx.response.status = 200;
                    ctx.response.body = {
                        msg: '修改医院成功！',
                        code: 200,
                    }
                } else {
                    ctx.response.status = 203;
                    ctx.response.body = {
                        code: 203,
                        msg: '修改医院失败！'
                    }
                }

            } else {
                ctx.response.status = 203;
                ctx.response.body = {
                    msg: '没有当前地区！',
                    code: 203,
                };
                return;
            }
        }
    } catch (error) {
        catchError(error)
    }
}

// 新建 或者 修改医院数据库
const updateHospital = async (ctx, next) => {
    // 获取医院id，地址id，医院名称！
    let { id, historyId, name, orgLevel } = ctx.request.body;
    try {
        if (id == 0) {
            // 新建
            // 首先获取地区值
            let historyList = await query(`select mergerName,longitude,latitude from s_provinces where id='${historyId[historyId.length - 1]}'`);
            if (historyList[0].longitude) {
                // 保存经纬度，地区文字
                // 获取成功地区值
                let historyArr = {
                    mergerName: historyList[0].mergerName,
                    longitude: historyList[0].longitude,
                    latitude: historyList[0].latitude
                };
                // 判断医院名字是否重复！
                let nameArr = await query(`select * from hospital where name='${name}'`);
                if (nameArr.length > 0) {
                    //存在医院名字重复
                    ctx.response.status = 203;
                    ctx.response.body = {
                        msg: "当前医院已经被注册过！",
                        code: 203
                    };
                    return;
                }
                // 插入医院表！
                // 获取当前时间
                let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                let queryData = await query(INSERT_DATA('hospital', 'name,historyId,longitude,latitude,historyName,mergerName,createTime,destoryTime,orgLevel', `'${name}','${historyId.join(',')}','${historyArr.longitude}','${historyArr.latitude}','${historyArr.mergerName}','${historyArr.mergerName}','${create}','${update}',${orgLevel}`));
                if (queryData) {
                    ctx.response.status = 200;
                    ctx.response.body = {
                        msg: '新建医院成功！',
                        code: 200,
                    }
                } else {
                    ctx.response.status = 203;
                    ctx.response.body = {
                        code: 203,
                        msg: '新建医院失败！'
                    }
                }

            } else {
                ctx.response.status = 203;
                ctx.response.body = {
                    msg: '没有当前地区！',
                    code: 203,
                };
                return;
            }
        } else {
            // 修改
            // 首先获取地区值
            let historyList = await query(`select mergerName,longitude,latitude from s_provinces where id='${historyId[historyId.length - 1]}'`);
            if (historyList[0].longitude) {
                // 保存经纬度，地区文字
                // 获取成功地区值
                let historyArr = {
                    mergerName: historyList[0].mergerName,
                    longitude: historyList[0].longitude,
                    latitude: historyList[0].latitude
                };
                // 判断医院名字是否重复！
                let nameArr = await query(`select * from hospital where name='${name}' not in (${id})`);
                if (nameArr.length > 0) {
                    //存在医院名字重复
                    ctx.response.status = 203;
                    ctx.response.body = {
                        msg: "当前医院已经被注册过！",
                        code: 203
                    };
                    return;
                }
                // 插入医院表！
                // 获取当前时间
                let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                let queryData = await query(`UPDATE hospital SET name='${name}',historyId='${historyId.join(',')}',longitude='${historyArr.longitude}',latitude='${historyArr.latitude}',historyName='${historyArr.mergerName}',mergerName='${historyArr.mergerName}',destoryTime='${update}' WHERE id=${id}`)

                if (queryData) {
                    ctx.response.status = 200;
                    ctx.response.body = {
                        msg: '修改医院成功！',
                        code: 200,
                    }
                } else {
                    ctx.response.status = 203;
                    ctx.response.body = {
                        code: 203,
                        msg: '修改医院失败！'
                    }
                }

            } else {
                ctx.response.status = 203;
                ctx.response.body = {
                    msg: '没有当前地区！',
                    code: 203,
                };
                return;
            }
        }
    } catch (error) {
        catchError(error)
    }
}

module.exports = {
    'POST /departmentManagemen/allHistory': allHistory,
    'POST /departmentManagemen/updateHospital': updateHospital,
    'POST /departmentManagemen/getHospital': getHospital,
    'POST /departmentManagemen/updateHospitalTwo': updateHospitalTwo,
};