const { format } = require("date-fns");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const fsPromise = require("fs").promises;
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");

async function logEvent(message, logFileName) {
  const dateTime = format(new Date(), "yyyy-MM-dd HH:mm:ss.SSS");
  const logItem = `${dateTime}\t${uuidv4()}\t${message}\n`;
  try {
    // 无需手动 existsSync 判断，非阻塞且安全
    await fsPromise.mkdir(LOG_DIR, { recursive: true });
    await fsPromise.appendFile(path.join(LOG_DIR, logFileName), logItem);
  } catch (error) {
    console.error("Logger Error:", error);
  }
}

module.exports = logEvent;