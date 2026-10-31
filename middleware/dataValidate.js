const dataValidate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.issues) {
      const errors = error.issues.map((err) => ({
        field: err.path.join(""),
        message: err.message
      }));

      const firstErrorMessage = error.issues[0]?.message || "输入的数据格式验证失败";

      return res.status(400).json({
        isError: true,
        message: firstErrorMessage,
        errors
      });
    }
    // express5中直接交给全局错误捕获器
    next(error);
  }
};

module.exports = dataValidate;
