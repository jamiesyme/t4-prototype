function register (app) {
	app.delete('/files/:id', async (req, res) => {
		try {
			const fileId = req.params.id;

			const fileRepo = app.get('file-repo');
			await fileRepo.delete(fileId);

			res.sendStatus(204);

		} catch (e) {
			console.log(e);
			res.sendStatus(500);
		}
	});

	app.get('/files/:id/contents', async (req, res) => {
		try {
			const fileId = req.params.id;

			const fileRepo = app.get('file-repo');
			const fileContents = await fileRepo.getContents(fileId);

			res.send(fileContents);

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}

module.exports = { register };
