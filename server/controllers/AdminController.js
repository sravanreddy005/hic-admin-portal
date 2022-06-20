const Sequelize = require('sequelize');
const winston = require('../helpers/winston');
const { AdminModels } = require('../database');
const { validateUserLogin, getAccessAndRefreshTokens } = require('./AuthController');
const { getShipmentData } = require('./ShipmentsController');
const { validateData, generatePasswordHashSalt, generateHashSaltUsingString, stringToSlug, genarateAccessToken } = require('../helpers/common');
// const { sendMail } = require('../helpers/email');
const { sendWhatsappMessage, amountInwords, formatDate, getSumByKey } = require('../helpers/common');
const { passwordRegx, alnumRegx } = require('../helpers/regExp');
const csv = require('csv-parser');
const fs = require('fs');
const Op = Sequelize.Op;

const pdf = require('html-pdf');
const {promisify} = require('util');
const read = promisify(require('fs').readFile);
const handlebars = require('handlebars');

handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

const {  
    addRecordToDB,
    addBulkRecordsToDB,
    getRecordsFromDB,
    getRecordsWithJoinFromDB,
    getOneRecordFromDB,
    updateRecordInDB, 
    deleteRecordInDB,
    deleteAllRecordInDB,
    getOneRecordWithJoinFromDB,
    getRecordsCount
} = require('../services/AdminService');


/**************************** ADMIN ACCESS/STATUS ***************************/
/**
 * check admin modules access 
 */
module.exports.checkAdminAccess = async (roleID, moduleVal, type) => {
    try {
        const rolesResp = await getOneRecordFromDB('Roles', {id: roleID});
        if(rolesResp && rolesResp.access_modules){
            let accessModules = Array.isArray(rolesResp.access_modules) ? rolesResp.access_modules : JSON.parse(rolesResp.access_modules);
            let moduleData = accessModules.filter(module =>{
                if (type === 'edit') {
                    return (module.module_val === moduleVal && module.edit === true);
                }else if (type === 'delete') {
                    return (module.module_val === moduleVal && module.delete === true);
                }else if (type === 'view') {
                    return (module.module_val === moduleVal && module.view === true);
                }else{
                    return false;
                }
            });
            return moduleData && moduleData.length > 0 ? true : false;
        }else{
            return false;
        }       
    }catch (err) {
        return false;
    }
}

/**
 * check admin account status 
 */
module.exports.checkAdminStatus = async (adminID) => {
    try {
        const adminResp = await getOneRecordFromDB('Admin', {id: adminID});
        if(adminResp && adminResp.active === true){
            return true;
        }else{
            return false;
        }       
    }catch (err) {
        return false;
    }
}

/**************************** END ADMIN ACCESS/STATUS ***************************/

/**************************** MODULES ***************************/
/**
 * fetching the admin modules list 
 */
module.exports.getModules = async (req, res, next) => {
    try {
        const modulesResp = await getRecordsFromDB('Modules');
        return res.status(200).json({responseCode: 1,message: "success",modules: modulesResp});        
    }catch (err) {
        return next(err);
    }
}

/**
 * creating the modules 
 */
module.exports.createModule = async (req, res, next) => {
    try {
        if(req.body && req.body.module_name && alnumRegx.test(req.body.module_name)){
            let reqData = {
                module_name: req.body.module_name,
                module_value: await stringToSlug(req.body.module_name)
            }
            const resp = await addRecordToDB(reqData, 'Modules');
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details successfully added"});
            }else{
                res.status(200).json({responseCode: 0, message: "Details adding has failed"});
            }             
        }        
    }catch (err) {
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Module already exists with this name"});
        }else{
            return next(err);
        }
    }
}
/**************************** END MODULES ***************************/

/**************************** ADMIN ROLES ***************************/
/**
 * fetching the role types 
 */
 module.exports.getRoleTypes = async (req, res, next) => {
    try {
        const resp = await getRecordsFromDB('RoleTypes');
        res.status(200).json({responseCode: 1,message: "success",roleTypes: resp});        
    }catch (err) {
        return next(err);
    }
}

/**
 * creating the roles 
 */
module.exports.createRole = async (req, res, next) => {
    try {
        const reqBody = req.body;
        let roleTypes = ['Super-Admin', 'Admin', 'Branch', 'Agent'];
        if(
            reqBody &&
            reqBody.role_name && 
            validateData('alnum', reqBody.role_name) && 
            reqBody.role_type &&
            roleTypes.indexOf(reqBody.role_type) > -1 &&
            reqBody.modules
        ){
            let addData = {
                role_name: req.body.role_name,
                role_type: req.body.role_type,
                access_modules: req.body.modules,
            }
            const resp = await addRecordToDB(addData, 'Roles');
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details successfully added"});
            }else{
                res.status(200).json({responseCode: 0, message: "Details adding has failed"});
            }
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }      
    }catch (err) {
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Role already exists with this name"});
        }else{
            return next(err);
        }
    }
}

/**
 * fetching the admin roles 
 */
module.exports.getRoles = async (req, res, next) => {
    try {
        const rolesResp = await getRecordsFromDB('Roles');
        res.status(200).json({responseCode: 1,message: "success",roles: rolesResp});        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getRoles method': err.message });
        return next(err);
    }
}

/**
 * updating the admin roles details
 */
module.exports.updateRole = async (req, res, next) => {
    try {
        const reqBody = req.body;
        let roleTypes = ['Super-Admin', 'Admin', 'Branch', 'Agent'];
        if(
            reqBody &&
            reqBody.role_name && 
            validateData('alnum', reqBody.role_name) && 
            reqBody.role_type &&
            roleTypes.indexOf(reqBody.role_type) > -1 &&
            reqBody.modules
        ){
            const roleID = req.body.role_id;
            let updateData = {
                role_name: req.body.role_name,
                role_type: req.body.role_type,
                access_modules: req.body.modules,
            }
            let updateResp = await updateRecordInDB('Roles', updateData, {id: roleID});
            if(updateResp){
                return res.status(200).json({responseCode: 1,message: "Details updated successfully"});
            }else{
                return res.status(200).json({responseCode: 0,message: "Details updating has failed"});
            }
        }        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateRole method': err.message });
        return next(err);
    }
}

