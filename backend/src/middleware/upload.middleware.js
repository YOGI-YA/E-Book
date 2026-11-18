import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve('public', 'temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const mediaFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = [
    // Photos
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.avif',
    // Videos
    '.mp4',
    '.mov',
    '.webm',
    '.mkv',
    '.avi',
  ];

  if (
    allowedExt.includes(ext) ||
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    cb(
      new Error('Only image and video files are supported (jpg, png, webp, mp4, mov, webm, etc.)'),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for photos and vlog video clips
  fileFilter: mediaFilter,
});

export default upload;
