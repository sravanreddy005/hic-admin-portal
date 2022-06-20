const { Admin } = require('../models/admin.model');
const winston = require('../helpers/winston');
const { ResetPasswordRecords, TokenRecords } = require('../models/auth.model');
const { AuthModels } = require('../database');
const Sequelize = require('sequelize');

class AuthService {
    getOneAuthRecordFromDB(tableName, whereData, attributes = []) {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await AuthModels[tableName].findOne({ where: whereData });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    getAuthRecordsFromDB(tableName, whereData = {}, attributes = [], limit = '') {
        return new Promise(async (resolve, reject) => {
            try {
                let conditions = {
                    where: whereData,
                    attributes: attributes,                    
                };
                if(limit){
                    conditions.limit = limit;
                }
                conditions.order = [['id', 'DESC']];
                let data = await AuthModels[tableName].findAll(conditions);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    }

    addAuthRecordToDB = async (insertData, tableName) => {
        return new Promise((resolve, reject) => {
            AuthModels[tableName].create(insertData)
            .then((data) => {
                return { success: true };
            })
            .then(async(result) => {
                resolve(result);
            })
            .catch((error) => {
                winston.info({ [`Exception occured while inserting record to ${tableName} table::`]: JSON.stringify(error) });
                reject(error);
            });
        });
    };

    updateAuthRecordInDB = async (tableName, updateData, whereData) => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await AuthModels[tableName].update(updateData, { where: whereData });
            resolve({ success: true });
          } catch (error) {
            winston.info({ [`Exception occured while updating record to ${tableName} table::`]: error });
            reject({ error });
          }
        });
    };

    deleteAuthRecordInDB = async (tableName, whereData) => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await AuthModels[tableName].destroy({ where: whereData });
            if(result > 0){
                resolve(true);
            }else{
                resolve(false);
            }            
          } catch (error) {
            winston.info({ [`Exception occured while deleting record from ${tableName} table::`]: error });
            reject({ error });
          }
        });
    };

    register(req){                
        return new Promise((resolve, reject) => {
            const admin = new Admin();
            admin.first_name = req.body.firstName;
            admin.last_name = req.body.lastName;
            admin.email = req.body.email;
            admin.setPassword(req.body.password);
            admin.active = true;
            admin.created_at = new Date();
            admin.modified_at = new Date();
            admin.save((error, data) => {
                if (!error){
                    const token = admin.generateJwt();
                    resolve(token);
                }else{
                    reject(error);
                }
            });
        });
    }

    expireTokenOldRecords(id, activeTokenRecords){                
        return new Promise(async(resolve, reject) => { 
            try {
                let exceptTokens = activeTokenRecords.map(value => value.access_token);
                const result = await AuthModels.TokenRecords.destroy({ where: { user_id: id, access_token: {[Sequelize.Op.notIn] : exceptTokens} } });
                resolve(true);
            } catch (error) {
                reject(error); 
            }
        });
    }

    getAccessTokenStatus(accessToken) {
        return new Promise(async (resolve, reject) => {
            const query = { 'access_token': accessToken }
            const projection = { _id: 0, active: 1 }
            const options = { limit: 1 }
            TokenRecords.findOne(query, projection, options).exec(async (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            })
        });
    }

    getAccessToken(id, accessToken, refreshToken) {
        return new Promise(async (resolve, reject) => {
            const query = { 'user_id': clientID,'access_token': accessToken, 'refresh_token': refreshToken, 'active': true }
            const projection = { _id: 0, active: 1 }
            const options = { limit: 1 }
            TokenRecords.findOne(query, projection, options).exec(async (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            })
        });
    }

    addResetPasswordRecord(resetPasswordReq){                
        return new Promise((resolve, reject) => {  
            resetPasswordReq.save((error, data) => {
                if (!error){
                    resolve(data);
                }else{
                    reject(error);
                }
            });
        });
    }

    

    expireResetOldRecords(user_type, email){                
        return new Promise((resolve, reject) => { 
            const setData = {token_expiry: new Date()}
            const query = {'user_type': user_type, 'email': email, token_expiry: { $gte: new Date() }};
            ResetPasswordRecords.findOneAndUpdate(query, { $set: setData }, (error, data) => {
                if (error) {
                    reject(error);          
                } else {
                    resolve(true)
                }
            });
        });
    }
    
}

module.exports = new AuthService;