const Errors = require('../errors');
const isFileId = require('../utils/is-id').isFileId;

function register (app) {
	app.delete('/files/:id', async (req, res) => {

		const fileId = req.params.id;
		if (!isFileId(fileId)) {
			return res.status(400).json({
				error: 'invalid file id'
			});
		}

		try {
			const fileRepo = app.get('file-repo');
			await fileRepo.delete(fileId);

			res.sendStatus(204);

		} catch (err) {
			if (err instanceof Errors.FileNotFoundError) {
				return res.status(404).json({
					error: 'file not found'
				});
			}
			throw err;
		}
	});

	app.get('/files/:id', async (req, res) => {

		const fileId = req.params.id;
		if (!isFileId(fileId)) {
			return res.status(400).json({
				error: 'invalid file id'
			});
		}

		try {
			const fileRepo = app.get('file-repo');
			const fileInfo = await fileRepo.get(fileId);

			res.json(fileInfo);

		} catch (err) {
			if (err instanceof Errors.FileNotFoundError) {
				return res.status(404).json({
					error: 'file not found'
				});
			}
			throw err;
		}
	});

	app.get('/files/:id/contents', async (req, res) => {

		const fileId = req.params.id;
		if (!isFileId(fileId)) {
			return res.status(400).json({
				error: 'invalid file id'
			});
		}

		try {
			const fileRepo = app.get('file-repo');
			const fileContents = await fileRepo.getContents(fileId);

			res.send(fileContents);

		} catch (err) {
			if (err instanceof Errors.FileNotFoundError) {
				return res.status(404).json({
					error: 'file not found'
				});
			}
			throw err;
		}
	});
}

module.exports = { register };
