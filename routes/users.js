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
//注册接口
const reg = async (ctx, next) => {
  /*
    用户名：name
    密码：pass  （md5加密）
    邮箱：eamil
  */
  let {
    username,
    pwd,
    phone
  } = ctx.request.body;
  console.log(username, pwd, phone);
  try {
    //查询用户名和邮箱在user表里面是否存在 如果存在返回状态码203 提示用户名已存在 
    //如果不存在 写入数据表
    let nameArr = await query(`select * from user where username='${username}'`);
    if (nameArr.length > 0) {
      //存在用户名
      ctx.response.status = 203;
      ctx.response.body = {
        msg: "用户名重复！"
      };
      return;
    }
    //存在电话
    let phoneArr = await query(`select * from user where phone='${phone}'`);
    // console.log(`这里是emailArr${emailArr}`)
    if (phoneArr.length > 0) {
      //存在邮箱
      ctx.response.status = 203;
      ctx.response.body = {
        msg: "手机号重复！"
      };
      return;
    };

    let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    //INSERT INTO tableName(col1,col2,col3) VALUES (1,2,3)    
    let flag = await query(INSERT_DATA('user', 'username,pwd,headline,value,phone,type,remarks,createdAt,updatedAt', `'${username}','${pwd}','',${Number(3)},'${phone}',${Number(1)},'','${create}','${update}'`));
    if (flag) {
      //插入成功
      ctx.response.status = 200;
      ctx.response.body = {
        msg: "注册成功！"
      };
    } else {
      //插入成功
      ctx.response.status = 203;
      ctx.response.body = {
        msg: "注册失败！"
      };
    }
  } catch (error) {
    console.log(error);
    catchError(error)
  }
}
//登录接口
const login = async (ctx, next) => {

  const {
    userName,
    pwd
  } = ctx.request.body;

  try {

    // console.log(name,pwd);
    //select text, password from myusertable where text=UserName and password=Password;
    let loginArr = await query(`select name, pass from user where name='${userName}' and pass='${pwd}'`);
    console.log(loginArr)
    if (loginArr.length > 0 && loginArr) {
      let arr = await query(`select * from user where name='${loginArr[0].name}'`);
      let type = arr[0].rolesType;
      if (!type) {
        ctx.response.body = {
          msg: '请联系管理员，您的账号被锁了！',
          code: 302
        };
        return;
      }
      let headline = arr[0].headline ? arr[0].headline : 'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=2726056320,1269467144&fm=26&gp=0.jpg';
      ctx.response.body = {
        msg: '登录成功！！',
        code: 200,
        data: {
          token: jsonwebtoken.sign({
              name: arr[0].name,
              id: arr[0].id,
              roles: arr[0].roleNum
            },
            SECRST, {
              expiresIn: '1h'
            }
          ),
          name: arr[0].name,
          roles: arr[0].roleNum,
          id: arr[0].id,
          headline: headline,
          userName: arr[0].userName
        },

      };
      ctx.response.status = 200;
    } else {
      ctx.response.body = {
        msg: '账号或者密码输入错误！！',
        code: 302,
      }
      ctx.response.status = 302;
    }

  } catch (error) {
    catchError(error)
  }
};
//查询 左侧菜单导航
const queryAddMenu = async (ctx, next) => {
  let token = ctx.header.authorization;
  let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
  //lat签发时间 exp 过期时间
  //拿到 权限字段
  let value = String(payload.value);
  console.log(value)
  //去查询 菜单导航
  //FROM user WHERE username LIKE '%${name}%' order by id asc
  let meunArr = await query(`SELECT * FROM addrouter WHERE value Like '%${value}%'`);
  ctx.response.body = {
    code: 200,
    data: meunArr,
    msg: '成功请求到！',
  }
}
//退出登录接口
const goOut = async (ctx, next) => {
  const cookies = {
    id: ctx.cookies.get('id'),
    name: ctx.cookies.get('name'),
    pwd: ctx.cookies.get('pwd'),
  };
  console.log(cookies)
  try {
    //摧毁cookies
    _cookies.destoryCookies(ctx, cookies);
    ctx.response.status = 200;
    ctx.response.body = {
      msg: '退出成功！！！'
    };
  } catch (error) {
    _cookies.catchError(error);
  }
};
//验证密码是否正确
const verificationPass = async (ctx, next) => {
  let token = ctx.header.authorization;
  let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
  // console.log(payload)
  let username = payload.name;
  // console.log(`username----->`)
  // console.log(username)
  const {
    pwd
  } = ctx.request.body;
  // console.log(`pwd-------->`)
  // console.log(pwd)
  try {
    let loginArr = await query(`select username, pwd from user where username='${username}' and pwd='${pwd}'`);
    console.log(loginArr)
    if (loginArr.length > 0 && loginArr) {
      ctx.response.body = {
        msg: '密码正确！',
        code: 200,
      }
    } else {
      ctx.response.body = {
        msg: '密码不正确！请重新输入！',
        code: 202,
      }
    }
  } catch (error) {
    catchError(error)
  }
}
//修改密码
const modifyPass = async (ctx, next) => {
  let token = ctx.header.authorization;
  let payload = await util.promisify(jsonwebtoken.verify)(token.split(' ')[1], SECRST);
  let username = payload.name;
  const {
    pwd
  } = ctx.request.body;
  console.log(pwd)
  try {
    //update Users set password=（这写新密码）where username=' '
    let loginArr = await query(`update user set pwd='${pwd}' where username='${username}'`);
    // console.log(`这里是loginArr------>`)
    // console.log(loginArr)
    if (loginArr) {
      ctx.response.body = {
        code: 200,
        msg: '修改成功！请重新登录！'
      }
    } else {
      ctx.response.body = {
        code: 202,
        msg: '修改有问题，具体不知道'
      }
    }
  } catch (error) {
    console.log(error);
    catchError(error)
  }
}

