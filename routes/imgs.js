const fs = require('fs');
const path = require('path');
const CryptoJs = require('crypto-js');
const moment = require('moment');


const upload = async (ctx, next) => {
    console.log(ctx.request);
    const file = ctx.request.files.file;
    const hash = CryptoJs.MD5(`${file.path}_${moment()}`);
    const reader = fs.createReadStream(file.path);
    let filePath = path.join(__dirname, '../../public/imgs') +  `/${hash}.${file.name.split('.').pop()}`;
    console.log(`path------>${__dirname}../../public/imgs`)
    console.log(filePath);
    const upStream = fs.createWriteStream(filePath);
    reader.pipe(upStream);
    ctx.body = {
        status: 201,
        fileName: `${hash}.${file.name.split('.').pop()}`,
    };
};

module.exports = {
    'POST /imgs/upload' : upload,
}