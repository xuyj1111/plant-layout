const express = require('express');
const router = express.Router();
const prefix = '/api';

router.post(prefix + '/login', (request, response) => {
    console.log(request);
    var user = request.query.user;
    var pwd = request.query.pwd;
    console.log("user: " + user);
    console.log("pwd: " + pwd);
    if(user == 'root' && pwd == '123') {
        response.send();
    } else {
        response.statusCode = 400;
        response.statusMessage = 'Wrong account password';
        response.send();
    }
});



module.exports = router;