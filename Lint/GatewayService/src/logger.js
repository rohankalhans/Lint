import fs from 'fs'
import path from 'path'
import { createLogger, format, transports } from 'winston'

// Change these values as per the service
const SERVICE_NAME = 'GatewayService'
const TIMESTAMP_FORMAT = 'YY-MM-DD HH:MM:SS'
const LOG_FOLDER_PATH = '../../Logs/gatewayService.log'
const env = process.env.NODE_ENV || 'development'

const createLogDirIfNot = () => {
    if (!fs.existsSync(path.join(__dirname, '../../Logs'))) {
        fs.mkdirSync(path.join(__dirname, '../../Logs'))
    }
}
createLogDirIfNot()

const LOG_DISPLAY_FORMAT = format.combine(
    format.colorize({
        all: true
    }),
    format.label({
        label: `[${SERVICE_NAME}]`
    }),
    format.timestamp({
        format: TIMESTAMP_FORMAT
    }),
    format.printf(
        info => {
            if (info.level.includes('error')) {
                return `${info.timestamp}  ${info.label}  ❌ ${info.level} : ${info.message}`
            } else if (info.level.includes('warn')) {
                return `${info.timestamp}  ${info.label}  ⚠️ ${info.level}  : ${info.message}`
            } else if (info.level.includes('debug')) {
                return `${info.timestamp}  ${info.label}  🐞 ${info.level} : ${info.message}`
            } else if (info.level.includes('info')) {
                return `${info.timestamp}  ${info.label}  ✅ ${info.level}  : ${info.message}`
            } else {
                return `${info.timestamp}  ${info.label}   ${info.level} : ${info.message}`
            }
        }
    )
)
const LOG_STORAGE_FORMAT = format.combine(
    format.label({
        label: SERVICE_NAME
    }),
    format.timestamp({
        format: TIMESTAMP_FORMAT
    }),
    format.printf(
        info => `{"date": "${info.timestamp}", "service": "${info.label}", "level": "${info.level}", "message": "${info.message}"}`
    )
)
const LOGGER = createLogger({
    level: env === 'development' ? 'debug' : 'info',
    transports: [
        new (transports.Console)({
            format: format.combine(format.colorize(), LOG_DISPLAY_FORMAT)
        }),
        new (transports.File)({
            filename: path.join(__dirname, LOG_FOLDER_PATH),
            maxFiles: 5,
            maxsize: 100000000,
            format: format.combine(LOG_STORAGE_FORMAT)
        })
    ],
})

export default LOGGER
