import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import path from 'path';
import fs from 'fs';
import serve from 'koa-static';
import { fileURLToPath } from 'url';
import cors from '@koa/cors';
import bcrypt from 'bcryptjs';

import userRoutes from './routes/userRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import sequelize from './config/database.js';
import User from './models/User.js';
import Asset from './models/Asset.js';
import AssetItem from './models/AssetItem.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();

app.use(cors());
app.use(errorHandler);
app.use(bodyParser());

// Serve static files
app.use(serve(path.join(__dirname, '../public')));

// Global Auth Middleware
app.use(authMiddleware);

const router = new Router();
router.use(userRoutes.routes());
router.use(assetRoutes.routes());
app.use(router.routes()).use(router.allowedMethods());

// Initial Admin User & DB Sync
const initDB = async () => {
    try {
        await sequelize.sync();
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (!admin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword,
                status: 'active'
            });
            console.log('Default admin user created');
        }
        console.log('Database synced successfully');
    } catch (err) {
        console.error('Database sync failed:', err);
    }
};

if (process.env.NODE_ENV !== 'test') {
    initDB();
}

// Fallback to index.html for SPA routing
app.use(async (ctx, next) => {
    if (ctx.path.startsWith('/api')) {
        await next();
        return;
    }
    const indexFile = path.join(__dirname, '../public/index.html');
    if (fs.existsSync(indexFile)) {
        ctx.type = 'html';
        ctx.body = fs.createReadStream(indexFile);
    } else {
        await next();
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
