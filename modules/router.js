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
const date = require("silly-datetime");

const db = mysql.createPool(MYSQL_CONFIG);
const exec = sql => {
    return new Promise((resolve, reject) => {
        db.getConnection((err, connection) => {
            if (err) {
                //console.log('连接mysql失败!');
                reject(err);
            } else {
                connection.query(sql, (err, result) => {
                    if (err) {
                        reject(err);
                        //console.log('连接mysql失败!');
                    } else {
                        resolve(result);
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
const USER_ROLE = {
    'all': 'root',
    'zt1': 'assist',
    'zt2': 'assist',
    'zt3': 'assist',
    'improve': 'assist',
    'provide': 'assist',
    'assy': 'local',
    'logistics': 'local',
    'case': 'local',
    'gear': 'local',
    'pulley': 'local',
    'differential': 'local',
    'heat': 'local'
}

const ASSIST_VALUE = {
    'zt1': 'ZT1-保全',
    'zt2': 'ZT2-组装技术',
    'zt3': 'ZT3-加工技术',
    'improve': '改善班',
    'provide': '供给中心'
}


// “登陆”接口
router.post('/login', (request, response) => {
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `>>> request to login, user[${request.body.user}]`);
    var user = request.body.user;
    var pwd = request.body.pwd;
    fs.readFile('./metadata/config.txt', function (err, data) {
        if (err) {
            //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `配置文件读取失败：${err.message}`);
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
            //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + '账号密码错误');
            response.statusCode = 400;
            response.statusMessage = 'Wrong account password';
            response.send();
        } catch (error) {
            //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `解析配置文件失败: ${error.message}`);
            response.statusCode = 400;
            response.statusMessage = 'Failed to parse configuration file';
            response.send();
        }
    })
});

// “获取地图数据”接口
router.get('/plant', (request, response) => {
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `>>> request to get plant data, plant name ${request.query.name} `);
    var fileName = `./metadata/${request.query.name}.txt`;
    fs.readFile(fileName, function (err, data) {
        if (err) {
            //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `地图文件读取失败：${err.message}`);
            response.statusCode = 400;
            response.statusMessage = 'Failed to read map file';
            response.send();
            return;
        }
        try {
            const encoding = chardet.detect(data);
            response.send(iconv.decode(data, encoding));
        } catch (error) {
            //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `解析地图数据失败: ${error.message}`);
            response.statusCode = 400;
            response.statusMessage = 'Failed to parse map data';
            response.send();
        }
    })
})

// “更新地图数据”接口
router.post('/plant', (request, response) => {
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `>>> request to update plant data, plant name[${request.query.name}]`);
    var fileName = `./metadata/${request.query.name}.txt`;
    fs.writeFile(fileName, JSON.stringify(request.body, null, 4), 'utf8', (err) => {
        if (err) {
            //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `地图文件修改失败：${err.message}`);
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
    const stationNum = request.query.stationNum != null && request.query.stationNum.trim() == "" ? STATION_NUM_NULL : request.query.stationNum;
    const isNeedHelp = request.query.isNeedHelp;
    const status = request.query.status;
    const search = request.query.search;
    const department = request.query.department;
    const startDatetime = request.query.startDatetime;
    const endDatetime = request.query.endDatetime;
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `>>> request to get plant probelsm count, plant[${plant}] deviceNum [${deviceNum}] 
    //stationNum[${stationNum}] isNeedHelp[${isNeedHelp}] status[${status}] search[${search}]`)
    if (plant == null) {
        //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `plant值不能为null`);
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
        sqlStr += ` and (id like '%${search}%' or device_num like '%${search}%' or station_num like '%${search}%' or name like '%${search}%' or detail like '%${search}%')`;
    }
    if (startDatetime != null && endDatetime != null) {
        sqlStr += ` and date_created >= '${startDatetime}' and date_created <= '${endDatetime}'`;
    }
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `exec sql [${sqlStr}]`);
    exec(sqlStr).then(data => {
        response.send(data[0]);
    })
})

// 根据条件获取问题点
router.get('/plant/problems', (request, response) => {
    const plant = PLANT_VALUE[request.query.plant];
    const deviceNum = request.query.deviceNum;
    const stationNum = request.query.stationNum != null && request.query.stationNum.trim() == "" ? STATION_NUM_NULL : request.query.stationNum;
    const isNeedHelp = request.query.isNeedHelp;
    const status = request.query.status;
    const page = request.query.page;
    const size = request.query.size;
    const search = request.query.search;
    const department = request.query.department;
    const startDatetime = request.query.startDatetime;
    const endDatetime = request.query.endDatetime;
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `>>> request to get plant probelsms, plant[${plant}] deviceNum [${deviceNum}] 
    //stationNum[${stationNum}] isNeedHelp[${isNeedHelp}] status[${status}] page[${page}] size[${size}] search[${search}]`);
    if (plant == null) {
        //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `plant值不能为null`);
        response.statusCode = 400;
        response.statusMessage = 'Plant cannot be null';
        response.send();
        return;
    }
    var sqlStr = `select id, device_num, station_num, name, date_created, detail, is_need_help, remark, picture, return_reason, status from problems where plant = '${plant}'`;
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
        sqlStr += ` and (id like '%${search}%' or device_num like '%${search}%' or station_num like '%${search}%' or name like '%${search}%' or detail like '%${search}%')`;
    }
    if (startDatetime != null && endDatetime != null) {
        sqlStr += ` and date_created >= '${startDatetime}' and date_created <= '${endDatetime}'`;
    }
    sqlStr += ' order by date_created desc';
    sqlStr += ` limit ${page * size}, ${size}`;
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `exec sql [${sqlStr}]`);
    exec(sqlStr).then(data => {
        data = data.map(d => {
            return {
                id: d.id,
                deviceNum: d.device_num,
                stationNum: d.station_num == STATION_NUM_NULL ? '' : d.station_num,
                name: d.name,
                dateCreated: moment(d.date_created).format('YYYY-MM-DD HH:mm:ss'),
                detail: d.detail,
                isNeedHelp: d.is_need_help,
                picture: d.picture,
                remark: d.remark,
                status: STATUS_VALUE[d.status],
                returnReason: d.return_reason
            };
        })
        response.send(data);
    })
})

// 根据条件获取unmatch问题点count
router.post('/plant/problems/unmatch/count', (request, response) => {
    const plant = PLANT_VALUE[request.body.plant];
    const isNeedHelp = request.body.isNeedHelp;
    const status = request.body.status;
    const search = request.body.search;
    const department = request.body.department;
    const allDevice = request.body.allDevice;
    const startDatetime = request.body.startDatetime;
    const endDatetime = request.body.endDatetime;
    if (plant == null) {
        response.statusCode = 400;
        response.statusMessage = 'Plant cannot be null';
        response.send();
        return;
    }
    var sqlStr = `select count(1) as count from problems where plant = '${plant}'`;
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
        sqlStr += ` and (id like '%${search}%' or device_num like '%${search}%' or station_num like '%${search}%' or name like '%${search}%' or detail like '%${search}%')`;
    }
    if (startDatetime != null && endDatetime != null) {
        sqlStr += ` and date_created >= '${startDatetime}' and date_created <= '${endDatetime}'`;
    }
    sqlStr += ` and (device_num, station_num) NOT IN (${allDevice})`;
    exec(sqlStr).then(data => {
        response.send(data[0]);
    })
})


// 根据条件获取unmatch问题点
router.post('/plant/problems/unmatch', (request, response) => {
    const plant = PLANT_VALUE[request.body.plant];
    const isNeedHelp = request.body.isNeedHelp;
    const status = request.body.status;
    const page = request.body.page;
    const size = request.body.size;
    const search = request.body.search;
    const department = request.body.department;
    const allDevice = request.body.allDevice;
    const startDatetime = request.body.startDatetime;
    const endDatetime = request.body.endDatetime;
    if (plant == null) {
        response.statusCode = 400;
        response.statusMessage = 'Plant cannot be null';
        response.send();
        return;
    }
    var sqlStr = `select id, device_num, station_num, name, date_created, detail, is_need_help, picture, remark, status, return_reason from problems where plant = '${plant}'`;
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
        sqlStr += ` and (id like '%${search}%' or device_num like '%${search}%' or station_num like '%${search}%' or name like '%${search}%' or detail like '%${search}%')`;
    }
    if (startDatetime != null && endDatetime != null) {
        sqlStr += ` and date_created >= '${startDatetime}' and date_created <= '${endDatetime}'`;
    }
    sqlStr += ` and (device_num, station_num) NOT IN (${allDevice})`;
    sqlStr += ' order by date_created desc';
    sqlStr += ` limit ${page * size}, ${size}`;
    exec(sqlStr).then(data => {
        data = data.map(d => {
            return {
                id: d.id,
                deviceNum: d.device_num,
                stationNum: d.station_num == STATION_NUM_NULL ? '' : d.station_num,
                name: d.name,
                dateCreated: moment(d.date_created).format('YYYY-MM-DD HH:mm:ss'),
                detail: d.detail,
                isNeedHelp: d.is_need_help,
                picture: d.picture,
                remark: d.remark,
                status: STATUS_VALUE[d.status],
                returnReason: d.return_reason
            };
        })
        response.send(data);
    })
})

// 以设备编号和岗位号作为分组条件
router.get('/plant/problems/groupby', (request, response) => {
    const plant = PLANT_VALUE[request.query.plant];
    const role = USER_ROLE[request.query.option];
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `>>> request to get plant probelsms for groupby`);
    if (plant == null) {
        //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `plant值不能为null`);
        response.statusCode = 400;
        response.statusMessage = 'Plant cannot be null';
        response.send();
        return;
    }
    if (role == null) {
        //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `option值错误`);
        response.statusCode = 400;
        response.statusMessage = 'Option param error';
        response.send();
        return;
    }
    let table;
    if (role == 'root') {
        table = 'problems'
    } else if (role == 'assist') {
        table = `(SELECT * FROM problems WHERE is_need_help = '${ASSIST_VALUE[request.query.option]}') as assist_table`
    } else if (role == 'local') {
        table = `(SELECT * FROM problems WHERE is_need_help = '否') as local_table`
    }
    var sqlStr = `SELECT device_num, station_num, 
    SUM(CASE WHEN status IS NOT NULL THEN 1 ELSE 0 END) AS count, 
    SUM(CASE WHEN status = 'unfinished' AND is_need_help != '否' THEN 1 ELSE 0 END) AS need_help_and_unfinished, 
    SUM(CASE WHEN status = 'review' AND is_need_help != '否' THEN 1 ELSE 0 END) AS need_help_and_review, 
    SUM(CASE WHEN status = 'finished' AND is_need_help != '否' THEN 1 ELSE 0 END) AS need_help_and_finished, 
    SUM(CASE WHEN status = 'unfinished' AND is_need_help = '否' THEN 1 ELSE 0 END) AS no_help_and_unfinished, 
    SUM(CASE WHEN status = 'finished' AND is_need_help = '否' THEN 1 ELSE 0 END) AS no_help_and_finished 
    FROM ${table}`;
    sqlStr += ` WHERE plant = '${plant}'`;
    sqlStr += `  GROUP BY device_num, station_num`;
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `exec sql [${sqlStr}]`);
    exec(sqlStr).then(data => {
        data = data.map(d => {
            return {
                deviceNum: d.device_num,
                stationNum: d.station_num == STATION_NUM_NULL ? '' : d.station_num,
                count: d.count,
                needHelpAndUnfinished: d.need_help_and_unfinished,
                needHelpAndReview: d.need_help_and_review,
                needHelpAndFinished: d.need_help_and_finished,
                noHelpAndUnfinished: d.no_help_and_unfinished,
                noHelpAndFinished: d.no_help_and_finished
            };
        })
        response.send(data);
    })
})

