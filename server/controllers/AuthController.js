const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const encryption = require('../helpers/encryption');
const { getOneAuthRecordFromDB, getAuthRecordsFromDB, addAuthRecordToDB, updateAuthRecordInDB, deleteAuthRecordInDB, addTokensRecord, expireTokenOldRecords, getAccessToken } = require('../services/AuthService');
const { getOneRecordFromDB, getOneRecordWithJoinFromDB, updateRecordInDB } = require('../services/AdminService');
const { TokenRecords } = require('../models/auth.model');
const { passwordRegx, emailRegx } = require('../helpers/regExp');
const { generateJWT, decodeJWT, generateHashSaltUsingString, generateAccessAndRefreshToken, validatePassword } = require('../helpers/common');
const { sendMail } = require('../helpers/email');
const { AdminModels } = require('../database');

//forgot password
module.exports.forgotPassword = (req, res, next) => {
    this.forgotAdminPassword(req, res, next);
}

//reset pssword
module.exports.resetPassword = (req, res, next) => {
    this.resetAdminPassword(req, res, next);
}

/****************************** USERS ******************************/
module.exports.authenticateUser = async(req, res, next) => {
    try {
        const adminResp = await AdminModels.Admin.findOne({ 
            where: {email: req.body.email},
            include: [ 
                { 
                    model: AdminModels.Roles, 
                    attributes: ["role_name", "role_type", "access_modules"], 
                    required: true, 
                },
                { 
                    model: AdminModels.Branches, 
                    attributes: ["branch_name", "branch_type", "active"], 
                    required: true, 
                } 
            ]
         });
        // If a admin is found
        if(adminResp){ 
            let validatePswd = await validatePassword(req.body.password, adminResp.salt, adminResp.hash);
            if(validatePswd){
                if(adminResp.active === true && adminResp.branch.active === true){
                    let adminData = {
                        id: adminResp.id,
                        email: adminResp.email,
                        first_name: adminResp.first_name,
                        last_name: adminResp.last_name,
                        role_id: adminResp.role_id,
                        role_type: adminResp.role.role_type,
                        branch_id: adminResp.branch_id,
                        branch_type: adminResp.branch.branch_type,
                        branch_name: adminResp.branch.branch_name,
                        access_modules: adminResp.role.access_modules
                    }
                    let tokens = await this.getAccessAndRefreshTokens(adminData, adminResp.id);
                    if(tokens && tokens.accessToken && tokens.refreshToken){
                        return res.status(200).json({
                            responseCode: 1,
                            message: "success",
                            accessToken : tokens.accessToken,
                            refreshToken : tokens.refreshToken
                        });                                              
                    }
                    return res.status(200).json({responseCode: 0, errorCode: 'iw1004', message: "Something went wrong ! Please try again"});
                }else{
                    return res.status(200).json({responseCode: 0, errorCode: 'iw1006', message: "Your account has inactivated ! Please contact administrator."});
                }
            }else{
                return res.status(200).json({responseCode: 0, errorCode: 'iw1006', message: "Invalid Email/Password"});
            }
        } else {            
            // If user is not found
            return res.status(200).json({responseCode: 0, message: 'Invalid Email/Password'});
        }        
    }catch (err) {
        res.status(200).json({responseCode: 0, errorCode: 'iw1004', message: "Something went wrong ! Please try again"});
    }
}

module.exports.getAccessAndRefreshTokens = (data, id) => {
    return new Promise(async(resolve, reject) => {
        try {
            const encryptedData = encryption.encryptData(JSON.stringify(data));
            let tokens = await generateAccessAndRefreshToken(encryptedData);
            if(tokens && tokens.accessToken && tokens.refreshToken){
                const activeTokenRecords = await getAuthRecordsFromDB('TokenRecords', { user_id: id, active: true }, ['access_token'], process.env.NO_OF_ALLOWED_LOGINS - 1);
                let expireResp = true;
                if(activeTokenRecords && activeTokenRecords.length > 0){
                    expireResp = await expireTokenOldRecords(id, activeTokenRecords);
                }
                if(expireResp){
                    let tokenRecord = {
                        user_id: id,
                        access_token: tokens.accessToken,
                        refresh_token: tokens.refreshToken,
                        active: 1
                    }
                    const tokenResp = await addAuthRecordToDB(tokenRecord, 'TokenRecords');
                    if(tokenResp){
                        return resolve({
                            accessToken : tokens.accessToken,
                            refreshToken : tokens.refreshToken
                        });
                    }
                }
                return resolve(null);                                              
            }else{
                return resolve(null);
            }
        } catch (error) {
            resolve(null);
        }
    });
}

