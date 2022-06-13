const { validateData } = require('../helpers/common');
const csv = require('csv-parser');
const fs = require('fs');
const winston = require('../helpers/winston');

const {  
    addPricesModelRecordToDB,
    getOnePricesModelRecordFromDB,
    getPricesModelFilteredRecordsFromDB,
    getPricesModelRecordsFromDB,
    updatePricesModelRecordInDB, 
    deletePricesModelRecordInDB,
} = require('../services/PricesService');

/**************************** COUNTRIES ***************************/

module.exports.uploadCountries = async (req, res, next) => {
    try {        
        let countriesArray = [];
        fs.createReadStream('./server/uploads/countries_csv.csv').pipe(csv())
        .on('data', (data) => {
            const countryData = {
                country_name : data.Name,
                country_code: data.Code,
            }
            countriesArray.push(countryData);
        })
        .on('end', async() => {
            await addPricesModelRecordToDB(countriesArray);              
            res.status(200).json({responseCode: 1, message: "success"});          
        });
    }catch (err) {
        return next(err);
    }
}

/**
 * creating the countries 
 */
 module.exports.addCountries = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.country_name &&
            reqBody.country_code &&
            validateData('alpha', reqBody.country_code)
            (reqBody.country_code).length === 2
        ){
            let data = {
                country_name: reqBody.country_name,
                country_code: reqBody.country_code,
            }
            const resp = await addPricesModelRecordToDB(data, 'Countries');
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details successfully created"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details creating failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        if (err.code == 11000){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : " Country already exists with this name/code"});
        }else{
            return next(err);
        }
    }
}

/**
 * fetching the countries list 
 */
 module.exports.getCountries = async (req, res, next) => {
    try {
        let countriesResp = await getPricesModelRecordsFromDB('Countries');
        return res.status(200).json({responseCode: 1,message: "success", countries: countriesResp});        
    }catch (err) {
        return next(err);
    }
}

/**
 * fetching the countries list 
 */
 module.exports.getCountryDetails = async (countryCode) => {
     return new Promise(async(resolve, reject) => {
        try {
            let whereData = {country_code: countryCode};
            let respData = await getOnePricesModelRecordFromDB('Countries', whereData);
            resolve(respData)
        }catch (err) {
            resolve(null);
        }
     });    
}

/**
 * updating the country details
 */
 module.exports.updateCountries = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.country_id && 
            reqBody.country_name &&
            reqBody.country_code &&
            validateData('alpha', reqBody.country_code)
            (reqBody.country_code).length === 2
        ){
            let updateData = {
                country_name: reqBody.country_name,
                country_code: reqBody.country_code,
            }
            const resp = await updatePricesModelRecordInDB('Countries', updateData, {id: reqBody.country_id});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details updated successfully"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details updating has failed"});
            }            
        }        
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**
 * delete the country 
 */
 module.exports.deleteCountries = async (req, res, next) => {
    try {
        if(req.body.country){
            const countryID = req.body.country;
            const resp = await deletePricesModelRecordInDB('Countries', {id: countryID});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**************************** END COUNTRIES ***************************/

/**************************** CARRIERS ***************************/
/**
 * creating the carriers 
 */
 module.exports.addCarrier = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.carrier_name &&
            validateData('alnumSpecial', reqBody.carrier_name)
        ){
            let data = {
                carrier_name: reqBody.carrier_name,
            }
            const resp = await addPricesModelRecordToDB(data, 'Carriers');
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details successfully created"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details creating failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        if (err.code == 11000){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Carrier already exists with this name/code"});
        }else{
            return next(err);
        }
    }
}

/**
 * fetching the carriers list 
 */
 module.exports.getCarriers = async (req, res, next) => {
    try {
        let resp = await getPricesModelRecordsFromDB('Carriers');
        return res.status(200).json({responseCode: 1,message: "success", carriers: resp});        
    }catch (err) {
        return next(err);
    }
}

/**
 * updating the carrier details
 */
 module.exports.updateCarrier = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id && 
            reqBody.carrier_name &&
            validateData('alnumSpecial', reqBody.carrier_name)
        ){
            let updateData = {
                carrier_name: reqBody.carrier_name,
            }
            const resp = await updatePricesModelRecordInDB('Carriers', updateData, {id: reqBody.id});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details updated successfully"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details updating has failed"});
            }            
        }        
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**
 * delete the carrier
 */
 module.exports.deleteCarrier = async (req, res, next) => {
    try {
        if(req.body.id){
            const carrierID = req.body.id;
            const resp = await deletePricesModelRecordInDB('Carriers', {id: carrierID});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**************************** END CARRIERS ***************************/

/**************************** CARRIER ZONES ***************************/
/**
 * creating the carrier zones 
 */
 module.exports.addCarrierZone = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.zone &&
            reqBody.carrier_id &&
            reqBody.country_name &&
            reqBody.country_code &&
            reqBody.country_code.length === 2 &&
            validateData('alpha', reqBody.carrier_name) &&
            validateData('num', reqBody.zone)
        ){
            let data = {
                zone: reqBody.zone,
                country_name: reqBody.country_name,
                country_code: reqBody.country_code,
                carrier_id: reqBody.carrier_id,
            }
            const resp = await addPricesModelRecordToDB(data, 'CarrierCountryZones', false, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details successfully created"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details creating failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        if (err.code == 11000){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Carrier zone already exists with this name/code"});
        }else{
            return next(err);
        }
    }
}

