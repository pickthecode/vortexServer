const pool = require("../config/mysql");
const { v7: uuidv7 } = require("uuid");

const User = {
  preQuery: async (account) => {
    const [rows] = await pool.execute(
      "SELECT BIN_TO_UUID(uuid) AS uuid, username, account, roles, email FROM users WHERE account = :account",
      { account }
    );
    return rows[0];
  },

  findEmail: async (email) => {
    const [rows] = await pool.execute("SELECT email FROM users WHERE email = :email", { email });
    return rows[0];
  },

  createUser: async ({ account, username, password, email }) => {
    // 由后端生成安全的 UUID v7
    const newUuid = uuidv7();

    // 插入语句加入 uuid 字段，注意用 UUID_TO_BIN() 把newUuid字符串转换为二进制
    const [result] = await pool.execute(
      "INSERT INTO users (uuid, account, username, password, email) VALUES (UUID_TO_BIN(:uuid), :account, :username, :password, :email)",
      { uuid: newUuid, account, username, password, email }
    );
    return result;
  },

  findUsers: async () => {
    const [rows] = await pool.execute(
      "SELECT BIN_TO_UUID(uuid) AS uuid, username, account, roles, active, email, created_at, last_login_at FROM users"
    );
    return rows;
  },

  findUser: async (uuid) => {
    const [rows] = await pool.execute(
      "SELECT BIN_TO_UUID(uuid) AS uuid, account, username, roles, active, email, created_at, last_login_at FROM users WHERE uuid = UUID_TO_BIN(:uuid)",
      { uuid }
    );
    return rows[0];
  },

  updateUser: async (uuid, data) => {
    const { username, password } = data;
    let sql = "UPDATE users SET username=:username";
    let params = { username, uuid };
    if (password) {
      sql += ", password=:password";
      params.password = password;
    }
    sql += " WHERE uuid = UUID_TO_BIN(:uuid)";
    const [result] = await pool.execute(sql, params);
    return result;
  },

  deleteUser: async (uuid) => {
    const [result] = await pool.execute("DELETE FROM users WHERE uuid = UUID_TO_BIN(:uuid)", { uuid });
    return result;
  }
};

module.exports = User;
