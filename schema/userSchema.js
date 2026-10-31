const { z } = require("zod");

const userSchema = z
  .object({
    account: z
      .string()
      .min(6, "账号至少6位数")
      .max(12, "账号最多12位数")
      .regex(/^[a-zA-Z0-9_]+$/, "账号格式错误"),
    email: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "请输入正确的邮箱格式")
      .max(100),
    password: z.string().min(9, "密码至少9位数").max(100),
    captcha: z.string().min(6, "邮箱验证码至少6位数")
  })
  // 严格模式 没有定义的字段报错
  .strict();

const updateUserSchema = z
  .object({
    username: z
      .string()
      .min(1, "用户名不能为空")
      .max(12, "用户名最多12个字符")
      .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "只能包含中英文、数字或下划线"),
    password: z.string().min(9, "密码至少9位数").max(100)
  })
  // 可验证部分更新
  .partial()
  .strict();

const checkAccountSchema = z
  .object({
    account: z
      .string()
      .min(6, "账号至少6位数")
      .max(12, "账号最多12位数")
      .regex(/^[a-zA-Z0-9_]+$/, "只能包含中英文、数字或下划线")
  })
  .strict();

module.exports = { userSchema, updateUserSchema, checkAccountSchema };
