const multer = require('multer');
const Errors = require('../errors');
const isBoxId = require('../utils/is-id').isBoxId;
const queryParser = require('../utils/query-parser');

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
			return res.status(400).json({
				error: 'missing name'
			});
		}

		const boxRepo = app.get('box-repo');
		const boxInfo = await boxRepo.create(name);

		res.status(201).json(boxInfo);
	});

	app.delete('/boxes/:id', async (req, res) => {

		const boxId = req.params.id;
		if (!isBoxId(boxId)) {
			return res.status(400).json({
				error: 'invalid box id'
			});
		}

		try {
			const boxRepo = app.get('box-repo');
			await boxRepo.delete(boxId);

			res.sendStatus(204);

		} catch (err) {
			if (err instanceof Errors.BoxNotFoundError) {
				return res.status(404).json({
					error: 'box not found'
				});
			}
			throw err;
		}
	});

	app.get('/boxes/:id/files/_', async (req, res) => {

		const boxId = req.params.id;
		if (!isBoxId(boxId)) {
			return res.status(400).json({
				error: 'invalid box id'
			});
		}

		let fileQueryStr = req.query.q;
		let fileQuery;
		try {
			fileQuery = queryParser.parse(fileQueryStr);
		} catch (e) {
			console.log(e);
			return res.status(400).json({
				error: 'invalid query',
				query: fileQueryStr,
			});
		}

		const boxRepo = app.get('box-repo');
		const boxExists = await boxRepo.exists(boxId);
		if (!boxExists) {
			return res.status(404).json({
				error: 'box not found'
			});
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
		if (!isBoxId(boxId)) {
			return res.status(400).json({
				error: 'invalid box id'
			});
		}

		const boxRepo = app.get('box-repo');
		const boxExists = await boxRepo.exists(boxId);
		if (!boxExists) {
			return res.status(404).json({
				error: 'box not found'
			});
		}

		const fileRepo = app.get('file-repo');
		const fileInfo = await fileRepo.create(boxId, tags, contents);

		res.status(201).json(fileInfo);
	});
}

module.exports = { register };
