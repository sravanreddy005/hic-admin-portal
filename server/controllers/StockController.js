const { validateData } = require('../helpers/common');
const { AdminModels } = require('../database');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const {  
    addStockModelRecordToDB,
    getOneStockModelRecordFromDB,
    getStockModelFilteredRecordsFromDB,
    getStockModelRecordsFromDB,
    updateStockModelRecordInDB, 
    deleteStockModelRecordInDB,
    getStockList,
    getStockModelRecordsWithJoinFromDB,
    getStockModelRecordsCount
} = require('../services/StockService');

/**************************** STOCK PURCHASES ***************************/
/**
 * fetching the stock purchases list 
 */
module.exports.getStockPurchases = async (req, res, next) => {
    try {
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        // let whereData = {};
        // if(req.body.from_date){
        //     let toDate = req.body.to_date ? req.body.to_date : new Date().toISOString().split('T')[0];
        //     whereData.purchased_date = {[Op.between]: [req.body.from_date, toDate]};
        // } 

        let resp = await getStockModelRecordsFromDB('StockPurchases');
        return res.status(200).json({responseCode: 1, message: "success", list: resp});     
    }catch (err) {
        return next(err);
    }
}

/**
 * adding the stock purchases 
 */
 module.exports.addStockPurchases = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.purchased_date && validateData('date', reqBody.purchased_date) &&
            reqBody.stock_type && validateData('alpha', reqBody.stock_type) &&
            reqBody.box_weight &&
            reqBody.quantity && validateData('num', reqBody.quantity)
        ){
            let data = {
                purchased_date: reqBody.purchased_date,
                stock_type: reqBody.stock_type,
                box_weight: reqBody.stock_type === 'BOXES' ? reqBody.box_weight : 'N/A',
                quantity: reqBody.quantity,
                description: reqBody.description ? reqBody.description : ''
            }
            const resp = await addStockModelRecordToDB(data, 'StockPurchases', false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        return next(err);
    }
}
/**
 * updating the stock purchases 
 */
 module.exports.updateStockPurchases = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.purchased_date && validateData('date', reqBody.purchased_date) &&
            reqBody.stock_type && validateData('alpha', reqBody.stock_type) &&
            reqBody.box_weight &&
            reqBody.quantity && validateData('num', reqBody.quantity)
        ){
            let data = {
                purchased_date: reqBody.purchased_date,
                stock_type: reqBody.stock_type,
                box_weight: reqBody.stock_type === 'BOXES' ? reqBody.box_weight : 'N/A',
                quantity: reqBody.quantity,
                description: reqBody.description ? reqBody.description : ''
            }
            const resp = await updateStockModelRecordInDB('StockPurchases', data, {id: reqBody.id});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully updated"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data updating has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        return next(err);
    }
}

/**
 * delete the stock purchases
 */
 module.exports.deleteStockPurchases = async (req, res, next) => {
    try {
        if(req.body.id){
            const resp = await deleteStockModelRecordInDB('StockPurchases', {id: req.body.id});
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
/**************************** END STOCK PURCHASES ***************************/

/**************************** STOCK REQUESTS ***************************/
/**
 * fetching the stock requests list 
 */
module.exports.getStockRequests = async (req, res, next) => {
    try {
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        let whereData = {};
        if(req.body.branch_id){
            whereData.branch_id = req.body.branch_id;
        }else if (req.tokenData.role_type != 'Super-Admin'){
            whereData.branch_id = req.tokenData.branch_id;
            // whereData.created_at = {[Op.gte]: new Date(date[0])};
        }
        if(req.body.from_date){
            let toDate = req.body.to_date ? req.body.to_date : new Date().toISOString().split('T')[0];
            let startedDate = new Date(req.body.from_date);            
            let endDate = new Date(toDate);
            let futureDate = new Date(endDate.setDate(endDate.getDate() + 1));
            whereData.created_at = {[Op.between]: [startedDate, futureDate]};
        }        
        // if(Object.keys(whereData).length === 0){
        //     whereData.created_at = {[Op.gte]: new Date(date[0])};
        // }

        let joinData = [ 
            { 
                model: AdminModels.Branches, 
                attributes: ["branch_name"],
                required: true, 
            } 
        ];

        let resp = await getStockModelRecordsWithJoinFromDB('StockRequests', whereData, joinData);
        return res.status(200).json({responseCode: 1, message: "success", list: resp});     
    }catch (err) {
        return next(err);
    }
}

/**
 * fetching the count of pending stock requests 
 */
 module.exports.getStockRequestsCount = async (req, res, next) => {
    try {
        let daysDuration = req.body && req.body.days_duration ? req.body.days_duration : 90;
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - daysDuration));
        let date = backDate.toISOString().split('T');
        let toDate = new Date().toISOString().split('T')[0];
        let startedDate = new Date(date);            
        let endDate = new Date(toDate);
        let futureDate = new Date(endDate.setDate(endDate.getDate() + 1));

        let whereData1 = {
            status: 'PENDING',
            created_at: {[Op.between]: [startedDate, futureDate]}
        }
        if(req.body.branch_id){
            whereData1.branch_id = req.body.branch_id;
        }else if (req.tokenData.role_type != 'Super-Admin'){
            whereData1.branch_id = req.tokenData.branch_id;
        }
        let pendingStockCount = await getStockModelRecordsCount('StockRequests', whereData1);
        return res.status(200).json({responseCode: 1, message: "success", countData: {pendingStockCount}});      
    }catch (err) {
        return next(err);
    }
}

/**
 * adding the stock requests 
 */
 module.exports.addStockRequests = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.branch_id && validateData('num', reqBody.branch_id) &&
            reqBody.stock_type && validateData('alpha', reqBody.stock_type) &&
            reqBody.box_weight &&
            reqBody.quantity && validateData('num', reqBody.quantity)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                stock_type: reqBody.stock_type,
                box_weight: reqBody.stock_type === 'BOXES' ? reqBody.box_weight : 'N/A',
                request_quantity: reqBody.quantity,
                status: 'PENDING',
                description: reqBody.description ? reqBody.description : ''
            }
            const resp = await addStockModelRecordToDB(data, 'StockRequests', false, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        return next(err);
    }
}

