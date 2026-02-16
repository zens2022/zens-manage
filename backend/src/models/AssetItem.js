import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Asset from './Asset.js';

const AssetItem = sequelize.define('AssetItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    assetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Asset,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.FLOAT, // Using FLOAT to support decimals if needed, though usually integer for currency
        allowNull: false,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'asset_items'
});

Asset.hasMany(AssetItem, { foreignKey: 'assetId', as: 'items', onDelete: 'CASCADE' });
AssetItem.belongsTo(Asset, { foreignKey: 'assetId' });

export default AssetItem;