/**
 * creating the carrier zones 
 */
 module.exports.uploadCarrierZones = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.carrier_id &&
            req.files
        ){
            let zonesArray = [];
            fs.createReadStream(`./server/uploads/carrier-zones/${req.files['carrier_zones_file'][0]['filename']}`).pipe(csv())
            .on('data', (data) => {
                const countryData = {
                    country_name : data.CountryName,
                    country_code: data.CountryCode,
                    zone: data.Zone,
                    carrier_id: reqBody.carrier_id,
                }
                zonesArray.push(countryData);
            })
            .on('end', async() => {                
                let resp = await addPricesModelRecordToDB(zonesArray, 'CarrierCountryZones', true); 
                try {
                    fs.unlinkSync(`./server/uploads/carrier-zones/${req.files['carrier_zones_file'][0]['filename']}`);
                } catch (error) {
                    winston.info({ 'PricesController:: Exception occured while unlink file in uploadCarrierZones method': error.message });
                }                
                if(resp){
                    return res.status(200).json({responseCode: 1, message: "success"});
                } else {
                    return res.status(200).json({responseCode: 0, message: "failure"});
                }                           
            });           
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        if (err.code == 11000){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Carrier zone already exists with this name/code"});
        }else{
            return next(err);
        }
    }
}

/**
 * fetching the carrier zones list 
 */
 module.exports.getCarrierZones = async (req, res, next) => {
    try {
        if(req.body && req.body.carrier_id){
            let resp = await getPricesModelFilteredRecordsFromDB('CarrierCountryZones', {carrier_id: req.body.carrier_id});
            return res.status(200).json({responseCode: 1, message: "success", carrier_zones: resp});
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }        
    }catch (err) {
        return next(err);
    }
}

