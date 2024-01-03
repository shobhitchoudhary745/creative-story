const S3 = require("aws-sdk/clients/s3");
const multer = require("multer");

exports.s3Uploadv2 = async (file) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/${Date.now().toString()}-${file.originalname}`,
    Body: file.buffer,
  };

  return await s3.upload(param).promise();
};

exports.deleteFile = async (url, res) => {
  const key = url.split(".com/")[1];
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    const data = await s3.deleteObject(params).promise();
    console.log("File deleted successfully:", data);
    res.status(200).json({data});
  } catch (err) {
    console.log("Error deleting file:", err);
    return res.status(400).json({ err });
  }

  // return await s3.deleteObject(params).promise();
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log(file);
  console.log("in this route");
  if (file.mimetype.split("/")[0] === "image") {
    req.video_file = false;
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5242880, files: 1 },
});
