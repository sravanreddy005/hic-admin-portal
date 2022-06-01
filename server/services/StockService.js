// const mongoose = require('mongoose');
const Sequelize = require('sequelize');
const { getCache, setCache, deleteCache, clearAllCache } = require('../helpers/cache');
const winston = require('../helpers/winston');
const { StockModels, AdminModels } = require('../database');
const Op = Sequelize.Op

const cacheData = {
    StockPurchases: {
        key: 'StockPurchases',
        time: '24h'
    },
};

class StockService {

    addStockModelRecordToDB = async (insertData, tableName, bulkCreate = false, cache = true, cacheKeyAddOn = '') => {        
        return new Promise(async(resolve, reject) => {
            try {
                let result;
                if(bulkCreate){
                    result = await StockModels[tableName].bulkCreate(insertData);
                }else{
                    result = await StockModels[tableName].create(insertData);
                }    
                if(result){
                    if(cache){
                        await deleteCache(cacheData[tableName].key + cacheKeyAddOn);
                    }
                    resolve(true);
                }else{
                    resolve(false);
                }
            } catch (error) {
                winston.info({ [`Exception occured while inserting record to ${tableName} table::`]: JSON.stringify(error) });
                reject(error);
            }
        });
    };

    getStockModelRecordsFromDB(tableName, cache = true, cacheKeyAddOn = '') {
        return new Promise(async (resolve, reject) => {
            try {
                const records = await getCache(cacheData[tableName].key + cacheKeyAddOn);
                if (records && records.length > 0 && cache) {
                    resolve(records);
                } else {
                    let data = await StockModels[tableName].findAll();
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

    getStockModelFilteredRecordsFromDB(tableName, whereData, cache = false, cacheKeyAddOn = '') {
        return new Promise(async (resolve, reject) => {
            try {
                const records = cache ? await getCache(cacheData[tableName].key + cacheKeyAddOn) : [];
                if (cache && records && records.length > 0) {
                    resolve(records);
                } else {
                    let data = await StockModels[tableName].findAll({where: whereData, order: [['created_at', 'DESC']]});
                    if(cache){
                        await setCache(data, cacheData[tableName].key + cacheKeyAddOn, cacheData[tableName].time);
                    }
                    resolve(data);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    getStockModelRecordsWithJoinFromDB(tableName, whereData = '', includeData) {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await StockModels[tableName].findAll({
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

    getStockModelRecordsCount(tableName, whereData = '') {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await StockModels[tableName].count({ 
                    where: whereData
                 });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    getStockList(whereData) {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await StockModels.Stock.findAll({
                    where: {
                        ...whereData,
                        status: 1,
                    },
                    order: [
                        ['date', 'DESC']
                    ],
                    include: [ 
                        { 
                            model: AdminModels.Branches, 
                            attributes: ["branch_name"],
                            required: true, 
                        } 
                    ],
                   });
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    }

    getOneStockModelRecordFromDB(tableName, whereData) {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await StockModels[tableName].findOne({ where: whereData });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    updateStockModelRecordInDB = async (tableName, updateData, whereData, cache = true, cacheKeyAddOn = '') => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await StockModels[tableName].update(updateData, { where: whereData });
            if(cache){
                await deleteCache(cacheData[tableName].key + cacheKeyAddOn);
            }
            resolve({ success: true });
          } catch (error) {
            winston.info({ [`Exception occured while updating record to ${tableName} table::`]: error });
            reject({ error });
          }
        });
    };

    deleteStockModelRecordInDB = async (tableName, whereData, cache = true, cacheKeyAddOn = '') => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await StockModels[tableName].destroy({ where: whereData });
            if(cache){
                await deleteCache(cacheData[tableName].key + cacheKeyAddOn);
            }
            resolve({ success: true });
          } catch (error) {
            winston.info({ [`Exception occured while deleting record from ${tableName} table::`]: error });
            reject({ error });
          }
        });
    };

}

module.exports = new StockService;