const _cookies = require('../lib/utils.js');
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
//新建角色
const rolesInsert = async (ctx, next) => {
    // level: "",
    // name: "",
    // remarks: ""
    let {
        name,
        details
    } = ctx.request.body;
    try {
        //查询roles库是否有name 重复
        let nameArr = await query(`select * from roles where name='${name}'`);
        if (nameArr.length > 0) {
            //说明有这个名字 不能新建
            ctx.response.body = {
                code: 203,
                msg: '角色名字重复！'
            };
            return;
        }
        //可以创建了
        /*
            value 1：超级管理员 2副管理员 3普通会员 控制等级！
        */
        //查找 所有 有这个level的路由id
        //select username,pwd,headline,type,phone,remarks from user where id='${id}'
        //创建时间 更改时间
        let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        // await query(INSERT_DATA('user', 'username,pwd,headline,value,phone,type,remarks,createdAt,updatedAt', `'${username}','${pwd}','',${Number(3)},'${phone}',${Number(1)},'${remarks}','${create}','${update}'`))
        //插入数据
        let queryData = await query(INSERT_DATA('roles', 'name,count,details,type,createTime,destoryTime', `'${name}', ${Number(0)},'${details}',1,'${create}','${update}'`));
        if (queryData) {
            ctx.response.body = {
                code: 200,
                msg: '新建成功！'
            }
        } else {
            ctx.response.body = {
                code: 201,
                msg: '新建失败！'
            }
        }
    } catch (error) {
        catchError(error)
    }
}
//新建角色 (旧)
// const rolesInsert = async (ctx, next) => {
//     // level: "",
//     // name: "",
//     // remarks: ""
//     let { name, details } = ctx.request.body;
//     try {
//         //查询roles库是否有name 重复
//         let nameArr = await query(`select * from roles where name='${name}'`);
//         if (nameArr.length > 0) {
//             //说明有这个名字 不能新建
//             ctx.response.body = {
//                 code: 203,
//                 msg: '角色名字重复！'
//             };
//             return;
//         }
//         //可以创建了
//         /*
//             value 1：超级管理员 2副管理员 3普通会员 控制等级！
//         */
//         //查找 所有 有这个level的路由id
//         //select username,pwd,headline,type,phone,remarks from user where id='${id}'
//         console.log(level)
//         let idArr = await query(`select id from user where value Like '%${level}%'`);
//         //用户id
//         let _idArr = [];
//         console.log(idArr)
//         if (idArr.length > 0) {
//             for (let i = 0; i < idArr.length; i++) {
//                 _idArr.push(idArr[i].id)
//             }
//         };
//         console.log(_idArr)
//         let routerIdArr = await query(`select id from addrouter where value Like '%${level}%'`);
//         //routerid集合
//         let _routerIdArr = [];
//         if (routerIdArr.length > 0) {
//             for (let k = 0; k < routerIdArr.length; k++) {
//                 _routerIdArr.push(routerIdArr[k].id);
//             }
//         };
//         //创建时间 更改时间
//         let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
//         let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
//         // await query(INSERT_DATA('user', 'username,pwd,headline,value,phone,type,remarks,createdAt,updatedAt', `'${username}','${pwd}','',${Number(3)},'${phone}',${Number(1)},'${remarks}','${create}','${update}'`))
//         //插入数据
//         let queryData = await query(INSERT_DATA('roles', 'name,count,routerIds,remarks,level,createdAt,updatedAt', `'${name}',${_idArr.length},'${_routerIdArr.join(',')}','${remarks}',${level},'${create}','${update}'`));
//         if (queryData) {
//             ctx.response.body = {
//                 code: 200,
//                 msg: '新建成功！'
//             }
//         } else {
//             ctx.response.body = {
//                 code: 201,
//                 msg: '新建失败！'
//             }
//         }
//     } catch (error) {
//         catchError(error)
//     }
// }

