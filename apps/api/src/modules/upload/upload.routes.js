import { Router }   from 'express';
import multer        from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../../middlewares/auth.js';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = resolve(__dirname, '../../../../../uploads');

// ── Detectar si Cloudinary está configurado ──────────────────────────
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY    &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ── Multer: memoria si va a Cloudinary, disco si es local ────────────
const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOADS_DIR),
      filename:    (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `${uuidv4()}${ext}`);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

const router = Router();

router.post('/', authenticate, upload.single('image'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen' });

  try {
    let url;

    if (useCloudinary) {
      // Subir buffer a Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'storesfast', resource_type: 'image' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      url = result.secure_url;
    } else {
      // Archivo guardado en disco
      url = `/uploads/${req.file.filename}`;
    }

    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;
