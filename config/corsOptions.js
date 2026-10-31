const allowedOrigins = ["http://localhost:5173", "https://www.lucidate.cn"];

const corsOptions = {
  // || !origin 代表postman等软件可以访问api
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = corsOptions;
