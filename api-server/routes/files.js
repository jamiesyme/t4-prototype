const multer = require('multer');
const uuidv4 = require('uuid/v4');

const bucketId = process.env.B2_BUCKET_ID;
const upload = multer();

module.exports = function (app) {
	app.get('/files/:id/contents', async (req, res) => {
		try {
			// Get the file id
			const fileId = req.params.id;

			// Look up B2 fileId in Arango
			const db = app.get('arango');
			let b2FileId;
			try {
				const doc = db.collection('files').document(fileId);
				b2FileId = doc.b2FileId;
			} catch (e) {
				res.sendStatus(404);
				return;
			}

			// Download file from B2
			const b2 = app.get('b2');
			await b2.authorize();
			const b2Res = await b2.downloadFileById({ fileId: b2FileId });

			res.send(b2Res.data);

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
	app.post('/files', upload.single('file'), async (req, res) => {
		try {
			// Upload the file to B2
			const b2 = app.get('b2');
			await b2.authorize();
			const uploadUrlRes = await b2.getUploadUrl(bucketId);
			const uploadUrl = uploadUrlRes.data.uploadUrl;
			const uploadAuthToken = uploadUrlRes.data.authorizationToken;
			const fileId = uuidv4();
			const filename = 'files/' + fileId;
			const data = req.file.buffer;
			const uploadFileRes = await b2.uploadFile({
				uploadUrl,
				uploadAuthToken,
				filename,
				data,
			});
			const b2FileId = uploadFileRes.data.fileId;

			// Save the file info in Arango
			const db = app.get('arango');
			db.collection('files').save({
				_key: fileId,
				b2FileId,
			});

			res.status(201).json({
				id: fileId,
			});

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}
