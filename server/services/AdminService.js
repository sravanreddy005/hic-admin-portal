// const mongoose = require('mongoose');
const Sequelize = require('sequelize');
const { getCache, setCache, deleteCache, clearAllCache } = require('../helpers/cache');
const winston = require('../helpers/winston');
const { AdminModels } = require('../database');
const Op = Sequelize.Op

const {
    AdminRoles,
    Modules,
    Admin,
} = require('../models/admin.model');

const cacheData = {
    Modules: {
        key: 'Modules',
        time: '24h'
    },
    RoleTypes: {
        key: 'RoleTypes',
        time: '24h'
    },
    Roles: {
        key: 'Roles',
        time: '24h'
    },
    Admin: {
        key: 'Admin',
        time: '24h'
    },
    Branches: {
        key: 'Branches',
        time: '24h'
    },
    Commodities: {
        key: 'Commodities',
        time: '24h'
    },
};

class AdminService {

    /******************* COMMON METHODS *******************/
    addRecordToDB = async (insertData, tableName, cache = true) => {
        return new Promise(async(resolve, reject) => {
            try {
                let result = await AdminModels[tableName].create(insertData);
                if(result){
                    if(cache){
                        await deleteCache(cacheData[tableName].key);
                    }
                    resolve(true);
                }else{
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }
        });
    };

    addBulkRecordsToDB = async (insertData, tableName, cache = true) => {
        return new Promise(async(resolve, reject) => {
            try {
                let result = await AdminModels[tableName].bulkCreate(insertData);
                if(result){
                    if(cache){
                        await deleteCache(cacheData[tableName].key);
                    }
                    resolve(true);
                }else{
                    resolve(false);
                }
            } catch (error) {
                reject(error);
            }            
        });
    };

    getRecordsFromDB(tableName, cache = true, whereData = null) {
        return new Promise(async (resolve, reject) => {
            try {
                const records = cache ? await getCache(cacheData[tableName].key) : null;
                if (cache && records && records.length > 0) {
                    resolve(records);
                } else {
                    let data = await AdminModels[tableName].findAll({where: whereData});
                    if(cache){
                        await setCache(data, cacheData[tableName].key, cacheData[tableName].time);
                    }
                    resolve(data);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    getRecordsWithJoinFromDB(tableName, whereData = '', includeData, attributes = '') {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await AdminModels[tableName].findAll({
                    attributes: attributes,
                    where: whereData,
                    order: [['created_at', 'DESC']],
                    include: includeData,
                });
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    }

    getOneRecordFromDB(tableName, whereData) {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await AdminModels[tableName].findOne({ where: whereData });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    getOneRecordWithJoinFromDB(tableName, whereData, includeData) {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await AdminModels[tableName].findOne({ 
                    where: whereData,
                    include: includeData,
                 });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    getRecordsCount(tableName, whereData = '') {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await AdminModels[tableName].count({ 
                    where: whereData
                 });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    updateRecordInDB = async (tableName, updateData, whereData, cache = true) => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await AdminModels[tableName].update(updateData, { where: whereData });
            if(cache){
                await deleteCache(cacheData[tableName].key);
            }
            resolve({ success: true });
          } catch (error) {
            reject(error);
          }
        });
    };

    deleteRecordInDB = async (tableName, whereData, cache = true) => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await AdminModels[tableName].destroy({ where: whereData });
            if(cache){
                await deleteCache(cacheData[tableName].key);
            }
            resolve({ success: true });
          } catch (error) {
            reject(error);
          }
        });
    };

    deleteAllRecordInDB = async (tableName, whereData = '', cache = true) => {
        return new Promise(async (resolve, reject) => {
          try {
            let result;
            if(whereData){
                result = await AdminModels[tableName].destroy({ where: whereData });
            }else{
                result = await AdminModels[tableName].destroy({ truncate: true });
            }            
            if(cache){
                await deleteCache(cacheData[tableName].key);
            }
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });
    };
    /******************* END COMMON METHODS *******************/

}

module.exports = new AdminService;