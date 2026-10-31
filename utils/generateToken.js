const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign({ uuid: user.uuid, account: user.account, roles: user.roles }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h"
  });
}
function generateRefreshToken(user) {
  return jwt.sign({ uuid: user.uuid, account: user.account, roles: user.roles }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d"
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken
};
