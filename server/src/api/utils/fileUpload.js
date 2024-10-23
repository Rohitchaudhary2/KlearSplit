import path from "path";
import multer from "multer";

const __dirname = path.resolve();

// Set up file filter to validate file type and size
const fileFilter = (req, file, cb) => {
  // Allow only specific file types (e.g., jpg, png, pdf)
  const allowedTypes = /jpg|jpeg|png|pdf/;
  const isFileTypeValid = allowedTypes.test(file.mimetype);

  // Validate file size (for example, limit to 5MB)
  const isFileSizeValid = file.size <= 5 * 1024 * 1024;

  if (isFileTypeValid && isFileSizeValid) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type or file size exceeded limit"), false);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "/public/uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter,
});
