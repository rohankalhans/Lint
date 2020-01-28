import '@grpc/proto-loader'
import express from 'express'
import HTTPStatusFromCode from '../grpcErrorHandler'

const router = express.Router()

export default function (dbClient, logger) {

    router.get('/apk-version', (req, res) => {
        dbClient.getAPKVersion(req.query, (err, data) => {
            if (err) {
                logger.error(`${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    return router
}
