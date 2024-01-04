const genreModel = require("../models/genreModel");
const catchAsyncError = require("../utils/catchAsyncError");

exports.createGenre = catchAsyncError(async (req, res, next) => {
    const { genre,starter } =
      req.body;
    const genres = await genreModel.create({
      genre,
      starter
    });
    res.status(201).send({
      status: 201,
      success: true,
      data: genres,
      message: "Genre Created Successfully",
    });
  });

  exports.getAllGenre = catchAsyncError(async (req, res, next) => {
    const genres = await genreModel.find().lean();
    res.status(200).send({
      status: 201,
      success: true,
      data: genres,
    });
  });