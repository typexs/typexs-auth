import {BadRequestError, UnauthorizedError} from 'routing-controllers';


export class RestrictedAccessError extends UnauthorizedError {

    constructor() {
        super('Restricted access error.');
    }

    toJSON() {
        return {
            status: this.httpCode,
            message: this.message
        };
    }
}
