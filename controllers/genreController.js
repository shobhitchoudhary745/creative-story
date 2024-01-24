const { json } = require("express");
const genreModel = require("../models/genreModel");
const catchAsyncError = require("../utils/catchAsyncError");
const { s3Uploadv2 } = require("../utils/s3");

exports.createGenre = catchAsyncError(async (req, res, next) => {
  const { genre, starter, colour, backgroundColour } = req.body;
  // console.log(req.body);
  const file = req.file;
  const results = await s3Uploadv2(file);
  console.log(results)
  const location = results.Location && results.Location;
  const genres = await genreModel.create({
    genre,
    starter: JSON.parse(starter),
    colour,
    backgroundColour,
    imageUrl: location,
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
    length: genresCount,
    data: genres,
  });
});
