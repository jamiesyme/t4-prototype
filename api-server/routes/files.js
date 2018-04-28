function register (app) {
	app.delete('/files/:id', async (req, res) => {
		const fileId = req.params.id;

		const fileRepo = app.get('file-repo');
		await fileRepo.delete(fileId);

		res.sendStatus(204);
	});

	app.get('/files/:id/contents', async (req, res) => {
		const fileId = req.params.id;

		const fileRepo = app.get('file-repo');
		const fileContents = await fileRepo.getContents(fileId);

		res.send(fileContents);
	});
}

module.exports = { register };
