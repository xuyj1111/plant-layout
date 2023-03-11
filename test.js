const fs = require('fs');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const { v4: uuidv4 } = require('uuid');


var fileName = './metadata/' + 'assy.txt';
var jsonObj;
fs.readFile(fileName, function (err, data) {
    if (err) {
        return console.log('文件读取失败：' + err.message);
    }
    const encoding = chardet.detect(data);
    jsonObj = JSON.parse(iconv.decode(data, encoding));
    for (var i = 0; i < jsonObj.length; i++) {
        jsonObj[i]['stationNum'] = uuidv4();
    }


    var copyFile = './metadata/' + 'assyCopy.txt';
    fs.writeFile(copyFile, JSON.stringify(jsonObj), 'utf8', (err) => {
        if (err) throw err;
        console.log('文件已保存');
    });
});