//获取角色list
const getRolesList = async (ctx, next) => {
    const {
        page,
        pageSize,
        name
    } = ctx.request.body;
    try {
        //page 当前页数
        //pageSize 一页多少条
        let token = ctx.header.authorization;
        let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
        //lat签发时间 exp 过期时间
        //拿到 权限字段
        let id = payload.id;
        let start = (page - 1) * pageSize;
        //当前页为1  返回 10条数据 0 - 10
        //当前页为2  返回 11 - 20
        //select * from articles order by id desc limit ${page},${limit}
        //SELECT *  FROM student_info WHERE name LIKE '%${name}%' LIMIT ${start},${pageSize}
        let list = '';
        if (name) {
            list = await query(`SELECT id,name,count,details,type,createTime  FROM  roles WHERE name LIKE '%${name}%' order by id asc LIMIT ${start},${pageSize}`)
        } else {
            list = await query(`SELECT  id,name,count,details,type,createTime  FROM  roles order by id asc LIMIT ${start},${pageSize}`)
        }
        // console.log(list)
        if (list && list !== undefined && list !== null) {
            let listTotal = '';
            //如果name没有显示总total 
            if (name) {
                listTotal = await query(`SELECT COUNT(*) AS total FROM roles WHERE name LIKE '%${name}%' order by id asc`)
            } else {
                //查询总条数
                listTotal = await query(`SELECT COUNT(*) AS total FROM roles`);
            }
            let total = 0;
            if (!listTotal[0]) {
                total = 0;
            } else {
                total = listTotal[0].total;
            }
            ctx.response.body = {
                code: 200,
                msg: '请求到了！',
                data: list,
                total: total,
            }
        } else {
            ctx.response.body = {
                code: 202,
                msg: '当前没有用户列表！'
            }
        }
    } catch (error) {
        catchError(error)
    }
}

//初始化角色 编辑
const searchRolesUser = async (ctx, next) => {
    const {
        id
    } = ctx.request.body;
    console.log(id)
    try {
        let IDarr = await query(`select name,details from roles where id='${id}'`);
        // console.log('IDarr-------->'+IDarr)
        if (IDarr !== undefined && IDarr !== null && IDarr.length > 0) {
            //查询到了
            ctx.response.status = 200;
            ctx.response.body = {
                msg: '查找到了！',
                data: IDarr[0],
                code: 200
            };
        } else {
            ctx.response.status = 202;
            ctx.response.body = {
                msg: '没有查找到！',
                code: 203,
                data: []
            };
        }
    } catch (error) {
        catchError(error)
    }
}

//编辑角色
const compolieRolesUser = async (ctx, next) => {

    // let { id, level, name, remarks } = ctx.request.body;
    let {
        id,
        name,
        details
    } = ctx.request.body;
    // select * from table where id not in (ID)
    //select * from user where username='${username}'
    //select *form a where id not in（select id from b）and username=‘root’
    try {
        let nameArr = await query(`select * from roles where name='${name}' and id not in (${id})`);
        if (nameArr.length > 0) {
            //存在用户名
            ctx.response.status = 203;
            ctx.response.body = {
                msg: "用户名重复！"
            };
            return;
        };
        let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        //UPDATE user SET age=? WHERE id=?
        //username, pwd, headline, phone, type, remarks, id
        let datas = await query(`UPDATE roles SET name='${name}',details='${details}',type=1,destoryTime='${update}' WHERE id=${id}`)
        if (datas) {
            //修改成功！
            ctx.response.body = {
                msg: '修改成功！',
                code: 200,
            }
        } else {
            //修改失败
            ctx.response.body = {
                msg: '修改失败！',
                code: 402
            }
        }
    } catch (error) {
        catchError(error);
    }
}

//删除角色
const deleteRoles = async (ctx, next) => {
    const {
        id
    } = ctx.request.body;
    try {
        // let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        //先查找
        let searchArr = await query(`select * from roles where id=${id}`);
        if (!searchArr) {
            ctx.response.body = {
                msg: '没有查找这个角色ID！',
                code: 203,
            };
            return;
        };
        let rolesArr = await query(`DELETE FROM roles WHERE id = ${id}`);
        if (!rolesArr.affectedRows) {
            ctx.response.body = {
                msg: '删除失败！',
                code: 201,
            };
        } else {
            ctx.response.body = {
                msg: '删除成功！',
                code: 200,
            };
        }
    } catch (err) {
        catchError(err);
    }
}

//查询路由导航
const rolesRouter = async (ctx, next) => {
    let token = ctx.header.authorization;
    let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
    //lat签发时间 exp 过期时间
    //拿到 权限字段
    let value = String(payload.value);
    console.log(value)
    //去查询 菜单导航
    //FROM user WHERE username LIKE '%${name}%' order by id asc
    let meunArr = await query(`SELECT * FROM route`);
    ctx.response.body = {
        code: 200,
        data: meunArr,
        msg: '成功请求到！',
    }
}

