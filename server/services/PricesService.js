// const mongoose = require('mongoose');
const Sequelize = require('sequelize');
const { getCache, setCache, deleteCache, clearAllCache } = require('../helpers/cache');
const winston = require('../helpers/winston');
const { PricesModels } = require('../database');
const Op = Sequelize.Op

const cacheData = {
    Countries: {
        key: 'Countries',
        time: '24h'
    },
    Carriers: {
        key: 'Carriers',
        time: '24h'
    },
    CarrierCountryZones: {
        key: 'CarrierCountryZones',
        time: '24h'
    },
    Prices: {
        key: 'Prices',
        time: '24h'
    },
};

class PricesService {

    addPricesModelRecordToDB = async (insertData, tableName, bulkCreate = false, cache = true, cacheKeyAddOn = '') => {        
        return new Promise(async(resolve, reject) => {
            try {
                let result;
                if(bulkCreate){
                    result = await PricesModels[tableName].bulkCreate(insertData);
                }else{
                    result = await PricesModels[tableName].create(insertData);
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

    getPricesModelRecordsFromDB(tableName, cache = true, cacheKeyAddOn = '', attributes = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                const records = await getCache(cacheData[tableName].key + cacheKeyAddOn);
                if (records && records.length > 0 && cache) {
                    resolve(records);
                } else {
                    let data = await PricesModels[tableName].findAll({attributes: attributes});
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

    getPricesModelFilteredRecordsFromDB(tableName, whereData, cache = false, cacheKeyAddOn = '', attributes = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                const records = cache ? await getCache(cacheData[tableName].key + cacheKeyAddOn) : [];
                if (cache && records && records.length > 0) {
                    resolve(records);
                } else {
                    let data = await PricesModels[tableName].findAll({where: whereData, attributes: attributes});
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

    getOnePricesModelRecordFromDB(tableName, whereData) {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await PricesModels[tableName].findOne({ where: whereData });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    updatePricesModelRecordInDB = async (tableName, updateData, whereData, cache = true, cacheKeyAddOn = '') => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await PricesModels[tableName].update(updateData, { where: whereData });
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

    deletePricesModelRecordInDB = async (tableName, whereData, cache = true, cacheKeyAddOn = '') => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await PricesModels[tableName].destroy({ where: whereData });
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

module.exports = new PricesService;