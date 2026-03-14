import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes    from './modules/auth/auth.routes.js';
import storeRoutes   from './modules/stores/store.routes.js';
import productRoutes from './modules/products/product.routes.js';
import uploadRoutes  from './modules/upload/upload.routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// Servir imágenes subidas como archivos estáticos
app.use('/uploads', express.static(resolve(__dirname, '../../../uploads')));

// Rutas
app.use('/api/auth',                    authRoutes);
app.use('/api/stores',                  storeRoutes);
app.use('/api/stores/:slug/products',   productRoutes);
app.use('/api/upload',                  uploadRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
