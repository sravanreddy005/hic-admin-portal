const { addRecordToDB } = require('../services/AdminService');
const { getPricesModelRecordsWithJoinFromDB } = require('../services/PricesService');
const { getCarrierZonesByCountry } = require('./PricesController');
const { validateData, roundOffWeight, groupArrayOfObjects } = require('../helpers/common');
const { sendMail } = require('../helpers/email');
const { PricesModels } = require('../database');
const winston = require('../helpers/winston');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const axios = require('axios');
const dateOptions = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };


/****************************** CONATCT INFO ******************************/
/**
 * storing the contact info requests 
 */
 module.exports.addContactInfo = async (req, res, next) => {
    try {
        let reqBody = req.body;
        if(
            reqBody &&
            reqBody.name && validateData('alnumSpecial', reqBody.name) && 
            reqBody.email && validateData('email', reqBody.email) && 
            reqBody.mobile_number && validateData('mobile', reqBody.mobile_number) &&
            reqBody.message && validateData('nonHTML', reqBody.message)
        ){
            let reqData = {
                name: reqBody.name,
                email: (reqBody.email).toLowerCase(),
                mobile_number: reqBody.mobile_number,
                message: reqBody.message
            }
            const resp = await addRecordToDB(reqData, 'ContactInfo', false);
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details successfully added"});
            }else{
                res.status(200).json({responseCode: 0, message: "Details adding has failed"});
            }             
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad Request"});
        }        
    }catch (err) {
        return next(err);
    }
}
/****************************** END CONATCT INFO ******************************/

/****************************** PARTNER US ******************************/
/**
 * storing the partner us info requests 
 */
 module.exports.addParterUsInfo = async (req, res, next) => {
    try {
        let reqBody = req.body;
        if(
            reqBody &&
            reqBody.name && validateData('alnumSpecial', reqBody.name) && 
            reqBody.email && validateData('email', reqBody.email) && 
            reqBody.mobile_number && validateData('mobile', reqBody.mobile_number) && 
            reqBody.city && validateData('alpha', reqBody.city) && 
            reqBody.state && validateData('alpha', reqBody.state) && 
            reqBody.pincode && validateData('pincode', reqBody.pincode) && 
            reqBody.address && validateData('address', reqBody.address)
        ){
            let reqData = {
                name: reqBody.name,
                email: (reqBody.email).toLowerCase(),
                mobile_number: reqBody.mobile_number,
                city: reqBody.city,
                state: reqBody.state,
                pincode: reqBody.pincode,
                address: reqBody.address,
                know_about_hic: reqBody.know_about_hic ? reqBody.know_about_hic : '',
            }
            const resp = await addRecordToDB(reqData, 'ParterUs', false);
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details successfully added"});
            }else{
                res.status(200).json({responseCode: 0, message: "Details adding has failed"});
            }             
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad Request"});
        }        
    }catch (err) {
        return next(err);
    }
}
/****************************** END PARTNER US ******************************/

/****************************** PICKUP REQUESTS ******************************/
/**
 * storing the pickup request info requests 
 */
 module.exports.addPickupRequest = async (req, res, next) => {
    try {
        let reqBody = req.body;
        if(
            reqBody &&
            reqBody.name && validateData('alnumSpecial', reqBody.name) && 
            reqBody.mobile_number && validateData('mobile', reqBody.mobile_number) && 
            reqBody.pickup_date && validateData('date', reqBody.pickup_date) && 
            reqBody.weight && validateData('float', reqBody.weight) && 
            reqBody.address && validateData('address', reqBody.address)
        ){
            let reqData = {
                name: reqBody.name,
                mobile_number: reqBody.mobile_number,
                pickup_date: reqBody.pickup_date,
                weight: reqBody.weight,
                address: reqBody.address,
            }
            const resp = await addRecordToDB(reqData, 'PickupRequests', false);
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details successfully added"});
            }else{
                res.status(200).json({responseCode: 0, message: "Details adding has failed"});
            }             
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad Request"});
        }        
    }catch (err) {
        return next(err);
    }
}
/****************************** END PARTNER US ******************************/

