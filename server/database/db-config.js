const Sequelize = require('sequelize');

const sequelize = new Sequelize('ngx_a_test', 'root', '', {
  host: process.env.MYSQL_HOST,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;
