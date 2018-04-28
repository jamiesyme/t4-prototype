const uuidv4 = require('uuid/v4');
const FileInfo = require('../models/file-info');

class FileInfoRepo {
	constructor (arango, collectionName) {
		this.db = arango;
		this.fileCollection = this.db.collection(collectionName);
	}

	_docToInfo (doc) {
		return new FileInfo(doc._key, doc.boxId, doc.tags);
	}

	async create (boxId, tags) {
		const doc = {
			_key: uuidv4(),
			boxId: boxId,
			tags: tags || []
		};
		await this.fileCollection.save(doc);
		return this._docToInfo(doc);
	}

	async delete (fileId) {
		await this.fileCollection.remove(fileId);
	}

	async getManyByQuery (fileQuery) {
		const filterClause = fileQuery.toFilterClause('file.tags');

		const queryStr = `
			FOR file IN ${this.fileCollection.name}
				${filterClause.filter}
				RETURN file
		`;
		const cursor = await this.db.query(queryStr, filterClause.params);
		const docs = await cursor.all();

		return docs.map(this._docToInfo);
	}
}

module.exports = FileInfoRepo;