/****************************** PRICES ******************************/
/**
 * fetching the prices info 
 */
 module.exports.getPrices = async (req, res, next) => {
    try {
        if(
            req.body && 
            req.body.country && validateData('alpha', req.body.country) && req.body.country.length === 2 &&
            req.body.weight && validateData('float', req.body.weight)
        ){
            let weight = req.body.weight;
            let prices = [];
            let zonesResp = await getCarrierZonesByCountry(req.body.country);
            if(zonesResp && zonesResp.length > 0){
                let attributes = ['zone','price_per_kg','medicine_price_per_kg','weight_to'];
                let condition = [];
                zonesResp.map(data => {
                    let val = {
                        [Op.and]: [
                            { 'zone': data.zone },
                            { 'carrier_id': data.carrier_id }
                        ]
                    }
                    condition.push(val);
                });
                let whereData = {
                    [Op.and]: [
                        {weight_from: {[Op.lte]: weight}},
                        {weight_to: {[Op.gte]: weight}}
                        
                    ],
                    [Op.or]: [
                        ...condition
                    ]
                }
                let joinData = [ 
                    { 
                        model: PricesModels.Carriers, 
                        attributes: ["carrier_name"],
                        required: true, 
                    } 
                ];
                let resp = await getPricesModelRecordsWithJoinFromDB('Prices', whereData, joinData, attributes);
                if(resp){
                    let calWeight = await roundOffWeight(weight);
                    resp.map(data => {
                        let pricePerKG = req.body.is_medicine && req.body.is_medicine === 'Yes' ? data.medicine_price_per_kg : data.price_per_kg;
                        let actualAmount = (weight > 0.5) ? Math.round(pricePerKG * calWeight) : pricePerKG;
                        let taxAmount = Math.round((actualAmount * 18)/100);
                        let totalAmount = Math.round(parseFloat(actualAmount) + parseFloat(taxAmount));
                        let priceData = {
                            'pricePerKG': pricePerKG,
                            'actualAmount': actualAmount.toLocaleString('en'),
                            'taxAmount': taxAmount.toLocaleString('en'),
                            'totalAmount': totalAmount.toLocaleString('en'),
                            'carrier': data.carrier.carrier_name,
                        }
                        prices.push(priceData);
                    })
                }
            }
            
            return res.status(200).json({responseCode: 1, message: "success", prices: prices});
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }        
    }catch (error) {
        winston.info({ 'WebController:: Exception occured in getPrices method': error.message });
        return next(error);
    }
}
/****************************** END PRICES ******************************/

/****************************** TRACKING ******************************/
/**
 * fetching the tracking info 
 */
 module.exports.getTrackingInfo = async (req, res, next) => {
    try {
        if(
            req.body && 
            req.body.tracking_id && validateData('nonHTML', req.body.tracking_id)
        ){
            let trackingID = (req.body.tracking_id).toString().toUpperCase();
            let courier = 'dhl';
            let trackingResp = {};
            if(trackingID.substring(0,2) === '1Z'){
                courier = 'ups';
                trackingResp = await this.upsTracking(trackingID);
            }else if(trackingID.substring(0,2) === 'AL'){
                courier = 'allied';
                trackingID = trackingID.replace('AL', '');
                trackingResp = await this.speedBoxTracking(trackingID);
            }else if(trackingID.substring(0,2) === 'DL'){
                courier = 'delhivery';
                trackingResp = await this.delhiveryTracking(trackingID);
            }else{
                trackingResp = await this.dhlTracking(trackingID);
            }
            trackingResp.courier = courier;
            return res.status(200).json({responseCode: 1, message: "success", info: trackingResp});
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }        
    }catch (error) {
        winston.info({ 'WebController:: Exception occured in getPrices method': error.message });
        return next(error);
    }
}

