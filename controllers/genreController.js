const genreModel = require("../models/genreModel");
const catchAsyncError = require("../utils/catchAsyncError");

exports.createGenre = catchAsyncError(async (req, res, next) => {
    const { genre,starter,colour } =
      req.body;
    const genres = await genreModel.create({
      genre,
      starter,
      colour
    });
    res.status(201).send({
      status: 201,
      success: true,
      genres,
      message: "Genre Created Successfully",
    });
  });

  exports.getAllGenre = catchAsyncError(async (req, res, next) => {
    const genresCount = await genreModel.countDocuments();
    const genres = await genreModel.find().lean();
    res.status(200).send({
      status: 200,
      success: true,
      length:genresCount,
      data: genres,
    });
  });