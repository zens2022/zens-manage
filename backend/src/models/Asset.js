import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Asset = sequelize.define('Asset', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    }
}, {
    timestamps: true,
    tableName: 'assets'
});

Asset.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Asset, { foreignKey: 'userId' });

export default Asset;
