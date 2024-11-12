import multer from "multer";
import path from "path";
import { ErrorHandler } from "./errorHandler.js";

const __dirname = path.resolve();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "/public/uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png/;
  const isFileTypeValid = allowedTypes.test(file.mimetype);
  if (!isFileTypeValid) {
    cb(
      new ErrorHandler(400, "Only JPG, JPEG, and PNG files are allowed"),
      false,
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter,
}).single("receipt");

const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific error
      next(new ErrorHandler(400, "The uploaded file should be under 2MB"));
    } else if (err) {
      // Other errors
      next(err);
    }
    // Proceed if everything is okay
    next();
  });
};

export default uploadMiddleware;