module.exports.dhlTracking = (trackingID) => {
    return new Promise(async(resolve, reject) => {
        try {
            let headers = {
                "Content-Type": "application/json",
                "DHL-API-Key": "vEmLagVIaKgABGeRIofRK9UNh7RDGkBH",
            };
            let apiURL = `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingID}&language=en`;
            let resp = await axios.get(apiURL, {headers: headers});
            if(resp && resp.data && resp.data.shipments && resp.data.shipments.length > 0){
                const shipment = resp.data.shipments[0];
                let eventsData = shipment.events;
                let events = [];
                let eventsCount = eventsData.length;                    
                for(let i = 0; i < eventsCount; i++){
                    let date = new Date(eventsData[i]['timestamp']);
                    let val = {
                        sno: eventsCount - i,
                        date: new Date(eventsData[i]['timestamp']).toLocaleDateString('en-US', dateOptions),
                        time: date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                        location: eventsData[i]['location']['address']['addressLocality'],
                        description: eventsData[i]['description']
                    }
                    events.push(val);
                }
                let evts = await groupArrayOfObjects(events, 'date');
                let dateVal = new Date(shipment['status']['timestamp']);
                let timestamp = `${new Date(shipment['status']['timestamp']).toLocaleDateString('en-US', dateOptions)} ${dateVal.getHours()}:${dateVal.getMinutes()}`;
                let totalNumberOfPieces = shipment['details']['totalNumberOfPieces'];
                let estimatedTimeOfDelivery = '';
                let estimatedTimeOfDeliveryRemark = '';
                if(shipment['status']['statusCode'] !== 'delivered'){
                    estimatedTimeOfDelivery =  new Date(shipment['estimatedTimeOfDelivery']).toLocaleDateString('en-US', dateOptions);
                    estimatedTimeOfDeliveryRemark =  shipment['estimatedTimeOfDeliveryRemark'];
                }
                let deliveryInfo = {
                    waybill_id: shipment['id'],
                    origin: shipment['origin']['address']['addressLocality'],
                    destination: shipment['destination']['address']['addressLocality'],
                    estimatedTimeOfDelivery: estimatedTimeOfDelivery,
                    estimatedTimeOfDeliveryRemark: estimatedTimeOfDeliveryRemark,
                    totalNumberOfPieces: totalNumberOfPieces,
                    status: {
                        'timestamp': timestamp,
                        'statusCode': shipment['status']['statusCode'], 
                        'description': shipment['status']['description']
                    }
                }
                resolve({events: evts, deliveryInfo}) 
            }else{
                resolve(null);
            }
        } catch (error) {
            winston.info({ 'WebController:: Exception occured in dhlTracking method': error.message });
            resolve(null);
        }        
    });
}

