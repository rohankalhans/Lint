
export default function (code, details) {
    switch (code) {
        case 0:
            return { status: 200, message: 'OK', details }
        case 1:
            return { status: 408, message: 'RequestTimeout', details }
        case 2:
            return { status: 500, message: 'InternalServerError', details }
        case 3:
            return { status: 400, message: 'BadRequest', details }
        case 4:
            return { status: 504, message: 'GatewayTimeout' }
        case 5:
            return { status: 404, message: 'NotFound', details }
        case 6:
            return { status: 409, message: 'Conflict', details }
        case 7:
            return { status: 403, message: 'Forbidden', details }
        case 8:
            return { status: 429, message: 'TooManyRequests', details }
        case 9:
            return { status: 400, message: 'BadRequest', details }
        case 10:
            return { status: 409, message: 'Conflict', details }
        case 11:
            return { status: 400, message: 'BadRequest', details }
        case 12:
            return { status: 501, message: 'NotImplemented', details }
        case 13:
            return { status: 500, message: 'InternalServerError', details }
        case 14:
            return { status: 503, message: 'ServiceUnavailable', details }
        case 15:
            return { status: 500, message: 'InternalServerError', details }
        case 16:
            return { status: 401, message: 'Unauthorized', details }
    }
}
