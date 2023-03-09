const express = require('express');
const req = require('express/lib/request');
const router = express.Router();
const fs = require('fs');

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

router.get('/plant', (request, response) => {
    console.log('>>> request to get plant data, plant name: ' + request.query.name);
    fs.readFile('./metadata/' + request.query.name + '.txt', 'utf-8', function (err, data) {
        if (err) {
            return console.log('文件读取失败：' + err.message);
        }
        response.send(data);
    })
})

module.exports = router;