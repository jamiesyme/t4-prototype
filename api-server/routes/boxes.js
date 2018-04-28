const multer = require('multer');
const queryParser = require('../helpers/query-parser');

function register (app) {
	app.get('/boxes', async (req, res) => {
		const boxRepo = app.get('box-repo');
		const boxInfo = await boxRepo.getAll();

		res.json({
			boxes: boxInfo
		});
	});

	app.post('/boxes', async (req, res) => {
		const name = req.body.name;
		if (!name) {
			res.status(400).json({
				error: 'missing name'
			});
			return;
		}

		const boxRepo = app.get('box-repo');
		const boxInfo = await boxRepo.create(name);

		res.status(201).json(boxInfo);
	});

	app.delete('/boxes/:id', async (req, res) => {
		const boxId = req.params.id;

		const boxRepo = app.get('box-repo');
		await boxRepo.delete(boxId);

		res.sendStatus(204);
	});

	app.get('/boxes/:id/files/_', async (req, res) => {
		const boxId = req.params.id;

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

		const fileRepo = app.get('file-repo');
		const fileInfo = await fileRepo.getManyByQuery(boxId, fileQuery);

		res.json({
			files: fileInfo
		});
	});

	app.post('/boxes/:id/files', multer().single('file'), async (req, res) => {
		const contents = req.file.buffer;

		const tagsStr = req.body.tags;
		const tags = tagsStr.split(',').filter(t => !!t);

		const boxId = req.params.id;
		const boxRepo = app.get('box-repo');
		const boxExists = await boxRepo.exists(boxId);
		if (!boxExists) {
			res.status(404).json({
				error: 'box not found'
			});
			return;
		}

		const fileRepo = app.get('file-repo');
		const fileInfo = await fileRepo.create(boxId, tags, contents);

		res.status(201).json(fileInfo);
	});
}

module.exports = { register };
