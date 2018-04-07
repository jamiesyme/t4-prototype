const B2 = require('backblaze-b2');
const pg = require('pg');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');

{ // Load the .env variables
	const r = dotenv.config();
	if (r.error) {
		throw r.error;
	}
}

const app = express();
app.use(bodyParser.json());

// Create B2 client
app.set('b2', new B2({
	accountId: process.env.B2_ACCOUNT_ID,
	applicationKey: process.env.B2_APPLICATION_KEY,
}));

// Create PG client (params pulled from env)
app.set('pg', new pg.Pool());

require('./routes/boxes')(app);
require('./routes/files')(app);

app.listen(3000, () => {
	console.log('Example app listening on port 3000');
});
