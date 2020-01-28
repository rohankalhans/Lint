import '@grpc/proto-loader'
import express from 'express'
import { check, validationResult } from 'express-validator'
import HTTPStatusFromCode from '../grpcErrorHandler'

const router = express.Router()
const date = new Date()

export default function (adminClient, logger) {

    router.get('/get/registration-link', (req, res) => {
        logger.info(`registration-link -> query: ${JSON.stringify(req.query)}`)
        if (Object.keys(req.query).length == 2 && typeof (req.query.email) === 'string' && req.query.email && typeof (req.query.type) === 'string' && req.query.type) {
            adminClient.getUrlForRegistrationDesk(req.query, (err, data) => {
                if (err) {
                    logger.error(`registration-link: ${err}`)
                    const response = HTTPStatusFromCode(err.code, err.details)
                    res.status(response.status).json(response)
                } else {
                    logger.info(`registration-link -> data: ${JSON.stringify(data)}`)
                    res.status(200).send({
                        status: 200,
                        url: data.url
                    })
                }
            })
        } else {
            res.status(400).send('Bad Request')
        }
    })

    router.post('/send-mail-self-reg', [
        check('email').isString(),
        check('type').isString().isIn(['employee', 'guest'])
    ], (req, res) => {
        logger.info(`send-mail-self-reg -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`send-mail-self-reg -> error: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }
        adminClient.sendMailSelfRegistration(req.body, (err, data) => {
            if (err) {
                logger.error(`sendMailSelfRegistration: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            logger.info(`sendMailSelfRegistration -> response: ${JSON.stringify(data)}`)
            return res.status(200).json(data)
        })
    })

    router.post('/re-send/invitation', [
        check('email').isEmail().normalizeEmail(),
        check('user_id').isUUID(),
        check('type').isString().isIn(['employee', 'guest']),
        check('updated_by').isString()
    ], (req, res) => {
        logger.info(`re-send/invitation -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.info(`re-send/invitation -> errors: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        adminClient.resendInviteMail(req.body, (err, data) => {
            if (err) {
                logger.error(`resendInviteMail: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            logger.info(`resendInviteMail -> data: ${JSON.stringify(data)}`)
            return res.status(200).json(data)
        })
    })

    router.post('/access-req', (req, res) => {
        logger.info(`access-req -> body: ${JSON.stringify(req.body)}`)
        adminClient.getUserApproved(req.body, (err, data) => {
            if (err) {
                logger.error(`access-req: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                logger.info(`access-req -> response: ${JSON.stringify(data)}`)
                res.status(200).send(data)
            }
        })
    })

    router.post('/reject-mail', [
        check('comments').isString(),
        check('user_id').isUUID(),
        check('status').isIn(['rejected']),
        check('email').isEmail().normalizeEmail(),
        check('name.first').isAlpha(),
        check('name.last').isAlpha(),
        check('type').isIn(['employee', 'guest']),
        check('updated_by').isString()
    ], (req, res) => {

        logger.info(`reject-mail -> body: ${JSON.stringify(req.body)}`)

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`reject-mail -> errors: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        req.body.name = JSON.stringify(req.body.name)
        adminClient.sendRejectEmail(req.body, (err, data) => {
            if (err) {
                logger.error(`reject-mail: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            logger.info(`reject-mail -> data: ${JSON.stringify(data)}`)
            return res.status(200).json(data)
        })
    })

    router.get('/getUsers', (req, res) => {
        logger.info(`getUsers -> query: ${JSON.stringify(req.query)}`)
        adminClient.getUsers(req.query, (err, data) => {
            if (err) {
                logger.error(`getUsers: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.get('/getNotification', (req, res) => {
        adminClient.getNotification({}, (err, data) => {
            if (err) {
                logger.error(`getNotification: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.post('/updateUser', [
        check('type').isIn(['employee', 'guest']),
        check('status').isIn(['invited', 'registered', 'approved', 'rejected', 'terminated']),
        check('name.first').trim().isAlpha().isLength({ min: 2, max: 20 }),
        check('name.last').trim().isAlpha().isLength({ min: 1, max: 20 }),
        check('email').isEmail().normalizeEmail(),
        check('phoneNumber').optional().isString(),
        check('gender').optional().isIn(['Female', 'Male']),
        check('employee_id').optional().isString(),
        check('otherDetails.dob').optional().isISO8601().isBefore(new Date(date.getFullYear() - 5, 1, 1).toISOString()).isAfter(new Date(date.getFullYear() - 90, 1, 1).toISOString()),
        check('otherDetails.companyName').optional().isString(),
        check('user_id').isUUID(),
        check('image').optional().isString(),
        check('access.forever').optional().isBoolean(),
        check('access.toDate').optional(),
        check('access.fromDate').optional().isISO8601()
    ], (req, res) => {
        logger.info(`updateUser -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`updateUser -> errors: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        adminClient.updateUser(req.body, (err, data) => {
            if (err) {
                logger.error(`updateUser: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).send(response)
            } else {
                logger.info(`updateUser -> response: ${JSON.stringify(data)}`)
                res.status(200).json(data)
            }
        })
    })

    router.post('/updateDoor', [
        check('cameras').optional(),
        check('previous_lock').optional().isAlphanumeric(),
        check('lock_id').optional().isAlphanumeric(),
        check('name').optional().trim().isLength({ min: 2, max: 20 }).matches(/^[a-zA-Z0-9][\w\s]+$/, 'g'),
        check('door_type').optional().isIn(['office']),
        check('selected').optional().isBoolean(),
        check('enabled').optional().isBoolean()
    ], (req, res) => {
        logger.info(`updateDoor -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`updateDoor -> errors: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        adminClient.updateDoor(req.body, (err, data) => {
            if (err) {
                logger.error(`updateDoor: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).send(response)
            } else {
                logger.info(`updateDoor -> response: ${JSON.stringify(data)}`)
                res.status(200).json(data)
            }
        })
    })

    router.post('/saveDoor', [
        check('cameras').optional(),
        check('previous_lock').optional().isAlphanumeric(),
        check('lock_id').optional().isAlphanumeric(),
        check('name').optional().trim().isLength({ min: 2, max: 20 }).matches(/^[a-zA-Z0-9][\w\s]+$/, 'g'),
        check('door_type').optional().isIn(['office']),
        check('selected').optional().isBoolean(),
        check('enabled').optional().isBoolean()
    ], (req, res) => {

        logger.info(`saveDoor -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`saveDoor -> errors: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        adminClient.saveDoor(req.body, (err, data) => {
            if (err) {
                logger.error(`saveDoor -> ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).send(response)
            } else {
                logger.info(`saveDoor -> response: ${JSON.stringify(data)}`)
                res.status(200).json(data)
            }
        })
    })

    router.delete('/door/deleteDoor', (req, res) => {
        logger.info(`deleteDoor -> query: ${JSON.stringify(req.query)}`)
        adminClient.deleteDoor(req.query, (err, data) => {
            if (err) {
                logger.error(`deleteDoor: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            logger.info(`deleteDoor -> response: ${JSON.stringify(data)}`)
            return res.status(200).json(data)
        })
    })

    router.get('/getCameras', (req, res) => {
        adminClient.getCameras(req.query, (err, data) => {
            if (err) {
                logger.error(`getCameras: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.post('/updateCamera', [
        check('camera_name').optional().trim().isLength({ min: 2, max: 20 }).matches(/^[a-zA-Z0-9][\w\s]+$/, 'g'),
        check('mac_id').isMACAddress(),
        check('camera_type').optional().isIn(['android']),
        check('spoof').optional().isBoolean(),
        check('edge_threshold').optional().isInt({ min: 0, max: 1000 }),
        check('blur_threshold').optional().isInt({ min: 0, max: 100 }),
        check('door_id').optional()
    ], (req, res) => {

        logger.info(`updateCamera -> body: ${JSON.stringify(req.body)}`)
        
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`updateCamera -> errors: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        adminClient.updateCamera(req.body, (err, data) => {
            if (err) {
                logger.error(`updateCamera: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).send(response)
            } else {
                logger.info(`updateCamera -> response: ${JSON.stringify(data)}`)
                res.status(200).json(data)
            }
        })
    })

    router.post('/saveCamera', [
        check('camera_name').trim().isLength({ min: 2, max: 20 }).matches(/^[a-zA-Z0-9][\w\s]+$/, 'g'),
        check('mac_id').isMACAddress(),
        check('camera_type').optional().isIn(['android']),
        check('spoof').optional().isBoolean(),
        check('edge_threshold').optional().isInt({ min: 0, max: 1000 }),
        check('blur_threshold').optional().isInt({ min: 0, max: 100 }),
        check('camera_in_use').optional().isBoolean()
    ], (req, res) => {
        logger.info(`saveCamera -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`saveCamera: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        adminClient.saveCamera(req.body, (err, data) => {
            if (err) {
                logger.error(`saveCamera: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).send(response)
            } else {
                logger.info(`saveCamera: ${JSON.stringify(data)}`)
                res.status(200).json(data)
            }
        })
    })


    router.delete('/deleteCamera', (req, res) => {
        logger.info(`deleteCamera -> query: ${JSON.stringify(req.query)}`)
        adminClient.deleteCamera(req.query, (err, data) => {
            if (err) {
                logger.error(`deleteCamera: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            logger.info(`deleteCamera -> data: ${JSON.stringify(data)}`)
            return res.status(200).json(data)
        })
    })

    router.get('/getLocks', (req, res) => {
        logger.info(`getLocks -> query: ${JSON.stringify(req.query)}`)
        adminClient.getLocks(req.query, (err, data) => {
            if (err) {
                logger.error(`getLocks: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.post('/updateLock', [
        check('lock_id').isAlphanumeric(),
        check('buzzer').isIn(['0', '1'])
    ], (req, res) => {
        logger.info(`updateLock -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`updateLock -> errors: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        adminClient.updateLock(req.body, (err, data) => {
            if (err) {
                logger.error(`updateLocks: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).send(response)
            } else {
                logger.info(`updateLock -> response: ${JSON.stringify(data)}`)
                res.status(200).json(data)
            }
        })
    })

    router.delete('/deleteLock', (req, res) => {
        logger.info(`deleteLock -> query: ${JSON.stringify(req.query)}`)
        adminClient.deleteLock(req.query, (err, data) => {
            if (err) {
                logger.error(`deleteLock: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            logger.info(`deleteLock -> response: ${JSON.stringify(data)}`)
            return res.status(200).json(data)
        })
    })

    router.get('/getCloudSettings', (req, res) => {
        logger.info(`getCloudSettings -> query: ${JSON.stringify(req.query)}`)
        adminClient.getCloudSettings(req.query, (err, data) => {
            if (err) {
                logger.error(`getCloudSettings: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            logger.info(`getCloudSettings -> response: ${JSON.stringify(data)}`)
            return res.status(200).json(data)
        })
    })

    router.post('/updateCloudSetting', [
        check('service').isIn(['registration']),
        check('enable').isBoolean(),
        check('updated_by').isUUID()
    ], (req, res) => {
        logger.info(`updateCloudSetting -> body: ${JSON.stringify(req.body)}`)
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`updateCloudSetting -> errors: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }

        adminClient.updateCloudSetting(req.body, (err, data) => {
            if (err) {
                logger.error(`updateCloudSettings: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).send(response)
            } else {
                logger.info(`updateCloudSetting -> response: ${JSON.stringify(data)}`)
                res.status(200).json(data)
            }
        })
    })

    router.get('/getCounts', (req, res) => {
        adminClient.getCounts({}, (err, data) => {
            if (err) {
                logger.error(`getCounts: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.get('/getAlerts', (req, res) => {
        adminClient.getAlerts(req.query, (err, data) => {
            if (err) {
                logger.error(`getAlerts: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.get('/getActivities', (req, res) => {
        adminClient.getActivities(req.query, (err, data) => {
            if (err) {
                logger.error(`getActivities: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.post('/match/password', (req, res) => {
        if (Object.keys(req.body).length === 2 && req.body.user_id && req.body.password && req.body.password.length >= 8) {
            adminClient.matchPassword({
                user_id: req.body.user_id,
                password: req.body.password
            }, (err, data) => {
                if (err) {
                    logger.error(`matchPassword: ${err}`)
                    res.status(err.code).send(err.details)
                } else {
                    res.json(data)
                }
            })
        } else {
            res.status(400).send('You made an invalid request!')
        }
    })

    router.put('/reset/password', (req, res) => {
        if (Object.keys(req.body).length === 4 &&
            req.body.user_id &&
            req.body.old && req.body.old.length >= 8 &&
            req.body.new && req.body.new.length >= 8 &&
            req.body.confirm && req.body.confirm.length >= 8 &&
            req.body.new !== req.body.old) {
            logger.error(`reset/password -> body: ${JSON.stringify(req.body)}`)
            adminClient.setPassword({
                user_id: req.body.user_id,
                password: req.body.new
            }, (err, data) => {
                if (err) {
                    logger.error(`setPassword: ${err}`)
                    res.status(err.code).send(err.details)
                } else {
                    res.json(data)
                }
            })
        } else {
            res.status(400).send('You made and invalid request!')
        }
    })

    router.get('/search/user', (req, res) => {
        let query = {}
        let offsetLimit = {}
        offsetLimit.offset = 1

        offsetLimit.limit = 10
        try {
            if (req.query.status) {
                if (req.query.offset) {
                    offsetLimit.offset = parseInt(req.query.offset)
                }
                if (req.query.limit) {
                    offsetLimit.limit = parseInt(req.query.limit)
                }
                query.offsetLimit = offsetLimit
                if (req.query.type && !['employee', 'admin', 'guest'].includes(req.query.type)) {
                    throw new Error('Type Missing')
                }
                query.queryString = req.query.queryString
                query.type = req.query.type
                query.status = req.query.status
                query.role = req.query.role
                adminClient.searchWidget(query, (err, data) => {
                    if (!err && data) {
                        res.json(data)
                    } else {
                        logger.error(`searchWidget: ${err}`)
                        res.status(err.code).send(err.details)
                    }
                })
            } else {
                throw new Error('mandatory params missing / invalid params')
            }
        } catch (error) {
            res.sendStatus(400)
        }
    })

    router.get('/search/camera', (req, res) => {
        let query = {}
        let offsetLimit = {}
        offsetLimit.offset = 1
        offsetLimit.limit = 10
        try {
            if (req.query.offset) {
                offsetLimit.offset = parseInt(req.query.offset)
            }
            if (req.query.limit) {
                offsetLimit.limit = parseInt(req.query.limit)
            }
            query.offsetLimit = offsetLimit
            query.queryString = req.query.queryString
            logger.info(`search/camera -> query: ${JSON.stringify(query)}`)
            adminClient.searchCamera(query, (err, data) => {
                if (!err && data) {
                    res.json(data)
                } else {
                    logger.error(`searchCamera: ${err}`)
                    res.status(err.code).send(err.details)
                }
            })
        } catch (error) {
            res.sendStatus(400)
        }
    })

    router.get('/search/door', (req, res) => {
        let query = {}
        let offsetLimit = {}
        offsetLimit.offset = 1
        offsetLimit.limit = 10
        try {
            if (req.query.offset) {
                offsetLimit.offset = parseInt(req.query.offset)
            }
            if (req.query.limit) {
                offsetLimit.limit = parseInt(req.query.limit)
            }
            query.offsetLimit = offsetLimit
            query.queryString = req.query.queryString
            logger.info(`search/door -> query: ${JSON.stringify(query)}`)
            adminClient.searchDoor(query, (err, data) => {
                if (!err && data) {
                    res.json(data)
                } else {
                    logger.error(`searchDoor: ${err}`)
                    res.status(err.code).send(err.details)
                }
            })
        } catch (error) {
            res.sendStatus(400)
        }
    })

    router.put('/make_an_admin', (req, res) => {
        req.body.users = JSON.stringify(req.body.users)
        req.body.emails = JSON.stringify(req.body.emails)
        adminClient.makeSelectedAdmin(req.body, (err, data) => {
            if (err) {
                logger.error(`makeSelectedAdmin: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            logger.info(`makeSelectedAdmin -> response: ${JSON.stringify(data)}`)
            return res.status(200).json(data)
        })
    })

    router.put('/remove_an_admin', (req, res) => {
        logger.info(`removeSelectedAdmin -> body: ${JSON.stringify(req.body)}`)
        req.body.users = JSON.stringify(req.body.users)
        req.body.emails = JSON.stringify(req.body.emails)
        adminClient.removeSelectedAdmin(req.body, (err, data) => {
            if (err) {
                logger.error(`removeSelectedAdmin: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.put('/terminate_selected_user', (req, res) => {
        logger.info(`terminate_selected_user -> body: ${JSON.stringify(req.body)}`)
        req.body.users = JSON.stringify(req.body.users)
        req.body.emails = JSON.stringify(req.body.emails)
        adminClient.terminateSelectedUser(req.body, (err, data) => {
            if (err) {
                logger.error(`terminatedSelectedUser: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.put('/revoke_selected_user', (req, res) => {
        logger.info(`revoke_selected_user -> body: ${JSON.stringify(req.body)}`)
        req.body.users = JSON.stringify(req.body.users)
        req.body.emails = JSON.stringify(req.body.emails)
        adminClient.revokeSelectedUser(req.body, (err, data) => {
            if (err) {
                logger.error(`revokeSelectedUser: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.put('/delete_selected_user', (req, res) => {
        logger.info(`delete_selected_user -> body: ${JSON.stringify(req.body)}`)
        adminClient.deleteSelectedUsers(req.body, (err, data) => {
            if (err) {
                logger.error(`deleteSelectedUser: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.put('/deleteSelectedDoor', (req, res) => {
        logger.info(`deleteSelectedDoor -> body: ${JSON.stringify(req.body)}`)
        req.body.doors = JSON.stringify(req.body.doors)
        adminClient.deleteSelectedDoor(req.body, (err, data) => {
            if (err) {
                logger.error(`deleteSelectedDoor: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.put('/deleteSelectedCamera', (req, res) => {
        logger.info(`deleteSelectedCamera -> body: ${JSON.stringify(req.body)}`)
        req.body.cameras = JSON.stringify(req.body.cameras)
        adminClient.deleteSelectedCamera(req.body, (err, data) => {
            if (err) {
                logger.error(`deleteSelectedCamera: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    router.post('/door/removeCamera', (req, res) => {
        adminClient.camera_stop({
            camera_id: req.body.camera_id
        }, (err, data) => {
            logger.error('removeCamera -> camera_stop:', err, data)
        })
        adminClient.removeCameraFromDoor(req.body, (err, data) => {
            if (err) {
                logger.error(`removeCamera: ${err}`)
                res.status(err.status).send(err.message)
            } else {
                logger.info(`removeCamera -> response: ${JSON.stringify(data)}`)
                res.json(data)
            }
        })
    })

    router.get('/cameras/:camera_id/:action', (req, res) => {
        if (!req.params.action || !['start', 'stop'].includes(req.params.action)) {
            res.status(400).send('Bad request!')
        } else if (req.params.action == 'start') {
            adminClient.camera_init({
                camera_id: req.params.camera_id
            }, (err, data) => {
                if (err) {
                    logger.error(`camera_init: ${err}`)
                    const response = HTTPStatusFromCode(err.code, err.details)
                    res.status(response.status).json(response)
                } else {
                    res.status(200).json(data)
                }
            })
        } else {
            adminClient.camera_stop({
                camera_id: req.params.camera_id
            }, (err, data) => {
                if (err) {
                    logger.error(`camera_stop: ${err}`)
                    const response = HTTPStatusFromCode(err.code, err.details)
                    res.status(response.status).json(response)
                } else {
                    res.json(data)
                }
            })
        }
    })

    router.get('/controlCamera', [
        check('action').isIn(['start', 'stop'])
    ], (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            logger.error(`controlCamera: ${JSON.stringify(errors)}`)
            return res.status(400).json({ status: 400, message: 'Bad Request', errors: errors.array() })
        }
        req.query.running = req.query.action === 'start' ? true : false
        adminClient.controlCamera(req.query, (err, data) => {
            if (err) {
                logger.error(`controlCamera: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                res.status(data.status).json(data)
            }
        })
    })

    router.get('/getDoors', (req, res) => {
        let tempReq = {}
        if (req.query) {
            tempReq = {
                query: JSON.stringify(req.query)
            }
        }
        logger.info(`getDoors: ${JSON.stringify(tempReq)}`)
        adminClient.getDoors(tempReq, (err, data) => {
            if (err) {
                logger.error(`${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                res.json(data)
            }
        })
    })

    router.get('/getDoorsWithLocks', (req, res) => {
        logger.info(`getDoorsWithLocks -> query: ${req.query}`)
        adminClient.getDoorsWithLocks(req.query, (err, data) => {
            if (err) {
                logger.error(`getDoorsWithLocks: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                res.json(data)
            }
        })
    })

    router.get('/getDoorsOpenedCount', (req, res) => {
        let tempReq = {}
        if (req.query) {
            tempReq = {
                query: JSON.stringify(req.query)
            }
        }
        logger.info(`getDoorsOpenedCount: ${JSON.stringify(tempReq)}`)
        adminClient.getDoorsOpenedCount(tempReq, (err, data) => {
            if (err) {
                logger.error(`getDoorsOpenedCount: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                res.json(data)
            }
        })
    })

    router.get('/getEmergencyExitStatus', (req, res) => {
        adminClient.getEmergencyExitStatus(req, (err, data) => {
            if (err) {
                logger.error(`getEmergencyExitStatus: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                res.json(data)
            }
        })
    })

    router.get('/quickGrant', (req, res) => {
        let tempReq = {}
        if (req.query) {
            tempReq = {
                query: JSON.stringify(req.query)
            }
        }
        logger.info(`quickGrant -> query: ${JSON.stringify(tempReq)}`)
        adminClient.quickGrant(tempReq, (err, data) => {
            if (err) {
                logger.error(`quickGrant: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            } else {
                res.json(data)
            }
        })
    })

    router.get('/emergencyExit', (req, res) => {
        let tempReq = {}
        if (req.query) {
            tempReq = {
                query: JSON.stringify(req.query)
            }
        }
        logger.info(`emergencyExit: ${JSON.stringify(tempReq)}`)
        adminClient.emergencyExit(tempReq, (err, data) => {
            if (err) {
                logger.error(`emergencyExit: ${err}`)
                const response = HTTPStatusFromCode(err.code, err.details)
                res.status(response.status).json(response)
            }
            return res.status(200).json(data)
        })
    })

    return router
}
