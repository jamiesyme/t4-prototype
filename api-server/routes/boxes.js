const multer = require('multer');
const queryParser = require('../helpers/query-parser');

function register (app) {
	app.get('/boxes', async (req, res) => {
		try {
			const boxInfoRepo = app.get('box-info-repo');
			const boxInfo = await boxInfoRepo.getAll();

			res.json({
				boxes: boxInfo
			});

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});

	app.post('/boxes', async (req, res) => {
		try {
			const name = req.body.name;
			if (!name) {
				res.status(400).json({
					error: 'missing name'
				});
				return;
			}

			const boxInfoRepo = app.get('box-info-repo');
			const boxInfo = await boxInfoRepo.create(name);

			res.status(201).json(boxInfo);

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});

	app.get('/boxes/:id/files/_', async (req, res) => {
		try {
			let fileQueryStr = req.query.q;
			let fileQuery;
			try {
				fileQuery = queryParser.parse(fileQueryStr);
			} catch (e) {
				console.log(e);
				res.status(400).json({
					error: 'invalid query',
					query: fileQueryStr,
				});
				return;
			}

			const fileInfoRepo = app.get('file-info-repo');
			const fileInfo = await fileInfoRepo.getManyByQuery(fileQuery);

			res.json({
				files: fileInfo
			});

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});

	app.post('/boxes/:id/files', multer().single('file'), async (req, res) => {
		try {
			const fileContent = req.file.buffer;

			const tagsStr = req.body.tags;
			const tags = tagsStr.split(',').filter(t => !!t);

			const boxId = req.params.id;
			const boxInfoRepo = app.get('box-info-repo');
			const boxExists = await boxInfoRepo.exists(boxId);
			if (!boxExists) {
				res.status(404).json({
					error: 'box not found'
				});
				return;
			}

			const fileInfoRepo = app.get('file-info-repo');
			const fileInfo = await fileInfoRepo.create(boxId, tags);

			const fileContentRepo = app.get('file-content-repo');
			await fileContentRepo.set(fileInfo.id, fileContent);

			res.status(201).json(fileInfo);

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}

module.exports = { register };
