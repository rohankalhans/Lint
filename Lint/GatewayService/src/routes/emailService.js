import express from 'express'
import { check, validationResult } from 'express-validator'
import HTTPStatusFromCode from '../grpcErrorHandler'

const router = express.Router()

export default function (emailClient, logger) {

    router.get('/get/email-configuration', (req, res) => {
        emailClient.getEmailConfiguration({}, (err, config) => {
            if (!err && config) {
                if (req.query.request && req.query.request === 'help') {
                    res.status(200).json({ email: config.emergencyContacts.email, number: config.emergencyContacts.number })
                } else {
                    res.status(200).json(config)
                }
            } else {
                logger.error(`${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
        })
    })

    router.post('/email-configuration', [
        check('companyDetails.name').isString(),
        check('companyDetails.logo').isURL(),
        check('emergencyContacts.email').isEmail().normalizeEmail(),
        check('emergencyContacts.number').isString(),
        check('fromEmail.alias').isString(),
        check('fromEmail.password').isString(),
        check('fromEmail.mailId').isEmail().normalizeEmail(),
        check('host').isString(),
        check('port').isNumeric(),
        check('secure').isBoolean(),
        check('toEmail').isEmail().normalizeEmail(),
    ], (req, res) => {

        // Returns error if syntax is correct but is unprocessable / have wrong values
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        let toMailList = req.body.toEmail.split(/[ ,]+/)
        let bodyData = req.body
        bodyData.toEmail = getMailList(toMailList)
        bodyData.secure = bodyData.secure === true
        bodyData.port = parseInt(bodyData.port, 10)
        const emailConfiguration = bodyData
        emailClient.saveEmailConfiguration(emailConfiguration, (err, data) => {
            if (err) {
                logger.error(`${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                res.status(data.status).json(data)
            }
        })
    })

    return router
}

function getMailList(mailArr) {
    let arr = []
    if (mailArr && mailArr.length > 0) {
        mailArr.forEach((toMail) => {
            arr.push({ mailId: toMail })
        })
    }
    return arr
}
