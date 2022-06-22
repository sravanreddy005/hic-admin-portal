const Sequelize = require('sequelize');

const sequelize = new Sequelize('hic_admin_portal_db', 'root', 'HicAdmin@123', {
  host: process.env.MYSQL_HOST,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
