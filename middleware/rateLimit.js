const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { format } = require("date-fns");
const logEvent = require("./logger");
// 根据中间件是否传参来设计是否使用闭包工厂模式(有参数就选闭包)
// 来规避Express 路由挂载的“时间差”(比如不确定参数的具体值)与全局变量污染
const createLimiter = (options) => {
  // 限流过期时间
  const windowMs = options && options.windowMs ? options.windowMs : 60 * 1000;
  // 限制 1 分钟最多尝试登录 10 次
  const max = options && options.max ? options.max : 5;
  // 是否为刷新 Token 专属接口
  const isRefreshField = options && options.isRefreshField ? options.isRefreshField : false;

  return rateLimit({
    windowMs: windowMs,
    max: max,
    handler: (req, res, next, rateLimitOptions) => {
      const errMsg = typeof rateLimitOptions.message === "string" ? rateLimitOptions.message : "Too Many Requests";

      // 记录拦截日志
      logEvent(
        `Too Many Requests:  ${errMsg}\t${req.method}\t${req.url}\t${req.headers.origin}\t${req.ip}`,
        `err-${format(new Date(), "yyyy-MM-dd")}.log`
      );

      // 返回 429 状态码给前端
      res.status(429).json({ message: "请求过于频繁，请稍后再试", isError: true });
    },
    // 防ip代理池爆破
    keyGenerator: (req) => {
      //  先确定核心目标：是针对邮箱，还是针对 IP？
      const target =
        isRefreshField === false && req.body && req.body.email ? String(req.body.email) : ipKeyGenerator(req);

      // 如果req.body.email没有就锁定请求的ip返回429
      // 这样生成的 Key 会变成： "/users/check|admin@qq.com" 或者 "/posts/list|192.168.1.10" 接口的次数独立计算
      return `${req.originalUrl}|${target}`;
    }
  });
};

// 高阶混合导出，不要直接导出工厂，而是给它套个娃,给予每个函数独立内存
const limiterFactory = createLimiter;

// 默认导出一个已经加了空括号、激活好了的默认限流器实例（1分钟5次）
const defaultLimiter = limiterFactory();

// 把工厂函数挂在默认实例的属性上
defaultLimiter.custom = limiterFactory;

module.exports = defaultLimiter;
