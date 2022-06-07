const _cookies = require('../lib/utils.js');
const { password } = require("../mysql/mysql_config");
const query = require("../mysql/query"); //引入异步查询方法
const { SHOW_ALL_DB , INSERT_DATA } = require("../mysql/sql"); //部分引入sql库

const catchError = (ctx, err) => {
    // console.log(`提示了${err}`);
    ctx.resError = err;
};

//发布文章接口
const createArticles = async (ctx, err) => {
    /*
        id,title,content,excerpt,creatorId,type,cover
    */
    let {title,content,excerpt,creatorId,type,cover} = ctx.request.body;
    let Base = '';
    // console.log(excerpt);
    try {
        /*
            首先判断类型 看他在哪个表中
            0  文章
            1  问题
            2  回答
        */
        if (type === 0) {
            Base = 'articles';
        } else if (type === 1) {
            Base = 'questions';
        } else if (type === 2) {
            Base = 'answers';
        };
        let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        let flag = await query(INSERT_DATA(Base,'title,content,excerpt,creatorId,type,cover,createdAt,updatedAt',`'${title}','${content}','${excerpt}',${creatorId},${type},'${cover}','${create}','${update}'`));
        if (flag) {
            //创建成功
            //创建成功后 需要在状态表里面建一条数据 输入这篇文章的点赞 收藏等记录数据的信息
            //flag返回为插入的对象 insertId 为当前插入记录表里面的唯一id值
            //点赞 等记录 凭借着这个id 来记录点赞等功能的 用户id  记录为一个数组 返回人数用数组的length来显示
            let create = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            let update = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            let statusFlag = await query(INSERT_DATA('status','voteup,Votedown,favorite,thanks,targetType,targetId,createdAt,updatedAt',`'','','','',${type},${flag.insertId},'${create}','${update}'`));
            if(statusFlag) {
                ctx.response.status = 200;
                ctx.response.body = {
                    msg : '发布成功！'
                };
            } else {
                ctx.response.status = 202;
                ctx.response.body = {
                    msg : '状态表插入失败！！'
                };
            }
        } else {
            //插入失败
            ctx.response.status = 202;
            ctx.response.body = {
                msg: "发布失败！"
            };
        }
    } catch(err){
        catchError(err)
    }
}
//查询文章列表接口
const listArticles = async (ctx, err) => {
    /*
        一页查询最多10个
        参数 ：页数
    */
    let limit = 10;
    let page = ctx.query.page * limit;
    // console.log(`页数为-------> ${page}`)
    try {
        //select * from table_name limit 0,10      updatedAt
        const flag = await query(`select * from articles order by id desc limit ${page},${limit}`);
        if (flag && flag !== undefined && flag !== null) {
            //成功
            ctx.response.status = 200;
            ctx.response.body = flag;
        } else {
            //没有找到任何文章 返回202
            ctx.response.status = 202;
            ctx.response.body = {
                msg : '当前没有任何文章！'
            };
        };
    } catch (error) {
        catchError(error);
    }
}
//按照文章id 查询文章
const searchActicle = async (ctx, err) => {
    /*
        接受到前端发来的id值
        查找文章
    */
    let { id } = ctx.request.body;
    id = parseInt(id);
    let articleArr = await query(`select * from articles where id='${id}'`);
    // console.log(articleArr);
    if(articleArr.length > 0){
        //说明存在 并且找到id值
        ctx.response.status = 200;
        ctx.response.body = {
            msg: '查找成功！',
            data: articleArr,
        };
        return;
    } else{
        ctx.response.status = 202;
        ctx.response.body = {
            msg: '没有此id！',
        }
    };
}


module.exports = {
    'POST /articles/create': createArticles,
    'GET /articles/list': listArticles,
    'POST /articles/search': searchActicle,
};