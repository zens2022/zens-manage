import User from '../models/User.js';
import { Op } from 'sequelize';

class UserRepository {
    async findByUsername(username) {
        return await User.findOne({ where: { username } });
    }

    async findById(id) {
        return await User.findByPk(id);
    }

    async create(userData) {
        return await User.create(userData);
    }

    async findAll(search = '') {
        const where = {};
        if (search) {
            where.username = {
                [Op.like]: `%${search}%`
            };
        }
        return await User.findAll({
            where,
            attributes: ['id', 'username', 'status', 'createdAt', 'updatedAt']
        });
    }

    async update(id, userData) {
        const user = await User.findByPk(id);
        if (user) {
            return await user.update(userData);
        }
        return null;
    }

    async updateStatus(id, status) {
        const user = await User.findByPk(id);
        if (user) {
            return await user.update({ status });
        }
        return null;
    }

    async delete(id) {
        const user = await User.findByPk(id);
        if (user) {
            return await user.destroy();
        }
        return null;
    }
}

export default new UserRepository();
