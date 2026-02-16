import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import sequelize from '../src/config/database.js';
import bcrypt from 'bcryptjs';

describe('User API', () => {
    let server;
    let adminToken;
    let createdUserId;

    beforeAll(async () => {
        // Sync database with force to ensure clean state
        await sequelize.sync({ force: true });
        server = app.callback();

        // Create an admin user with hashed password
        const hashedPassword = await bcrypt.hash('password', 10);
        await User.create({
            username: 'admin_test',
            password: hashedPassword,
            status: 'active'
        });

        // Login as admin to get token
        const loginRes = await request(server)
            .post('/api/user/login')
            .send({
                username: 'admin_test',
                password: 'password'
            });
        adminToken = loginRes.body.data.token;
    });

    afterAll(async () => {
        // Cleanup
        if (createdUserId) {
            await User.destroy({ where: { id: createdUserId } });
        }
        await User.destroy({ where: { username: 'admin_test' } });
        await sequelize.close();
    });

    test('should list users (GET /api/user/list)', async () => {
        const res = await request(server)
            .get('/api/user/list')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should create a user (POST /api/user/create)', async () => {
        const res = await request(server)
            .post('/api/user/create')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'testuser_es6',
                password: 'password123',
                status: 'active'
            });
        expect(res.status).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.username).toEqual('testuser_es6');
        createdUserId = res.body.data.id;
    });

    test('should login (POST /api/user/login)', async () => {
        const res = await request(server)
            .post('/api/user/login')
            .send({
                username: 'testuser_es6',
                password: 'password123'
            });
        expect(res.status).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });

    test('should update user (POST /api/user/update)', async () => {
        const res = await request(server)
            .post('/api/user/update')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                id: createdUserId,
                username: 'testuser_es6_updated'
            });
        expect(res.status).toEqual(200);
        expect(res.body.success).toBe(true);
    });

    test('should change status (POST /api/user/change-status)', async () => {
        const res = await request(server)
            .post('/api/user/change-status')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                id: createdUserId,
                status: 'disabled'
            });
        expect(res.status).toEqual(200);
        expect(res.body.success).toBe(true);
    });

    test('should prevent disabled user login (POST /api/user/login)', async () => {
        const res = await request(server)
            .post('/api/user/login')
            .send({
                username: 'testuser_es6_updated',
                password: 'password123'
            });
        expect(res.status).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('停用');
    });

    test('should delete user (POST /api/user/delete)', async () => {
        const res = await request(server)
            .post('/api/user/delete')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                id: createdUserId
            });
        expect(res.status).toEqual(200);
        expect(res.body.success).toBe(true);

        createdUserId = null; // Mark as deleted
    });
});
