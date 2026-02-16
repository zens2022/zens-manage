import userRepository from '../repositories/userRepository.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

class UserService {
    async authenticate(username, password) {
        const user = await userRepository.findByUsername(username);
        if (user && await bcrypt.compare(password, user.password)) {
            if (user.status === 'disabled') {
                throw new Error('您的帳號已被停用，請聯絡管理員。');
            }
            const token = generateToken(user);
            return {
                id: user.id,
                username: user.username,
                status: user.status,
                token
            };
        }
        return null;
    }

    async getAllUsers(keyword) {
        return await userRepository.findAll(keyword);
    }

    async createUser(userData) {
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }
        return await userRepository.create(userData);
    }

    async updateUser(id, userData) {
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }
        return await userRepository.update(id, userData);
    }

    async changeStatus(id, status) {
        const user = await userRepository.findById(id);
        if (user && user.username === 'admin') {
            throw new Error('管理者帳號 (admin) 不可停用。');
        }
        return await userRepository.updateStatus(id, status);
    }

    async deleteUser(id) {
        const user = await userRepository.findById(id);
        if (user && user.username === 'admin') {
            throw new Error('管理者帳號 (admin) 不可刪除。');
        }
        return await userRepository.delete(id);
    }
}

export default new UserService();
