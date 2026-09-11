const multer = require("multer");
const DataParser = require("datauri/parser.js");
const path = require("path");
const { StatusCodes } = require("http-status-codes");

const storage = multer.memoryStorage();

// Per-file size cap. 10 MB covers high-resolution scans of legal documents
// (insurance certificates, DVLA roadworthy slips, vehicle registration,
// Ghana ID cards) which can easily run 5-8 MB at full resolution.
//
// The frontend should still compress where possible — a 10 MB upload
// over a slow Ghana 4G link takes 30-60 seconds. Profile selfies should
// be compressed to ~1-2 MB before sending. This cap is a backstop.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

const parser = new DataParser();

const formatImage = (file) => {
  const fileExtension = path.extname(file.originalname).toString();
  return parser.format(fileExtension, file.buffer).content;
};

// Express error middleware that turns multer's MulterError into a clean
// 413 / 400 response. Mount in the global errorHandler chain (or as a
// per-route catch) so users see a useful message instead of an HTML
// stack trace when their image is too big or the wrong field name.
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(StatusCodes.REQUEST_TOO_LONG).json({
        msg: `Image is too large. Maximum size is ${
          MAX_FILE_SIZE_BYTES / (1024 * 1024)
        } MB. Try resizing before uploading.`,
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `Unexpected file field: ${err.field}. Check the field names in your form.`,
      });
    }
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Upload failed: ${err.message}`,
      code: err.code,
    });
  }
  return next(err);
};

module.exports = {
  upload,
  formatImage,
  handleUploadErrors,
  MAX_FILE_SIZE_BYTES,
};
