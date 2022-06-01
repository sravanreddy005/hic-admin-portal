const sequelize = require("./db-config");
const AuthModels = require('../models/auth.model');
const AdminModels = require('../models/admin.model');
const PricesModels = require('../models/prices.model');
const ShipmentModels = require('../models/shipments.model');
const StockModels = require('../models/stock.model');

const synncDB = async() => {
  try {
    await sequelize.sync();
    console.log("DB connected and all models were synchronized successfully.");
  } catch (error) {
    console.log("synchronized failed.", error);
  }  
}

synncDB();

module.exports = { AdminModels, AuthModels, PricesModels, ShipmentModels, StockModels };
