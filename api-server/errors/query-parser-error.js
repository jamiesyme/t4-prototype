const AppError = require('./app-error');

class QueryParserError extends AppError {
	constructor (reason, queryStr, queryStrIndex) {
		super(reason);
		this.queryStr = queryStr;
		this.queryStrIndex = queryStrIndex;
	}
}

module.exports = QueryParserError;
