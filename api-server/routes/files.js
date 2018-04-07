const multer = require('multer');
const uuidv4 = require('uuid/v4');

const bucketId = process.env.B2_BUCKET_ID;
const upload = multer();

module.exports = function (app) {
	app.post('/files', upload.single('file'), async (req, res) => {
		try {
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

			const pg = app.get('pg');
			const query = {
				text: 'INSERT INTO files VALUES ($1, $2)',
				values: [fileId, uploadFileRes.data.fileId],
			};
			await pg.query(query);

			res.status(201).json({ fileId });

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}
