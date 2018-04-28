const uuidv4 = require('uuid/v4');
const BoxInfo = require('../models/box-info');

class BoxRepo {
	constructor (arango, collectionName) {
		this.db = arango;
		this.boxCollection = this.db.collection(collectionName);
	}

	_infoDocToModel (doc) {
		return new BoxInfo(doc._key, doc.name);
	}

	async getAll () {
		const cursor = await this.boxCollection.all();
		const docs = await cursor.all();
		return docs.map(this._infoDocToModel);
	}

	async create (name) {
		const doc = {
			_key: uuidv4(),
			name: name
		};
		await this.boxCollection.save(doc);
		return this._infoDocToModel(doc);
	}

	async exists (boxId) {
		try {
			await this.boxCollection.document(boxId);
			return true;
		} catch (e) {
			return false;
		}
	}
}

module.exports = BoxRepo;
