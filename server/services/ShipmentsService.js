const Sequelize = require('sequelize');
const { getCache, setCache, deleteCache } = require('../helpers/cache');
const winston = require('../helpers/winston');
const { AdminModels, ShipmentModels, PricesModels } = require('../database');
const Op = Sequelize.Op

const cacheData = {
    Shipments: {
        key: 'Shipments',
        time: '24h'
    },
};

class ShipmentsService {

    addShipmentsModelRecordToDB = async (insertData, tableName, bulkCreate = false, cache = true, cacheKeyAddOn = '') => {        
        return new Promise(async(resolve, reject) => {
            try {
                let result;
                if(bulkCreate){
                    result = await ShipmentModels[tableName].bulkCreate(insertData);
                }else{
                    result = await ShipmentModels[tableName].create(insertData);
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

    getShipmentsModelRecordsFromDB(tableName, cache = true, cacheKeyAddOn = '') {
        return new Promise(async (resolve, reject) => {
            try {
                const records = await getCache(cacheData[tableName].key + cacheKeyAddOn);
                if (records && records.length > 0 && cache) {
                    resolve(records);
                } else {
                    let data = await ShipmentModels[tableName].findAll();
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

    getShipmentsModelFilteredRecordsFromDB(tableName, whereData, cache = false, cacheKeyAddOn = '') {
        return new Promise(async (resolve, reject) => {
            try {
                const records = cache ? await getCache(cacheData[tableName].key + cacheKeyAddOn) : [];
                if (cache && records && records.length > 0) {
                    resolve(records);
                } else {
                    let data = await ShipmentModels[tableName].findAll({where: whereData});
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

    getShipmentsModelRecordsWithJoinFromDB(tableName, whereData = '', includeData) {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await ShipmentModels[tableName].findAll({
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

    getShipmentsList(whereData) {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await ShipmentModels.Shipments.findAll({
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
                        },
                        { 
                            model: PricesModels.Carriers, 
                            attributes: ["carrier_name"],
                            required: true, 
                        }, 
                        { 
                            model: PricesModels.Countries, 
                            attributes: ["country_name"],
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

    getShipmentsModelRecordsWithAttributesFromDB(tableName, whereData = '', attributes = '', cache = true, cacheKeyAddOn = '') {
        return new Promise(async (resolve, reject) => {
            try {
                const records = await getCache(cacheData[tableName].key + cacheKeyAddOn);
                if (records && records.length > 0 && cache) {
                    resolve(records);
                } else {
                    let data = await ShipmentModels[tableName].findAll({
                        attributes: attributes,
                        where: whereData
                    });
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

    getOneShipmentsModelRecordWithAttributesFromDB(tableName, whereData = '', attributes = '', includeData = '') {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await ShipmentModels[tableName].findOne({
                    attributes: attributes,
                    where: whereData,
                    include: includeData
                });
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    }

    getOneShipmentsModelRecordFromDB(tableName, whereData) {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await ShipmentModels[tableName].findOne({ 
                    where: whereData,
                    include: [ 
                        { 
                            model: AdminModels.Branches, 
                            attributes: ["branch_name"],
                            required: true, 
                        }, 
                        { 
                            model: PricesModels.Carriers, 
                            attributes: ["carrier_name"],
                            required: true, 
                        }, 
                        { 
                            model: PricesModels.Countries, 
                            attributes: ["country_name"],
                            required: true, 
                        } 
                    ],
                });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    getShipmentsModelRecordsCount(tableName, whereData = '') {
        return new Promise(async (resolve, reject) => {
            try {
                let resp = await ShipmentModels[tableName].count({ 
                    where: whereData
                 });
                resolve(resp);
            } catch (error) {
                reject(error);
            }
        });
    }

    updateShipmentsModelRecordInDB = async (tableName, updateData, whereData, cache = true, cacheKeyAddOn = '') => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await ShipmentModels[tableName].update(updateData, { where: whereData });
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

    deleteShipmentsModelRecordInDB = async (tableName, whereData, cache = true, cacheKeyAddOn = '') => {
        return new Promise(async (resolve, reject) => {
          try {
            const result = await ShipmentModels[tableName].destroy({ where: whereData });
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

module.exports = new ShipmentsService;