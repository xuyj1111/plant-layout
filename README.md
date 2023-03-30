# plant-layout
> 厂房设备平面可视化系统  

项目使用 node.js + vue，vue 代码内容见[plant-layout-UI](https://github.com/xuyj1111/plant-layout-UI)

结构介绍：
- 入口文件`index.js`
- 使用 Express 接收请求`router.js`，在 modules 文件夹内
- metadata 为`元数据`文件夹
- dist 为打包的`plant-layout-UI`项目

### index.js
1. 使用`connect-history-api-fallback`中间件，将前端请求直接转到“dist”文件夹；但保留“/api”开头的请求，留给后端使用；