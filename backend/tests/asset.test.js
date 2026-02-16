import request from 'supertest';
import app from '../src/app.js';
import sequelize from '../src/config/database.js';
import User from '../src/models/User.js';
import Asset from '../src/models/Asset.js';
import AssetItem from '../src/models/AssetItem.js';
import bcrypt from 'bcryptjs';

describe('Asset API', () => {
    let server;
    let token;
    let userId;
    let assetId;

    beforeAll(async () => {
        // Sync database with force to ensure clean state
        await sequelize.sync({ force: true });
        server = app.callback();

        // Create Test User with hashed password
        const hashedPassword = await bcrypt.hash('password', 10);
        const user = await User.create({
            username: 'test_asset_user',
            password: hashedPassword,
            status: 'active'
        });
        userId = user.id;

        // Login to get Token
        const loginRes = await request(server)
            .post('/api/user/login')
            .send({ username: 'test_asset_user', password: 'password' });

        token = loginRes.body.data.token;
    });

    afterAll(async () => {
        // Cleanup
        if (userId) {
            await User.destroy({ where: { id: userId } });
        }
        await sequelize.close();
    });

    test('POST /api/asset/create - Create Asset', async () => {
        const res = await request(server)
            .post('/api/asset/create')
            .set('Authorization', `Bearer ${token}`)
            .send({
                date: '2025-01-01',
                items: [
                    { name: 'Stock', value: 100 },
                    { name: 'Cash', value: 200 }
                ]
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Asset created successfully');
        expect(res.body.assetId).toBeDefined();
        assetId = res.body.assetId;
    });

    test('GET /api/asset/list - List Assets with Subtotal', async () => {
        const res = await request(server)
            .get('/api/asset/list')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.length).toBeGreaterThan(0);

        const asset = res.body.data.find(a => a.id === assetId);
        expect(asset).toBeDefined();
        expect(asset.total).toBe(300); // 100 + 200
        expect(asset.items.length).toBe(2);
    });

    test('GET /api/asset/last-items - Get Last Items', async () => {
        const res = await request(server)
            .get('/api/asset/last-items')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.items).toBeDefined();
        expect(res.body.items.length).toBe(2);
        expect(res.body.items[0].name).toBeDefined();
    });

    test('PUT /api/asset/:id - Update Asset', async () => {
        const res = await request(server)
            .put(`/api/asset/${assetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                date: '2025-01-02',
                items: [
                    { name: 'Stock', value: 150 },
                    { name: 'Cash', value: 250 }
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Asset updated successfully');

        // Verify update
        const listRes = await request(server)
            .get('/api/asset/list')
            .set('Authorization', `Bearer ${token}`);

        const asset = listRes.body.data.find(a => a.id === assetId);
        expect(asset.total).toBe(400); // 150 + 250
        expect(asset.date).toBe('2025-01-02');
    });

    test('DELETE /api/asset/:id - Delete Asset', async () => {
        const res = await request(server)
            .delete(`/api/asset/${assetId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Asset deleted successfully');

        // Verify Deletion
        const checkRes = await Asset.findByPk(assetId);
        expect(checkRes).toBeNull();

        // Check Cascading Deletion
        const items = await AssetItem.findAll({ where: { assetId } });
        expect(items.length).toBe(0);
    });
});
