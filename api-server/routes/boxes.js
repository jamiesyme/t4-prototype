const multer = require('multer');
const uuidv4 = require('uuid/v4');

const bucketId = process.env.B2_BUCKET_ID;
const upload = multer();

module.exports = function (app) {
	app.get('/boxes', async (req, res) => {
		try {
			// Get the list from Postgres
			const pg = app.get('pg');
			const pgQuery = 'SELECT * FROM boxes';
			const pgRes = await pg.query(pgQuery);

			// Transform the row to remove the 'box_' prefix from the id
			const boxes = pgRes.rows.map(row => {
				return {
					id: row.box_id,
					name: row.name,
				};
			});

			res.json(boxes);

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
	app.post('/boxes', async (req, res) => {
		try {
			// Get the box name
			const name = req.body.name;
			if (!name) {
				res.status(400).json({
					error: 'missing name'
				});
				return;
			}

			// Create the box in Postgres
			const boxId = uuidv4();
			const pg = app.get('pg');
			const query = {
				text: 'INSERT INTO boxes VALUES ($1, $2)',
				values: [boxId, name]
			};
			await pg.query(query);

			res.status(201).json({
				id: boxId,
				name: name,
			});

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
	app.post('/boxes/:id/files', upload.single('file'), async (req, res) => {
		try {
			// Verify the box exists
			const boxId = req.params.id;
			const pg = app.get('pg');
			let pgQuery = {
				text: 'SELECT EXISTS (SELECT 1 FROM boxes WHERE box_id = $1)',
				values: [boxId],
			};
			let pgRes = await pg.query(pgQuery);
			if (!pgRes.rows[0]) {
				res.status(404).json({
					error: 'box not found'
				});
				return;
			}

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

			// Save the file info in Postgres
			pgQuery = {
				text: 'INSERT INTO files VALUES ($1, $2)',
				values: [fileId, b2FileId],
			};
			await pg.query(pgQuery);
			pgQuery = {
				text: 'INSERT INTO box_files VALUES ($1, $2)',
				values: [boxId, fileId],
			};
			await pg.query(pgQuery);

			res.status(201).json({
				id: fileId,
			});

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}
