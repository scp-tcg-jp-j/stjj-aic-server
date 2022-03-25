import winston = require('winston');
import DailyRotateFile = require('winston-daily-rotate-file');

// ロガー生成
export const logger = winston.createLogger({
    transports: [
        new DailyRotateFile({
            dirname: '/home/stjj-aic/log',
            filename: 'node.log-%DATE%',
            datePattern: 'YYYY-MM-DD',
        })
    ],
});
