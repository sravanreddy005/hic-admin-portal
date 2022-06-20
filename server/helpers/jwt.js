const jwt = require('jsonwebtoken');
const encryption = require('./encryption');
const { checkAdminAccess, checkAdminStatus } = require('../controllers/AdminController');
const { checkAccessTokenStatus } = require('../controllers/AuthController');

/**************************************** ADMIN ****************************************/

module.exports.verifyAdminJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers){
        token = req.headers['authorization'].split(' ')[1];
    }
    if (!token)
        return res.status(401).send({ responseCode: 0, message: 'Authentication failed.' });
    else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async(err, decoded) => {
                if (err){
                    return res.status(401).send({ responseCode: 0, message: 'Authentication failed.' });
                }else {
                    const tokenStatus = await checkAccessTokenStatus(token); 
                    if(tokenStatus){
                        const tokenData = JSON.parse(encryption.decryptData(decoded.data));
                        if(tokenData.email){
                            const adminStatus = await checkAdminStatus(tokenData.id);
                            if(adminStatus){
                                req.tokenData = tokenData;
                                next();
                            }else{
                                return res.status(403).send({ responseCode: 0, errorCode: 'iw1006', message: 'iw1006 :: Your account has inactivated ! Please contact administrator.' });
                            }                        
                        }else{
                            return res.status(401).send({ responseCode: 0, message: 'Authentication failed.' });
                        } 
                    }else{
                        return res.status(401).send({ responseCode: 0, message: 'iw1008 :: Token expired.' });
                    }
                }
            }
        )
    }
}

module.exports.verifyJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers){
        token = req.headers['authorization'].split(' ')[1];
    }
    if (!token)
        return res.status(401).send({ responseCode: 0, message: 'Authentication failed.' });
    else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async(err, decoded) => {
                if (err){
                    return res.status(401).send({ responseCode: 0, message: 'Authentication failed.' });
                }else{
                    const tokenData = JSON.parse(encryption.decryptData(decoded.data));
                    req.tokenData = tokenData;
                    req.jwtToken = token;
                    next();
                }
            }
        )
    }
}

module.exports.verifyJwtTokenWithoutExpiry = (req, res, next) => {
    var token;
    if ('authorization' in req.headers){
        token = req.headers['authorization'].split(' ')[1];
    }
    if (!token){
        if(req.refreshToken){
            return res.status(403).send({ responseCode: 0, message: 'Permission Denied.' });
        }else{
            return res.status(401).send({ responseCode: 0, message: 'Authentication failed.' });
        }        
    }else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {ignoreExpiration: true}, async(err, decoded) => {
                if (err){
                    if(req.refreshToken){
                        return res.status(403).send({ responseCode: 0, message: 'Permission Denied.' });
                    }else{
                        return res.status(401).send({ responseCode: 0, message: 'Authentication failed.' });
                    }
                }else{
                    const tokenData = JSON.parse(encryption.decryptData(decoded.data));
                    req.tokenData = tokenData;
                    req.jwtToken = token;
                    next();
                }
            }
        )
    }
}

module.exports.verifyAdminJwtTokenWithAccess = (module, type) => {       
    return (req, res, next) => {
        var token;
        if ('authorization' in req.headers)
            token = req.headers['authorization'].split(' ')[1];

        if (!token)
            res.status(401).send({ responseCode: 0, message: 'Authentication failed.' });
        else {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,
                async(err, decoded) => {
                    if (err){
                        res.status(401).send({ responseCode: 0, errorCode: 'iw1003',message: 'Authentication failed.' });
                    }else {                                     
                        const tokenData = JSON.parse(encryption.decryptData(decoded.data));   
                        if(tokenData.email){
                            const tokenStatus = await checkAccessTokenStatus(token); 
                            if(tokenStatus){
                                const adminStatus = await checkAdminStatus(tokenData.id);
                                if(adminStatus){
                                    const roleID = tokenData.role_id;
                                    const access = await checkAdminAccess(roleID, module, type);
                                    if(access){
                                        req.tokenData = tokenData;
                                        next();
                                    }else{
                                        res.status(403).send({ responseCode: 0, errorCode: 'iw1002',message: 'iw1002 :: Permission Denied.' });
                                    }   
                                }else{
                                    return res.status(403).send({ responseCode: 0, errorCode: 'iw1006', message: 'iw1006 :: Your account has inactivated ! Please contact administrator.' });
                                } 
                            }else{
                                return res.status(401).send({ responseCode: 0, errorCode: 'iw1001', message: 'Authentication failed.' });
                            }                        
                        }else{
                            res.status(401).send({ responseCode: 0, errorCode: 'iw1001', message: 'Authentication failed.' });
                        } 
                    }
                }
            )
        }
    }
}