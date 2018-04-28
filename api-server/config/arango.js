async function doesCollectionExist (db, name) {
	for (const col of await db.listCollections()) {
		if (col.name === name) {
			return true;
		}
	}
	return false;
}

async function init (db) {
	// Create the database
	db.useBasicAuth(
		process.env.ARANGO_USERNAME,
		process.env.ARANGO_PASSWORD,
	);
	const dbName = process.env.ARANGO_DATABASE;
	try {
		await db.createDatabase(dbName);
	} catch (e) {
	}
	db.useDatabase(dbName);

	// Create the collections
	let colExists = await doesCollectionExist(db, 'boxes');
	if (!colExists) {
		await createBoxesCollection(db);
	}

	colExists = await doesCollectionExist(db, 'files');
	if (!colExists) {
		await createFilesCollection(db);
	}
}

async function createBoxesCollection (db) {
	const col = db.collection('boxes');
	await col.create();
}

async function createFilesCollection (db) {
	const col = db.collection('files');
	await col.create();
}

module.exports = { init };
