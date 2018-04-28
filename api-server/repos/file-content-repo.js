class FileContentRepo {
	constructor (b2, bucketId, arango, collectionName) {
		this.b2 = b2;
		this.bucketId = bucketId;
		this.db = arango;
		this.fileCollection = this.db.collection(collectionName);
	}

	async delete (fileId) {
		const fileInfo = await this.fileCollection.document(fileId);

		const b2FileId = fileInfo.b2FileId;
		const b2FileName = 'files/' + fileId;
		await this.b2.authorize();
		await this.b2.deleteFileVersion({
			fileId: b2FileId,
			fileName: b2FileName,
		});

		// NOTE: this leaves invalid b2FileId in file info
	}

	async get (fileId) {
		const fileInfo = await this.fileCollection.document(fileId);

		await this.b2.authorize();
		const downloadRes = await this.b2.downloadFileById({
			fileId: fileInfo.b2FileId
		});

		return downloadRes.data;
	}

	async set (fileId, contentBuffer) {
		const b2FileName = 'files/' + fileId;

		await this.b2.authorize();
		const uploadUrlRes = await this.b2.getUploadUrl(this.bucketId);
		const uploadUrl    = uploadUrlRes.data.uploadUrl;
		const authToken    = uploadUrlRes.data.authorizationToken;

		const uploadFileRes = await this.b2.uploadFile({
			uploadUrl:       uploadUrl,
			uploadAuthToken: authToken,
			filename:        b2FileName,
			data:            contentBuffer,
		});
		const b2FileId = uploadFileRes.data.fileId;

		await this.fileCollection.update(fileId, { b2FileId });
	}
}

module.exports = FileContentRepo;
