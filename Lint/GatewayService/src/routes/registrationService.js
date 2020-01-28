import '@grpc/proto-loader'
import express from 'express'
import { check, validationResult } from 'express-validator'
import HTTPStatusFromCode from '../grpcErrorHandler'

const router = express.Router()
const date = new Date()

export default function(dbClient, logger, pyImageValidationClient, registrationClient) {

    router.post('/validate/token', [
        check('deviceInfo').isJSON(),
        check('token').isJWT(),
        check('onPrem_id').isString()
    ], (req, res) => {

        // Returns error if syntax is correct but is unprocessable / have wrong values
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        registrationClient.validateRegistrationToken(req.body, (err, data) => {
            logger.info(`validateRegistrationToken -> body: ${JSON.stringify(req.body)}`)
            if (err) {
                logger.error(`validateRegistrationToken: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                logger.info(`validateRegistrationToken -> response: ${JSON.stringify(data)}`)
                res.status(200).json(cleanObject(data))
            }
        })
    })

    router.post('/blurdetect', (req, res) => {
        if (req.body.image && typeof (req.body.image) === 'string') {
            pyImageValidationClient.blur_detect(req.body, (err, data) => {
                if (err) {
                    logger.error(`blurdetect: ${err}`)
                    const response = HTTPStatusFromCode(err.code, err.details)
                    res.status(response.status).json(response)
                } else {
                    logger.info(`blurdetect -> response: ${JSON.stringify(data)}`)
                    res.status(200).send(data)
                }
            })
        } else {
            res.status(400).send('Bad Request!')
        }
    })

    router.post('/add-user', [
        check('firstName').isAlpha(),
        check('lastName').isAlpha(),
        check('gender').isIn(['Female', 'Male']),
        check('email').isEmail().normalizeEmail(),
        check('phoneNumber').optional().isString(),
        check('dob').isISO8601().isBefore(new Date(date.getFullYear() - 5, 1, 1).toISOString()).isAfter(new Date(date.getFullYear() - 90, 1, 1).toISOString()),
        check('imageData').notEmpty(),
        check('onPrem_id').optional().isString(),
        check('user_id').isUUID()
    ], (req, res) => {
        // Returns error if syntax is correct but is unprocessable / have wrong values
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        registrationClient.addUser(req.body, (err, data) => {
            if (err) {
                logger.error(`add-user: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                logger.info(`add-user -> response: ${JSON.stringify(data)}`)
                res.status(200).send(data)
            }
        })
    })

    router.get('/userById/:id', (req, res) => {
        logger.info(`userById -> params: ${JSON.stringify(req.params)}`)
        dbClient.getUserById(req.params.id, (err, data) => {
            if (err) {
                logger.error(`userById: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                logger.info(`userById -> response: ${JSON.stringify(data)}`)
                res.status(200).send(data)
            }
        })
    })

    router.post('/ratings', [
        check('rating').isInt({ min: 0, max: 5 }),
        check('email').isEmail().normalizeEmail(),
        check('onPrem_id').optional().isString()
    ], (req, res) => {
        logger.info(`ratings -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        if (req.body && req.body.rating && req.body.email && typeof(req.body.rating) === 'number') {
            registrationClient.createRating(req.body, (err, data) => {
                if (err) {
                    logger.error(`error: ${err}`)
                    const response = HTTPStatusFromCode(err.code, err.details)
                    res.status(response.status).json(response)
                } else {
                    logger.info(`ratings -> response: ${JSON.stringify(data)}`)
                    res.status(200).send(data)
                }
            })
        } else {
            res.status(400).send('Bad Request!')
        }
    })

    function cleanObject(data) {
        Object.keys(data).forEach((key) => {
            if (data[key] === null || data[key] === '' || data[key] === 0) {
                delete data[key]
            }
        })
        return data
    }

    return router
}
