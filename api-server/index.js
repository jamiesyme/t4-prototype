const B2 = require('backblaze-b2');
const dotenv = require('dotenv');
const express = require('express');

{ // Load the .env variables
	const r = dotenv.config();
	if (r.error) {
		throw r.error;
	}
}

const app = express();
app.set('b2', new B2({
	accountId: process.env.B2_ACCOUNT_ID,
	applicationKey: process.env.B2_APPLICATION_KEY,
}));

require('./routes/files')(app);

app.listen(3000, () => {
	console.log('Example app listening on port 3000');
});
