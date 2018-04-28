function del (boxInfoRepo, fileInfoRepo, boxId) {
	boxInfoRepo.delete(boxId);

}

module.exports = del;
