const AppError = require('./app-error');
const BoxNotFoundError = require('./box-not-found-error');
const FileNotFoundError = require('./file-not-found-error');
const QueryParserError = require('./query-parser-error');

module.exports = {
	AppError,
	BoxNotFoundError,
	FileNotFoundError,
	QueryParserError,
};