//凭借id 查询作者信息
const searchAuthor = async (ctx, next) => {
  const {
    id
  } = ctx.request.body;
  console.log(id)
  try {
    //检查是否存在此id  select name, pwd, id from users where name='${name}' and pwd='${pwd}'
    let IDarr = await query(`select * from user where id='${id}'`);
    // console.log('IDarr-------->'+IDarr)
    if (IDarr !== undefined && IDarr !== null && IDarr.length > 0) {
      //查询到了
      ctx.response.status = 200;
      ctx.response.body = {
        msg: '查找到了！',
        data: IDarr,
        code: 200
      };
    } else {
      ctx.response.status = 202;
      ctx.response.body = {
        msg: '没有此文章！',
        code: 203
      };
    }
  } catch (error) {
    catchError(error)
  }
}

//用户管理tabs列表 模糊查询
const systemUserList = async (ctx, next) => {
  const {
    page,
    pageSize,
    name,
    userName
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
    console.log(start)
    //当前页为1  返回 10条数据 0 - 10
    //当前页为2  返回 11 - 20
    //select * from articles order by id desc limit ${page},${limit}
    //SELECT *  FROM student_info WHERE name LIKE '%${name}%' LIMIT ${start},${pageSize}
    let list = '';
    // 保存mysql字段
    //user, pass,userName,roleNum,workType,age, departmentOptions, gender, titleOptions, rolesType
    let str = '';
    if (name || userName) {

      if (name && userName) {
        str = `name LIKE '%${name}%'and userName LIKE '%${userName}%'`;
      } else {
        if (name) {
          str = `name LIKE '%${name}%'`;
        } else if (userName) {
          str = `userName LIKE '%${userName}%'`;
        }
      }
      list = await query(`SELECT id,name,userName,departmentOptions,titleOptions, age ,idcode,createTime,destoryTime  FROM  user WHERE ${str} order by id asc LIMIT ${start},${pageSize}`)
    } else {
      list = await query(`SELECT  id,name,userName,departmentOptions,titleOptions, age ,idcode,createTime,destoryTime  FROM  user order by id asc LIMIT ${start},${pageSize}`)
    }
    // console.log(str)
    console.log(list)
    if (list && list !== undefined && list !== null) {
      // elect * from articles order by id desc limit ${page},${limit}
      //SELECT COUNT(*) AS total FROM user WHERE ${str} order by id asc
      let listTotal = '';

      if (name || userName) {
        listTotal = await query(`SELECT COUNT(*) AS total FROM user WHERE ${str} order by id asc`)
      } else {
        listTotal = await query(`SELECT COUNT(*) AS total FROM user order by id asc`)
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

//用户管理 新增
const addUser = async (ctx, next) => {
  //账号： 密码： 角色： 状态： 真实姓名： 年龄： 性别：科室：职称：工作状态
  //科室呵职称都为空 当前没有做
  let {
    user,
    pass,
    userName,
    roleNum,
    workType,
    age,
    departmentOptions,
    titleOptions,
    gender,
    rolesType
  } = ctx.request.body;
  try {
    console.log(`状态码为------------>${rolesType}`)
    //查询用户名和邮箱在user表里面是否存在 如果存在返回状态码203 提示用户名已存在 
    //如果不存在 写入数据表
    let nameArr = await query(`select * from user where name='${user}'`);
    if (nameArr.length > 0) {
      //存在手机号
      ctx.response.status = 203;
      ctx.response.body = {
        msg: "手机号重复！",
        code: 203
      };
      return;
    }
    // 姓名可能重名
    // let userNameArr = await query(`select * from user where userName='${userName}'`);
    // if (userNameArr.length > 0) {
    //   //存在用户名
    //   ctx.response.status = 203;
    //   ctx.response.body = {
    //     msg: "重复！"
    //   };
    //   return;
    // }
    let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    //user, pass,userName,roleNum,workType,age, departmentOptions, gender, titleOptions, rolesType
    let flag = await query(INSERT_DATA('user', 'name,pass,userName,roleNum,workType,age,departmentOptions,gender,titleOptions,rolesType,createTime,destoryTime', `'${user}','${pass}','${userName}',${roleNum},${workType},${age},'',${gender},'',${rolesType},'${create}','${update}'`));
    if (flag) {
      //插入成功
      ctx.response.status = 200;
      ctx.response.body = {
        msg: "新增用户成功！",
        code: 200,
      };
      // 给角色表count + 1
      let nameArr = await query(`select count from roles where id='${roleNum}'`);
      console.log(nameArr);
      let datas = await query(`UPDATE roles SET count=${nameArr[0].count + 1} WHERE id=${roleNum}`)
      console.log(datas);
    } else {
      //插入成功
      ctx.response.status = 204;
      ctx.response.body = {
        msg: "新增用户失败！"
      };
    }
  } catch (error) {
    catchError(error)
  }
}

//用户管理 编辑
const complieUser = async (ctx, next) => {
  //user, pass,userName,roleNum,workType,age, departmentOptions, gender, titleOptions, rolesType
  let {
    user,
    pass,
    userName,
    roleNum,
    workType,
    age,
    departmentOptions,
    gender,
    titleOptions,
    rolesType,
    id
  } = ctx.request.body;
  // select * from table where id not in (ID)
  //select * from user where username='${username}'
  //select *form a where id not in（select id from b）and username=‘root’
  console.log(typeof id)
  try {
    console.log(1231231)
    let nameArr = await query(`select * from user where name='${user}' and id not in (${id})`);
    console.log(nameArr)
    if (nameArr.length > 0) {
      //存在用户名
      ctx.response.status = 203;
      ctx.response.body = {
        msg: "用户名重复！",
        code: 203,
      };
      return;
    };
    console.log(nameArr)
    let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    //UPDATE user SET age=? WHERE id=?
    //user, pass,userName,roleNum,workType,age, departmentOptions, gender, titleOptions, rolesType
    let datas = await query(`UPDATE user SET name='${user}',pass='${pass}',userName='${userName}',roleNum=${roleNum},workType=${workType},age=${age},departmentOptions='${departmentOptions}',gender=${gender},titleOptions='${titleOptions}',rolesType=${rolesType} WHERE id=${id}`)
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

//凭借id 查询用户信息
const searchUser = async (ctx, next) => {
  const {
    id
  } = ctx.request.body;
  console.log(id)
  try {
    let IDarr = await query(`select username,pwd,headline,type,phone,remarks from user where id='${id}'`);
    // console.log('IDarr-------->'+IDarr)
    if (IDarr !== undefined && IDarr !== null && IDarr.length > 0) {
      //查询到了
      ctx.response.status = 200;
      ctx.response.body = {
        msg: '查找到了！',
        data: IDarr[0]
      };
    } else {
      ctx.response.status = 202;
      ctx.response.body = {
        msg: '没有查找到！'
      };
    }
  } catch (error) {
    catchError(error)
  }
}

//禁用用户
const DeleteType = async (ctx, next) => {
  let {
    id
  } = ctx.request.body;
  try {
    let obj = await query(`UPDATE user SET type=0 WHERE id=${id}`);
    if (obj) {
      ctx.response.body = {
        msg: '禁用成功！',
        code: 200
      }
    } else {
      ctx.response.body = {
        msg: '禁用失败！',
        code: 202
      }
    }
  } catch (error) {
    catchError(error)
  }
}

module.exports = {
  'POST /users/reg': reg,
  'POST /users/login': login,
  'POST /users/goOut': goOut,
  'POST /users/searchAuthor': searchAuthor,
  'POST /users/queryAddMenu': queryAddMenu,
  'POST /users/verificationPass': verificationPass,
  'POST /users/modifyPass': modifyPass,
  'POST /users/systemUserList': systemUserList,
  'POST /users/addUser': addUser,
  'POST /users/searchUser': searchUser,
  'POST /users/complieUser': complieUser,
  'POST /users/DeleteType': DeleteType,
};