/**************************** END ADMIN ROLES ***************************/


/**************************** MANAGE ADMINS ***************************/

/**
 * creating the super admin 
 */
 module.exports.createSuperAdmin = async (req, res, next) => {
    try {
        const passwordHashSalt = await generateHashSaltUsingString(req.body.password);
        const email = (req.body.email).toLowerCase();
        let data = {
            role_id: req.body.role,
            first_name: req.body.first_name ? req.body.first_name : '',
            last_name: req.body.last_name ? req.body.last_name : '',
            email: email,
            address: req.body.address ? req.body.address : '',
            salt: passwordHashSalt.salt,
            hash: passwordHashSalt.hash,
            active: 1
        };
        const adminResp = await addRecordToDB(data, 'admin');
        if(adminResp){            
            res.status(200).json({responseCode: 1, message: "Super Admin created successfully"});   
        }else{
            res.status(200).json({responseCode: 0, message: "Super Admin creating has failed"}); 
        }     
    }catch (err) {
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Admin already exists with this email"});
        }else{
            return next(err);
        }
    }
}

/**
 * creating the users 
 */
module.exports.createAdmin = async (req, res, next) => {
    try {
        const reqData = req.body;
        if(
        reqData && 
        reqData.branch_id && 
        validateData('num', reqData.branch_id) &&
        reqData.role && 
        validateData('num', reqData.role) &&
        reqData.email && 
        validateData('email', reqData.email) && 
        reqData.mobile_number && 
        validateData('mobile', reqData.mobile_number) &&
        reqData.first_name && 
        validateData('alnum', reqData.first_name)
        ){
            const passwordObj = await generatePasswordHashSalt();
            const email = (req.body.email).toLowerCase();
            let data = {
                role_id: reqData.role,
                branch_id: reqData.branch_id,
                first_name: reqData.first_name,
                last_name: reqData.last_name ? reqData.last_name : '',
                email: email,
                mobile_number: reqData.mobile_number,
                address: reqData.address ? reqData.address : '',
                salt: passwordObj.salt,
                hash: passwordObj.hash,
                active: 1
            }
            const resp = await addRecordToDB(data, 'Admin');
            if(resp){
                // const replaceData = {
                //     first_name: req.body.first_name,
                //     username : email,
                //     password : passwordObj.password,
                //     login_url : process.env.APP_URL + '/auth/login'
                // }
                // const sendMailResp = await sendMail(email, replaceData, 'sendUserNamePassword');

                let template = {
                    name: 'account_credentials',
                    components: [{
                        type: 'body',
                        parameters: [
                            {
                                "type": "text",
                                "text": req.body.first_name
                            },
                            {
                                "type": "text",
                                "text": email.toLowerCase()
                            },
                            {
                                "type": "text",
                                "text": passwordObj.password
                            },
                            {
                                "type": "text",
                                "text": process.env.APP_URL + '/auth/login'
                            }
                        ]
                    }],
                    language: {code: 'en_US'}
                };
                let message = await sendWhatsappMessage(`91${reqData.mobile_number}`, template);

                res.status(200).json({responseCode: 1, message: "User created successfully"});   
            }else{
                res.status(200).json({responseCode: 0, message: "User creating has failed"}); 
            } 
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }    
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in createAdmin method': err.message });
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "User already exists with this email"});
        }else{            
            return next(err);
        }
    }
}

/**
 * fetching the admins list 
 */
module.exports.getAdminsList = async (req, res, next) => {
    try {
        let whereData = {};
        let includeWhereData = {};
        if(req.tokenData && req.tokenData.role_type && req.tokenData.role_type !== 'Super-Admin'){
            includeWhereData = {role_type: {[Op.not]: ['Super-Admin']}};
            if(req.tokenData.branch_type !== 'Head Office'){
                whereData.branch_id = req.tokenData.branch_id;
            }
        }
        let attributes = ['id','role_id','branch_id','first_name','last_name','email','mobile_number','address','active','created_at','updated_at'];
        let includeData = [ 
            { 
                model: AdminModels.Roles, 
                attributes: ["role_name", "role_type"], 
                where: includeWhereData,
                required: true, 
            }, 
            { 
                model: AdminModels.Branches, 
                attributes: ["branch_name", "branch_type"],
                required: true, 
            } 
        ];
        const adminResp = await getRecordsWithJoinFromDB('Admin', whereData, includeData, attributes);
        res.status(200).json({responseCode: 1, message: "success", adminsList: adminResp});        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getAdminsList method': err.message });
        return next(err);
    }
}

/**
 * fetching the admins list count
 */
module.exports.getUsersCount = async (req, res, next) => {
    try {        
        const count = await getRecordsCount('Admin');
        res.status(200).json({responseCode: 1, message: "success", count: count});        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getUsersCount method': err.message });
        return next(err);
    }
}

/**
 * updating the admin details
 */
module.exports.updateAdmin = async (req, res, next) => {
    try {
        const reqData = req.body;
        if(
        reqData && 
        reqData.branch_id && 
        validateData('num', reqData.branch_id) &&
        reqData.role && 
        validateData('num', reqData.role) &&
        reqData.admin_id && 
        validateData('num', reqData.admin_id) &&
        reqData.email && 
        validateData('email', reqData.email) && 
        reqData.mobile_number && 
        validateData('mobile', reqData.mobile_number) &&
        reqData.first_name && 
        validateData('alnum', reqData.first_name)
        ){
            const adminID = req.body.admin_id;
            let updateData = {
                role_id: reqData.role,
                branch_id: reqData.branch_id,
                first_name: reqData.first_name,
                last_name: reqData.last_name ? reqData.last_name : '',
                email: (reqData.email).toLowerCase(),
                mobile_number: reqData.mobile_number,
                address: reqData.address ? reqData.address : ''
            }            
            const resp = await updateRecordInDB('Admin', updateData, {id: adminID});
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details updated successfully"}); 
            }else{
                res.status(200).json({responseCode: 0, message: "Details updating has failed"}); 
            }
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }       
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateAdmin method': err.message });
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "User already exists with this email"});
        }else{
            return next(err);
        }
    }
}

