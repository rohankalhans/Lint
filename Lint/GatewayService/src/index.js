// Importing libraries
import '@babel/polyfill'
import cors from 'cors'
import express from 'express'
import grpc from 'grpc'
import helmet from 'helmet'
import http from 'http'
import morgan from 'morgan'
import path from 'path'
const protoLoader = require('@grpc/proto-loader') // can't be imported
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')


// Importing configurations
import config from './config'

// Logger configurations
import LOGGER from './logger'
const logger = LOGGER
require('appmetrics-dash').attach()

// Importing Routes
import adminRoute from './routes/adminService'
import androidRoute from './routes/androidService'
import emailServiceRoute from './routes/emailService'
import lockServiceRoute from './routes/lockService'
import loginRoute from './routes/loginService'
import recognitionRoute from './routes/recognitionService'
import registrationRoute from './routes/registrationService'

const app = express()
app.use(helmet())
app.use(cors())
app.use(morgan('dev', { stream: { write: message => logger.info(message) } }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
// File Server[https://<IP>:3500] hosting (Registration images / Recognition Images / lockModule / Android) files:
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/static', express.static(path.join(__dirname, '../../assets')))
const server = http.createServer(app)
server.listen(3500, () => { logger.info('Gateway Service listening on http://localhost:3500') })

// GRPC Client Configuration
const GRPC_OPTIONS = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
}
const ADMIN_SERVICE_PROTO_PATH = path.join(__dirname, './protoFiles/AdminService.proto')
const DATABASE_SERVICE_PROTO_PATH = path.join(__dirname, './protoFiles/DbService.proto')
const EMAIL_SERVICE_PROTO_PATH = path.join(__dirname, './protoFiles/EmailService.proto')
const LOCK_SERVICE_PROTO_PATH = path.join(__dirname, './protoFiles/LockService.proto')
const LOGIN_SERVICE_PROTO_PATH = path.join(__dirname, './protoFiles/LoginService.proto')
const PY_IMAGE_VALIDATION_SERVICE_PROTO_PATH = path.join(__dirname, './protoFiles/PyImageValidationService.proto')
const RECOGNITION_SERVICE_PROTO_PATH = path.join(__dirname, './protoFiles/RecognitionService.proto')
const REGISTRATION_SERVICE_PROTO_PATH = path.join(__dirname, './protoFiles/RegistrationService.proto')

const ADMIN_SERVICE_PACKAGE_DEFINITION = protoLoader.loadSync(ADMIN_SERVICE_PROTO_PATH, GRPC_OPTIONS)
const DATABASE_SERVICE_PACKAGE_DEFINITION = protoLoader.loadSync(DATABASE_SERVICE_PROTO_PATH, GRPC_OPTIONS)
const EMAIL_SERVICE_PACKAGE_DEFINITION = protoLoader.loadSync(EMAIL_SERVICE_PROTO_PATH, GRPC_OPTIONS)
const LOCK_SERVICE_PACKAGE_DEFINITION = protoLoader.loadSync(LOCK_SERVICE_PROTO_PATH, GRPC_OPTIONS)
const LOGIN_SERVICE_PACKAGE_DEFINITION = protoLoader.loadSync(LOGIN_SERVICE_PROTO_PATH, GRPC_OPTIONS)
const PY_IMAGE_VALIDATION_SERVICE_PACKAGE_DEFINITION = protoLoader.loadSync(PY_IMAGE_VALIDATION_SERVICE_PROTO_PATH, GRPC_OPTIONS)
const RECOGNITION_SERVICE_PACKAGE_DEFINITION = protoLoader.loadSync(RECOGNITION_SERVICE_PROTO_PATH, GRPC_OPTIONS)
const REGISTRATION_SERVICE_PACKAGE_DEFINITION = protoLoader.loadSync(REGISTRATION_SERVICE_PROTO_PATH, GRPC_OPTIONS)

let adminClient, dbClient, emailClient, lockClient, loginClient, pyImageValidationClient, recognitionClient, registrationClient

// where is event client ?
const getClient = function (address, protoPath, serviceName) {
    const Client = grpc.loadPackageDefinition(protoPath)[serviceName]
    return new Client(address, grpc.credentials.createInsecure())
}

function connectGrpcClients() {
    adminClient = getClient(config.ADMIN_SERVICE_PORT, ADMIN_SERVICE_PACKAGE_DEFINITION, 'AdminService')
    dbClient = getClient(config.DB_SERVICE_PORT, DATABASE_SERVICE_PACKAGE_DEFINITION, 'DbService')
    emailClient = getClient(config.EMAIL_SERVICE_PORT, EMAIL_SERVICE_PACKAGE_DEFINITION, 'EmailService')
    lockClient = getClient(config.LOCK_SERVICE_PORT, LOCK_SERVICE_PACKAGE_DEFINITION, 'LockService')
    loginClient = getClient(config.LOGIN_SERVICE_PORT, LOGIN_SERVICE_PACKAGE_DEFINITION, 'LoginService')
    pyImageValidationClient = getClient(config.PY_IMAGEVALIDATION_SERVICE_PORT, PY_IMAGE_VALIDATION_SERVICE_PACKAGE_DEFINITION, 'PyImageValidation')
    recognitionClient = getClient(config.RECOGNITION_SERVICE_PORT, RECOGNITION_SERVICE_PACKAGE_DEFINITION, 'RecognitionService')
    registrationClient = getClient(config.REGISTRATION_SERVICE_PORT, REGISTRATION_SERVICE_PACKAGE_DEFINITION, 'RegistrationService')
    logger.info('GRPC clients successfully connected')
}

connectGrpcClients()

// Routing API calls
app.use('/admin', adminRoute(adminClient, logger))
app.use('/android', androidRoute(dbClient, logger))
app.use('/config', emailServiceRoute(emailClient, logger))
app.use('/lock', lockServiceRoute(adminClient, lockClient, logger))
app.use('/recognition', recognitionRoute(logger, recognitionClient))
app.use('/user', loginRoute(loginClient, logger))
app.use('/user/registration', registrationRoute(dbClient, logger, pyImageValidationClient, registrationClient))

app.get('/', (req, res) => {
    res.status(200).json({
        message: req.connection.remoteAddress
    })
})
