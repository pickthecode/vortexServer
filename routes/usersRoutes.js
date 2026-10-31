const express = require("express");
const router = express.Router();
const verifyAccessToken = require("../middleware/verifyAccessToken");
// 验证用户输入
const datavalidate = require("../middleware/dataValidate");
const { userSchema, checkAccountSchema } = require("../schema/userSchema");
const { createUser, getUsers, checkAccount } = require("../controllers/uersController");
const defaultLimiter = require("../middleware/rateLimit");

router
  .route("/")
  .get(verifyAccessToken, getUsers)
  .post(defaultLimiter.custom({ max: 3, isRefreshField: false }), datavalidate(userSchema), createUser);

router
  .route("/check")
  .post(defaultLimiter, datavalidate(checkAccountSchema), checkAccount);

module.exports = router;