/**
 * updating the stock requests 
 */
 module.exports.updateStockRequests = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.branch_id && validateData('num', reqBody.branch_id) &&
            reqBody.stock_type && validateData('alpha', reqBody.stock_type) &&
            reqBody.box_weight &&
            reqBody.request_quantity && validateData('num', reqBody.request_quantity) &&
            reqBody.approved_quantity && validateData('num', reqBody.approved_quantity) &&
            reqBody.status && validateData('alpha', reqBody.status)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                stock_type: reqBody.stock_type,
                box_weight: reqBody.stock_type === 'BOXES' ? reqBody.box_weight : 'N/A',
                request_quantity: reqBody.quantity,
                approved_quantity: reqBody.approved_quantity,
                approved_date: reqBody.status === 'APPROVED' || reqBody.status === 'REJECTED' ? new Date().toISOString().split('T')[0] : '',
                status: reqBody.status,
                description: reqBody.description ? reqBody.description : ''
            }
            const resp = await updateStockModelRecordInDB('StockRequests', data, {id: reqBody.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully updated"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data updating has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        return next(err);
    }
}

/**
 * delete the stock requests
 */
 module.exports.deleteStockRequests = async (req, res, next) => {
    try {
        if(req.body.id){
            const resp = await deleteStockModelRecordInDB('StockRequests', {id: req.body.id}, false);
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
/**************************** END STOCK REQUESTS ***************************/

/**************************** USED STOCK RECORDS ***************************/
/**
 * fetching the used stock list 
 */
module.exports.getUsedStockList = async (req, res, next) => {
    try {
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        let whereData = {};
        if(req.body.branch_id){
            whereData.branch_id = req.body.branch_id;
        }else if (req.tokenData.role_type != 'Super-Admin'){
            whereData.branch_id = req.tokenData.branch_id;
        }
        if(req.body.from_date){
            let toDate = req.body.to_date ? req.body.to_date : new Date().toISOString().split('T')[0];
            let startedDate = new Date(req.body.from_date);            
            let endDate = new Date(toDate);
            let futureDate = new Date(endDate.setDate(endDate.getDate() + 1));
            whereData.created_at = {[Op.between]: [startedDate, futureDate]};
        } 

        let joinData = [ 
            { 
                model: AdminModels.Branches, 
                attributes: ["branch_name"],
                required: true, 
            } 
        ];

        let resp = await getStockModelRecordsWithJoinFromDB('UsedStock', whereData, joinData);
        return res.status(200).json({responseCode: 1, message: "success", list: resp});     
    }catch (err) {
        return next(err);
    }
}

/**
 * adding the used stock records 
 */
 module.exports.addUsedStockRecords = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.branch_id && validateData('num', reqBody.branch_id) &&
            reqBody.stock_type && validateData('alpha', reqBody.stock_type) &&
            reqBody.quantity && validateData('num', reqBody.quantity)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                stock_type: reqBody.stock_type,
                quantity: reqBody.quantity,
                description: reqBody.description ? reqBody.description : ''
            }
            const resp = await addStockModelRecordToDB(data, 'UsedStock', false, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        return next(err);
    }
}

/**
 * updating the used stock records
 */
 module.exports.updateUsedStockRecords = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.branch_id && validateData('num', reqBody.branch_id) &&
            reqBody.stock_type && validateData('alpha', reqBody.stock_type) &&
            reqBody.quantity && validateData('num', reqBody.quantity)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                stock_type: reqBody.stock_type,
                quantity: reqBody.quantity,
                description: reqBody.description ? reqBody.description : ''
            }
            const resp = await updateStockModelRecordInDB('UsedStock', data, {id: reqBody.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully updated"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data updating has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        return next(err);
    }
}

/**
 * delete the used stock records
 */
 module.exports.deleteUsedStockRecords = async (req, res, next) => {
    try {
        if(req.body.id){
            const resp = await deleteStockModelRecordInDB('UsedStock', {id: req.body.id}, false);
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
/**************************** END USED STOCK RECORDS ***************************/