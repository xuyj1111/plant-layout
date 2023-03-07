const express = require('express');
const router = express.Router();
const prefix = '/api';

router.post(prefix + '/login', (request, response) => {
    var user = request.body.user;
    var pwd = request.body.pwd;
    if(user == 'root' && pwd == '1234') {
        response.send();
    } else {
        response.statusCode = 400;
        response.statusMessage = 'Wrong account password';
        response.send();
    }
});



module.exports = router;