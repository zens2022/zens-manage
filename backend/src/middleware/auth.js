import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'zens-manage-secret';

export const authMiddleware = async (ctx, next) => {
    // 僅針對 /api 開頭的請求進行驗證
    if (!ctx.path.startsWith('/api')) {
        return await next();
    }

    // 免登入白名單
    const publicPaths = ['/api/user/login'];
    if (publicPaths.includes(ctx.path)) {
        return await next();
    }

    const token = ctx.header.authorization?.replace('Bearer ', '');

    if (!token) {
        ctx.status = 401;
        ctx.body = { success: false, message: 'Authentication required' };
        return;
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        ctx.state.user = decoded;
        await next();
    } catch (err) {
        ctx.status = 401;
        ctx.body = { success: false, message: 'Invalid or expired token' };
    }
};

export const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username },
        SECRET_KEY,
        { expiresIn: '24h' }
    );
};