module.exports.upsTracking = (trackingID) => {
    return new Promise(async(resolve, reject) => {
        try {
            let headers = {
                "Content-Type": "application/json",
                "transId": new Date().getTime(),
                "transactionSrc": "HIC",
                "AccessLicenseNumber": "4D63C9F457022438",
                "Username": "iclexpress1",
                "Password": "Icl@12345",
            };
            let apiURL = `https://onlinetools.ups.com/track/v1/details/${trackingID}`;
            let resp = await axios.get(apiURL, {headers: headers});                     
            if(resp && resp.data && resp.data.trackResponse && resp.data.trackResponse.shipment){                
                let packageInfo = resp.data['trackResponse']['shipment'][0]['package'][0];
                let eventsData = packageInfo['activity'];
                let events = [];
                let eventsCount = eventsData.length;
                for (let i=0; i < eventsCount; i++){
                    let address = eventsData[i]['location']['address']['city'];
                    if(eventsData[i]['location']['address']['stateProvince']){
                        address = address + ", " + eventsData[i]['location']['address']['stateProvince'];
                    }
                    address = address + ", " + eventsData[i]['location']['address']['country'];
                    let date = eventsData[i]['date'];
                    let time = eventsData[i]['time'];
                    let dateVal = `${date.substring(6,8)}/${date.substring(4,6)}/${date.substring(0,4)}`;
                    let data = {
                        'date': dateVal,
                        'time': `${time.substring(0,2)}:${time.substring(2,4)}`,
                        'location': address.replace(/(^,)|(,$)/g, ''),
                        'description': eventsData[i]['status']['description'],
                    }
                    events.push(data);
                }
                let deliveryInfo = {};
                if(packageInfo['deliveryDate'] && packageInfo['deliveryDate'].length > 0 && packageInfo['deliveryDate'][0]['date']){
                    let deliveryArry = {
                        'RDD': 'Rescheduled Delivery',
                        'SDD': 'Scheduled Delivery',
                        'DEL': 'Delivered On'
                    }
                    let deliveryDate = packageInfo['deliveryDate'][0]['date'];
                    let deliveryTime = packageInfo['deliveryTime'] && packageInfo['deliveryTime']['endTime'] ? packageInfo['deliveryTime']['endTime'] : '';
                    let deliveryDateVal = `${deliveryDate.substring(6,8)}/${deliveryDate.substring(4,6)}/${deliveryDate.substring(0,4)}`;
                    let deliveryTimeVal = deliveryTime ? `${deliveryTime.substring(0,2)}:${deliveryTime.substring(2,4)}` : '';
                    let date = new Date(deliveryDate.substring(0,4), deliveryDate.substring(4,6) - 1, deliveryTime.substring(0,2));
                    let deliveredDay = date.toLocaleString('default', { weekday: 'long' });
                    deliveryInfo = {
                        'delivered_day': deliveredDay,
                        'delivered_on': deliveryDateVal,
                        'delivery_time': deliveryTimeVal,
                    }
                    if(packageInfo['deliveryDate'][0]['type'] === 'DEL'){
                        deliveryInfo.description1 = 'Delivered';
                        deliveryInfo.description2 = deliveryArry[packageInfo['deliveryDate'][0]['type']];
                        deliveryInfo.description3 = 'Delivery Time';
                    }else{
                        deliveryInfo.description1 = events && events.length > 0 ? events[0]['description'] : '';
                        deliveryInfo.description2 = deliveryArry[packageInfo['deliveryDate'][0]['type']];
                        deliveryInfo.description3 = 'Estimated Time';
                    }
                }
                resolve({events: events, deliveryInfo}); 
            }else{
                resolve(null);
            }
        } catch (error) {
            winston.info({ 'WebController:: Exception occured in upsTracking method': error.message });
            resolve(null);
        }        
    });
}

module.exports.speedBoxTracking = (trackingID) => {
    return new Promise(async(resolve, reject) => {
        try {
            let headers = {
                "Content-Type": "application/json"
            };
            let data = {
                orderNumber: [trackingID]
            }
            let apiURL = 'https://dashboard.speedboxapp.com/speedbox/api/v1/trackShipment';
            let resp = await axios.post(apiURL, JSON.stringify(data), {headers: headers});
            if(resp && resp.data && resp.data.length > 0){
                let packageInfo = respVal['data'][0];
                let eventsData = packageInfo['statusDetails'];
                let events = [];
                let eventsCount = eventsData.length;
                for (let i=0; i<eventsCount; i++){
                    let date = new Date(eventsData[i]['timeStamp']);
                    let data = {
                        sno: eventsCount - i,
                        date: new Date(eventsData[i]['timeStamp']).toLocaleDateString('en-US', dateOptions),
                        time: date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                        location: eventsData[i]['location'],
                        description: eventsData[i]['msg'],
                    }
                    events.push(data);
                }              
                let deliveryInfo = {
                    'waybill_id': packageInfo['carrierAirWayBillNumber'],
                    'origin': packageInfo['origin'],
                    'destination': packageInfo['destination'],
                    'status': packageInfo['status'],
                }
                resolve({events: events, deliveryInfo});
            }else{
                resolve(null);
            }
        } catch (error) {
            winston.info({ 'WebController:: Exception occured in speedBoxTracking method': error.message });
            resolve(null);
        }        
    });
}

