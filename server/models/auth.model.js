const sequelize = require('../database/db-config');
const Sequelize = require('sequelize');

const AuthModels = {};

/*********************** ResetPasswordRecords schema defining *************************/
AuthModels.ResetPasswordRecords = sequelize.define('reset_password_records', {
    id: {
        type: Sequelize.INTEGER,
        unique: true,
        autoIncrement: true,
        primaryKey: true
    },
    user_type: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        }
    },
    token: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    token_sent_on: {
        type: Sequelize.DATE,
        default: new Date()
    },
    token_expiry: {
        type: Sequelize.DATE
    },
    reset_status: {
        type: Sequelize.BOOLEAN,
        default: false
    },
    reset_on: {
        type: Sequelize.DATE,
        allowNull: true,
        default: null
    }
},
    {
        underscored: true,
        freezeTableName: true,
        tableName: 'reset_password_records',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['email']
            },
            {
                fields: ['token_expiry']
            },
            {
                fields: ['token_sent_on']
            },
            {
                fields: ['reset_status']
            },
            {
                fields: ['reset_on']
            },
        ]
    }
);

/*********************** End of reset password records schema defining *************************/

/*********************** DB scema for access & refresh token records *************************/
AuthModels.TokenRecords = sequelize.define('token_records', {
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    access_token: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
    refresh_token: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    active: {
        type: Sequelize.BOOLEAN,
        default: 1
    }
}, {
    underscored: true,
    freezeTableName: true,
    tableName: 'token_records',
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['refresh_token']
        },
        {
            fields: ['active']
        }
    ]
});
/*********************** End of access & refresh token records schema defining *************************/



module.exports = AuthModels;