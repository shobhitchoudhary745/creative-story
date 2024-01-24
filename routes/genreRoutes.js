const express = require("express");
const { createGenre, getAllGenre } = require("../controllers/genreController");
const { auth, isAdmin } = require("../middlewares/auth");
const { upload } = require("../utils/s3");
const router = express.Router();

router.post("/addGenre",auth,isAdmin,upload.single("image"), createGenre);
router.get("/getAllGenre", auth, getAllGenre);

module.exports = router;
