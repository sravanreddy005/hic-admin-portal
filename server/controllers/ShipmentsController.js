const { validateData, sendWhatsappMessage } = require('../helpers/common');
const { AdminModels } = require('../database');
const winston = require('../helpers/winston');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const {  
    addShipmentsModelRecordToDB,
    getOneShipmentsModelRecordFromDB,
    getShipmentsModelFilteredRecordsFromDB,
    getShipmentsModelRecordsFromDB,
    updateShipmentsModelRecordInDB, 
    deleteShipmentsModelRecordInDB,
    getShipmentsList,
    getShipmentsModelRecordsWithJoinFromDB,
    getShipmentsModelRecordsWithAttributesFromDB,
    getShipmentsModelRecordsCount,
    getOneShipmentsModelRecordWithAttributesFromDB
} = require('../services/ShipmentsService');

/**************************** SHIPMENTS ***************************/
/**
 * adding the shipments 
 */
 module.exports.addShipment = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.branch &&
            reqBody.invoice_number &&
            reqBody.date &&
            reqBody.service_type &&            
            reqBody.destination_country && validateData('alpha', reqBody.destination_country) && (reqBody.destination_country).length === 2 &&
            reqBody.no_of_pieces && validateData('num', reqBody.no_of_pieces) &&
            reqBody.actual_weight && validateData('float', reqBody.actual_weight) &&
            reqBody.valumetric_weight && validateData('float', reqBody.valumetric_weight) &&
            reqBody.chargable_weight && validateData('float', reqBody.chargable_weight) &&
            reqBody.medicine_shipment &&
            reqBody.product_type &&
            reqBody.basic_amount && validateData('float', reqBody.basic_amount) &&
            reqBody.total_amount && validateData('float', reqBody.total_amount) &&
            reqBody.mode_of_payment && validateData('alpha', reqBody.mode_of_payment) &&            
            reqBody.sender_name && validateData('alnumSpecial', reqBody.sender_name) &&
            reqBody.sender_address1 && validateData('nonHTML', reqBody.sender_address1) &&
            reqBody.sender_pincode && validateData('pincode', reqBody.sender_pincode) &&
            reqBody.sender_phone_number && validateData('mobile', reqBody.sender_phone_number) &&
            reqBody.sender_id_proof_type && validateData('alpha', reqBody.sender_id_proof_type) &&
            reqBody.sender_id_proof_number && validateData('alnumSpecial', reqBody.sender_id_proof_number) &&
            reqBody.receiver_name && validateData('alnumSpecial', reqBody.receiver_name) &&
            reqBody.receiver_address1 && validateData('nonHTML', reqBody.receiver_address1) &&
            reqBody.receiver_pincode &&
            reqBody.receiver_phone_number &&
            reqBody.commodity_list &&
            reqBody.commodity_items_summery
        ){
            if(reqBody.mode_of_payment !== 'CASH' && (!reqBody.transaction_id || validateData('nonHTML', reqBody.transaction_id))){
                return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
            }
            let data = {
                branch_id: reqBody.branch,
                invoice_number: reqBody.invoice_number,
                reference_number: Date.now(),
                date: reqBody.date,
                service_type: reqBody.service_type,
                destination_country: reqBody.destination_country,
                no_of_pieces: reqBody.no_of_pieces,
                boxes_3kg: reqBody.boxes_3kg ? reqBody.boxes_3kg : 0,
                boxes_5kg: reqBody.boxes_5kg ? reqBody.boxes_5kg : 0,
                boxes_10kg: reqBody.boxes_10kg ? reqBody.boxes_10kg : 0,
                boxes_15kg: reqBody.boxes_15kg ? reqBody.boxes_15kg : 0,
                boxes_custom: reqBody.boxes_custom ? reqBody.boxes_custom : 0,
                custom_box_dimentions: reqBody.custom_box_dimentions ? reqBody.custom_box_dimentions : '',
                actual_weight: reqBody.actual_weight,
                valumetric_weight: reqBody.valumetric_weight,
                chargable_weight: reqBody.chargable_weight, 
                medicine_shipment: reqBody.medicine_shipment,     
                product_type: reqBody.product_type,
                basic_amount: reqBody.basic_amount,
                gst_amount: reqBody.gst_amount ? reqBody.gst_amount : (reqBody.basic_amount * 18) / 100,
                other_amount: reqBody.other_amount ? reqBody.other_amount : 0,
                total_amount: reqBody.total_amount,
                mode_of_payment: reqBody.mode_of_payment,
                transaction_id: reqBody.transaction_id ? reqBody.transaction_id : '',
                sender_name: reqBody.sender_name,
                sender_company_name: reqBody.sender_company_name ? reqBody.sender_company_name : '',
                sender_address1: reqBody.sender_address1,
                sender_address2: reqBody.sender_address2,
                sender_address3: reqBody.sender_address3 ? reqBody.sender_address3 : '',
                sender_pincode: reqBody.sender_pincode,
                sender_country: 'IN',
                sender_state: reqBody.sender_state,
                sender_city: reqBody.sender_city,
                sender_phone_number: reqBody.sender_phone_number,
                sender_email: reqBody.sender_email ? reqBody.sender_email : '',
                sender_id_proof_type: reqBody.sender_id_proof_type,
                sender_id_proof_number: reqBody.sender_id_proof_number,
                receiver_name: reqBody.receiver_name,
                receiver_company_name: reqBody.receiver_company_name ? reqBody.receiver_company_name : '',
                receiver_address1: reqBody.receiver_address1,
                receiver_address2: reqBody.receiver_address2,
                receiver_address3: reqBody.receiver_address3 ? reqBody.receiver_address3 : '',
                receiver_pincode: reqBody.receiver_pincode,
                receiver_country: reqBody.destination_country,
                receiver_state: reqBody.receiver_state,
                receiver_city: reqBody.receiver_city,
                receiver_phone_number: reqBody.receiver_phone_number,
                receiver_email: reqBody.receiver_email ? reqBody.receiver_email : '',
                commodity_list: reqBody.commodity_list,
                commodity_items_summery: reqBody.commodity_items_summery,
                remarks: reqBody.remarks ? reqBody.remarks : '',
                status: 1
            }
            if(req.files.kyc_files){
                let files = [];
                (req.files.kyc_files).map(file => {
                    files.push(file.filename);
                });
                data.kyc_doc = files.toString();
            }
            const resp = await addShipmentsModelRecordToDB(data, 'Shipments', false, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : " Country already exists with this name/code"});
        }else{
            winston.info({ 'ShipmentsController:: Exception occured in addShipment method': err.message });
            return next(err);
        }
    }
}

