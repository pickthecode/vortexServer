const logEvent = require("./logger");
const { format } = require("date-fns");

const errHandler = async (err, req, res, next) => {
  const logMsg = `${req.method}\t${req.url}\t${err.name}: ${err.message}\t${req.ip}`;
  const logFileName = `err-${format(new Date(), "yyyy-MM-dd")}.log`;
  try {
    await logEvent(logMsg, logFileName);
  } catch (logErr) {
    console.error("Critical: Logger failed", logErr);
  }
  console.error(`[ERROR] ${err.stack}`);

  // 捕获 mysql2 熔断错误
  if (err.code === "ER_POOL_EXCEEDED_QUOTA") {
    // 503，语义是“服务暂时过载”
    return res.status(503).json({
      message: "服务器繁忙，请稍后再试",
      isError: true
    });
  }

  // 确定状态码并返回
  const status = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(status).json({
    message: err.message,
    isError: true
  });
};

module.exports = errHandler;