module.exports.validateUserLogin = (password, whereData) => {
    return new Promise(async(resolve, reject) => {
        try {
            const adminResp = await AdminModels.Admin.findOne({ 
                where: whereData,
                include: [ 
                    { 
                        model: AdminModels.Roles, 
                        attributes: ["role_name", "role_type", "access_modules"], 
                        required: true, 
                    } 
                ]
            });
            if(adminResp){ 
                let validatePswd = await validatePassword(password, adminResp.salt, adminResp.hash);
                if(validatePswd){
                    if(adminResp.active === true){
                        return resolve(adminResp);
                    }
                }else{
                    return resolve(false);
                }
            }
            return resolve(false);        
        }catch (err) {
            resolve(false); 
        }
    });    
}

/* 
Get the admin recover password
@forgotAdminPassword()
*/
module.exports.forgotAdminPassword = async (req, res, next) => {
    try {
        if(req.body.email && emailRegx.test(req.body.email)){
            const email = (req.body.email).toLowerCase();
            const adminData = await getOneRecordFromDB('Admin', {email: email});
            if(adminData){
                const id = adminData.id;
                const firstName = adminData.first_name;
                let date = new Date();
                const expiryTime = date.setMinutes(date.getMinutes() + 15);
                const tokenData = {
                    type: 'admin',
                    email: email,
                    expiry: expiryTime
                }
                let jwtExp = date.setDate(date.getMinutes() + 15);
                let jwtToken = await generateJWT(tokenData, jwtExp);
                const replaceData = {
                    first_name: firstName,
                    reset_url : process.env.APP_URL + `/auth/reset-password?token=${encodeURI(jwtToken)}`
                }
                const sendMailResp = await sendMail(email, replaceData, 'sendResetPassword');
                if(sendMailResp && sendMailResp.response && (sendMailResp.accepted).length > 0){
                    const whereData = {email: email, token_expiry: { [Sequelize.Op.gte]: new Date() }};
                    const updateResp = await updateAuthRecordInDB('ResetPasswordRecords', {token_expiry: new Date()}, whereData);
                    if(updateResp){
                        const resetRecords = {
                            user_type: 'admin',
                            user_id: id,
                            email: email,
                            token: jwtToken,
                            token_expiry: expiryTime,
                            token_sent_on: new Date()
                        };
                        const resetRecordsResp = await addAuthRecordToDB(resetRecords, 'ResetPasswordRecords');
                        if(resetRecordsResp){
                            return res.status(200).json({responseCode: 1, message: "success"});
                        }   
                    }                 
                }
                res.status(200).json({responseCode: 0, errorCode: 'iw1004', message: "Something went wrong ! Please try again."});
            }else{
                res.status(422).json({responseCode: 0, errorCode: 'iw1007', message: "Account not found with email"});
            }            
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Invalid email address"});
        }        
    }catch (err) {
        return next(err);
    }
}

