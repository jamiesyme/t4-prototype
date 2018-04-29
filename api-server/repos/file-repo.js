const uuidv4 = require('uuid/v4');
const Errors = require('../errors');
const FileInfo = require('../models/file-info');

class FileRepo {
	constructor (arango, fileColName, b2, bucketId) {
		this.db = arango;
		this.fileCollection = this.db.collection(fileColName);
		this.b2 = b2;
		this.bucketId = bucketId;
	}

	_infoDocToModel (doc) {
		return new FileInfo(doc._key, doc.boxId, doc.tags);
	}

	async create (boxId, tags, contents) {
		const doc = {
			_key: uuidv4(),
			boxId: boxId,
			tags: tags || []
		};
		await this.fileCollection.save(doc);
		await this.setContents(doc._key, contents);
		return this._infoDocToModel(doc);
	}

	async delete (fileId) {
		let fileInfo;
		try {
			fileInfo = await this.fileCollection.document(fileId);
		} catch (err) {
			if (err && err.code === 404) {
				throw new Errors.FileNotFoundError(fileId);
			}
			throw err;
		}

		await this.fileCollection.remove(fileId);

		const b2FileId = fileInfo.b2FileId;
		const b2FileName = 'files/' + fileId;
		await this.b2.authorize();
		await this.b2.deleteFileVersion({
			fileId: b2FileId,
			fileName: b2FileName,
		});
	}

	async exists (fileId) {
		try {
			await this.fileCollection.document(fileId);
			return true;

		} catch (err) {
			if (err && err.code === 404) {
				return false;
			}
			throw err;
		}
	}

	async getManyByQuery (boxId, fileQuery) {
		const filterClause = fileQuery.toFilterClause('file.tags');

		const queryStr = `
			FOR file IN ${this.fileCollection.name}
				FILTER file.boxId == @boxId
				${filterClause.filter}
				RETURN file
		`;
		const queryParams = Object.assign({ boxId }, filterClause.params);
		const cursor = await this.db.query(queryStr, queryParams);
		const docs = await cursor.all();

		return docs.map(this._infoDocToModel);
	}

	async getContents (fileId) {
		let fileInfo;
		try {
			fileInfo = await this.fileCollection.document(fileId);
		} catch (err) {
			if (err && err.code === 404) {
				throw new Errors.FileNotFoundError(fileId);
			}
			throw err;
		}

		await this.b2.authorize();
		const downloadRes = await this.b2.downloadFileById({
			fileId: fileInfo.b2FileId
		});

		return downloadRes.data;
	}

	async setContents (fileId, contents) {
		const fileExists = await this.exists(fileId);
		if (!fileExists) {
			throw new Errors.FileNotFoundError(fileId);
		}

		const b2FileName = 'files/' + fileId;

		await this.b2.authorize();
		const uploadUrlRes = await this.b2.getUploadUrl(this.bucketId);
		const uploadUrl    = uploadUrlRes.data.uploadUrl;
		const authToken    = uploadUrlRes.data.authorizationToken;

		const uploadFileRes = await this.b2.uploadFile({
			uploadUrl:       uploadUrl,
			uploadAuthToken: authToken,
			filename:        b2FileName,
			data:            contents,
		});
		const b2FileId = uploadFileRes.data.fileId;

		await this.fileCollection.update(fileId, { b2FileId });
	}
}

module.exports = FileRepo;