/**
 * updating the carrier zone details
 */
 module.exports.updateCarrierZone = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id && 
            reqBody.zone &&
            reqBody.carrier_id &&
            reqBody.country_name &&
            reqBody.country_code &&
            reqBody.country_code.length === 2 &&
            validateData('alpha', reqBody.carrier_name) &&
            validateData('num', reqBody.zone)
        ){
            let updateData = {
                zone: reqBody.zone,
                country_name: reqBody.country_name,
                country_code: reqBody.country_code,
                carrier_id: reqBody.carrier_id,
            }
            const resp = await updatePricesModelRecordInDB('CarrierCountryZones', updateData, {id: reqBody.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details updated successfully"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details updating has failed"});
            }            
        }        
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**
 * delete the carrier zone
 */
 module.exports.deleteCarrierZone = async (req, res, next) => {
    try {
        if(req.body.id){
            const carrierZoneID = req.body.id;
            const resp = await deletePricesModelRecordInDB('CarrierCountryZones', {id: carrierZoneID});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**
 * delete all the carrier zones
 */
 module.exports.deleteAllCarrierZones = async (req, res, next) => {
    try {
        if(req.body.id){
            const carrierID = req.body.id;
            const resp = await deletePricesModelRecordInDB('CarrierCountryZones', {carrier_id: carrierID});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**************************** END CARRIER ZONES ***************************/

/**************************** CARRIER PRICES ***************************/
/**
 * creating the carrier price 
 */
 module.exports.addPrice = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.zone &&
            reqBody.carrier_id &&
            reqBody.weight_from &&
            reqBody.weight_to &&
            reqBody.price_per_kg &&
            validateData('float', reqBody.weight_from) &&
            validateData('float', reqBody.weight_to) &&
            validateData('float', reqBody.price_per_kg)
        ){
            let data = {
                zone: reqBody.zone,
                carrier_id: reqBody.carrier_id,
                weight_from: reqBody.weight_from,
                weight_to: reqBody.weight_to,
                price_per_kg: reqBody.price_per_kg,
                medicine_price_per_kg: reqBody.medicine_price_per_kg ? reqBody.medicine_price_per_kg : 0,
            }
            const resp = await addPricesModelRecordToDB(data, 'Prices', false, true, reqBody.carrier_id);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details successfully created"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details creating failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        if (err.code == 11000){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "This prices already exists"});
        }else{
            return next(err);
        }
    }
}

/**
 * creating the carrier prices 
 */
 module.exports.uploadPrices = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.carrier_id &&
            req.files
        ){
            let pricesArray = [];
            let prices = [];
            let i = 0;
            fs.createReadStream(`./server/uploads/prices/${req.files['prices_file'][0]['filename']}`).pipe(csv())
            .on('data', (data) => { 
                prices.push(data)               
                let weightValue = (prices[i].Weight).replace(/\s/g, '');
                let weight;
                let weightFrom;
                let weightTo;
                if(weightValue.includes('-')){
                    weight = weightValue.split('-');
                    weightFrom = weight[0];
                    weightTo = weight[1];
                }else if(weightValue.includes('to')){
                    weight = weightValue.split('to');
                    weightFrom = weight[0];
                    weightTo = weight[1];
                }else{
                    if(i === 0){
                        weightFrom = 0.1;
                    }else{
                        weightFrom = parseFloat(prices[i-1].Weight) + 0.1;
                    }
                    weightTo = weightValue;
                }
                for(let j = 1; j < Object.keys(data).length; j++){
                    let values = {                    
                        zone: j,
                        weight_from : weightFrom,
                        weight_to: weightTo,
                        price_per_kg: data[`${j}`] ? data[`${j}`] : 0,
                        medicine_price_per_kg: 0,
                        carrier_id: reqBody.carrier_id,
                    }
                    pricesArray.push(values);
                }
                i = i + 1;
            })
            .on('end', async() => {
                let resp = await addPricesModelRecordToDB(pricesArray, 'Prices', true, true, reqBody.carrier_id); 
                try {
                    fs.unlinkSync(`./server/uploads/prices/${req.files['prices_file'][0]['filename']}`);
                } catch (error) {
                    winston.info({ 'PricesController:: Exception occured while unlink file in uploadPrices method': error.message });
                }
                if(resp){
                    return res.status(200).json({responseCode: 1, message: "success"});
                } else {
                    return res.status(200).json({responseCode: 0, message: "failure"});
                }                           
            });           
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        if (err.code == 11000){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Prices already exists with this name/code"});
        }else{
            return next(err);
        }
    }
}

/**
 * fetching the carrier prices list 
 */
 module.exports.getPrices = async (req, res, next) => {
    try {
        if(req.body && req.body.carrier_id){
            let resp = await getPricesModelFilteredRecordsFromDB('Prices', {carrier_id: req.body.carrier_id}, true, req.body.carrier_id);
            return res.status(200).json({responseCode: 1, message: "success", prices: resp});
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }        
    }catch (err) {
        return next(err);
    }
}

/**
 * fetching the carrier prices based on zone 
 */
 module.exports.getCarrrierZonePrices = async (req, res, next) => {
    try {
        if(req.body && req.body.carrier_id && req.body.country_code && (req.body.country_code).length === 2){
            let zoneData = await getOnePricesModelRecordFromDB('CarrierCountryZones', {carrier_id: req.body.carrier_id, country_code: req.body.country_code});
            if(zoneData && zoneData.zone){
                let pricesResp = await getPricesModelFilteredRecordsFromDB('Prices', {carrier_id: req.body.carrier_id, zone: zoneData.zone}, false, '', ['carrier_id', 'medicine_price_per_kg', 'price_per_kg', 'weight_from', 'weight_to', 'zone']);
                return res.status(200).json({responseCode: 1, message: "success", prices: pricesResp});
            }else{
                return res.status(200).json({responseCode: 1, message: "success", prices: {}});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }        
    }catch (err) {
        return next(err);
    }
}

/**
 * updating the carrier price details
 */
 module.exports.updatePrice = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.zone &&
            reqBody.carrier_id &&
            reqBody.weight_from &&
            reqBody.weight_to &&
            reqBody.price_per_kg &&
            validateData('float', reqBody.weight_from) &&
            validateData('float', reqBody.weight_to) &&
            validateData('float', reqBody.price_per_kg)
        ){
            let data = {
                zone: reqBody.zone,
                carrier_id: reqBody.carrier_id,
                weight_from: reqBody.weight_from,
                weight_to: reqBody.weight_to,
                price_per_kg: reqBody.price_per_kg,
                medicine_price_per_kg: reqBody.medicine_price_per_kg ? reqBody.medicine_price_per_kg : 0,
            }
            const resp = await updatePricesModelRecordInDB('Prices', data, {id: reqBody.id}, true, reqBody.carrier_id);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details updated successfully"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details updating has failed"});
            }            
        }        
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**
 * delete the carrier price
 */
 module.exports.deletePrice = async (req, res, next) => {
    try {
        if(req.body.id){
            const priceID = req.body.id;
            const carrierID = req.body.carrier_id;
            const resp = await deletePricesModelRecordInDB('Prices', {id: priceID}, true, carrierID);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**
 * delete all the carrier prices
 */
 module.exports.deleteAllPrices = async (req, res, next) => {
    try {
        if(req.body.id){
            const carrierID = req.body.id;
            const resp = await deletePricesModelRecordInDB('Prices', {carrier_id: carrierID}, true, carrierID);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/**************************** END CARRIER PRICES ***************************/