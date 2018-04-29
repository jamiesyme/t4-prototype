const AppError = require('./app-error');

class QueryParseError extends AppError {
	constructor (message, queryStr, queryStrIndex) {
		super(message);
		this.queryStr = queryStr;
		this.queryStrIndex = queryStrIndex;
	}
}

module.exports = QueryParseError;
