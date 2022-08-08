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
            reqBody.shipment_type &&            
            reqBody.destination_country && validateData('alpha', reqBody.destination_country) && (reqBody.destination_country).length === 2 &&
            reqBody.no_of_pieces && validateData('num', reqBody.no_of_pieces) &&
            reqBody.actual_weight && validateData('float', reqBody.actual_weight) &&
            reqBody.valumetric_weight && validateData('float', reqBody.valumetric_weight) &&
            reqBody.chargable_weight && validateData('float', reqBody.chargable_weight) &&
            reqBody.medicine_shipment &&
            reqBody.product_type &&
            reqBody.basic_amount && validateData('float', reqBody.basic_amount) &&
            reqBody.total_amount && validateData('float', reqBody.total_amount) &&
            reqBody.mode_of_payment &&            
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
            if(reqBody.mode_of_payment !== 'CASH' && !reqBody.transaction_id){
                return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
            }
            if(reqBody.shipment_type === 'C2C' && reqBody.total_amount > 24000){
                return res.status(200).json({responseCode: 0, message: "Commodity value should not exceed 24,000 for C2C shipment"});
            }
            if((reqBody.sender_id_proof_type).toUpperCase() === 'AADHAR' && !validateData('aadhar', reqBody.sender_id_proof_number)){
                return res.status(400).json({responseCode: 0, message: "Invalid aadhar number"});
            }else if((reqBody.sender_id_proof_type).toUpperCase() === 'PAN CARD' && !validateData('pancard', reqBody.sender_id_proof_number)){
                return res.status(400).json({responseCode: 0, message: "Invalid pancard number"});
            }else if((reqBody.sender_id_proof_type).toUpperCase() === 'GSTN' && !validateData('gstn', reqBody.sender_id_proof_number)){
                return res.status(400).json({responseCode: 0, message: "Invalid gstn number"});
            }else if((reqBody.sender_id_proof_type).toUpperCase() === 'PASSPORT' && !validateData('passport', reqBody.sender_id_proof_number)){
                return res.status(400).json({responseCode: 0, message: "Invalid passport number"});
            }

            let boxesDetails = JSON.parse(reqBody.boxes_details);
            let boxes3kgCount = boxesDetails.filter(data => data.box_weight === '3KG').length;
            let boxes5kgCount = boxesDetails.filter(data => data.box_weight === '5KG').length;
            let boxes10kgCount = boxesDetails.filter(data => data.box_weight === '10KG').length;
            let boxes15kgCount = boxesDetails.filter(data => data.box_weight === '15KG').length;
            let boxesCustomCount = boxesDetails.filter(data => data.box_weight === 'CUSTOM').length;
            let amount = reqBody.basic_amount + reqBody.commercial_charges_amount + reqBody.jewellery_appraisal_amount + reqBody.pickup_charges_amount + reqBody.packing_charges_amount;
            let data = {
                branch_id: reqBody.branch,
                invoice_number: reqBody.invoice_number,
                reference_number: Date.now(),
                date: reqBody.date,
                service_type: reqBody.service_type,
                shipment_type: reqBody.shipment_type,
                destination_country: reqBody.destination_country,
                no_of_pieces: reqBody.no_of_pieces,
                boxes_details: reqBody.boxes_details,
                boxes_3kg: boxes3kgCount ? boxes3kgCount : 0,
                boxes_5kg: boxes5kgCount ? boxes5kgCount : 0,
                boxes_10kg: boxes10kgCount ? boxes10kgCount : 0,
                boxes_15kg: boxes15kgCount ? boxes15kgCount : 0,
                boxes_custom: boxesCustomCount ? boxesCustomCount : 0,
                actual_weight: reqBody.actual_weight,
                valumetric_weight: reqBody.valumetric_weight,
                chargable_weight: reqBody.chargable_weight, 
                medicine_shipment: reqBody.medicine_shipment,     
                product_type: reqBody.product_type,
                basic_amount: reqBody.basic_amount,
                commercial_charges_amount: reqBody.commercial_charges_amount,
                jewellery_appraisal_amount: reqBody.jewellery_appraisal_amount,
                pickup_charges_amount: reqBody.pickup_charges_amount,
                packing_charges_amount: reqBody.packing_charges_amount,
                gst_amount: reqBody.gst_amount ? reqBody.gst_amount : (amount * 18) / 100,
                other_amount: reqBody.other_amount ? reqBody.other_amount : 0,
                total_amount: reqBody.total_amount,
                mode_of_payment: reqBody.mode_of_payment,
                transaction_id: reqBody.transaction_id ? reqBody.transaction_id : '',
                sender_name: (reqBody.sender_name).toUpperCase(),
                sender_company_name: reqBody.sender_company_name ? (reqBody.sender_company_name).toUpperCase() : '',
                sender_address1: (reqBody.sender_address1).toUpperCase(),
                sender_address2: (reqBody.sender_address2).toUpperCase(),
                sender_address3: reqBody.sender_address3 ? (reqBody.sender_address3).toUpperCase() : '',
                sender_pincode: reqBody.sender_pincode,
                sender_country: 'IN',
                sender_state: (reqBody.sender_state).toUpperCase(),
                sender_city: (reqBody.sender_city).toUpperCase(),
                sender_phone_number: reqBody.sender_phone_number,
                sender_email: reqBody.sender_email ? (reqBody.sender_email).toUpperCase() : '',
                sender_id_proof_type: (reqBody.sender_id_proof_type).toUpperCase(),
                sender_id_proof_number: (reqBody.sender_id_proof_number).toUpperCase(),
                receiver_name: (reqBody.receiver_name).toUpperCase(),
                receiver_company_name: reqBody.receiver_company_name ? (reqBody.receiver_company_name).toUpperCase() : '',
                receiver_address1: (reqBody.receiver_address1).toUpperCase(),
                receiver_address2: (reqBody.receiver_address2).toUpperCase(),
                receiver_address3: reqBody.receiver_address3 ? (reqBody.receiver_address3).toUpperCase() : '',
                receiver_pincode: reqBody.receiver_pincode,
                receiver_country: (reqBody.destination_country).toUpperCase(),
                receiver_state: (reqBody.receiver_state).toUpperCase(),
                receiver_city: (reqBody.receiver_city).toUpperCase(),
                receiver_phone_number: reqBody.receiver_phone_number,
                receiver_email: reqBody.receiver_email ? (reqBody.receiver_email).toUpperCase() : '',
                commodity_list: reqBody.commodity_list,
                commodity_items_summery: (reqBody.commodity_items_summery).toUpperCase(),
                remarks: reqBody.remarks ? (reqBody.remarks).toUpperCase() : '',
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
            reqBody.shipment_type &&            
            // reqBody.tracking_no1 && validateData('nonHTML', reqBody.no_of_pieces) &&
            reqBody.destination_country && validateData('alpha', reqBody.destination_country) && (reqBody.destination_country).length === 2 &&
            reqBody.no_of_pieces && validateData('num', reqBody.no_of_pieces) &&
            reqBody.actual_weight && validateData('float', reqBody.actual_weight) &&
            reqBody.valumetric_weight && validateData('float', reqBody.valumetric_weight) &&
            reqBody.chargable_weight && validateData('float', reqBody.chargable_weight) &&
            reqBody.medicine_shipment &&
            reqBody.product_type &&
            reqBody.basic_amount && validateData('float', reqBody.basic_amount) &&
            reqBody.total_amount && validateData('float', reqBody.total_amount) &&
            reqBody.mode_of_payment &&
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
            if(reqBody.mode_of_payment !== 'CASH' && !reqBody.transaction_id){
                return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
            }
            if(reqBody.shipment_type === 'C2C' && reqBody.total_amount > 24000){
                return res.status(200).json({responseCode: 0, message: "Commodity value should not exceed 24,000 for C2C shipment"});
            }
            if((reqBody.sender_id_proof_type).toUpperCase() === 'AADHAR' && !validateData('aadhar', reqBody.sender_id_proof_number)){
                return res.status(400).json({responseCode: 0, message: "Invalid aadhar number"});
            }else if((reqBody.sender_id_proof_type).toUpperCase() === 'PAN CARD' && !validateData('pancard', reqBody.sender_id_proof_number)){
                return res.status(400).json({responseCode: 0, message: "Invalid pancard number"});
            }else if((reqBody.sender_id_proof_type).toUpperCase() === 'GSTN' && !validateData('gstn', reqBody.sender_id_proof_number)){
                return res.status(400).json({responseCode: 0, message: "Invalid gstn number"});
            }else if((reqBody.sender_id_proof_type).toUpperCase() === 'PASSPORT' && !validateData('passport', reqBody.sender_id_proof_number)){
                return res.status(400).json({responseCode: 0, message: "Invalid passport number"});
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
                        // tracking_no1: reqBody.tracking_no1,
                        // tracking_no2: reqBody.tracking_no2 ? reqBody.tracking_no2 : '',
                        // tracking_no3: reqBody.tracking_no3 ? reqBody.tracking_no3 : '',
                        // tracking_no4: reqBody.tracking_no4 ? reqBody.tracking_no4 : '',
                        sender_name: (reqBody.sender_name).toUpperCase(),
                        sender_company_name: reqBody.sender_company_name ? (reqBody.sender_company_name).toUpperCase() : '',
                        sender_address1: (reqBody.sender_address1).toUpperCase(),
                        sender_address2: (reqBody.sender_address2).toUpperCase(),
                        sender_address3: reqBody.sender_address3 ? (reqBody.sender_address3).toUpperCase() : '',
                        sender_pincode: reqBody.sender_pincode,
                        sender_country: 'IN',
                        sender_state: (reqBody.sender_state).toUpperCase(),
                        sender_city: (reqBody.sender_city).toUpperCase(),
                        sender_phone_number: reqBody.sender_phone_number,
                        sender_email: reqBody.sender_email ? (reqBody.sender_email).toUpperCase() : '',
                        sender_id_proof_type: (reqBody.sender_id_proof_type).toUpperCase(),
                        sender_id_proof_number: (reqBody.sender_id_proof_number).toUpperCase(),
                        receiver_name: (reqBody.receiver_name).toUpperCase(),
                        receiver_company_name: reqBody.receiver_company_name ? (reqBody.receiver_company_name).toUpperCase() : '',
                        receiver_address1: (reqBody.receiver_address1).toUpperCase(),
                        receiver_address2: (reqBody.receiver_address2).toUpperCase(),
                        receiver_address3: reqBody.receiver_address3 ? (reqBody.receiver_address3).toUpperCase() : '',
                        receiver_pincode: reqBody.receiver_pincode,
                        receiver_country: (reqBody.destination_country).toUpperCase(),
                        receiver_state: (reqBody.receiver_state).toUpperCase(),
                        receiver_city: (reqBody.receiver_city).toUpperCase(),
                        receiver_phone_number: reqBody.receiver_phone_number,
                        receiver_email: reqBody.receiver_email ? (reqBody.receiver_email).toUpperCase() : '',
                        remarks: reqBody.remarks ? (reqBody.remarks).toUpperCase() : ''
                    }
                    let data2 = {};
                    if(req.tokenData.role_type === 'Super-Admin'){
                        let boxesDetails = reqBody.boxes_details;
                        let boxes3kgCount = boxesDetails.filter(data => data.box_weight === '3KG').length;
                        let boxes5kgCount = boxesDetails.filter(data => data.box_weight === '5KG').length;
                        let boxes10kgCount = boxesDetails.filter(data => data.box_weight === '10KG').length;
                        let boxes15kgCount = boxesDetails.filter(data => data.box_weight === '15KG').length;
                        let boxesCustomCount = boxesDetails.filter(data => data.box_weight === 'CUSTOM').length;
                        let amount = reqBody.basic_amount + reqBody.commercial_charges_amount + reqBody.jewellery_appraisal_amount + reqBody.pickup_charges_amount + reqBody.packing_charges_amount;
                        data2 = {
                            branch_id: reqBody.branch,
                            no_of_pieces: reqBody.no_of_pieces,
                            boxes_details: JSON.stringify(reqBody.boxes_details),
                            boxes_3kg: boxes3kgCount ? boxes3kgCount : 0,
                            boxes_5kg: boxes5kgCount ? boxes5kgCount : 0,
                            boxes_10kg: boxes10kgCount ? boxes10kgCount : 0,
                            boxes_15kg: boxes15kgCount ? boxes15kgCount : 0,
                            boxes_custom: boxesCustomCount ? boxesCustomCount : 0,
                            actual_weight: reqBody.actual_weight,
                            valumetric_weight: reqBody.valumetric_weight,
                            chargable_weight: reqBody.chargable_weight, 
                            medicine_shipment: reqBody.medicine_shipment,     
                            product_type: reqBody.product_type,
                            basic_amount: reqBody.basic_amount,
                            commercial_charges_amount: reqBody.commercial_charges_amount,
                            jewellery_appraisal_amount: reqBody.jewellery_appraisal_amount,
                            pickup_charges_amount: reqBody.pickup_charges_amount,
                            packing_charges_amount: reqBody.packing_charges_amount,
                            gst_amount: reqBody.gst_amount ? reqBody.gst_amount : (amount * 18) / 100,
                            other_amount: reqBody.other_amount ? reqBody.other_amount : 0,
                            total_amount: reqBody.total_amount,
                            mode_of_payment: reqBody.mode_of_payment,
                            transaction_id: reqBody.transaction_id ? reqBody.transaction_id : '',                            
                            commodity_list: JSON.stringify(reqBody.commodity_list),
                            commodity_items_summery: (reqBody.commodity_items_summery).toUpperCase()
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
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        let whereData = {
            tracking_no1: null,
            tracking_no2: null,
            tracking_no3: null,
            tracking_no4: null
        }
        if(req.body.branch_id){
            whereData.branch_id = req.body.branch_id;
        }else if (req.tokenData.role_type != 'Super-Admin'){
            whereData.branch_id = req.tokenData.branch_id;
            whereData.date = {[Op.gte]: date[0]};
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
        let daysDuration = req.body && req.body.days_duration ? req.body.days_duration : 90;
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - daysDuration));
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
        if(req.body.branch_id){
            whereData1.branch_id = req.body.branch_id;
        }else if (req.tokenData.role_type != 'Super-Admin'){
            whereData1.branch_id = req.tokenData.branch_id;
        }
        let shipmentsWithoutTrackingNoCount = await getShipmentsModelRecordsCount('Shipments', whereData1);
        let whereData2 = {
            tracking_no1: { [Op.not]: null},
            date: {[Op.between]: [startedDate, endDate]}
        }
        if(req.body.branch_id){
            whereData2.branch_id = req.body.branch_id;
        }else if (req.tokenData.role_type != 'Super-Admin'){
            whereData2.branch_id = req.tokenData.branch_id;
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
        }else if (req.tokenData.role_type != 'Super-Admin'){
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

        let attributes = ['id','branch_id','date','boxes_3kg','boxes_5kg','boxes_10kg','boxes_15kg','boxes_custom'];

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
        if(req.body.id || req.body.invoice_no){
            let whereData = {};
            if(req.body.id){
                whereData = {id: req.body.id};
            }else if(req.body.invoice_no){
                whereData = {invoice_number: req.body.invoice_no};
            }
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
            let tracking_no1_old = reqBody.tracking_no1_old ? reqBody.tracking_no1_old : null;
            let data = {
                tracking_no1: reqBody.tracking_no1,
                tracking_no2: reqBody.tracking_no2 ? reqBody.tracking_no2 : null,
                tracking_no3: reqBody.tracking_no3 ? reqBody.tracking_no3 : null,
                tracking_no4: reqBody.tracking_no4 ? reqBody.tracking_no4 : null,
            }
            const resp = await updateShipmentsModelRecordInDB('Shipments', data, {id: reqBody.id});
            if(resp){
                let whereData = {id: req.body.id};
                let attributes = ['sender_phone_number','invoice_number','no_of_pieces','chargable_weight','total_amount'];
                let resp = await getOneShipmentsModelRecordWithAttributesFromDB('Shipments', whereData, attributes);
                if(resp && resp.sender_phone_number && tracking_no1_old !== reqBody.tracking_no1){
                    let template = {
                        name: 'shipment_tracking_update',
                        components: [{
                            type: 'body',
                            parameters: [
                                {
                                    "type": "text",
                                    "text": (resp.invoice_number).toString()
                                },
                                {
                                    "type": "text",
                                    "text": (resp.no_of_pieces).toString()
                                },
                                {
                                    "type": "text",
                                    "text": (resp.chargable_weight).toString()
                                },
                                {
                                    "type": "text",
                                    "text": (resp.total_amount).toString()
                                },
                                {
                                    "type": "text",
                                    "text": `${process.env.APP_URL}/tracking/${reqBody.tracking_no1}`
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