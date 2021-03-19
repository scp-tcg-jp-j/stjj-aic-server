import winston = require('winston')

// ロガー生成
export const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({
                    format: "YYYY-MM-DD HH:mm:ss"
                })
            )
        }),
    ],
});