module.exports.updateShipmentDetails = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.branch &&
            reqBody.invoice_number &&
            reqBody.date &&
            reqBody.service_type &&            
            reqBody.tracking_no1 && validateData('nonHTML', reqBody.no_of_pieces) &&
            reqBody.destination_country && validateData('alpha', reqBody.destination_country) && (reqBody.destination_country).length === 2 &&
            reqBody.no_of_pieces && validateData('num', reqBody.no_of_pieces) &&
            reqBody.actual_weight && validateData('float', reqBody.actual_weight) &&
            reqBody.valumetric_weight && validateData('float', reqBody.valumetric_weight) &&
            reqBody.chargable_weight && validateData('float', reqBody.chargable_weight) &&
            reqBody.medicine_shipment &&
            reqBody.product_type &&
            reqBody.basic_amount && validateData('float', reqBody.basic_amount) &&
            reqBody.total_amount && validateData('float', reqBody.total_amount) &&
            reqBody.mode_of_payment && validateData('alpha', reqBody.mode_of_payment) &&
            reqBody.sender_name && validateData('alnumSpecial', reqBody.sender_name) &&
            reqBody.sender_address1 && validateData('nonHTML', reqBody.sender_address1) &&
            reqBody.sender_pincode && validateData('pincode', reqBody.sender_pincode) &&
            reqBody.sender_phone_number && validateData('mobile', reqBody.sender_phone_number) &&
            reqBody.sender_id_proof_type && validateData('alpha', reqBody.sender_id_proof_type) &&
            reqBody.sender_id_proof_number && validateData('alnumSpecial', reqBody.sender_id_proof_number) &&
            reqBody.receiver_name && validateData('alnumSpecial', reqBody.receiver_name) &&
            reqBody.receiver_address1 && validateData('nonHTML', reqBody.receiver_address1) &&
            reqBody.receiver_pincode &&
            reqBody.receiver_phone_number &&
            reqBody.commodity_list &&
            reqBody.commodity_items_summery
        ){
            if(reqBody.mode_of_payment !== 'CASH' && (!reqBody.transaction_id || validateData('nonHTML', reqBody.transaction_id))){
                return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
            }
            let shipmentsDetails = await getOneShipmentsModelRecordFromDB('Shipments', {id: reqBody.id});
            if(shipmentsDetails){
                let currentDate = new Date().toISOString().split('T')[0];
                let createdDate = new Date(shipmentsDetails.createdAt);
                let futureDate = new Date(createdDate.setDate(createdDate.getDate() + 2)).toISOString().split('T')[0];
                if(futureDate >= currentDate || req.tokenData.role_type === 'Super-Admin'){
                    let data1 = {
                        invoice_number: reqBody.invoice_number,
                        date: reqBody.date,
                        service_type: reqBody.service_type,
                        destination_country: reqBody.destination_country,
                        tracking_no1: reqBody.tracking_no1,
                        tracking_no2: reqBody.tracking_no2 ? reqBody.tracking_no2 : '',
                        tracking_no3: reqBody.tracking_no3 ? reqBody.tracking_no3 : '',
                        tracking_no4: reqBody.tracking_no4 ? reqBody.tracking_no4 : '',
                        sender_name: reqBody.sender_name,
                        sender_company_name: reqBody.sender_company_name ? reqBody.sender_company_name : '',
                        sender_address1: reqBody.sender_address1,
                        sender_address2: reqBody.sender_address2,
                        sender_address3: reqBody.sender_address3 ? reqBody.sender_address3 : '',
                        sender_pincode: reqBody.sender_pincode,
                        sender_country: 'IN',
                        sender_state: reqBody.sender_state,
                        sender_city: reqBody.sender_city,
                        sender_phone_number: reqBody.sender_phone_number,
                        sender_email: reqBody.sender_email ? reqBody.sender_email : '',
                        sender_id_proof_type: reqBody.sender_id_proof_type,
                        sender_id_proof_number: reqBody.sender_id_proof_number,
                        receiver_name: reqBody.receiver_name,
                        receiver_company_name: reqBody.receiver_company_name ? reqBody.receiver_company_name : '',
                        receiver_address1: reqBody.receiver_address1,
                        receiver_address2: reqBody.receiver_address2,
                        receiver_address3: reqBody.receiver_address3 ? reqBody.receiver_address3 : '',
                        receiver_pincode: reqBody.receiver_pincode,
                        receiver_country: reqBody.destination_country,
                        receiver_state: reqBody.receiver_state,
                        receiver_city: reqBody.receiver_city,
                        receiver_phone_number: reqBody.receiver_phone_number,
                        receiver_email: reqBody.receiver_email ? reqBody.receiver_email : '',
                        remarks: reqBody.remarks ? reqBody.remarks : ''
                    }
                    let data2 = {};
                    if(req.tokenData.role_type === 'Super-Admin'){
                        data2 = {
                            branch_id: reqBody.branch,
                            no_of_pieces: reqBody.no_of_pieces,
                            boxes_3kg: reqBody.boxes_3kg ? reqBody.boxes_3kg : 0,
                            boxes_5kg: reqBody.boxes_5kg ? reqBody.boxes_5kg : 0,
                            boxes_10kg: reqBody.boxes_10kg ? reqBody.boxes_10kg : 0,
                            boxes_15kg: reqBody.boxes_15kg ? reqBody.boxes_15kg : 0,
                            boxes_custom: reqBody.boxes_custom ? reqBody.boxes_custom : 0,
                            custom_box_dimentions: reqBody.custom_box_dimentions ? reqBody.custom_box_dimentions : '',
                            actual_weight: reqBody.actual_weight,
                            valumetric_weight: reqBody.valumetric_weight,
                            chargable_weight: reqBody.chargable_weight, 
                            medicine_shipment: reqBody.medicine_shipment,     
                            product_type: reqBody.product_type,
                            basic_amount: reqBody.basic_amount,
                            gst_amount: reqBody.gst_amount ? reqBody.gst_amount : (reqBody.basic_amount * 18) / 100,
                            other_amount: reqBody.other_amount ? reqBody.other_amount : 0,
                            total_amount: reqBody.total_amount,
                            mode_of_payment: reqBody.mode_of_payment,
                            transaction_id: reqBody.transaction_id ? reqBody.transaction_id : '',                            
                            commodity_list: JSON.stringify(reqBody.commodity_list),
                            commodity_items_summery: reqBody.commodity_items_summery
                        }
                    }
                    let data = {...data1, ...data2};
                    const resp = await updateShipmentsModelRecordInDB('Shipments', data, {id: reqBody.id});
                    if(resp){
                        return res.status(200).json({responseCode: 1, message: "Details updated successfully"});
                    }else{
                        return res.status(200).json({responseCode: 0, message: "Details updating has failed"});
                    } 
                }else{

                }
            }else{
                return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
            }           
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in updateShipmentDetails method': err.message });
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : " Shipment already exists with this invoice number"});
        }else{           
            return next(err);
        }
    }
}

