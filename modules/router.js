const express = require('express');
const req = require('express/lib/request');
const router = express.Router();
const fs = require('fs');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const mysql = require('mysql');
const MYSQL_CONFIG = require('../metadata/mysqlConfig');

const db = mysql.createPool(MYSQL_CONFIG);
const exec = sql => {
    return new Promise((resolve, reject) => {
        db.getConnection((err, connection) => {
            if (err) {
                console.log('连接mysql失败!');
                reject(err);
            } else {
                connection.query(sql, (err, result) => {
                    if (err) {
                        reject(err);
                        console.log('连接mysql失败!');
                    } else {
                        resolve(result);
                        console.log('连接mysql成功!');
                    }
                });
            }
            // 连接归还到连接池
            connection.release();
        })
    })
}


const STATION_NUM_NULL = '(跳过)';
const PLANT_VALUE = {
    'assy': '组装',
    'logistics': '物流',
    'case': '外壳',
    'gear': '齿轮',
    'pulley': '带轮',
    'differential': '差速器',
    'heat': '热处理'
}


// “登陆”接口
router.post('/login', (request, response) => {
    console.log(`>>> request to login, user[${request.body.user}]`);
    var user = request.body.user;
    var pwd = request.body.pwd;
    fs.readFile('./metadata/config.txt', function (err, data) {
        if (err) {
            console.log(`配置文件读取失败：${err.message}`);
            response.statusCode = 400;
            response.statusMessage = 'Failed to read configuration file';
            response.send();
            return;
        }
        try {
            const encoding = chardet.detect(data);
            const jsonObj = JSON.parse(iconv.decode(data, encoding));
            if (user == jsonObj['user'] && pwd == jsonObj['pwd']) {
                response.send();
            } else {
                console.log('用户名密码错误');
                response.statusCode = 400;
                response.statusMessage = 'Wrong account password';
                response.send();
            }
        } catch (error) {
            console.log(`解析配置文件失败: ${error.message}`);
            response.statusCode = 400;
            response.statusMessage = 'Failed to parse configuration file';
            response.send();
        }
    })
});

// “获取地图数据”接口
router.get('/plant', (request, response) => {
    console.log(`>>> request to get plant data, plant name ${request.query.name} `);
    var fileName = `./metadata/${request.query.name}.txt`;
    fs.readFile(fileName, function (err, data) {
        if (err) {
            console.log(`地图文件读取失败：${err.message}`);
            response.statusCode = 400;
            response.statusMessage = 'Failed to read map file';
            response.send();
            return;
        }
        try {
            const encoding = chardet.detect(data);
            response.send(iconv.decode(data, encoding));
        } catch (error) {
            console.log(`解析地图数据失败: ${error.message}`);
            response.statusCode = 400;
            response.statusMessage = 'Failed to parse map data';
            response.send();
        }
    })
})

// “更新地图数据”接口
router.post('/plant', (request, response) => {
    console.log(`>>> request to update plant data, plant name[${request.query.name}]`);
    var fileName = `./metadata/${request.query.name}.txt`;
    fs.writeFile(fileName, JSON.stringify(request.body, null, 4), 'utf8', (err) => {
        if (err) {
            console.log(`地图文件修改失败：${err.message}`);
            response.statusCode = 400;
            response.statusMessage = 'Failed to write map file';
            response.send();
            return;
        }
        response.send();
    });
})

router.get('/plant/problems/count', (request, response) => {
    const plant = PLANT_VALUE[request.query.plant];
    const deviceNum = request.query.deviceNum;
    const stationNum = request.query.stationNum == null ? STATION_NUM_NULL : request.query.stationNum;
    const isNeedHelp = request.query.isNeedHelp;
    const status = request.query.status;
    console.log(`>>> request to get plant probelsm count, plant[${plant}] deviceNum [${deviceNum}] 
    stationNum[${stationNum}] isNeedHelp[${isNeedHelp}] status[${status}]`)
    if (plant == null) {
        console.log(`plant值不能为null`);
        response.statusCode = 400;
        response.statusMessage = 'Plant cannot be null';
        response.send();
        return;
    }
    if (deviceNum == null) {
        console.log(`deviceNum值不能为null`);
        response.statusCode = 400;
        response.statusMessage = 'DeviceNum cannot be null';
        response.send();
        return;
    }
    var sqlStr = `select count(1) from problems where plant = ${plant} and device_num = ${deviceNum} and station_num = ${stationNum}`;
    if (isNeedHelp != null) {
        isNeedHelp ? sqlStr += ` and is_need_help != '否'` 
        : sqlStr += ` and is_need_help = '否'`;
    }
    if (status != null) {
        sqlStr += ` and status = ${status}`;
    }
    console.log(`exec sql [${sqlStr}]`);
    exec(sqlStr).then(data => {
        response.send(data);
    })
})

module.exports = router;