const express = require('express');
const history = require('connect-history-api-fallback');
const userRouter = require('./modules/router');
const opn = require('opn');
const app = express();
const cors = require('cors');

// 使用h5 history模式需要载入 connect-history-api-fallback 中间件，用于单页面项目
// express允许访问静态资源，通过url后缀名访问对应资源，但在vue打包的单页面项目中，只有一个 index.html，其他页面（模块）是由vue路由显示
// 因此使用 connect-history-api-fallback，将所有url请求都对应到一个资源上 即 index.html，使用vue路由
// 官方文档：https://github.com/bripkens/connect-history-api-fallback
app.use(history({
    // 将“/api”开头的请求都放行，留给后端返回数据用
    rewrites: [
        {
            from: /^\/api\/.*$/,
            to: function (context) {
                return context.parsedUrl.pathname;
            }
        }
    ]
}));
app.use(express.static('dist'));
// 允许所有源进行跨域请求，也可以指定允许的域名
app.use(cors());

// 自己实现的跨域中间件
// app.use(function (req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.setHeader(
//         'Access-Control-Allow-Headers',
//         'Content-Type, Authorization'
//     );
//     next();
// });

app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ extended: true, limit: "10mb" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', userRouter);

app.listen(8889, () => {
    console.log('express server running at http://127.0.0.1:8889')
    opn('http://127.0.0.1:8889');
});
