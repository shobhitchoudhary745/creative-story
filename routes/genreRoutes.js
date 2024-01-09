const express = require("express");
const { createGenre, getAllGenre } = require("../controllers/genreController");
const { auth, isAdmin } = require("../middlewares/auth");
const router = express.Router();

router.post("/addGenre",auth,isAdmin, createGenre);
router.get("/getAllGenre", auth, getAllGenre);

module.exports = router;
