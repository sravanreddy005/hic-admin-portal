const fs = require("fs");
const { createLogger, format, config, transports } = require('winston');
const { combine, timestamp, splat,simple,json, label, printf } = format;
// const logDir = __dirname + "/../../../logs/";
const logDir = "../logs/";
const httpContext = require('express-http-context');

require('dotenv').config();
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const logFormat = printf(({ level, message, timestamp }) => {
    var requestId = '';
    if (message && message.sessionid) {
      requestId = message.sessionid
      delete message['sessionid'];
    }
  requestId = requestId ? requestId : httpContext.get('requestId');
  message = (Object.keys(message) >= '1') ? `${JSON.stringify(message)}` : message;
  return JSON.stringify({ timestamp: timestamp, level: level, session_id: requestId ? requestId : '', message: message });
});
const logger = createLogger({
  transports: [
    new(transports.Console)({
      format: combine(
        // winston.format.colorize(),
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        splat(),
        simple(),
        label(),
        printf(function(info) {
          return format.colorize().colorize(info.level, `${info.level}: ${JSON.stringify(info.message)}`)
          // return `${info.level}: ${JSON.stringify(info.message)}`;
        })
      ),
      levels: config.syslog.levels
    }),
    new(require("winston-daily-rotate-file"))({
      filename: logDir + process.env.LOG_FILE_NAME + '_%DATE%.log',
      // zippedArchive: true,
      format: combine(
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        json(),
        logFormat
      ),
      levels: config.syslog.levels
    }),
    new transports.File({
      filename: logDir + process.env.LOG_FILE_NAME + '_error.log',
      level: 'error',
      format: combine(
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        simple(),
      )
    }),
  ]
});
module.exports = logger;