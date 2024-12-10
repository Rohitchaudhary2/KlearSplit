import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { ErrorHandler } from "./errorHandler.js";

const __dirname = path.resolve();

// Helper function to create directories if they don't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { "recursive": true });
  }
};

// Function to create a middleware with custom folder and field name
const uploadMiddleware = (folderName, fieldName) => {
  // Configure storage settings for multer
  const storage = multer.diskStorage({
    "destination": (req, file, cb) => {
      const uploadPath = path.join(__dirname, "/uploads", folderName); // Construct the upload directory path
      
      // Ensure the directory exists before storing the file
      ensureDirectoryExists(uploadPath);

      cb(null, uploadPath); // Pass the directory path to multer
    },
    "filename": (req, file, cb) => {
      // Generate a unique file name using timestamp and a random number
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

      cb(
        null,
        `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}` // Construct the file name with its original extension
      );
    }
  });

  // File filter to validate allowed file types
  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png/; // Define allowed file extensions
    const isFileTypeValid = allowedTypes.test(file.mimetype); // Check if the file's MIME type matches the allowed types

    if (!isFileTypeValid) {
      // If the file type is not valid, pass an error to multer
      cb(
        new ErrorHandler(400, "Only JPG, JPEG, and PNG files are allowed"),
        false
      );
    }
    cb(null, true); // If the file type is valid, pass it to multer
  };

  // Explicitly limit file size to 2MB for safety
  const maxFileSize = 2 * 1024 * 1024;

  // Configue multer with storage, file filter, and field name
  const upload = multer({
    storage,
    "limits": {
      "fileSize": maxFileSize
    },
    fileFilter
  }).single(fieldName); // Only allow a single file upload for the specified field

  // Middleware function to handle the upload process
  return (req, res, next) => {
    // Validate Content-Length header
    const contentLength = parseInt(req.headers[ "content-length" ]);

    if (isNaN(contentLength)) {
      return next(new ErrorHandler(411, "Content-Length header is required"));
    }
    if (contentLength > maxFileSize) {
      return next(new ErrorHandler(413, "File size exceeds the maximum limit of 2MB"));
    }
    
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific error (e.g., file size exceeded)
        next(new ErrorHandler(400, "The uploaded file should be under 2MB"));
      } else if (err) {
        // Other errors (e.g., file filter rejection)
        next(err);
      } else {
        // Proceed to the next middleware if the upload was successful
        next();
      }
    });
  };
};

export default uploadMiddleware;
