const sequelize = require('../database/db-config');
const Sequelize = require('sequelize');
const AdminModels = require('./admin.model');

const StockModels = {};

/*********************** Stock purchases schema defining *************************/
StockModels.StockPurchases = sequelize.define('stock_purchases', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  purchased_date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  stock_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  box_weight: {
    type: Sequelize.STRING,
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT
  },
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'stock_purchases',
  indexes: [
    {
      fields: ['purchased_date']
    },
    {
      fields: ['stock_type']
    },
    {
      fields: ['box_weight']
    },
    {
      fields: ['quantity']
    }
  ]
}
);
/*********************** End of stock purchases schema defining *************************/

/*********************** Stock requests schema defining *************************/
StockModels.StockRequests = sequelize.define('stock_requests', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  branch_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  stock_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  box_weight: {
    type: Sequelize.STRING,
  },
  request_quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  approved_quantity: {
    type: Sequelize.INTEGER
  },
  approved_date: {
    type: Sequelize.DATEONLY
  },
  description: {
    type: Sequelize.TEXT
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
    default: 'PENDING'
  },  
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'stock_requests',
  indexes: [
    {
      fields: ['branch_id']
    },
    {
      fields: ['stock_type']
    },
    {
      fields: ['box_weight']
    },
    {
      fields: ['request_quantity']
    },
    {
      fields: ['approved_quantity']
    },
    {
      fields: ['approved_date']
    },
    {
      fields: ['status']
    }
  ]
}
);

StockModels.StockRequests.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});
/*********************** End of stock requests schema defining *************************/

/*********************** Used stock records schema defining *************************/
StockModels.UsedStock = sequelize.define('used_stock', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  branch_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  stock_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT
  } 
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'used_stock',
  indexes: [
    {
      fields: ['branch_id']
    },
    {
      fields: ['stock_type']
    },
    {
      fields: ['quantity']
    }    
  ]
}
);

StockModels.UsedStock.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});
/*********************** End of used stock records schema defining *************************/

module.exports = StockModels