/**
 * updating the status of admin
 */
module.exports.updateAdminStatus = async (req, res, next) => {
    try {        
        if(req.body.id && (req.body.current_status || req.body.current_status === false)){
            const status = (req.body.current_status) ? false : true;
            let updateResp = await updateRecordInDB('Admin', {active: status}, {id: req.body.id});
            if(updateResp){
                return res.status(200).json({responseCode: 1, message: "success"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Status updating has failed"});
            }
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Invalid request"});
        }               
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateAdminStatus method': err.message });
        return next(err);
    }
}

/**
 * delete the admin 
 */
module.exports.deleteAdmin = async (req, res, next) => {
    try {
        if(req.body && req.body.id){
            const deleteResp = await deleteRecordInDB('Admin', {id: req.body.id});
            if(deleteResp){
                res.status(200).json({responseCode: 1, message: "success"});
            }else{
                res.status(200).json({responseCode: 0, message: "failure"});
            }
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteAdmin method': err.message });
        return next(err);
    }
}

/* 
Get the admin profile details
@getAdminProfile()
*/
module.exports.getAdminProfile = async (req, res, next) => {
    try {
        if(req.tokenData.id){
            const adminID = req.tokenData.id;
            const adminResp = await getOneRecordFromDB('Admin', {id: adminID});
            res.status(200).json(adminResp);
        }else{
            res.status(200).json('');
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getAdminProfile method': err.message });
        return next(err);
    }
}

/**
 * updating the admin email
 */
module.exports.updateEmail = async (req, res, next) => {
    try {
        const reqData = req.body;
        if(
            reqData && 
            reqData.email &&
            validateData('email', reqData.email) &&
            reqData.new_email &&
            validateData('email', reqData.new_email) &&
            reqData.email !== reqData.new_email &&
            reqData.password
        ){
            const adminID = req.tokenData.id;
            const newEmail = (reqData.new_email).toLowerCase();
            const adminValues = await validateUserLogin(reqData.password, {email: reqData.email});
            if(adminValues){
                let updateData = {email: newEmail};
                const adminResp = await updateRecordInDB('Admin', updateData, {id: adminID});
                if(adminResp){
                    let adminData = {
                        id: adminValues.id,
                        email: newEmail,
                        first_name: adminValues.first_name,
                        last_name: adminValues.last_name,
                        role_id: adminValues.role_id,
                        role_type: adminValues.role.role_type,
                        isAdmin: true,
                        access_modules: adminValues.role.access_modules
                    }
                    let tokens = await getAccessAndRefreshTokens(adminData, adminValues.id);
                    if(tokens && tokens.accessToken && tokens.refreshToken){  
                        return res.status(200).json({
                            responseCode: 1,
                            message: "success",
                            accessToken : tokens.accessToken,
                            refreshToken : tokens.refreshToken
                        });                                            
                    }else{
                        return res.status(200).json({
                            responseCode: 1,
                            message: "success",
                            accessToken : '',
                            refreshToken : ''
                        });
                    }
                }else{
                    return res.status(422).json({responseCode: 0, errorCode: 'iw1004', message : "iw1004 :: Something went wrong ! Please try again"});
                }
            }else{
                return res.status(200).json({responseCode: 0, errorCode: 'iw1003', message: "Invalid password"});
            }   
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad Request"});
        }
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateEmail method': err.message });
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "User already exists with this email"});
        }else{
            return next(err);
        }
    }
}

/**
 * updating the admin profile details
 */
module.exports.updateProfile = async (req, res, next) => {
    try {
        const adminID = req.tokenData.id;
        let updateData = {...req.body, modified_at: new Date()};
        const adminResp = await updateRecordInDB('Admin', updateData, {id: adminID}, false);
        res.status(200).json({responseCode: 1, message: "Details updated successfully"});        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateProfile method': err.message });
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Admin already exists with this email"});
        }else{
            return next(err);
        }
    }
}

/* 
Updating the admin password
@updatePassword()
 */
module.exports.updatePassword = async (req, res, next) => {
    try {
        var errRespMsg = 'Something went wrong ! Please try again.' 
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.old_password &&
            reqBody.new_password &&
            reqBody.confirm_new_password
        ){    
            const oldPassword = reqBody.old_password;
            const newPassword = reqBody.new_password;
            const confirmNewPassword = reqBody.confirm_new_password;
            if(oldPassword && passwordRegx.test(oldPassword)){
                if(newPassword && passwordRegx.test(newPassword)){
                    if(oldPassword !== newPassword){
                        if(newPassword === confirmNewPassword){
                            const adminID = req.tokenData.id;
                            const adminValues = await validateUserLogin(oldPassword, {id: adminID});
                            if(adminValues){
                                let passwordHashSalt = await generateHashSaltUsingString(newPassword);
                                let updateData = {
                                    salt: passwordHashSalt.salt,
                                    hash: passwordHashSalt.hash
                                }
                                const updateResp = await updateRecordInDB('Admin', updateData, {id: adminID});
                                if(updateResp){
                                    return res.status(200).json({ responseCode: 1, message: 'Password updated successfully' }); 
                                }else{
                                    return res.status(200).json({ responseCode: 0, message: 'Password updating has failed' }); 
                                }                                
                            }else{
                                return res.status(200).json({ responseCode: 0, message: 'Invalid old password.'});
                            }                            
                        }else{
                            errRespMsg = 'New password and confirm password must be match.'
                        }
                    }else{
                        errRespMsg = 'Old and new passwords must be different.'
                    }
                }else{
                    errRespMsg = 'Invalid new password.'
                }
            }else{
                errRespMsg = 'Invalid old password.'
            }
        }
        return res.status(200).json({responseCode: 0, message:errRespMsg});
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updatePassword method': err.message });
        return next(err);
    }
}

/**************************** END MANAGE ADMINS ***************************/

/**************************** MANAGE BRANCHES ***************************/
/**
 * creating the branch 
 */