// 修改问题点状态、对策、退回理由（指定id）
router.put('/plant/problem', (request, response) => {
    const id = request.query.id;
    const status = request.query.status;
    const remark = request.query.remark;
    const returnReason = request.query.returnReason;
    const isNeedHelp = request.query.isNeedHelp;
    const oldStatus = request.query.oldStatus;
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `>>> request to update plant probelsm status, id[${id}] status [${status}]`);
    if (id == null || status == null) {
        //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `参数错误`);
        response.statusCode = 400;
        response.statusMessage = 'Parameter error';
        response.send();
        return;
    }
    var sqlStr = `update problems set `;
    if (remark != null) {
        sqlStr += `remark = '${remark}', `;
    }
    if (returnReason != null) {
        sqlStr += `return_reason = '${returnReason}', `;
    }
    sqlStr += `status = '${status}' where id = '${id}'`;
    if (isNeedHelp != null) {
        sqlStr += ` and is_need_help = '${isNeedHelp}'`;
    }
    if (oldStatus != null) {
        sqlStr += ` and status = '${oldStatus}'`;
    }
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `exec sql [${sqlStr}]`);
    exec(sqlStr).then((result) => {
        const data = { affectedRows: result.affectedRows };
        response.json(data);
    })
})

// 根据id修改“是否需要其他部门协助”字段
router.put('/plant/problem/isNeedHelp', (request, response) => {
    const id = request.query.id;
    const isNeedHelp = request.query.isNeedHelp;
    const oldStatus = request.query.oldStatus;
    var sqlStr = `update problems set is_need_help = '${isNeedHelp}' where id = '${id}' and status = '${oldStatus}'`;
    //console.log(date.format(new Date(),'YYYY-MM-DD HH:mm:ss') + ': ' + `exec sql [${sqlStr}]`);
    exec(sqlStr).then((result) => {
        const data = { affectedRows: result.affectedRows };
        response.json(data);
    })
})
module.exports = router;