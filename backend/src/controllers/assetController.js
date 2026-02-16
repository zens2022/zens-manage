import Asset from '../models/Asset.js';
import AssetItem from '../models/AssetItem.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';

class AssetController {
    async create(ctx) {
        const { date, items } = ctx.request.body;
        const userId = ctx.state.user.id; // From authMiddleware

        if (!date || !items || !Array.isArray(items) || items.length === 0) {
            ctx.status = 400;
            ctx.body = { error: 'Date and items are required' };
            return;
        }

        const t = await sequelize.transaction();

        try {
            const asset = await Asset.create({
                date,
                userId
            }, { transaction: t });

            const assetItems = items.map(item => ({
                assetId: asset.id,
                name: item.name,
                value: item.value || 0
            }));

            await AssetItem.bulkCreate(assetItems, { transaction: t });

            await t.commit();

            ctx.status = 201;
            ctx.body = { message: 'Asset created successfully', assetId: asset.id };
        } catch (error) {
            await t.rollback();
            console.error('Create asset error:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    }

    async list(ctx) {
        const { page = 1, limit = 10, userId } = ctx.query;
        const currentUserId = ctx.state.user.id;
        const currentUsername = ctx.state.user.username;
        const isAdmin = currentUsername === 'admin';

        // Default to current user if not admin and no userId provided, or strictly filter by current user if not admin
        // Requirement: "User filter data function, default filter is current login user"
        let where = {};
        if (userId) {
            where.userId = userId;
        } else {
            where.userId = currentUserId; // Default
        }

        // If not admin and trying to view another user's data -> policy check? 
        // Requirement says "Regular users only see their own data" in conversation summary, 
        // but user request here says "user filter data function". 
        // I will assume Admin can filter any, User can only see their own.

        if (!isAdmin && where.userId != currentUserId) {
            // Force to own data
            where.userId = currentUserId;
        }

        const offset = (page - 1) * limit;

        try {
            const { count, rows } = await Asset.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'username']
                    },
                    {
                        model: AssetItem,
                        as: 'items',
                        attributes: ['id', 'name', 'value']
                    }
                ],
                order: [['date', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                distinct: true // Important for correct count when including hasMany
            });

            // Calculate total dynamically
            const data = rows.map(asset => {
                const total = asset.items.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
                return {
                    ...asset.toJSON(),
                    total
                };
            });

            ctx.body = {
                data,
                total: count,
                page: parseInt(page),
                limit: parseInt(limit)
            };
        } catch (error) {
            console.error('List asset error:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    }

    async update(ctx) {
        const { id } = ctx.params;
        const { date, items } = ctx.request.body;
        const userId = ctx.state.user.id;
        const isAdmin = ctx.state.user.username === 'admin';

        const t = await sequelize.transaction();

        try {
            const asset = await Asset.findByPk(id);

            if (!asset) {
                ctx.status = 404;
                ctx.body = { error: 'Asset not found' };
                await t.rollback();
                return;
            }

            if (asset.userId !== userId && !isAdmin) {
                ctx.status = 403;
                ctx.body = { error: 'Permission denied' };
                await t.rollback();
                return;
            }

            if (date) {
                asset.date = date;
                await asset.save({ transaction: t });
            }

            if (items && Array.isArray(items)) {
                // Strategy: Delete all existing items and recreate (simpler for this scale) or upset.
                // Requirement: "Edit... set each item's value at that time"
                // Let's replace all items to ensure sync.
                await AssetItem.destroy({ where: { assetId: id }, transaction: t });

                const assetItems = items.map(item => ({
                    assetId: id,
                    name: item.name,
                    value: item.value || 0
                }));

                await AssetItem.bulkCreate(assetItems, { transaction: t });
            }

            await t.commit();
            ctx.body = { message: 'Asset updated successfully' };

        } catch (error) {
            await t.rollback();
            console.error('Update asset error:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    }

    async delete(ctx) {
        const { id } = ctx.params;
        const userId = ctx.state.user.id;
        const isAdmin = ctx.state.user.username === 'admin';

        try {
            const asset = await Asset.findByPk(id);

            if (!asset) {
                ctx.status = 404;
                ctx.body = { error: 'Asset not found' };
                return;
            }

            if (asset.userId !== userId && !isAdmin) {
                ctx.status = 403;
                ctx.body = { error: 'Permission denied' };
                return;
            }

            await asset.destroy();
            ctx.body = { message: 'Asset deleted successfully' };

        } catch (error) {
            console.error('Delete asset error:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    }

    // Helper to get the last asset items for the current user to pre-fill the form
    async getLastItems(ctx) {
        const userId = ctx.state.user.id;

        try {
            const lastAsset = await Asset.findOne({
                where: { userId },
                order: [['date', 'DESC']],
                include: [{
                    model: AssetItem,
                    as: 'items',
                    attributes: ['name']
                }]
            });

            if (lastAsset) {
                // Return unique item names
                const itemNames = [...new Set(lastAsset.items.map(item => item.name))];
                // Construct object structure for frontend form
                const items = itemNames.map(name => ({ name, value: '' }));
                ctx.body = { items };
            } else {
                ctx.body = { items: [] };
            }

        } catch (error) {
            console.error('Get last items error:', error);
            ctx.status = 500;
            ctx.body = { error: 'Internal server error' };
        }
    }
}

export default new AssetController();
