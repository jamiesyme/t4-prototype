const arango     = require('arangojs');
const B2         = require('backblaze-b2');
const bodyParser = require('body-parser');
const dotenv     = require('dotenv');
const express    = require('express');
require('express-async-errors');

const ArangoConfig = require('./config/arango');
const BoxRepo      = require('./repos/box-repo');
const FileRepo     = require('./repos/file-repo');
const BoxRoutes    = require('./routes/boxes');
const FileRoutes   = require('./routes/files');

async function main () {

	{ // Load the .env variables
		const r = dotenv.config();
		if (r.error) {
			throw r.error;
		}
	}

	// Init B2 client
	const b2Client = new B2({
		accountId: process.env.B2_ACCOUNT_ID,
		applicationKey: process.env.B2_APPLICATION_KEY,
	});
	const b2BucketId = process.env.B2_BUCKET_ID;

	// Init ArangoDB client
	const arangoClient = new arango.Database();
	await ArangoConfig.init(arangoClient);

	// Init repos
	const boxRepo = new BoxRepo(arangoClient, 'boxes');
	const fileRepo = new FileRepo(arangoClient, 'files', b2Client, b2BucketId);

	// Init Express app
	const app = express();
	app.use(bodyParser.json());

	app.set('arango', arangoClient);
	app.set('b2', b2Client);
	app.set('box-repo', boxRepo);
	app.set('file-repo', fileRepo);

	BoxRoutes.register(app);
	FileRoutes.register(app);

	app.use((err, req, res, next) => {
		if (!res.headersSent) {
			res.sendStatus(500);
		}
		next(err);
	});

	app.listen(3000, () => {
		console.log('Listening on :3000');
	});
}
main();
