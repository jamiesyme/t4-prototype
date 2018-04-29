const uuidv4 = require('uuid/v4');
const BoxInfo = require('../models/box-info');
const Errors = require('../errors');

class BoxRepo {
	constructor (arango, boxColName, fileRepo) {
		this.db = arango;
		this.boxCollection = this.db.collection(boxColName);
		this.fileRepo = fileRepo;
	}

	_infoDocToModel (doc) {
		return new BoxInfo(doc._key, doc.name);
	}

	async create (name) {
		const doc = {
			_key: uuidv4(),
			name: name
		};
		await this.boxCollection.save(doc);
		return this._infoDocToModel(doc);
	}

	async delete (boxId) {
		// TODO: this is hacky. When you fix this, remove the fileRepo member
		const cursor = await this.fileRepo.fileCollection.byExample({ boxId });
		while (cursor.hasNext()) {
			const doc = await cursor.next();
			await this.fileRepo.delete(doc._key);
		}

		try {
			await this.boxCollection.remove(boxId);

		} catch (err) {
			if (err && err.code === 404) {
				throw new Errors.BoxNotFoundError(boxId);
			}
			throw err;
		}
	}

	async exists (boxId) {
		try {
			await this.get(boxId);
			return true;

		} catch (err) {
			if (err instanceof Errors.BoxNotFoundError) {
				return false;
			}
			throw err;
		}
	}

	async get (boxId) {
		try {
			const doc = await this.boxCollection.document(boxId);
			return this._infoDocToModel(doc);

		} catch (err) {
			if (err && err.code === 404) {
				throw new Errors.BoxNotFoundError(boxId);
			}
			throw err;
		}
	}

	async getAll () {
		const cursor = await this.boxCollection.all();
		const docs = await cursor.all();
		return docs.map(this._infoDocToModel);
	}
}

module.exports = BoxRepo;
