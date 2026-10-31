const pool = require("../config/mysql");

const Auth = {
  login: async (account, password) => {
    const [rows] = await pool.execute(
      "SELECT BIN_TO_UUID(uuid) AS uuid,account,password,username,roles,active,email FROM users WHERE account = :account",
      { account }
    );
    return rows[0];
  }
};

module.exports = Auth;
