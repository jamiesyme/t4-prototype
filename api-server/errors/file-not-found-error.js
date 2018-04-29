const AppError = require('./app-error');

class FileNotFoundError extends AppError {
	constructor (fileId) {
		super('file not found');
		this.fileId = fileId;
	}
}

module.exports = FileNotFoundError;
