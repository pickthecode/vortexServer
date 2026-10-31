const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const redisClient = require("../config/redis");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");

// Express 5 允许直接抛出错误，无需手动写 try-catch 包裹每个函数
// 错误会被自动捕获并传递给 app.use((err, req, res, next) => {})

async function checkAccount(req, res) {
  const { account } = req.body;
  const foundAccount = await User.preQuery(account);
  if (foundAccount) {
    return res.status(400).json({ message: "用户名已存在", exists: true });
  }
  return res.status(200).json({ exists: false, message: "账号可以使用" });
}

async function createUser(req, res) {
  const { account, password, email, captcha } = req.body;
  const realCaptcha = await redisClient.get(email);
  if (!realCaptcha) {
    return res.status(400).json({ message: "验证码已过期或不存在" });
  }
  if (realCaptcha.toLowerCase() !== captcha.toLowerCase()) {
    return res.status(400).json({ message: "验证码错误" });
  }
  // 邮箱验证码查到就删
  await redisClient.del(email);

  const foundAccount = await User.preQuery(account);
  if (foundAccount) {
    return res.status(400).json({ message: "账号已经存在" });
  }
  const foundEmail = await User.findEmail(email);
  if (foundEmail) {
    return res.status(400).json({ message: "邮箱已存在" });
  }

  const username = email.split("@")[0];
  const hashPassword = await bcrypt.hash(password, 10);
  await User.createUser({ account, username, password: hashPassword, email });
  const newUser = await User.preQuery(account);

  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);
  // 保存redis白名单,如果token泄露(比如异地登录或者异常登录),服务器可以主动作废refreshToken 604800为7天
  await redisClient.setEx(`refresh_token:${newUser.uuid}`, 604800, refreshToken);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return res.status(201).json({
    isSuccess: true,
    message: "注册成功",
    accessToken,
    user: {
      uuid: newUser.uuid,
      account: newUser.account,
      username: newUser.username,
      roles: newUser.roles,
      email: newUser.email
    }
  });
}

async function getUsers(req, res) {
  const result = await User.findUsers();
  return res.json({ isSuccess: true, result });
}

async function getUser(req, res) {
  const { uuid } = req.params;
  const result = await User.findUser(uuid);
  if (!result) {
    return res.status(404).json({ message: "用户不存在" });
  }
  return res.json({ isSuccess: true, result });
}

module.exports = {
  checkAccount,
  createUser,
  getUsers,
  getUser
};
