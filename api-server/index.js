const arango     = require('arangojs');
const B2         = require('backblaze-b2');
const bodyParser = require('body-parser');
const dotenv     = require('dotenv');
const express    = require('express');

const ArangoConfig    = require('./config/arango');
const BoxInfoRepo     = require('./repos/box-info-repo');
const FileInfoRepo    = require('./repos/file-info-repo');
const FileContentRepo = require('./repos/file-content-repo');
const BoxRoutes       = require('./routes/boxes');
const FileRoutes      = require('./routes/files');

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

	// Init ArangoDB client
	const arangoClient = new arango.Database();
	await ArangoConfig.init(arangoClient);

	// Init repos
	const boxInfoRepo = new BoxInfoRepo(arangoClient, 'boxes');
	const fileInfoRepo = new FileInfoRepo(arangoClient, 'files');
	const fileContentRepo = new FileContentRepo(
		b2Client,
		process.env.B2_BUCKET_ID,
		arangoClient,
		'files'
	);

	// Init Express app
	const app = express();
	app.use(bodyParser.json());

	app.set('arango', arangoClient);
	app.set('b2', b2Client);
	app.set('box-info-repo', boxInfoRepo);
	app.set('file-info-repo', fileInfoRepo);
	app.set('file-content-repo', fileContentRepo);

	BoxRoutes.register(app);
	FileRoutes.register(app);

	app.listen(3000, () => {
		console.log('Example app listening on port 3000');
	});
}
main();
