import dotenv from 'dotenv'
dotenv.config()
import path from 'path'

export default {
    ADMIN_SERVICE_PORT: process.env.ADMIN_SERVICE_PORT,
    APK_VERSION: process.env.APK_VERSION,
    APK_URL: process.env.APK_URL,
    DB_SERVICE_PORT: process.env.DB_SERVICE_PORT,
    EMAIL_SERVICE_PORT: process.env.EMAIL_SERVICE_PORT,
    LOCK_SERVICE_PORT: process.env.LOCK_SERVICE_PORT,
    LOGIN_SERVICE_PORT: process.env.LOGIN_SERVICE_PORT,
    PY_IMAGEVALIDATION_SERVICE_PORT: process.env.PY_IMAGEVALIDATION_SERVICE_PORT,
    RECOGNITION_SERVICE_PORT: process.env.RECOGNITION_SERVICE_PORT,
    REGISTRATION_IMAGE_FOLDER_PATH: path.join(__dirname + '../../RegistrationImageFolder'),
    REGISTRATION_SERVICE_PORT: process.env.REGISTRATION_SERVICE_PORT,
    USERACCESS_SERVICE_PORT: process.env.USERACCESS_SERVICE_PORT
}