module.exports.addBranch = async (req, res, next) => {
    try {
        const reqData = req.body;
        if(
            reqData && 
            reqData.branch_type && 
            reqData.branch_type === 'Head Office' || reqData.branch_type === 'Franchise' || reqData.branch_type === 'Agent' && 
            reqData.branch_name && 
            validateData('alnumSpecial', reqData.branch_name) &&
            reqData.address1 && 
            validateData('address', reqData.address1) && 
            reqData.address2 && 
            validateData('address', reqData.address2) && 
            reqData.pincode && 
            validateData('pincode', reqData.pincode) &&
            reqData.city && 
            validateData('alpha', reqData.city) &&
            reqData.state && 
            validateData('alpha', reqData.state)
        ){
            let data = {
                branch_type: reqData.branch_type,
                branch_name: reqData.branch_name,
                address1: reqData.address1,
                address2: reqData.address2,
                pincode: reqData.pincode,
                city: reqData.city,
                state: reqData.state,
                google_map_link: reqData.google_map_link ? reqData.google_map_link : '',
                active: 1
            }
            if(req.files && req.files['branch_photo'] && req.files['branch_photo'][0]['filename']){
                data.photo = req.files['branch_photo'][0]['filename'];
            }
            const resp = await addRecordToDB(data, 'Branches');
            if(resp){
                res.status(200).json({responseCode: 1, message: "Branch added successfully"});   
            }else{
                res.status(200).json({responseCode: 0, message: "Branch adding has failed"}); 
            } 
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }    
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in addBranch method': err.message });
        return next(err);
    }
}

/**
 * fetching the branches list 
 */
module.exports.getBranches = async (req, res, next) => {
    try {
        const resp = await getRecordsFromDB('Branches');
        res.status(200).json({responseCode: 1, message: "success", branchesList: resp});        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getBranches method': err.message });
        return next(err);
    }
}

/**
 * fetching the branches count
 */
 module.exports.getBranchesCount = async (req, res, next) => {
    try {        
        const count = await getRecordsCount('Branches');
        res.status(200).json({responseCode: 1, message: "success", count: count});        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getBranchesCount method': err.message });
        return next(err);
    }
}

/**
 * updating the branch info
 */
 module.exports.updateBranch = async (req, res, next) => {
    try {
        const reqData = req.body;
        if(
            reqData && 
            reqData.id && 
            reqData.branch_type && 
            reqData.branch_type === 'Head Office' || reqData.branch_type === 'Franchise' || reqData.branch_type === 'Agent' && 
            reqData.branch_name && 
            validateData('alnumSpecial', reqData.branch_name) &&
            reqData.address1 && 
            validateData('address', reqData.address1) && 
            reqData.address2 && 
            validateData('address', reqData.address2) && 
            reqData.pincode && 
            validateData('pincode', reqData.pincode) &&
            reqData.city && 
            validateData('alpha', reqData.city) &&
            reqData.state && 
            validateData('alpha', reqData.state)
        ){
            let data = {
                branch_type: reqData.branch_type,
                branch_name: reqData.branch_name,
                address1: reqData.address1,
                address2: reqData.address2,
                pincode: reqData.pincode,
                city: reqData.city,
                state: reqData.state,
                google_map_link: reqData.google_map_link ? reqData.google_map_link : '',
            }
            if(req.files && req.files['branch_photo'] && req.files['branch_photo'][0]['filename']){
                data.photo = req.files['branch_photo'][0]['filename'];
            }
            const resp = await updateRecordInDB('Branches', data, {id: reqData.id});
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details updated successfully"});   
            }else{
                res.status(200).json({responseCode: 0, message: "Details updating has failed"}); 
            } 
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }    
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateBranch method': err.message });
        return next(err);
    }
}

/**
 * updating the status of branch
 */
 module.exports.updateBranchStatus = async (req, res, next) => {
    try {        
        if(req.body.id && (req.body.current_status || req.body.current_status === false)){
            const status = (req.body.current_status) ? false : true;
            let updateResp = await updateRecordInDB('Branches', {active: status}, {id: req.body.id, branch_type: {[Op.not]: ['Head Office']}});
            if(updateResp){
                return res.status(200).json({responseCode: 1, message: "success"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Status updating has failed"});
            }
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Invalid request"});
        }               
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateBranchStatus method': err.message });
        return next(err);
    }
}

/**
 * delete the branch 
 */
module.exports.deleteBranch = async (req, res, next) => {
    try {
        if(req.body && req.body.id){
            const deleteResp = await deleteRecordInDB('Branches', {id: req.body.id, branch_type: {[Op.not]: ['Head Office']}});
            if(deleteResp){
                res.status(200).json({responseCode: 1, message: "success"});
            }else{
                res.status(200).json({responseCode: 0, message: "failure"});
            }
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteBranch method': err.message });
        return next(err);
    }
}
/**************************** END MANAGE BRANCHES ***************************/

/**************************** MANAGE BRANCH COMMISSIONS ***************************/
/**
 * creating the branch commission
 */
module.exports.addBranchCommission = async (req, res, next) => {
    try {
        const reqData = req.body;
        if(
            reqData && 
            reqData.branch_id && validateData('num', reqData.branch_id) &&
            reqData.weight_from && validateData('float', reqData.weight_from) && 
            reqData.weight_to && validateData('float', reqData.weight_to) && 
            reqData.commission_amount && validateData('float', reqData.commission_amount) &&
            reqData.from_date && validateData('date', reqData.from_date) &&
            reqData.to_date && validateData('date', reqData.to_date) &&
            reqData.to_date >= reqData.from_date
        ){
            let data = {
                branch_id: reqData.branch_id,
                weight_from: reqData.weight_from,
                weight_to: reqData.weight_to,
                commission_amount: reqData.commission_amount,
                from_date: reqData.from_date,
                to_date: reqData.to_date,
            }
            const resp = await addRecordToDB(data, 'BranchCommissions', false);
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details added successfully"});   
            }else{
                res.status(200).json({responseCode: 0, message: "Details adding has failed"}); 
            } 
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }    
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in addBranchCommission method': err.message });
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "This data already exists in this branch"});
        }else{
            return next(err);
        }
    }
}

