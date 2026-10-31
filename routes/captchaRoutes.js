const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const defaultLimiter = require("../middleware/rateLimit");
const redisClient = require("../config/redis");

const transporter = nodemailer.createTransport({
  service: "163",
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post("/email", defaultLimiter.custom({ max: 1, isRefreshField: false }), async (req, res, next) => {
  const { email } = req.body;
  const lockKey = `email_lock:${email}`;
  const isLocked = await redisClient.get(lockKey);
  if (isLocked) {
    // 如果 60 秒的锁还在，提示用户
    return res.status(400).json({ message: "验证码已发送，请在 60 秒后重新获取" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "请输入有效的邮箱地址" });
  }

  try {
    const captcha = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`生成验证码: ${captcha}，准备发送至: ${email}`);
    const mailOptions = {
      from: `"marchApp团队" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "【marchApp】您的账号注册验证码",
      html: `
        <div style="padding: 20px; background: #f6f6f6; font-family: sans-serif;">
          <div style="background: #fff; padding: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">欢迎注册我们的网站</h2>
            <p style="color: #666; font-size: 14px;">您正在进行账号注册，您的验证码为：</p>
            <p style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0; text-align: center;">
              ${captcha}
            </p>
            <p style="color: #999; font-size: 12px;">验证码有效期为 5 分钟。如非本人操作，请忽略此邮件。</p>
          </div>
        </div>
      `
    };
    // 发送邮件
    await transporter.sendMail(mailOptions);
    // 存入redis设置过期时间5分钟
    const redisKey = `${email}`;
    await redisClient.set(redisKey, captcha, { EX: 300 });
    await redisClient.set(lockKey, "locked", { EX: 300 });
    res.status(200).json({ message: "验证码已发送,请注意查收" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
