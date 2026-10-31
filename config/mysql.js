const mysql = require("mysql2/promise");

// Pool 通过维护一组可复用的长连接，既规避了频繁创建连接的开销
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // 告诉驱动把所有 JS Date 对象全部当做 UTC 处理
  timezone: "Z",
  // 这决定了当 10 个连接都在忙（都在执行 SQL），而第 11 个请求进来时是否排队
  waitForConnections: true,
  // 最大连接数 小链接大队列
  connectionLimit: 10,
  // 等待队列的最大长度 超过这个数的排队请求直接报错，实现“熔断”保护。
  queueLimit: 100,
  connectTimeout: 10000, // 连接超时 10s
  enableKeepAlive: true,
  // 防止因为长时间没有请求，云服务器防火墙或数据库主动断开“僵尸连接”
  keepAliveInitialDelay: 10000,
  // 提高执行效率，同时彻底防止 SQL 注入
  namedPlaceholders: true
});

// 👇 改用 Promise 的方式来测试连接
pool
  .getConnection()
  .then((connection) => {
    console.log("mysql connection successful");
    connection.release(); // 释放连接回连接池
  })
  .catch((err) => {
    console.error("mysql connection failed", err.message);
  });

module.exports = pool;
