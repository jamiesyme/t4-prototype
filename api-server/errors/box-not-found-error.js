const AppError = require('./app-error');

class BoxNotFoundError extends AppError {
	constructor (boxId) {
		super('box not found');
		this.boxId = boxId;
	}
}

module.exports = BoxNotFoundError;
