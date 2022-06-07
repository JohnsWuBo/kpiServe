/*
    setCookies  设置cookies
    destoryCookies  删除cookies
    catchError  捕获错误
*/
exports.setCookies = (ctx, obj) => {
    console.log(typeof obj +'setCookies');
    if (Object.prototype.toString.call(obj) !== '[object Object]') {//判断是否是一个对象
        return false;//返回一个布尔值
    };
    console.log('是一个object')
    for (let key in obj) {
        //存入cookies
        ctx.cookies.set(key,encodeURIComponent(obj[key]), {
            domain: 'localhost',//写入cookies的所在域名
            path: '/',//写入cookies的所在路径
            maxAge: 24 * 60 * 60 * 1000,//存在的时长 毫秒值             1天
            httpOnly: false,//是否只是用于http请求中获取
            overwrite: false,//是否只用于重写
        });
    };
};

exports.destoryCookies = (ctx ,obj) => {
    if(Object.prototype.toString.call(obj) !== '[object Object]'){
        return false;
    };
    for (let key in obj) {
        ctx.cookies.set(key, obj[key] ,{
            maxAge: -1,//只要设置为负数 即为删除
        });
    };
};

exports.transformTree = (arr) => {
    let map = {};
    let list = [];
    arr.forEach((value) => {
        map[value.id] = value;
    })
    arr.forEach((value) => {
        let parent = map[value.parentId];
        // console.log(map)
        if (parent) {
            (parent.children || (parent.children = [])).push(value)
        } else {
            list.push(value)
        }
    })
    return list
}

exports.catchError = (ctx, obj) => {//捕获错误
    console.log(err);
    ctx.resError = err;
}