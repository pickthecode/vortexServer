const User = require("../models/Users");

async function userModify(req, res) {
  // 🌟 直接从 Token 里拿，根本不看外部参数！
  const uuid = req.user.uuid;
  const { username, password } = req.body;

  let data = {};
  if (username) data.username = username;
  if (password) data.password = await bcrypt.hash(password, 10);

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "没有提供需要更新的有效字段" });
  }

  await User.updateUser(uuid, data);
  return res.json({ isSuccess: true, message: "个人资料更新成功" });
}

// 专门留给管理员使用的接口
async function adminUpdateUser(req, res) {
  const { uuid } = req.params;

  // 严防死守：只有 admin 才能调这个接口
  if (!req.user.roles.includes("admin")) {
    return res.status(403).json({ message: "越权操作：仅限管理员" });
  }

  // ... 管理员修改其他用户的逻辑
}

async function cancellation(req, res) {
  const { uuid } = req.params;

  // 🛡️ 【核心防御】：防止越权注销别人账号
  if (req.user.uuid !== uuid && !req.user.roles.includes("admin")) {
    return res.status(403).json({ message: "无权注销其他用户的账号" });
  }

  await User.deleteUser(uuid);

  // 可选：注销账号后，顺手把该用户的 Refresh Token 从 Redis 踢掉，防止残留
  await redisClient.del(`refresh_token:${uuid}`);

  // 可选：清除客户端的 Cookie
  res.clearCookie("refreshToken");

  return res.json({ isSuccess: true, message: "用户注销成功" });
}

module.exports = {
  userModify,
  cancellation
};
