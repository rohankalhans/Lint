import '@grpc/proto-loader'
import express from 'express'
import { check, validationResult } from 'express-validator'
import HTTPStatusFromCode from '../grpcErrorHandler'

const router = express.Router()

export default function(loginClient, logger) {

    router.post('/login', [
        check('email').isEmail().normalizeEmail(),
        check('password').isString()
    ], (req, res) => {

        // Returns error if syntax is correct but is unprocessable / have wrong values
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        loginClient.checkForValidCredentials(req.body, (err, data) => {
            logger.info(`checkForValidCredentials -> body: ${JSON.stringify(req.body)}`)
            if (err) {
                logger.error(`checkForValidCredentials: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                logger.info(`checkForValidCredentials -> response: ${JSON.stringify(data)}`)
                res.status(200).send(data)
            }
        })
    })

    router.get('/forgotpassword', (req, res) => {
        logger.info(`forgotPassword -> query: ${JSON.stringify(req.query)}`)
        if (req.query && req.query.email && typeof req.query.email === 'string') {
            loginClient.forgotPasswordAdmin(req.query, (err, data) => {
                if (err) {
                    logger.error(`forgotpassword: ${err}`)
                    const response = HTTPStatusFromCode(err.code, err.details)
                    res.status(response.status).json(response)
                } else {
                    logger.info(`forgotpassword -> response: ${JSON.stringify(data)}`)
                    res.status(200).send(data)
                }
            })
        } else {
            res.sendStatus(400)
        }
    })

    return router
}