//按照当前路由请求导航
const jurisdictionRouter = async (ctx, next) => {
    // let token = ctx.header.authorization;
    // let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
    // //lat签发时间 exp 过期时间
    // //拿到 权限字段
    // let jurisdiction = String(payload.roles);
    // console.log(payload)
    // console.log('权限的值为---------------------->')
    // console.log(jurisdiction)
    let {
        jurisdiction
    } = ctx.request.body;
    try {
        // console.log(value)
        //去查询 菜单导航
        //FROM user WHERE username LIKE '%${name}%' order by id asc
        let meunArr = await query(`SELECT id FROM route WHERE value Like '%${jurisdiction}%'`);
        // console.log(meunArr[0]);
        if (meunArr.length > 0) {
            let arr = [];
            meunArr.forEach((value) => {
                arr.push(value.id);
            })
            ctx.response.body = {
                code: 200,
                data: arr,
                msg: '成功请求到！',
            }
        } else {
            ctx.response.body = {
                code: 403,
                msg: '请求失败，当前权限没有路由！',
            }
        }

    } catch (error) {
        catchError(error);
    }
}

//授权导航请求
const updateRolseAuthorization = async (ctx, next) => {
    // 点击改变的权限id 改变的导航数组id
    let {
        rolesId,
        routeList
    } = ctx.request.body;
    console.log(rolesId, routeList)
    try {
        // 开关
        let flag = false;
        let data = await query(`select * from roles where id='${rolesId}'`);
        if (!data[0]) {
            ctx.response.body = {
                code: 203,
                msg: '不存在当前权限值！'
            };
            ctx.response.status = 203;
            return;
        } else {
            let query4 = await query(`select * from route`);
            for (let i = 0; i < query4.length; i++) {
                console.log(query4[i].id)
                // 改变的数组集合没有这个id值 未选中 判断当前value字段有没有这个 权限值
                let query3 = await query(`select * from route where id=${query4[i].id}`);
                let value = query3[0].value;
                if (routeList.indexOf(query4[i].id) == -1) {
                    // 数组
                    let list = value.length > 1 ? value.split(',') : value.split('');
                    if (list.indexOf(String(rolesId)) == -1) {
                        // 正常 没有这个id值
                        continue;
                    } else {
                        list.splice(list.indexOf(String(rolesId)), 1);
                        // 有值 需要把值删掉
                        let query2 = await query(`UPDATE route SET value='${list.join(',')}' WHERE id=${query4[i].id}`);
                        if (query2) {
                            flag = true;
                        } else {
                            flag = false;
                        }
                    }
                } else {
                    // 存在
                    // 数组
                    let list = value.length > 1 ? value.split(',') : value.split('');
                    console.log(list.indexOf(String(rolesId)))
                    if (list.indexOf(String(rolesId)) == -1) {
                        // // 错误 没有这个id值
                        list.push(rolesId);
                        // 有值 需要把值删掉
                        let query2 = await query(`UPDATE route SET value='${list.join(',')}' WHERE id=${query4[i].id}`);
                        if (query2) {
                            flag = true;
                        } else {
                            flag = false;
                        }
                    } else {
                        continue;
                    }
                }
            }
            if (flag) {
                ctx.response.body = {
                    code: 200,
                    msg: '导航修改完毕！'
                };
                ctx.response.status = 200;
            } else {
                ctx.response.body = {
                    code: 203,
                    msg: '没有改变！'
                };
                ctx.response.status = 203;
            }
        }
    } catch (error) {
        catchError(ctx, error)
    }
    // 点击改变的权限id值 还有 当前改变的导航数组id集合
    // let { idDatas, rolesId, level } = ctx.request.body;
    // console.log(idDatas)
    // try {
    //     let queryId = await query(`UPDATE roles SET routerIds='${idDatas.join(',')}' WHERE id=${rolesId}`);
    //     console.log(queryId);
    //     if (queryId) {
    //         //插入成功
    //         let addRouterIddatas = await query(`select value,id from route`);
    //         console.log(addRouterIddatas)
    //         if (addRouterIddatas.length > 0) {
    //             console.log(111)
    //             //id集合
    //             let addRouterId = [];
    //             level = String(level);
    //             //value集合
    //             let addRouterVal = [];
    //             for (let i = 0; i < addRouterIddatas.length; i++) {
    //                 addRouterId.push(addRouterIddatas[i].id);
    //                 addRouterVal.push(addRouterIddatas[i].value);

    //             };
    //             let flag = false;
    //             //idDatas 为 当前权限的 路由集合
    //             //查询id 和 权限集合
    //             for (let i = 0; i < addRouterId.length; i++) {
    //                 //[10,1,2]
    //                 //如果当前传的id集合 在当前的addrouterId里面 拿到当前符合条件的id值
    //                 if (idDatas.indexOf(addRouterId[i]) >= 0) {
    //                     // console.log(1)
    //                     //拿到id值
    //                     let id = idDatas.indexOf(addRouterId[i]);
    //                     let arr = addRouterVal[i].split(',');
    //                     //判断 如果未存在这个权限 那么加上 如果存在 不动
    //                     if (arr.indexOf(level) < 0) {
    //                         let routerid = addRouterId[i];
    //                         arr.push(level)
    //                         arr.clean(arr)
    //                         console.log(arr)
    //                         // console.log('addRouterVal[i].push(level).join(,)---------->')
    //                         // console.log(arr)
    //                         // console.log(arr.push(level));
    //                         // console.log(arr);
    //                         // console.log(arr.join(','))
    //                         let queryFlag = await query(`UPDATE addrouter SET value='${arr.join(',')}' WHERE id=${routerid}`);
    //                         // console.log(queryFlag);
    //                         if (queryFlag) {
    //                             flag = true;
    //                         } else {
    //                             flag = false;
    //                             ctx.response.body = {
    //                                 msg: '逻辑错误',
    //                                 code: 203
    //                             };
    //                             return;
    //                         }
    //                     }
    //                 } else {
    //                     //其他未选中的
    //                     //判断 如果存在当前权限值，给他删掉
    //                     let id = idDatas.indexOf(addRouterId[i]);
    //                     let arr = addRouterVal[i].split(',');
    //                     console.log(arr)
    //                     if (arr.indexOf(level) >= 0) {
    //                         console.log(addRouterId[i])
    //                         console.log(addRouterId)
    //                         let routerid = addRouterId[i];
    //                         let index = arr.indexOf(level);
    //                         arr.splice(index, 1);
    //                         arr.clean(arr)
    //                         console.log(arr)
    //                         // console.log('routerid-------------->')
    //                         // console.log(routerid)
    //                         // console.log('index------------------->')
    //                         // console.log(index)
    //                         // console.log(arr)
    //                         // arr.splice(index, 1);
    //                         // console.log(arr)
    //                         // console.log('arrjoin--------------->')
    //                         // console.log(arr.join(','));
    //                         // console.log(routerid)
    //                         let queryFlag1 = await query(`UPDATE addrouter SET value='${arr.join(',')}' WHERE id=${routerid}`);
    //                         // console.log(queryFlag1)
    //                         if (queryFlag1) {
    //                             flag = true;
    //                         } else {
    //                             flag = false;
    //                             ctx.response.body = {
    //                                 msg: '逻辑错误',
    //                                 code: 203
    //                             };
    //                             return;
    //                         }
    //                     }
    //                 }
    //             };
    //             console.log(flag)
    //             if (flag) {
    //                 ctx.response.body = {
    //                     msg: '修改成功！',
    //                     code: 200,
    //                 };
    //             } else {
    //                 ctx.response.body = {
    //                     code: 203,
    //                     msg: '授权无变化！',
    //                 }
    //             }
    //         }
    //     } else {
    //         ctx.response.body = {
    //             code: 404,
    //             msg: '插入失败',
    //         }
    //     }
    // } catch (error) {
    //     catchError(error);
    // }
}

//按照路由名字查询导航
const addRouterByName = async (ctx, next) => {
    let {
        name
    } = ctx.request.body;
    try {
        let meunArr = await query(`SELECT * FROM addrouter WHERE name Like '%${name}%'`);
        if (meunArr.length > 0) {
            //成功查询
            ctx.response.body = {
                code: 200,
                data: meunArr,
            }
        } else {
            //失败
            ctx.response.body = {
                code: 201,
                data: [],
                msg: '没有此菜单名！',
            }
        }
    } catch (error) {
        catchError(error);
    }
}
module.exports = {
    'POST /roles/rolesInsert': rolesInsert,
    'POST /roles/getRolesList': getRolesList,
    'POST /roles/searchRolesUser': searchRolesUser,
    'POST /roles/compolieRolesUser': compolieRolesUser,
    'POST /roles/deleteRoles': deleteRoles,
    'POST /roles/rolesRouter': rolesRouter,
    'POST /roles/jurisdictionRouter': jurisdictionRouter,
    'POST /roles/updateRolseAuthorization': updateRolseAuthorization,
    'POST /roles/addRouterByName': addRouterByName,
}