module.exports.delhiveryTracking = (trackingID) => {
    return new Promise(async(resolve, reject) => {
        try {
            let headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            };
            let data = {
                grant_type: 'password',
                username: 'HINDUSTANXBEXPEXPRESS',
                password: 'Welcome@123',
                audience: 'StarFleet',
                scope: 'starfleet openid profile email ^/package/batchGeneratePackages:POST$ ^/package/batchGeneratePackages/.+:GET$ ^/package/auth-track/.+:GET$ ^/package/.+/invoice:GET$ ^/package/.+/shipping-label:GET$ ^/package/.+/upload-kyc-doc:POST$',
                client_id: '2XPpNsnL0w6oVG6YEkz8EzPuQqzbeeJa',
                client_secret: 'e6Pph2sXGuILD2pIkutsTX76xvbtrLm4ypb93PPmLLVrkz-dnm6QIk6Nne80EjZv',
            }
            let tokenApiURL = 'https://api-starfleet.delhivery.com/auth/token';
            let reqData = new URLSearchParams(data).toString();
            let tokenResp = await axios.post(tokenApiURL, reqData, {headers: headers});
            if(tokenResp && tokenResp.data && tokenResp.data.access_token && tokenResp.data.id_token){                
                let headers2 = {
                    "id_token": tokenResp.data.id_token,
                    "Authorization": `Bearer ${tokenResp.data.access_token}`
                };
                let trackingApiURL = `https://api-starfleet.delhivery.com/package/auth-track/${trackingID}`
                let trackingResp = await axios.get(trackingApiURL, {headers: headers2});
                if(trackingResp && trackingResp.data && trackingResp.data.payload && trackingResp.data.payload.waybills_found && trackingResp.data.payload.waybills_found.length > 0){
                    let trackingData = trackingResp.data;
                    let eventsData = trackingData['payload']['waybills_found'][0]['scans'];
                    let events = [];
                    let eventsCount = eventsData.length;                    
                    for(let i = 0; i < eventsCount; i++){
                        let date = new Date(eventsData[i]['time']);
                        let val = {
                            sno: eventsCount - i,
                            date: new Date(eventsData[i]['time']).toLocaleDateString('en-US', dateOptions),
                            time: date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                            location: eventsData[i]['city'],
                            description: eventsData[i]['remarks']
                        }
                        events.push(val);
                    }
                    let origin = trackingData['payload']['waybills_found'][0]['origin'];
                    let destination = trackingData['payload']['waybills_found'][0]['destination'];
                    let deliveryInfo = {
                        'waybill_id': trackingData['payload']['waybills_found'][0]['waybill'],
                        'origin': `${origin['city']}, ${origin['state']}, ${origin['country']}`,
                        'destination': `${destination['city']}, ${destination['state']}, ${destination['country']}`,
                        'status': '',
                    }
                    resolve({events, deliveryInfo});
                }else{
                    resolve(null);
                }       
            }else{
                resolve(null);
            }
        } catch (error) {
            winston.info({ 'WebController:: Exception occured in delhiveryTracking method': error.message });
            resolve(null);
        }        
    });
}

// module.exports.apiRequest = (apiURL, body, method, headers) =>
//   new Promise(async (resolve, reject) => {
//     const options = {
//       headers,
//       body,
//       method,
//     };
//     fetch(apiURL, options).then((response) => {
//         const responseData = response.json();
//         return {
//           data: responseData,
//           status: response.status,
//         };
//       })
//       .then((result) => {
//         if (result.status == 401) {
//           resolve(null);
//         } else {
//           resolve(result.data);
//         }
//       })
//       .catch((error) => {
//         winston.error({ [`Exception occured in ${apiURL} API with error`]: error });
//         resolve(null);
//       });
//   });
/****************************** END TRACKING ******************************/