/* 
Get the admin reset password
@adminResetPassword()
*/
module.exports.resetAdminPassword = async (req, res, next) => {
    try {
        if(
            req.body.token && 
            req.body.password && 
            passwordRegx.test(req.body.password) &&
            req.body.confirm_password && 
            req.body.password === req.body.confirm_password
        ){
            const token = req.body.token;
            const tokenDetails = await decodeJWT(token);
            const currentTime = new Date().getTime();
            if(tokenDetails && tokenDetails.data.expiry > currentTime){
                const email = tokenDetails.data.email;
                const tokenResp = await getOneAuthRecordFromDB('ResetPasswordRecords', {email: email, token: token}, ['id', 'token_expiry', 'reset_status']);
                const expiry = tokenResp.token_expiry;
                const resetStatus = tokenResp.reset_status;
                let currentDateTime = new Date();
                if(expiry > currentDateTime && resetStatus !== true){ 
                    const password = req.body.password;
                    const saltHash = await generateHashSaltUsingString(password);
                    let updateData = {
                        salt: saltHash.salt,
                        hash: saltHash.hash
                    }
                    const updateResp = await updateRecordInDB('Admin', updateData, {email: email});
                    if(updateResp){
                        let resetData = {
                            reset_status: true,
                            reset_on: new Date(),
                            token_expiry: new Date()
                        }
                        const resetResp = await updateAuthRecordInDB('ResetPasswordRecords', resetData, {email: email, token: token});
                        if(resetResp){
                            return res.status(200).json({responseCode: 1, message: 'success'});
                        }else{
                            return res.status(200).json({responseCode: 0, errorCode: 'iw1004', message: "Something went wrong ! Please try again."});
                        }
                    }
                    return res.status(200).json({responseCode: 0, errorCode: 'iw1004', message: "Something went wrong ! Please try again."});
                }
                return res.status(200).json({responseCode: 0, errorCode: 'iw1008', message: "Token expired"});
            }else{
                res.status(200).json({responseCode: 0, errorCode: 'iw1008', message: "Token expired"});
            }
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        return next(err);
    }
}

/* 
Get the admin profile details
@getAdmin()
*/
module.exports.validateResetToken = async (req, res, next) => {
    try {
        if(req.body.token){
            const token = req.body.token;
            const tokenDetails = await decodeJWT(token);
            if(tokenDetails){                
                const userType = tokenDetails.data.type;
                const email = tokenDetails.data.email;
                const expiry = tokenDetails.data.expiry;
                const currentTime = new Date().getTime();
                if(expiry >= currentTime){
                    const tokenResp = await getOneAuthRecordFromDB('ResetPasswordRecords', {email: email, token: token}, ['id', 'token_expiry', 'reset_status']);
                    if(tokenResp){
                        const expiry = tokenResp.token_expiry;
                        const resetStatus = tokenResp.reset_status;
                        let currentDateTime = new Date();
                        if(expiry > currentDateTime && resetStatus !== true){   
                            return res.status(200).json({responseCode: 1, message: "success", tokenExpiry: false});
                        }
                    }                    
                }                 
            }
            return res.status(200).json({responseCode: 0, errorCode: 'iw1008', message: "Token expired", tokenExpiry: true});
        }          
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        return next(err);
    }
}

/* 
@logoutUser
*/
module.exports.logoutUser = async (req, res, next) => {
    try {
        if(req.jwtToken && req.tokenData){
            const token = req.jwtToken;
            const tokenData = req.tokenData;
            let resp = await deleteAuthRecordInDB('TokenRecords', {user_id: tokenData.id, access_token: token});
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

module.exports.refreshToken = async (req, res, next) => {
    try {
        if(req.body.id && req.body.refreshToken){
            var accessToken;
            if ('authorization' in req.headers){
                accessToken = req.headers['authorization'].split(' ')[1];
                if(accessToken){
                    jwt.verify(req.body.refreshToken, process.env.REFRESH_TOKEN_SECRET, async(err, decoded) => {
                        if (err){
                            return res.status(403).send({ responseCode: 0, message: 'Permission Denied.' });
                        }else {
                            let whereData = {user_id: req.body.id, refresh_token: req.body.refreshToken, access_token: accessToken};
                            const tokenResp = await getOneAuthRecordFromDB('TokenRecords', whereData);
                            if(tokenResp && tokenResp.active === true){
                                let includeData = [ 
                                    { 
                                        model: AdminModels.Roles, 
                                        attributes: ["role_name", "role_type", "access_modules"], 
                                        required: true, 
                                    },
                                    { 
                                        model: AdminModels.Branches, 
                                        attributes: ["branch_name", "branch_type", "active"], 
                                        required: true, 
                                    } 
                                ]
                                const adminResp = await getOneRecordWithJoinFromDB('Admin', {id: req.body.id}, includeData);
                                if(adminResp.active === true && adminResp.branch.active === true){
                                    let adminData = {
                                        id: adminResp.id,
                                        email: adminResp.email,
                                        first_name: adminResp.first_name,
                                        last_name: adminResp.last_name,
                                        role_id: adminResp.role_id,
                                        role_type: adminResp.role.role_type,
                                        branch_id: adminResp.branch_id,
                                        branch_type: adminResp.branch.branch_type,
                                        branch_name: adminResp.branch.branch_name,
                                        access_modules: adminResp.role.access_modules
                                    }
                                    let tokens = await this.getAccessAndRefreshTokens(adminData, adminResp.id);
                                    if(tokens && tokens.accessToken && tokens.refreshToken){
                                        return res.status(200).json({
                                            responseCode: 1,
                                            message: "success",
                                            accessToken : tokens.accessToken,
                                            refreshToken : tokens.refreshToken
                                        });                                              
                                    }else{
                                        return res.status(403).json({responseCode: 0, errorCode: 'iw1004', message: "Something went wrong ! Please try again"});
                                    }                                    
                                }else{
                                    return res.status(403).json({responseCode: 0, errorCode: 'iw1006', message: "Your account has inactivated ! Please contact administrator."});
                                }
                            }else{
                                return res.status(403).json({responseCode: 0, message: "Permission Denied."});
                            }
                        }                       
                    });
                }else{
                    return res.status(403).json({responseCode: 0, message: "Permission Denied."});
                }
            }else{
                return res.status(403).json({responseCode: 0, message: "Permission Denied."});
            }
        }
        
    } catch (err) {
        return next(err);
    }
}

module.exports.checkAccessTokenStatus = async (accessToken) => {
    try {
        const statusResp = await getOneAuthRecordFromDB('TokenRecords', {access_token: accessToken});
        if(statusResp && statusResp.active === true){
            return true;
        }else{
            return false;
        }
    } catch (error) {
        return false;
    }
}
/****************************** END ADMIN ******************************/