/**
 * fetching the empty tracking numbers shipments list 
 */
 module.exports.getEmptyTrackingShipmentsList = async (req, res, next) => {
    try {
        let whereData = {
            tracking_no1: null,
            tracking_no2: null,
            tracking_no3: null,
            tracking_no4: null
        }
        let resp = await getShipmentsList(whereData);
        return res.status(200).json({responseCode: 1, message: "success", shipments: resp});      
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in getEmptyTrackingShipmentsList method': err.message });
        return next(err);
    }
}

/**
 * fetching the count of with and without tracking numbers shipments 
 */
 module.exports.getShipmentsCount = async (req, res, next) => {
    try {
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        let toDate = new Date().toISOString().split('T')[0];
        let startedDate = new Date(date);            
        let endDate = new Date(toDate);
        
        let whereData1 = {
            tracking_no1: null,
            tracking_no2: null,
            tracking_no3: null,
            tracking_no4: null,
            date: {[Op.between]: [startedDate, endDate]}
        }
        let shipmentsWithoutTrackingNoCount = await getShipmentsModelRecordsCount('Shipments', whereData1);
        let whereData2 = {
            tracking_no1: { [Op.not]: null},
            date: {[Op.between]: [startedDate, endDate]}
        }
        let shipmentsWithTrackingNoCount = await getShipmentsModelRecordsCount('Shipments', whereData2);
        return res.status(200).json({responseCode: 1, message: "success", countData: {shipmentsWithoutTrackingNoCount, shipmentsWithTrackingNoCount}});      
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in getShipmentsCount method': err.message });
        return next(err);
    }
}

