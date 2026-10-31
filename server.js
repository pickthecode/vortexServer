// 国际时间标准
process.env.TZ = "UTC";

require("dotenv").config();
const express = require("express");
const app = express();
const errHandler = require("./middleware/errorHandler");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");

require("./config/mysql");

// 监听端口
const PORT = 3500;
// 信任第一层代理 确保拿到的是客户端真实 IP 配合接口限流器
app.set("trust proxy", 1);

// 基础安全与解析中间件
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// 业务路由
app.use("/users", require("./routes/usersRoutes"));
app.use("/captcha", require("./routes/captchaRoutes"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/me", require("./routes/meRoutes"));

// 404
app.use((req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// 全局错误处理
app.use(errHandler);
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
