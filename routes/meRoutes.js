const express = require("express");
const router = express.Router();
const verifyAccessToken = require("../middleware/verifyAccessToken");
const datavalidate = require("../middleware/dataValidate");
const { updateUserSchema } = require("../schema/userSchema");

const { userModify,cancellation } = require("../controllers/meController");

router.route("/")
.patch(verifyAccessToken,datavalidate(updateUserSchema), userModify)
.delete(verifyAccessToken, cancellation)

module.exports = router;