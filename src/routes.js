const fs = require("fs")

const addMapping = (router,mapping) => {
    for(const url in mapping){
        if(url.startsWith("GET ")){
            const path = url.substring(4);
            router.get(path,mapping[url])
        }else if(url.startsWith("POST ")){
            const path = url.substring(5);
            router.post(path ,mapping[url])
        }
    }
};

const addContronllers = (router,dir) => {
    fs.readdirSync(__dirname + "/" + dir).filter((f) => {
        return f.endsWith(".js")
    }).forEach((f) => {
        let mapping = require(__dirname + "/" + dir + "/" + f);
        addMapping(router,mapping)
    })
}

module.exports = (dir) => {
    const controllers_dir = dir || "./../routes";
    const router = require("koa-router")();
    addContronllers(router,controllers_dir);
    return router.routes();
}