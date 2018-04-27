const multer = require('multer');
const uuidv4 = require('uuid/v4');
const queryParser = require('../helpers/query-parser');

const bucketId = process.env.B2_BUCKET_ID;
const upload = multer();

module.exports = function (app) {
	app.get('/boxes', async (req, res) => {
		try {
			// Get the list from Arango
			const db = app.get('arango');
			const boxCursor = await db.collection('boxes').all();
			const boxDocs = await boxCursor.all();

			// Return the boxes
			const boxes = boxDocs.map(doc => {
				return {
					id: doc._key,
					name: doc.name,
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

			// Create the box in Arango
			const boxId = uuidv4();
			const db = app.get('arango');
			db.collection('boxes').save({
				_key: boxId,
				name: name,
			});

			res.status(201).json({
				id: boxId,
				name: name,
			});

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
	app.get('/boxes/:id/files/_', async (req, res) => {
		try {
			// Get the file query
			const tagQueryStr = req.query.q;

			// Parse the file query
			let tagQuery;
			try {
				tagQuery = queryParser.parse(tagQueryStr);
			} catch (e) {
				console.log(e);
				res.status(400).json({
					error: 'invalid query',
					query: tagQueryStr,
				});
				return;
			}

			// Convert the file query to a filter clause for Arango
			const filterClause = tagQuery.toFilterClause('file.tags');

			// Get files from Arango
			const db = app.get('arango');
			const dbQueryStr = `
				FOR file IN files
					${filterClause.filter}
					RETURN file
			`;
			const fileCursor = await db.query(dbQueryStr, filterClause.params);
			const fileDocs = await fileCursor.all();

			// Return the files
			const files = fileDocs.map(doc => {
				return {
					id: doc._key,
					boxId: doc.boxId,
					tags: doc.tags,
				};
			});
			res.json(files);

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
	app.post('/boxes/:id/files', upload.single('file'), async (req, res) => {
		try {
			// Get the file tags
			const tagsStr = req.body.tags;
			let tags = [];
			if (tagsStr) {
				tags = tagsStr.split(',');
			}

			// Verify the box exists
			const boxId = req.params.id;
			const db = app.get('arango');
			try {
				const col = db.collection('boxes');
				const doc = await col.firstExample({ _key: boxId });
			} catch (e) {
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

			// Save the file info in Arango
			db.collection('files').save({
				_key: fileId,
				boxId,
				b2FileId,
				tags,
			});

			res.status(201).json({
				id: fileId,
				tags: tags,
			});

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}
