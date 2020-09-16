import {BadRequestError} from 'routing-controllers';


export class EmptyHttpRequestError extends BadRequestError {

    constructor() {
        super('Empty request.');
    }

    toJSON() {
        return {
            status: this.httpCode,
            message: this.message
        };
    }
}
