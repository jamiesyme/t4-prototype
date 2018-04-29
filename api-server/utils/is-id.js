const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isBoxId (id) {
	return id && uuidRegex.test(id);
}

function isFileId (id) {
	return id && uuidRegex.test(id);
}

module.exports = {
	isBoxId,
	isFileId,
};
