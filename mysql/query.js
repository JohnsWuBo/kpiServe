const mysql = require('mysql');

const MYSQL_CONFIG = require('./mysql_config.js');

const pool = mysql.createPool(MYSQL_CONFIG);

const query = (sql, val) => {
    return new Promise((res, rej) => {
        pool.getConnection(function (err,connection){
            if(err) rej(err);
            else {
                connection.query(sql, val, (err,fields) => {
                    console.log(err)
                    if (err) rej(err);
                    else res(fields);
                    connection.release();
                })
            }
        })
    })
};

module.exports = query;