/**
 * fetching the shipments list 
 */
 module.exports.getShipmentsList = async (req, res, next) => {
    try {
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        let whereData = {};
        if(req.body.branch_id){
            whereData.branch_id = req.body.branch_id;
        }else if (req.tokenData.role_type != 'Super-Admin' && req.tokenData.role_id !== 4){
            whereData.branch_id = req.tokenData.branch_id;
            whereData.date = {[Op.gte]: date[0]};
        }
        if(req.body.from_date){
            let toDate = req.body.to_date ? req.body.to_date : new Date().toISOString().split('T')[0];
            whereData.date = {[Op.between]: [req.body.from_date, toDate]};
        }
        if(Object.keys(whereData).length === 0){
            whereData.date = {[Op.gt]: date[0]}
        }
        whereData.tracking_no1 = { [Op.not]: null};

        let resp = await getShipmentsList(whereData);
        return res.status(200).json({responseCode: 1, message: "success", shipments: resp});     
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in getShipmentsList method': err.message });
        return next(err);
    }
}

/**
 * fetching the shipments list 
 */
 module.exports.getShipmentsByBranch = async (req, res, next) => {
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

        let attributes = ['id','branch_id','date','boxes_3kg','boxes_5kg','boxes_10kg','boxes_15kg','boxes_custom','custom_box_dimentions'];

        let resp = await getShipmentsModelRecordsWithAttributesFromDB('Shipments', whereData, attributes, false);
        return res.status(200).json({responseCode: 1, message: "success", shipments: resp});     
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in getShipmentsByBranch method': err.message });
        return next(err);
    }
}

