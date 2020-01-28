import '@grpc/proto-loader'
import express from 'express'
import HTTPStatusFromCode from '../grpcErrorHandler'

const router = express.Router()

export default function (adminClient, lockClient, logger) {

    router.get('/status/:lock_id', (req, res) => {
        logger.info(`status/:lock_id -> params: ${JSON.stringify(req.params)}`)
        lockClient.getLockStatus(req.params, (err, data) => {
            if (err) {
                logger.error(`status/:lock_id: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                logger.info(`status/:lock_id -> response: ${JSON.stringify(data)}`)
                res.status(200).send(data)
            }
        })
    })

    router.get('/:lock_id/:control', (req, res) => {
        logger.info(`:lock_id/:control -> params: ${JSON.stringify(req.params)}`)
        if (req.params.control === '2') {
            lockClient.deleteLock(req.params, (err, data) => {
                if (err) {
                    logger.error(`:lock_id/:control: ${err}`)
                    const response = HTTPStatusFromCode(err.code, err.details)
                    res.status(response.status).json(response)
                } else {
                    logger.info(`:lock_id/:control -> response: ${JSON.stringify(data)}`)
                    res.status(200).send(data)
                }
            })
        } else {
            req.params.lock_status = req.params.control
            lockClient.controlLock(req.params, (err, data) => {
                if (err) {
                    logger.error(`:lock_id/:control: ${err}`)
                    const response = HTTPStatusFromCode(err.code, err.details)
                    res.status(response.status).json(response)
                } else {
                    logger.info(`:lock_id/:control -> response: ${JSON.stringify(data)}`)
                    res.status(200).send(data)
                }
            })
        }
    })

    router.get('/lockStatus/:lock_id/:lock_status/:control_source/:wifi_strength/:ip_address/:door_status', (req, res) => {
        req.params.lock_status = parseInt(req.params.lock_status)
        req.params.door_status = parseInt(req.params.door_status)
        logger.info(`lockStatus -> params: ${JSON.stringify(req.params)}`)
        lockClient.lockStatus(req.params, (err, data) => {
            if (err) {
                logger.error(`lockStatus: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                logger.info(`lockStatus -> response: ${JSON.stringify(data)}`)
                res.status(200).send(data)
            }
        })
    })

    router.get('/enableBuzzer/:lock_id/:buzzer', (req, res) => {
        logger.info(`enableBuzzer -> params: ${JSON.stringify(req.params)}`)
        lockClient.enableBuzzer(req.params, (err, data) => {
            if (err) {
                logger.error(`enableBuzzer: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                logger.info(`enableBuzzer -> response: ${JSON.stringify(data)}`)
                res.status(200).send(data)
            }
        })
    })

    return router
}
