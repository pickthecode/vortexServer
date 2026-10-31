const express = require("express");
const router = express.Router();
const { login, handleRefresh, logout } = require("../controllers/authController");
const defaultLimiter = require("../middleware/rateLimit");

// 登录
router.post("/", defaultLimiter, login);

router.post("/logout", logout);

// 刷新
router.route("/refresh").post(defaultLimiter.custom({ max: 10, isRefreshField: true }), handleRefresh);

module.exports = router;