/**
 * fetching the shipment using id 
 */
 module.exports.getShipmentDetails = async (req, res, next) => {
    try {
        if(req.body.id){
            let whereData = {id: req.body.id};
            let resp = await getOneShipmentsModelRecordFromDB('Shipments', whereData);
            return res.status(200).json({responseCode: 1, message: "success", info: resp});  
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"}); 
        }   
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in getShipmentDetails method': err.message });
        return next(err);
    }
}

/**
 * fetching the shipment record using invoice number
 */
 module.exports.checkInvoiceNoAvailable = async (req, res, next) => {
    try {
        if(req.body.invoice_number){
            let whereData = {invoice_number: req.body.invoice_number};
            let attributes = ['invoice_number'];
            let resp = await getOneShipmentsModelRecordWithAttributesFromDB('Shipments', whereData, attributes);
            return res.status(200).json({responseCode: 1, message: "success", info: resp});  
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"}); 
        }   
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in checkInvoiceNoAvailable method': err.message });
        return next(err);
    }
}

/**
 * fetching the shipment using id 
 */
 module.exports.getShipmentData = (whereData) => {
    return new Promise(async(resolve, reject) => {
        try {
            let resp = await getOneShipmentsModelRecordFromDB('Shipments', whereData);
            resolve(resp);    
        }catch (err) {
            resolve(null);
        }
    });    
}

/**
 * updating the shipment details
 */
 module.exports.updateShipment = async (req, res, next) => {
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
            const resp = await updateShipmentsModelRecordInDB('Countries', updateData, {id: reqBody.country_id});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details updated successfully"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details updating has failed"});
            }            
        }        
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in updateShipment method': err.message });
        return next(err);
    }
}

/**
 * updating the shipment tracking no's
 */
 module.exports.updateShipmentTrackingNos = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.tracking_no1
        ){
            let data = {
                tracking_no1: reqBody.tracking_no1,
                tracking_no2: reqBody.tracking_no2 ? reqBody.tracking_no2 : '',
                tracking_no3: reqBody.tracking_no3 ? reqBody.tracking_no3 : '',
                tracking_no4: reqBody.tracking_no4 ? reqBody.tracking_no4 : '',
            }
            const resp = await updateShipmentsModelRecordInDB('Shipments', data, {id: reqBody.id});
            if(resp){
                let whereData = {id: req.body.id};
                let attributes = ['sender_phone_number'];
                let resp = await getOneShipmentsModelRecordWithAttributesFromDB('Shipments', whereData, attributes);
                if(resp && resp.sender_phone_number){
                    let template = {
                        name: 'shipment_update',
                        components: [{
                            type: 'body',
                            parameters: [
                                {
                                    "type": "text",
                                    "text": reqBody.tracking_no1
                                }
                            ]
                        }],
                        language: {code: 'en_US'}
                    };
                    let message = await sendWhatsappMessage(`91${resp.sender_phone_number}`, template);
                }
                return res.status(200).json({responseCode: 1, message: "Details updated successfully"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details updating has failed"});
            }            
        }        
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in updateShipmentTrackingNos method': err.message });
        return next(err);
    }
}

/**
 * updating the shipment status to annonymise
 */
 module.exports.annonymiseShipment = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id
        ){
            const resp = await updateShipmentsModelRecordInDB('Shipments', {status: 0}, {id: reqBody.id});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Shipment annonymised successfully"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Shipment annonymising has failed"});
            }            
        }        
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in annonymiseShipment method': err.message });
        return next(err);
    }
}

