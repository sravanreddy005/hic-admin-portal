const sequelize = require('../database/db-config');
const Sequelize = require('sequelize');

const PricesModels = {};

/*********************** Countries schema defining *************************/
PricesModels.Countries = sequelize.define('countries', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  country_name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  country_code: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  }
},
  {
    underscored: true,
    freezeTableName: true,
    tableName: 'countries'
  }
);
/*********************** End of countries schema defining *************************/

/*********************** Carriers schema defining *************************/
PricesModels.Carriers = sequelize.define('carriers', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  carrier_name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  }
},
  {
    underscored: true,
    freezeTableName: true,
    tableName: 'carriers'
  }
);
/*********************** End of carriers schema defining *************************/

/*********************** Carrier country zones schema defining *************************/
PricesModels.CarrierCountryZones = sequelize.define('carrier_country_zones', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  zone: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  country_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  country_code: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  carrier_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
},
  {
    underscored: true,
    freezeTableName: true,
    tableName: 'carrier_country_zones',
    indexes: [
      {
        fields: ['zone']
      },
      {
        fields: ['country_code']
      },
      {
        fields: ['carrier_id']
      },
    ]
  }
);

PricesModels.CarrierCountryZones.belongsTo(PricesModels.Carriers, {foreignKey: 'carrier_id', targetKey: 'id'});

/*********************** End of Carrier country zones schema defining *************************/

/*********************** Prices schema defining *************************/
PricesModels.Prices = sequelize.define('prices', {
  id: {
    type: Sequelize.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true
  },
  carrier_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  zone: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  weight_from: {
    type: Sequelize.DOUBLE
  },
  weight_to: {
    type: Sequelize.DOUBLE
  },
  price_per_kg : {
    type: Sequelize.DOUBLE
  },
  medicine_price_per_kg : {
    type: Sequelize.DOUBLE,
    default: 0
  },
},
  {
    underscored: true,
    freezeTableName: true,
    tableName: 'prices',
    indexes: [
      {
        fields: ['carrier_id']
      },
      {
        fields: ['zone']
      },
      {
        fields: ['weight_from']
      },
      {
        fields: ['weight_to']
      },
      {
        fields: ['price_per_kg']
      },
      {
        fields: ['medicine_price_per_kg']
      },
    ]
  }
);

PricesModels.Prices.belongsTo(PricesModels.Carriers, {foreignKey: 'carrier_id', targetKey: 'id'});

/*********************** End of prices schema defining *************************/

module.exports = PricesModels