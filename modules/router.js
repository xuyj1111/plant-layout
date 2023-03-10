const express = require('express');
const req = require('express/lib/request');
const router = express.Router();
const fs = require('fs');
const iconv = require('iconv-lite');
const chardet = require('chardet');

// “登陆”接口
router.post('/login', (request, response) => {
    console.log('>>> request to login, user: ' + request.body.user);
    var user = request.body.user;
    var pwd = request.body.pwd;
    if (user == 'root' && pwd == '1234') {
        response.send();
    } else {
        response.statusCode = 400;
        response.statusMessage = 'Wrong account password';
        response.send();
    }
});

// “获取地图数据”接口
router.get('/plant', (request, response) => {
    console.log('>>> request to get plant data, plant name: ' + request.query.name);
    var fileName = './metadata/' + request.query.name + '.txt';
    fs.readFile(fileName, function (err, data) {
        if (err) {
            return console.log('文件读取失败：' + err.message);
        }
        const encoding = chardet.detect(data);
        response.send(iconv.decode(data, encoding));
    })
})

module.exports = router;