/**
 * fetching the branch commissions 
 */
module.exports.getBranchCommissions = async (req, res, next) => {
    try {
        let whereData = '';
        if(req.body.branch_id){
            whereData.branch_id = req.body.branch_id;
        }
        const resp = await getRecordsFromDB('BranchCommissions', false, whereData);
        res.status(200).json({responseCode: 1, message: "success", list: resp});        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getBranchCommissions method': err.message });
        return next(err);
    }
}

/**
 * updating the branch commission info
 */
 module.exports.updateBranchCommission = async (req, res, next) => {
    try {
        const reqData = req.body;
        if(
            reqData && 
            reqData.id && 
            reqData.weight_from && validateData('float', reqData.weight_from) && 
            reqData.weight_to && validateData('float', reqData.weight_to) && 
            reqData.commission_amount && validateData('float', reqData.commission_amount) &&
            reqData.from_date && validateData('date', reqData.from_date) &&
            reqData.to_date && validateData('date', reqData.to_date) &&
            reqData.to_date >= reqData.from_date
        ){
            let data = {
                weight_from: reqData.weight_from,
                weight_to: reqData.weight_to,
                commission_amount: reqData.commission_amount,
                from_date: reqData.from_date,
                to_date: reqData.to_date,
            }
            const resp = await updateRecordInDB('BranchCommissions', data, {id: reqData.id}, false);
            if(resp){
                res.status(200).json({responseCode: 1, message: "Details updated successfully"});   
            }else{
                res.status(200).json({responseCode: 0, message: "Details updating has failed"}); 
            } 
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }    
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateBranchCommission method': err.message });
        return next(err);
    }
}

/**
 * delete the branch commission
 */
module.exports.deleteBranchCommission= async (req, res, next) => {
    try {
        if(req.body && req.body.id){
            const deleteResp = await deleteRecordInDB('BranchCommissions', {id: req.body.id}, false);
            if(deleteResp){
                res.status(200).json({responseCode: 1, message: "success"});
            }else{
                res.status(200).json({responseCode: 0, message: "failure"});
            }
        }else{
            res.status(400).json({responseCode: 0, errorCode: 'iw1003', message : "Bad Request"});
        }
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteBranchCommission method': err.message });
        return next(err);
    }
}
/**************************** END MANAGE BRANCH COMMISSIONS ***************************/

/**************************** COMMODITY LIST ***************************/
/**
 * creating the commodity 
 */
 module.exports.addCommodity = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.product_name &&
            reqBody.hsn_code &&
            validateData('nonHTML', reqBody.product_name) &&
            validateData('alnum', reqBody.hsn_code)
        ){
            let data = {
                product_name: reqBody.product_name,
                hsn_code: reqBody.hsn_code
            }
            const resp = await addRecordToDB(data, 'Commodities');
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in addCommodity method': err.message });
        if (err.name == 'SequelizeUniqueConstraintError'){
            res.status(409).json({responseCode: 0, errorCode: 'iw1005', message : "Details already exists with this name/code"});
        }else{
            return next(err);
        }
    }
}

/**
 * uploading the commodity list
 */
 module.exports.uploadCommodities = async (req, res, next) => {
    try {
        if(req.files){
            let dataArray = [];
            fs.createReadStream(`./server/uploads/commodity-list/${req.files['commodity_file'][0]['filename']}`).pipe(csv())
            .on('data', (data) => {
                const reqData = {
                    product_name : data.ProductName,
                    hsn_code: data.HSNCode
                }
                dataArray.push(reqData);
            })
            .on('end', async() => {
                let resp = await addBulkRecordsToDB(dataArray, 'Commodities', true);
                try {
                    fs.unlinkSync(`./server/uploads/commodity-list/${req.files['commodity_file'][0]['filename']}`);
                } catch (error) {
                    winston.info({ 'AdminController:: Exception occured while unlink file in uploadCommodities method': error.message });
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
        winston.info({ 'AdminController:: Exception occured in uploadCommodities method': err.message });
        return next(err);
    }
}

/**
 * fetching the commodity list 
 */
 module.exports.getCommodities = async (req, res, next) => {
    try {
        let resp = await getRecordsFromDB('Commodities');
        return res.status(200).json({responseCode: 1, message: "success", commodity_list: resp});        
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getCommodities method': err.message });
        return next(err);
    }
}

/**
 * updating the carrier zone details
 */
 module.exports.updateCommodity = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.product_name &&
            reqBody.hsn_code &&
            validateData('nonHTML', reqBody.product_name) &&
            validateData('alnum', reqBody.hsn_code)
        ){
            let data = {
                product_name: reqBody.product_name,
                hsn_code: reqBody.hsn_code
            }
            const resp = await updateRecordInDB('Commodities', data, {id: reqBody.id});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Details updated successfully"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Details updating has failed"});
            }            
        }        
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateCommodity method': err.message });
        return next(err);
    }
}

/**
 * delete the carrier zone
 */
 module.exports.deleteCommodity = async (req, res, next) => {
    try {
        if(req.body.id){
            const carrierZoneID = req.body.id;
            const resp = await deleteRecordInDB('Commodities', {id: carrierZoneID});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteCommodity method': err.message });
        return next(err);
    }
}

/**
 * delete all the commodities
 */
 module.exports.deleteAllCommodities = async (req, res, next) => {
    try {
        const resp = await deleteAllRecordInDB('Commodities');
        if(resp){
            return res.status(200).json({responseCode: 1, message: "success"});                
        }else{
            return res.status(200).json({responseCode: 0, message: "failure"});                
        }
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteAllCommodities method': err.message });
        return next(err);
    }
}

/**************************** END COMMODITY LIST ***************************/

/**************************** BANK BRANCH COMMISSION PAYMENTS ***************************/
/**
 * fetching the branch commission payments list 
 */
 module.exports.getBranchCommissionPayments = async (req, res, next) => {
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
        let joinData = [ 
            { 
                model: AdminModels.Branches, 
                attributes: ["branch_name"],
                required: true, 
            } 
        ];

        let resp = await getRecordsWithJoinFromDB('BranchCommissionPayments', whereData, joinData);
        return res.status(200).json({responseCode: 1, message: "success", transactions: resp});     
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getBranchCommissionPayments method': err.message });
        return next(err);
    }
}

