const jwt = require("jsonwebtoken");

// 这是一个 Express 中间件
const verifyAccessToken = (req, res, next) => {
  // 1. 获取请求头中的 Authorization 字段,并且只能请求头的token
  // 注意兼容大小写，有时候是 authorization
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // 2. 检查格式：必须存在，且以 "Bearer " 开头
  if (!authHeader?.startsWith("Bearer ")) {
    // 如果连票都没带，或者格式不对，直接打回 401
    return res.status(401).json({ message: "缺失访问令牌 (Access Token)" });
  }

  // 3. 提取出真正的 Token 字符串 (去掉 "Bearer " 前缀)
  const token = authHeader.split(" ")[1];

  try {
    // 4. 核心校验逻辑：验证短票是否有效、是否伪造、是否过期
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // 5. 校验通过！将解析出来的用户信息挂载到 req 上，方便后续路由使用
    req.user = decoded;
    
    // 6. 放行，进入下一个处理函数（即你真正的业务逻辑）
    next();
    
  } catch (error) {
    // 我们不需要区分是 "过期(TokenExpiredError)" 还是 "伪造(JsonWebTokenError)"
    // 只要短票不可用，统统返回 401。
    // 这就是触发你前端 axios.interceptors.response 拦截器中 `if (status === 401)` 的核心信号！
    return res.status(401).json({ 
      message: "访问令牌已过期或无效",
      errorName: error.name // (可选) 返回错误名方便前端调试，如 "TokenExpiredError"
    });
  }
};

module.exports = verifyAccessToken;