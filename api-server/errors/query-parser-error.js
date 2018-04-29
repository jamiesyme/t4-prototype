const AppError = require('./app-error');

class QueryParserError extends AppError {
	constructor (reason, str, strIndex) {
		super(reason);
		this.str = str;
		this.strIndex = strIndex;
	}
}

module.exports = QueryParserError;
