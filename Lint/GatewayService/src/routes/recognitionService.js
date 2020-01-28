import express from 'express'
import multer from 'multer'
import HTTPStatusFromCode from '../grpcErrorHandler'

const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({
    storage
})

export default function (logger, recognitionClient) {

    router.post('/recognise', upload.single('image'), (req, res) => {
        logger.info('\n\n[Gateway] Recognise')
        req.body.image = JSON.stringify(req.file.buffer)
        const startTimeForRecognitionClient = Date.now() // This line is only for testing and should be removed afterward
        recognitionClient.recognise(req.body, (err, data) => {
            if (err) {
                logger.error(`RecognitionRoute: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {

                /**
                 * Below 3 lines are only for testing and should be removed afterward
                 */
                const stopTimeForRecognitionClient = Date.now()
                const totalTime = (stopTimeForRecognitionClient - startTimeForRecognitionClient) / 1000
                totalTime > 0.400 ? logger.error(`FrameID: ${data.frame_id} :   STOP TIME (${stopTimeForRecognitionClient}) - START TIME (${startTimeForRecognitionClient}) = ${totalTime} seconds`) : logger.info(`FrameID: ${data.frame_id} :   STOP TIME (${stopTimeForRecognitionClient}) - START TIME (${startTimeForRecognitionClient}) = ${totalTime} seconds`)

                res.status(200).send(data)
            }
        })
    })

    return router
}
