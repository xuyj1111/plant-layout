const express = require('express');
const history = require('connect-history-api-fallback');

const app = express();

// 使用h5 history模式需要载入 connect-history-api-fallback 中间件，用于单页面项目
// express允许访问静态资源，通过url后缀名访问对应资源，但在vue打包的单页面项目中，只有一个 index.html，其他页面（模块）是由vue路由显示
// 因此使用 connect-history-api-fallback，将所有url请求都对应到一个资源上 即 index.html，使用vue路由
app.use(history());
app.use(express.static('dist'));

app.listen(8082, () => {
    console.log('express server running at http://127.0.0.1:8082')
})