/**
 * adding the branch commission payments 
 */
 module.exports.addBranchCommissionPayment = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.branch_id &&
            reqBody.transaction_date && validateData('date', reqBody.transaction_date) &&
            reqBody.transaction_id && validateData('alnumSpecial', reqBody.transaction_id) &&
            reqBody.mode_of_payment && validateData('alpha', reqBody.mode_of_payment) &&
            reqBody.amount && validateData('float', reqBody.amount)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                transaction_date: reqBody.transaction_date,
                transaction_id: reqBody.transaction_id,
                mode_of_payment: reqBody.mode_of_payment,
                amount: reqBody.amount,
            }
            if(req.files.transaction_proof){
                let files = [];
                (req.files.transaction_proof).map(file => {
                    files.push(file.filename);
                });
                data.transaction_proof = files.toString();
            }
            const resp = await addRecordToDB(data, 'BranchCommissionPayments', false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in addBranchCommissionPayment method': err.message });
        return next(err);
    }
}
/**
 * updating the branch commission payments 
 */
 module.exports.updateBranchCommissionPayment = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.branch_id &&
            reqBody.transaction_date && validateData('date', reqBody.transaction_date) &&
            reqBody.transaction_id && validateData('alnumSpecial', reqBody.transaction_id) &&
            reqBody.mode_of_payment && validateData('alpha', reqBody.mode_of_payment) &&
            reqBody.amount && validateData('float', reqBody.amount)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                transaction_date: reqBody.transaction_date,
                transaction_id: reqBody.transaction_id,
                mode_of_payment: reqBody.mode_of_payment,
                amount: reqBody.amount,
            }
            if(req.files.transaction_proof){
                let files = [];
                (req.files.transaction_proof).map(file => {
                    files.push(file.filename);
                });
                data.transaction_proof = files.toString();
            }
            const resp = await updateRecordInDB('BranchCommissionPayments', data, {id: reqBody.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully updated"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data updating has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateBranchCommissionPayment method': err.message });
        return next(err);
    }
}

/**
 * delete the branch commission payments
 */
 module.exports.deleteBranchCommissionPayment = async (req, res, next) => {
    try {
        if(req.body.id){
            const resp = await deleteRecordInDB('BranchCommissionPayments', {id: req.body.id});
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteBranchCommissionPayment method': err.message });
        return next(err);
    }
}

/**************************** END BRANCH COMMISSION PAYMENTS ***************************/

/**************************** BRANCH EXPENCES ***************************/
/**
 * fetching the branch expenses list 
 */
 module.exports.getExpenses = async (req, res, next) => {
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
        let joinData = [ 
            { 
                model: AdminModels.Branches, 
                attributes: ["branch_name"],
                required: true, 
            } 
        ];

        let resp = await getRecordsWithJoinFromDB('Expenses', whereData, joinData);
        return res.status(200).json({responseCode: 1, message: "success", transactions: resp});     
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getExpenses method': err.message });
        return next(err);
    }
}

