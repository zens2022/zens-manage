import userService from '../services/userService.js';

class UserController {
    async login(ctx) {
        const { username, password } = ctx.request.body;
        try {
            const user = await userService.authenticate(username, password);
            if (user) {
                ctx.body = { success: true, data: user };
            } else {
                ctx.status = 401;
                ctx.body = { success: false, message: 'Invalid credentials' };
            }
        } catch (err) {
            ctx.status = 400;
            ctx.body = { success: false, message: err.message };
        }
    }

    async list(ctx) {
        const { keyword } = ctx.query;
        const users = await userService.getAllUsers(keyword);
        ctx.body = { success: true, data: users };
    }

    async create(ctx) {
        const data = ctx.request.body;
        try {
            const result = await userService.createUser(data);
            ctx.body = { success: true, data: result };
        } catch (err) {
            ctx.status = 400;
            ctx.body = { success: false, message: err.message };
        }
    }

    async update(ctx) {
        const data = ctx.request.body;
        const { id } = data;
        try {
            await userService.updateUser(id, data);
            ctx.body = { success: true, message: 'User updated' };
        } catch (err) {
            ctx.status = 400;
            ctx.body = { success: false, message: err.message };
        }
    }

    async changeStatus(ctx) {
        const { id, status } = ctx.request.body;
        try {
            await userService.changeStatus(id, status);
            ctx.body = { success: true, message: 'Status updated' };
        } catch (err) {
            ctx.status = 400;
            ctx.body = { success: false, message: err.message };
        }
    }

    async deleteUser(ctx) {
        const { id } = ctx.request.body;
        try {
            await userService.deleteUser(id);
            ctx.body = { success: true, message: 'User deleted' };
        } catch (err) {
            ctx.status = 400;
            ctx.body = { success: false, message: err.message };
        }
    }
}

export default new UserController();
