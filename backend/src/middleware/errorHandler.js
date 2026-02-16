export const errorHandler = async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
            success: false,
            message: err.message || 'Internal Server Error'
        };
        // Log error
        console.error(`[Error] ${ctx.method} ${ctx.path}:`, err);
    }
};
