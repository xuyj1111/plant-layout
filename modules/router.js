const express = require('express');
const req = require('express/lib/request');
const router = express.Router();
const fs = require('fs');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const mysql = require('mysql');
const MYSQL_CONFIG = require('../metadata/mysqlConfig');
const CryptoJS = require("crypto-js");
const moment = require('moment');

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
};
const key = "1234";
const STATUS_VALUE = {
    'unfinished': '未完成',
    'review': '审核中',
    'finished': '已完成'
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
            // 获取文件的编码格式
            const encoding = chardet.detect(data);
            // 解密
            const bytes = CryptoJS.AES.decrypt(iconv.decode(data, encoding), key);
            // 以utf8格式获取
            const jsonStr = bytes.toString(CryptoJS.enc.Utf8);
            // json对象
            const jsonObj = JSON.parse(jsonStr);
            for (let element of jsonObj) {
                if (element.hasOwnProperty('user')
                    && element.hasOwnProperty('pwd')
                    && element.hasOwnProperty('role')) {
                    if (user == element['user'] && pwd == element['pwd']) {
                        response.send(element['role']);
                        return;
                    }
                }
            }
            console.log('账号密码错误');
            response.statusCode = 400;
            response.statusMessage = 'Wrong account password';
            response.send();
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

// 根据条件获取问题点count
router.get('/plant/problems/count', (request, response) => {
    const plant = PLANT_VALUE[request.query.plant];
    const deviceNum = request.query.deviceNum;
    const stationNum = request.query.stationNum == null ? STATION_NUM_NULL : request.query.stationNum;
    const isNeedHelp = request.query.isNeedHelp;
    const status = request.query.status;
    const search = request.query.search;
    const department = request.query.department;
    console.log(`>>> request to get plant probelsm count, plant[${plant}] deviceNum [${deviceNum}] 
    stationNum[${stationNum}] isNeedHelp[${isNeedHelp}] status[${status}] search[${search}]`)
    if (plant == null) {
        console.log(`plant值不能为null`);
        response.statusCode = 400;
        response.statusMessage = 'Plant cannot be null';
        response.send();
        return;
    }
    var sqlStr = `select count(1) as count from problems where plant = '${plant}'`;
    if (deviceNum != null) {
        sqlStr += ` and device_num = '${deviceNum}' and station_num = '${stationNum}'`
    }
    if (isNeedHelp != null) {
        JSON.parse(isNeedHelp) ? sqlStr += ` and is_need_help != '否'`
            : sqlStr += ` and is_need_help = '否'`;
    } else if (department != null) {
        sqlStr += ` and is_need_help = '${department}'`;
    }
    if (status != null) {
        sqlStr += ` and status = '${status}'`;
    }
    if (search != null) {
        sqlStr += ` and (id like '%${search}%' or name like '%${search}%' or detail like '%${search}%')`;
    }
    console.log(`exec sql [${sqlStr}]`);
    exec(sqlStr).then(data => {
        response.send(data[0]);
    })
})

// 根据条件获取问题点
router.get('/plant/problems', (request, response) => {
    const plant = PLANT_VALUE[request.query.plant];
    const deviceNum = request.query.deviceNum;
    const stationNum = request.query.stationNum == null ? STATION_NUM_NULL : request.query.stationNum;
    const isNeedHelp = request.query.isNeedHelp;
    const status = request.query.status;
    const page = request.query.page;
    const size = request.query.size;
    const search = request.query.search;
    const department = request.query.department;
    console.log(`>>> request to get plant probelsms, plant[${plant}] deviceNum [${deviceNum}] 
    stationNum[${stationNum}] isNeedHelp[${isNeedHelp}] status[${status}] page[${page}] size[${size}] search[${search}]`);
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
    var sqlStr = `select id, name, date_created, detail, is_need_help, picture, status from problems where plant = '${plant}' and device_num = '${deviceNum}' and station_num = '${stationNum}'`;
    if (isNeedHelp != null) {
        JSON.parse(isNeedHelp) ? sqlStr += ` and is_need_help != '否'`
            : sqlStr += ` and is_need_help = '否'`;
    } else if (department != null) {
        sqlStr += ` and is_need_help = '${department}'`;
    }
    if (status != null) {
        sqlStr += ` and status = '${status}'`;
    }
    if (search != null) {
        sqlStr += ` and (id like '%${search}%' or name like '%${search}%' or detail like '%${search}%')`;
    }
    sqlStr += ` limit ${page * size}, ${size}`;
    console.log(`exec sql [${sqlStr}]`);
    exec(sqlStr).then(data => {
        data = data.map(d => {
            return {
                id: d.id,
                name: d.name,
                dateCreated: moment(d.date_created,).format('YYYY-MM-DD HH:mm:ss'),
                detail: d.detail,
                isNeedHelp: d.is_need_help,
                picture: d.picture,
                status: STATUS_VALUE[d.status]
            };
        })
        response.send(data);
    })
})


// 以设备编号和岗位号作为分组条件，然后返回信息为：设备编号，岗位号，状态=unfinished的数量，状态=review的数量
router.get('/plant/problems/groupby', (request, response) => {
    const plant = PLANT_VALUE[request.query.plant];
    console.log(`>>> request to get plant probelsms for groupby`);
    if (plant == null) {
        console.log(`plant值不能为null`);
        response.statusCode = 400;
        response.statusMessage = 'Plant cannot be null';
        response.send();
        return;
    }
    var sqlStr = `SELECT device_num, station_num, SUM(CASE WHEN status = 'unfinished' THEN 1 ELSE 0 END) AS unfinished_count, SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS review_count FROM problems`;
    sqlStr += ` WHERE plant = '${plant}'`;
    sqlStr += `  GROUP BY device_num, station_num`;
    console.log(`exec sql [${sqlStr}]`);
    exec(sqlStr).then(data => {
        data = data.map(d => {
            return {
                deviceNum: d.device_num,
                stationNum: d.station_num,
                unfinishedCount: d.unfinished_count,
                reviewCount: d.review_count
            };
        })
        response.send(data);
    })
})
module.exports = router;