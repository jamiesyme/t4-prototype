async function create (boxRepo, name) {
	return await boxRepo.create(name);
}

module.exports = create;
