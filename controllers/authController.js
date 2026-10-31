const Auth = require("../models/Auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const User = require("../models/Users");

async function login(req, res) {
  const { account, password } = req.body;

  const user = await Auth.login(account, password);
  if (!user || user.active < 1) {
    return res.status(401).json({ message: "账号不存在或已被封禁" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "账号或密码错误" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await redisClient.setEx(`refreshToken:${user.uuid}`, 604800, refreshToken);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // 2. 统一使用 lax(兼容模式)，确保跨域和清除时不出错
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.json({
    isSuccess: true,
    message: "登录成功",
    accessToken,
    user: {
      uuid: user.uuid,
      account: user.account,
      username: user.username,
      roles: user.roles,
      email: user.email
    }
  });
}

async function handleRefresh(req, res) {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ message: "凭证丢失,请重新登录" });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "登录凭证已过期或非法，请重新登录" });
  }
  const uuid = decoded.uuid;

  // 读取当前的最新 Redis 白名单 Token
  const activeToken = await redisClient.get(`refresh_token:${uuid}`);

  let finalUser = null;

  // 情况 A：传过来的 Token 和最新白名单对不上
  if (!activeToken || activeToken !== refreshToken) {
    // 立刻去查这个 Token 是不是在 10 秒内刚刚被废弃的“旧车票”
    // 键名格式如：zombie_token:该Token的字符串值
    const cachedAccessToken = await redisClient.get(`zombie_token:${refreshToken}`);

    if (!cachedAccessToken) {
      // 既不在白名单，也不在 10 秒缓冲区，说明真的是假 Token 或早就过期的偷来 Token！直接干掉！
      return res.status(401).json({ message: "登录凭证已失效，请重新登录" });
    }

    // 如果在缓冲区里，说明它是并发引起的延迟请求！安全放行！
    // 重点：对于并发的延迟请求，我们只给他签发新的短 Token（Access），不能再动长 Token（Refresh）了
    // 否则长 Token 序列又会错乱，前端拿到新的短 Token 就可以顺利继续工作了！
    return res.status(200).json({
      isSuccess: true,
      accessToken: cachedAccessToken
    });
  }

  // 情况 B：正常走完第一步，Token 完美对上之前最新白名单
  finalUser = await User.findUser(uuid);
  if (!finalUser) {
    return res.status(404).json({ message: "用户不存在或已被注销" });
  }

  // 重新签发双 token 滚动续期
  const newAccessToken = generateAccessToken(finalUser);
  const newRefreshToken = generateRefreshToken(finalUser);

  // 【核心联动优化】在用新 Token 覆盖 Redis 之前，把即将变成废纸的旧 Token 扔进 10 秒临时缓冲区
  // 这样，在未来的 10 秒内，任何慢了半拍的并发请求带着这个旧 Token 来，都会进入上面的“情况 A”被温柔放行
  await redisClient.setEx(`zombie_token:${refreshToken}`, 10, newAccessToken);

  // 更新正常的 Redis 最新白名单
  await redisClient.setEx(`refresh_token:${finalUser.uuid}`, 604800, newRefreshToken);

  // 更新 cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(200).json({
    isSuccess: true,
    accessToken: newAccessToken
  });
}

async function logout(req, res) {
  try {
    // 根据前端请求的{ withCredentials: true } 浏览器会自动把cookie塞进请求头
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(200).json({ isSuccess: true, message: "已安全退出" });
    }
    const decoded = jwt.decode(refreshToken);
    if (decoded && decoded.uuid) {
      const redisKey = `refreshToken:${decoded.uuid}`;
      await redisClient.del(redisKey);
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    return res.status(200).json({ isSuccess: true, message: "已安全退出" });
  } catch (error) {
    console.error("Logout ERROR", error);
    res.clearCookie("refreshToken");
    return res.status(500).json({ isSuccess: false, message: "退出登录时发生异常" });
  }
}

module.exports = { login, handleRefresh, logout };