/**
 * delete the shipment 
 */
 module.exports.deleteShipment = async (req, res, next) => {
    try {
        if(req.body.country){
            const countryID = req.body.country;
            const resp = await deleteShipmentsModelRecordInDB('Countries', {id: countryID});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in deleteShipment method': err.message });
        return next(err);
    }
}

/**************************** END SHIPMENTS ***************************/

/**************************** BANK TRANSACTIONS ***************************/
/**
 * fetching the bank transactions list 
 */
module.exports.getBankTransactions = async (req, res, next) => {
    try {
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        let whereData = {};
        if(req.body.branch_id){
            whereData.branch_id = req.body.branch_id;
        }else if (req.tokenData.role_type != 'Super-Admin'){
            whereData.branch_id = req.tokenData.branch_id;
            whereData.transaction_date = {[Op.gte]: date[0]};
        }
        if(req.body.from_date){
            let toDate = req.body.to_date ? req.body.to_date : new Date().toISOString().split('T')[0];
            whereData.transaction_date = {[Op.between]: [req.body.from_date, toDate]};
        }        
        if(Object.keys(whereData).length === 0){
            whereData.transaction_date = {[Op.gte]: date[0]}
        }
        if(req.body.approved){
            whereData.status = 'APPROVED';
        }
        let joinData = [ 
            { 
                model: AdminModels.Branches, 
                attributes: ["branch_name"],
                required: true, 
            } 
        ];

        let resp = await getShipmentsModelRecordsWithJoinFromDB('BankTransactions', whereData, joinData);
        return res.status(200).json({responseCode: 1, message: "success", transactions: resp});     
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in getBankTransactions method': err.message });
        return next(err);
    }
}

/**
 * adding the bank transactions 
 */
 module.exports.addBankTransaction = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.branch_id &&
            reqBody.transaction_date && validateData('date', reqBody.transaction_date) &&
            reqBody.transaction_id && validateData('alnumSpecial', reqBody.transaction_id) &&
            reqBody.mode_of_deposit && validateData('alpha', reqBody.mode_of_deposit) &&
            reqBody.amount && validateData('float', reqBody.amount)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                transaction_date: reqBody.transaction_date,
                transaction_id: reqBody.transaction_id,
                mode_of_deposit: reqBody.mode_of_deposit,
                amount: reqBody.amount,
                status: 'PENDING',
            }
            if(req.files.transaction_proof){
                let files = [];
                (req.files.transaction_proof).map(file => {
                    files.push(file.filename);
                });
                data.transaction_proof = files.toString();
            }
            const resp = await addShipmentsModelRecordToDB(data, 'BankTransactions', false, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in addBankTransaction method': err.message });
        return next(err);
    }
}
/**
 * updating the bank transactions 
 */
 module.exports.updateBankTransaction = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.branch_id &&
            reqBody.transaction_date && validateData('date', reqBody.transaction_date) &&
            reqBody.transaction_id && validateData('alnumSpecial', reqBody.transaction_id) &&
            reqBody.mode_of_deposit && validateData('alpha', reqBody.mode_of_deposit) &&
            reqBody.amount && validateData('float', reqBody.amount) &&
            reqBody.status && validateData('alpha', reqBody.status)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                transaction_date: reqBody.transaction_date,
                transaction_id: reqBody.transaction_id,
                mode_of_deposit: reqBody.mode_of_deposit,
                amount: reqBody.amount,
                status: reqBody.status,
            }
            if(req.files.transaction_proof){
                let files = [];
                (req.files.transaction_proof).map(file => {
                    files.push(file.filename);
                });
                data.transaction_proof = files.toString();
            }
            const resp = await updateShipmentsModelRecordInDB('BankTransactions', data, {id: reqBody.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully updated"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data updating has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'ShipmentsController:: Exception occured in updateBankTransaction method': err.message });
        return next(err);
    }
}
/**************************** END BANK TRANSACTIONS ***************************/