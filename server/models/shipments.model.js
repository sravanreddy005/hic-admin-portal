const sequelize = require('../database/db-config');
const Sequelize = require('sequelize');
const AdminModels = require('./admin.model');
const PricesModels = require('./prices.model');

const ShipmentModels = {};

/*********************** Shipments schema defining *************************/
ShipmentModels.Shipments = sequelize.define('shipments', {
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
  invoice_number: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  reference_number: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  service_type: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  shipment_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  tracking_no1: {
    type: Sequelize.STRING
  },
  tracking_no2: {
    type: Sequelize.STRING
  },
  tracking_no3: {
    type: Sequelize.STRING
  },
  tracking_no4: {
    type: Sequelize.STRING
  },
  destination_country: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  no_of_pieces: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  boxes_details: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  boxes_3kg: {
    type: Sequelize.STRING,
  },
  boxes_5kg: {
    type: Sequelize.STRING,
  },
  boxes_10kg: {
    type: Sequelize.STRING,
  },
  boxes_15kg: {
    type: Sequelize.STRING,
  },
  boxes_custom: {
    type: Sequelize.STRING,
  },
  actual_weight: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  valumetric_weight: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  chargable_weight: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  medicine_shipment: {
    type: Sequelize.STRING,
    allowNull: false
  },
  product_type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  basic_amount: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  commercial_charges_amount: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  jewellery_appraisal_amount: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  pickup_charges_amount: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  packing_charges_amount: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  gst_amount: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  other_amount: {
    type: Sequelize.FLOAT,
  },
  total_amount: {
    type: Sequelize.FLOAT,
    allowNull: false
  },
  mode_of_payment: {
    type: Sequelize.STRING,
    allowNull: false
  },
  transaction_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  sender_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_company_name: {
    type: Sequelize.STRING,
  },
  sender_address1: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_address2: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_address3: {
    type: Sequelize.STRING
  },
  sender_pincode: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_country: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_state: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_city: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_phone_number: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_email: {
    type: Sequelize.STRING
  },
  sender_id_proof_type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_id_proof_number: {
    type: Sequelize.STRING,
    allowNull: false
  },
  sender_phone_number: {
    type: Sequelize.STRING,
    allowNull: false
  },
  receiver_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  receiver_company_name: {
    type: Sequelize.STRING
  },
  receiver_address1: {
    type: Sequelize.STRING,
    allowNull: false
  },
  receiver_address2: {
    type: Sequelize.STRING
  },
  receiver_address3: {
    type: Sequelize.STRING
  },
  receiver_pincode: {
    type: Sequelize.STRING,
    allowNull: false
  },
  receiver_country: {
    type: Sequelize.STRING,
    allowNull: false
  },
  receiver_state: {
    type: Sequelize.STRING,
    allowNull: false
  },
  receiver_city: {
    type: Sequelize.STRING,
    allowNull: false
  },
  receiver_phone_number: {
    type: Sequelize.STRING,
    allowNull: false
  },
  receiver_email: {
    type: Sequelize.STRING
  },
  commodity_list: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  commodity_items_summery: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  remarks: {
    type: Sequelize.TEXT
  },
  kyc_doc: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.BOOLEAN,
    default: 1
  },
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'shipments',
  indexes: [
    {
      fields: ['branch_id']
    },
    {
      fields: ['date']
    },
    {
      fields: ['service_type']
    },
    {
      fields: ['destination_country']
    },
    {
      fields: ['medicine_shipment']
    },
    {
      fields: ['product_type']
    },
    {
      fields: ['mode_of_payment']
    },
    {
      fields: ['transaction_id']
    },
    {
      fields: ['sender_name']
    },
    {
      fields: ['sender_pincode']
    },
    {
      fields: ['sender_phone_number']
    },
    {
      fields: ['receiver_name']
    },
    {
      fields: ['receiver_pincode']
    },
    {
      fields: ['receiver_phone_number']
    },
    {
      fields: ['status']
    },
  ]
}
);

ShipmentModels.Shipments.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});
ShipmentModels.Shipments.belongsTo(PricesModels.Carriers, {foreignKey: 'service_type', targetKey: 'id'});
ShipmentModels.Shipments.belongsTo(PricesModels.Countries, {foreignKey: 'destination_country', targetKey: 'country_code'});
/*********************** End of shipments schema defining *************************/

/*********************** Bank transactions schema defining *************************/
ShipmentModels.BankTransactions = sequelize.define('bank_transactions', {
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
  transaction_date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  transaction_id: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  mode_of_deposit: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  amount: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  transaction_proof: {
    type: Sequelize.STRING
  },  
  status: {
    type: Sequelize.STRING,
    default: 'PENDING',
    allowNull: false
  },
},
{
  underscored: true,
  freezeTableName: true,
  tableName: 'bank_transactions',
  indexes: [
    {
      fields: ['branch_id']
    },
    {
      fields: ['transaction_date']
    },
    {
      fields: ['transaction_id']
    },
    {
      fields: ['mode_of_deposit']
    },
    {
      fields: ['amount']
    },
    {
      fields: ['status']
    }
  ]
}
);
ShipmentModels.BankTransactions.belongsTo(AdminModels.Branches, {foreignKey: 'branch_id', targetKey: 'id'});
/*********************** End of bank transactions schema defining *************************/

module.exports = ShipmentModels