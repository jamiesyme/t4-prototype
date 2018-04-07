const multer = require('multer');

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
			const filename = 'test-file';
			const data = req.file.buffer;

			const uploadFileRes = await b2.uploadFile({
				uploadUrl,
				uploadAuthToken,
				filename,
				data,
			});

			res.sendStatus(201);
		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}
