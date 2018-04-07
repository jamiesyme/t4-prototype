const multer = require('multer');
const uuidv4 = require('uuid/v4');

const bucketId = process.env.B2_BUCKET_ID;
const upload = multer();

module.exports = function (app) {
	app.get('/files/:id/contents', async (req, res) => {
		try {
			// Look up B2 fileId in Postgres
			const pg = app.get('pg');
			const pgQuery = {
				text: 'SELECT * FROM files WHERE file_id = $1',
				values: [req.params.id]
			};
			const pgRes = await pg.query(pgQuery);
			if (pgRes.rows.length === 0) {
				res.sendStatus(404);
				return;
			}

			// Download file from B2
			const b2 = app.get('b2');
			await b2.authorize();
			const b2Res = await b2.downloadFileById({
				fileId: pgRes.rows[0].b2_file_id
			});

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

			// Save the file info in Postgres
			const pg = app.get('pg');
			const query = {
				text: 'INSERT INTO files VALUES ($1, $2)',
				values: [fileId, uploadFileRes.data.fileId],
			};
			await pg.query(query);

			res.status(201).json({
				id: fileId,
			});

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}
