function register (app) {
	app.delete('/files/:id', async (req, res) => {
		try {
			const fileId = req.params.id;

			const fileContentRepo = app.get('file-content-repo');
			await fileContentRepo.delete(fileId);

			const fileInfoRepo = app.get('file-info-repo');
			await fileInfoRepo.delete(fileId);

			res.sendStatus(204);

		} catch (e) {
			console.log(e);
			res.sendStatus(500);
		}
	});

	app.get('/files/:id/contents', async (req, res) => {
		try {
			const fileId = req.params.id;

			const fileContentRepo = app.get('file-content-repo');
			const fileContent = await fileContentRepo.get(fileId);

			res.send(fileContent);

		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});
}

module.exports = { register };
