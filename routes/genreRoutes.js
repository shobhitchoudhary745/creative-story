const express = require("express");
const { createGenre, getAllGenre } = require("../controllers/genreController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/createGenre", createGenre);
router.get("/getAllGenre", auth, getAllGenre);

module.exports = router;
