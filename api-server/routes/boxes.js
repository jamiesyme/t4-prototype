const uuidv4 = require('uuid/v4');

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
}