/**
 * adding the branch expenses
 */
 module.exports.addExpenses = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.branch_id &&
            reqBody.transaction_date && validateData('date', reqBody.transaction_date) &&
            reqBody.expense_type && validateData('alpha', reqBody.expense_type) &&
            reqBody.mode_of_payment && validateData('alpha', reqBody.mode_of_payment) &&
            reqBody.amount && validateData('float', reqBody.amount) && 
            reqBody.paid_by && validateData('nonHTML', reqBody.paid_by) &&
            reqBody.paid_to && validateData('nonHTML', reqBody.paid_to)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                transaction_date: reqBody.transaction_date,
                transaction_id: reqBody.transaction_id ? reqBody.transaction_id : '',
                expense_type: reqBody.expense_type,
                mode_of_payment: reqBody.mode_of_payment,
                amount: reqBody.amount,
                paid_by: reqBody.paid_by,
                paid_to: reqBody.paid_to,
                description: reqBody.description ? reqBody.description : '',
            }
            const resp = await addRecordToDB(data, 'Expenses', false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in addExpenses method': err.message });
        return next(err);
    }
}
/**
 * updating the branch expenses
 */
 module.exports.updateExpenses = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.branch_id &&
            reqBody.transaction_date && validateData('date', reqBody.transaction_date) &&
            reqBody.expense_type && validateData('alpha', reqBody.expense_type) &&
            reqBody.mode_of_payment && validateData('alpha', reqBody.mode_of_payment) &&
            reqBody.amount && validateData('float', reqBody.amount) && 
            reqBody.paid_by && validateData('nonHTML', reqBody.paid_by) &&
            reqBody.paid_to && validateData('nonHTML', reqBody.paid_to)
        ){
            let data = {
                branch_id: reqBody.branch_id,
                transaction_date: reqBody.transaction_date,
                transaction_id: reqBody.transaction_id ? reqBody.transaction_id : '',
                expense_type: reqBody.expense_type,
                mode_of_payment: reqBody.mode_of_payment,
                amount: reqBody.amount,
                paid_by: reqBody.paid_by,
                paid_to: reqBody.paid_to,
                description: reqBody.description ? reqBody.description : '',
            }            
            const resp = await updateRecordInDB('Expenses', data, {id: reqBody.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully updated"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data updating has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateExpenses method': err.message });
        return next(err);
    }
}

/**
 * delete the branch expenses
 */
 module.exports.deleteExpenses = async (req, res, next) => {
    try {
        if(req.body.id){
            const resp = await deleteRecordInDB('Expenses', {id: req.body.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteExpenses method': err.message });
        return next(err);
    }
}

/**************************** END BRANCH EXPENSES ***************************/

/**************************** SALARIES ***************************/
/**
 * fetching the salaries list 
 */
 module.exports.getSalaries = async (req, res, next) => {
    try {
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        let toDate = req.body.to_date ? req.body.to_date : new Date().toISOString().split('T')[0];
        let endDate = new Date(toDate);
        let futureDate = new Date(endDate.setDate(endDate.getDate() + 1));
        let whereData = {};
        if(req.body.from_date){            
            whereData.created_at = {[Op.between]: [new Date(req.body.from_date), futureDate]};
        }else{
            whereData.created_at = {[Op.between]: [new Date(date), futureDate]};
        }
        let resp = await getRecordsFromDB('Salaries', false, whereData);
        return res.status(200).json({responseCode: 1, message: "success", list: resp});     
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getSalaries method': err.message });
        return next(err);
    }
}

/**
 * adding the salaries 
 */
 module.exports.addSalaries = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.employee_name && validateData('alnumSpecial', reqBody.employee_name) &&
            reqBody.salary_amount && validateData('float', reqBody.salary_amount) &&
            reqBody.salary_date && validateData('date', reqBody.salary_date) &&
            reqBody.transaction_number && validateData('alnumSpecial', reqBody.transaction_number)
        ){
            let data = {
                employee_name: reqBody.employee_name,
                salary_amount: reqBody.salary_amount,
                salary_date: reqBody.salary_date,
                transaction_number: reqBody.transaction_number,
                esi: reqBody.esi ? reqBody.esi : '',
                pf: reqBody.pf ? reqBody.pf : '',
                hra: reqBody.hra ? reqBody.hra : '',
                description: reqBody.description ? reqBody.description : ''
            }
            const resp = await addRecordToDB(data, 'Salaries', false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully added"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in addSalaries method': err.message });
        return next(err);
    }
}
/**
 * updating the salaries 
 */
 module.exports.updateSalaries = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.employee_name && validateData('alnumSpecial', reqBody.employee_name) &&
            reqBody.salary_amount && validateData('float', reqBody.salary_amount) &&
            reqBody.salary_date && validateData('date', reqBody.salary_date) &&
            reqBody.transaction_number && validateData('alnumSpecial', reqBody.transaction_number)
        ){
            let data = {
                employee_name: reqBody.employee_name,
                salary_amount: reqBody.salary_amount,
                salary_date: reqBody.salary_date,
                transaction_number: reqBody.transaction_number,
                esi: reqBody.esi ? reqBody.esi : '',
                pf: reqBody.pf ? reqBody.pf : '',
                hra: reqBody.hra ? reqBody.hra : '',
                description: reqBody.description ? reqBody.description : ''
            }
            const resp = await updateRecordInDB('Salaries', data, {id: reqBody.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully updated"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data updating has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateSalaries method': err.message });
        return next(err);
    }
}

/**
 * delete the salaries
 */
 module.exports.deleteSalaries = async (req, res, next) => {
    try {
        if(req.body.id){
            const resp = await deleteRecordInDB('Salaries', {id: req.body.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteSalaries method': err.message });
        return next(err);
    }
}
/**************************** END SALARIES ***************************/

/**************************** COMPLAINTS ***************************/
/**
 * fetching the complaints list 
 */
 module.exports.getComplaints = async (req, res, next) => {
    try {
        if(req.body.invoice_number){
            let joinData = [ 
                { 
                    model: AdminModels.Branches, 
                    attributes: ["branch_name"],
                    required: true, 
                } 
            ];
            let whereData = {invoice_number: req.body.invoice_number};
            let resp = await getRecordsWithJoinFromDB('Complaints', whereData, joinData);
            return res.status(200).json({responseCode: 1, message: "success", list: resp});
        }else{
            let now = new Date();
            const backDate = new Date(now.setDate(now.getDate() - 30));
            let date = backDate.toISOString().split('T');
            let toDate = req.body.to_date ? req.body.to_date : new Date().toISOString().split('T')[0];
            let endDate = new Date(toDate);
            let futureDate = new Date(endDate.setDate(endDate.getDate() + 1));
            let whereData = {};
            if(req.body.branch_id){
                whereData.branch_id = req.body.branch_id;
            }
            if(req.body.from_date){            
                whereData.created_at = {[Op.between]: [new Date(req.body.from_date), futureDate]};
            }else{
                whereData.created_at = {[Op.between]: [new Date(date), futureDate]};
            }

            let joinData = [ 
                { 
                    model: AdminModels.Branches, 
                    attributes: ["branch_name"],
                    required: true, 
                } 
            ];
            let resp = await getRecordsWithJoinFromDB('Complaints', whereData, joinData);
            return res.status(200).json({responseCode: 1, message: "success", list: resp});
        }     
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getComplaints method': err.message });
        return next(err);
    }
}

/**
 * fetching the count of pending and cloed complaints
 */
 module.exports.getComplaintsCount = async (req, res, next) => {
    try {
        let now = new Date();
        const backDate = new Date(now.setDate(now.getDate() - 30));
        let date = backDate.toISOString().split('T');
        let toDate = new Date().toISOString().split('T')[0];
        let startedDate = new Date(date);            
        let endDate = new Date(toDate);
        let futureDate = new Date(endDate.setDate(endDate.getDate() + 1));

        let whereData1 = {
            status: 'PENDING',
            created_at: {[Op.between]: [startedDate, futureDate]}
        }
        let pendingCount = await getRecordsCount('Complaints', whereData1);
        let whereData2 = {
            status: 'CLOSED',
            created_at: {[Op.between]: [startedDate, futureDate]}
        }
        let closedCount = await getRecordsCount('Complaints', whereData2);
        return res.status(200).json({responseCode: 1, message: "success", countData: {pendingCount, closedCount}});      
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in getComplaintsCount method': err.message });
        return next(err);
    }
}

/**
 * adding the complaints
 */
 module.exports.addComplaints = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.invoice_number && validateData('alnumSpecial', reqBody.invoice_number) &&
            reqBody.customer_name && validateData('alnumSpecial', reqBody.customer_name) &&
            reqBody.mobile_number && validateData('mobile', reqBody.mobile_number) &&
            reqBody.description
        ){
            let shipmentData = await getShipmentData({invoice_number: reqBody.invoice_number});
            if(shipmentData && shipmentData.branch_id){
                let data = {
                    branch_id: shipmentData.branch_id,
                    invoice_number: reqBody.invoice_number,
                    customer_name: reqBody.customer_name,
                    mobile_number: reqBody.mobile_number,
                    status: 'PENDING',
                    description: reqBody.description,
                }
                const resp = await addRecordToDB(data, 'Complaints', false);
                if(resp){
                    return res.status(200).json({responseCode: 1, message: "Data successfully added"});
                }else{
                    return res.status(200).json({responseCode: 0, message: "Data adding has failed"});
                }   
            }else{
                return res.status(400).json({responseCode: 0, message: "Shipment not found with the given invoice number"});
            }         
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in addComplaints method': err.message });
        return next(err);
    }
}
/**
 * updating the complaints
 */
 module.exports.updateComplaints = async (req, res, next) => {
    try {
        const reqBody = req.body;
        if(
            reqBody &&
            reqBody.id &&
            reqBody.customer_name && validateData('alnumSpecial', reqBody.customer_name) &&
            reqBody.mobile_number && validateData('mobile', reqBody.mobile_number) &&
            reqBody.status && validateData('alpha', reqBody.status) &&
            reqBody.description
        ){
            let data = {
                customer_name: reqBody.customer_name,
                mobile_number: reqBody.mobile_number,
                status: reqBody.status,
                description: reqBody.description,
            }     
            const resp = await updateRecordInDB('Complaints', data, {id: reqBody.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "Data successfully updated"});
            }else{
                return res.status(200).json({responseCode: 0, message: "Data updating has failed"});
            }            
        }else{
            return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
        }                
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in updateComplaints method': err.message });
        return next(err);
    }
}

/**
 * delete the complaints
 */
 module.exports.deleteComplaints = async (req, res, next) => {
    try {
        if(req.body.id){
            const resp = await deleteRecordInDB('Complaints', {id: req.body.id}, false);
            if(resp){
                return res.status(200).json({responseCode: 1, message: "success"});                
            }else{
                return res.status(200).json({responseCode: 0, message: "failure"});                
            }
        }
        return res.status(400).json({responseCode: 0, errorCode: 'iw1003', message: "Bad request"});
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in deleteComplaints method': err.message });
        return next(err);
    }
}

/**************************** END COMPLAINTS ***************************/

/**************************** DOWNLOAD FILES ***************************/
 module.exports.downLoadFiles = async (req, res, next) => {
    try {
        if(req.body.folderName && req.body.fileName){
            const file = `./server/uploads/${req.body.folderName}/${req.body.fileName}`;
            //No need for special headers
            return res.download(file); 
        }else{
            return res.status(200).json({responseCode: 0}); 
        }
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in downLoadFiles method': err.message });
        return next(err);
    }
}
module.exports.generateInvoicePDF = async (req, res, next) => {
    try {
        let shipmentData = req.body.data;
        // Read source template
        const source = await read(`./server/uploads/invoices/invoive-template.html`, 'utf-8');
        let commodityList = JSON.parse(shipmentData.commodity_list);        
        let boxes_3kg = parseInt(shipmentData.boxes_3kg);
        let boxes_5kg = parseInt(shipmentData.boxes_5kg);
        let boxes_10kg = parseInt(shipmentData.boxes_10kg);
        let boxes_15kg = parseInt(shipmentData.boxes_15kg);
        let boxes_custom = parseInt(shipmentData.boxes_custom);
        let boxDimentions = [];
        if(boxes_3kg > 0){            
            for(let i=0; i<boxes_3kg; i++ ){
                boxDimentions.push('30*21*21');
            };
        }
        if(boxes_5kg > 0){
            for(let i=0; i<boxes_5kg; i++ ){
                boxDimentions.push('36*26*26');
            };
        }
        if(boxes_10kg > 0){
            for(let i=0; i<boxes_10kg; i++ ){
                boxDimentions.push('40*35*35');
            };
        }
        if(boxes_15kg > 0){
            for(let i=0; i<boxes_15kg; i++ ){
                boxDimentions.push('60*35*35');
            };
        }
        if(boxes_custom > 0){
            let customBoxDimentions = (shipmentData.custom_box_dimentions).split(',');
            customBoxDimentions.map((data) => {
                boxDimentions.push(data);
            });
        }
        let data = {
            ...shipmentData,
            date : await formatDate(shipmentData.date, 'dd-mm-yyyy'),
            awb_number: shipmentData.tracking_no1 ? shipmentData.tracking_no1 : '',
            box_dimentions: (boxDimentions.toString()).replace(/,/g, ', '),
            destination_country: (shipmentData.country.country_name).toUpperCase(),
            commodities: commodityList,
            total_commodities_quantity: await getSumByKey(commodityList, 'quantity'),
            total_commodities_unitprice: await getSumByKey(commodityList, 'unit_price'),
            total_commodity_value: await getSumByKey(commodityList, 'commodity_value'),
            amount_in_words: await amountInwords(2000)
        };
        // Convert to Handlebars template and add the data
        const template = handlebars.compile(source);
        const html = template(data);

        // PDF Options
        const pdf_options = {
            format: 'A4',
            orientation: "portrait",
            border: "0",
            childProcessOptions: {
                env: {
                  OPENSSL_CONF: '/dev/null',
                },
            }
        };

        // Generate PDF and promisify the toFile function
        const p = pdf.create(html, pdf_options);
        p.toFile = promisify(p.toFile);
        let fileNameVal = shipmentData.invoice_number ? (shipmentData.invoice_number).toLowerCase() : new Date().getTime();
        // Saves the file to the File System as invoice.pdf in the current directorylet
        let fileName = 'invoice' + fileNameVal + '.pdf'
        await p.toFile(`./server/uploads/invoices/${fileName}`);
        const file = `./server/uploads/invoices/${fileName}`;
        const stream = fs.createReadStream(file);
        stream.on('end', function() {
            fs.unlinkSync(file);
        });
        return stream.pipe(res);
    }catch (err) {
        winston.info({ 'AdminController:: Exception occured in generateInvoicePDF method': err.message });
        return next(err);
    }
}
 
/**************************** DOWNLOAD FILES ***************************/