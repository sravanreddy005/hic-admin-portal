const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const RandExp = require('randexp');
const winston = require('../helpers/winston');
const passwordGenRegx = /^([a-zA-Z0-9]){1}^([!@#$%&*_]){2}^([a-z0-9]){4}^([0-9]){2}^([A-Z0-9]){4}^([!@#$%&*_]){2}^([0-9]){1}$/;
const { emailRegx, alphaRegx, alnumRegx, alnumSpecialRegx, alphaSpecialRegx, addressRegx, mobileRegx, internationalMobileRegx, nonHTMLRegx, numRegx, pincodeRegx, dateRegx, passwordRegx, urlRegx } = require('./regExp');

module.exports.genarateRandomString = (length = 8) => {
    return new Promise((resolve, reject) => {
        const randomString = crypto.randomBytes(length).toString('hex');
        resolve(randomString);
    });
}

module.exports.genarateRandomPasswordByRegex = () => {
    return new Promise((resolve, reject) => {
        const Regex = passwordGenRegx;
        const randExp = new RandExp(Regex);
        resolve(randExp.gen());
    });
}

module.exports.generatePasswordHashSalt = () => {
    return new Promise((resolve, reject) => {
        const Regex = passwordGenRegx;
        const randExp = new RandExp(Regex);
        const randomString = randExp.gen();
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(randomString, salt, 1000, 64, 'sha512').toString('hex');

        resolve({salt, hash, password: randomString});
    });
};

module.exports.generateHashSaltUsingString = (randomString) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(randomString, salt, 1000, 64, 'sha512').toString('hex');

        resolve({salt, hash});
    });
};

module.exports.validatePassword = (password, salt, oldHash) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        resolve(hash === oldHash);
    });
};

module.exports.validateData = (type, data) => {
    switch(type){
        case 'email':
            return emailRegx.test(data);
            break;
        case 'alpha':
            return alphaRegx.test(data);
            break;
        case 'alnum':
            return alnumRegx.test(data);
            break;
        case 'num':
            return numRegx.test(data);
            break;
        case 'mobile':
            return mobileRegx.test(data);
            break;
        case 'alnumSpecial':
            return alnumSpecialRegx.test(data);
            break;
        case 'address':
            return addressRegx.test(data);
            break;
        case 'nonHTML':
            return nonHTMLRegx.test(data);
            break;
        case 'alphaSpecial':
            return alphaSpecialRegx.test(data);
            break;
        case 'pincode':
            return pincodeRegx.test(data);
            break;
        case 'date':
            return dateRegx.test(data);
            break;
        case 'password':
            return passwordRegx.test(data);
            break;
        case 'url':
            return urlRegx.test(data);
            break;
        case 'float':
            return !isNaN(parseFloat(data));
            break;
        default:
            return true;
            break;
    }    
};

//Generate JWT token
module.exports.generateJWT = (data, expiry) => {
    return new Promise((resolve, reject) => {
        const token = jwt.sign({
            data: data,
            exp: parseInt(expiry / 1000),
          }, process.env.JWT_SECRET);

        resolve(token);
    });
};

module.exports.genarateAccessToken = (data) => {
    return new Promise((resolve, reject) => {
        try {
            let token = jwt.sign({
                data: data,
                exp: Math.floor(Date.now() / 1000) + (60 * process.env.ACCESS_TOKEN_EXPIRY),
            }, process.env.ACCESS_TOKEN_SECRET);

            resolve(token);
        } catch (error) {
            reject();
        }
    });
}

module.exports.genarateRefreshToken = () => {
    return new Promise((resolve, reject) => {
        try {
            let token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * process.env.REFRESH_TOKEN_EXPIRY),
            }, process.env.REFRESH_TOKEN_SECRET);

            resolve(token);
        } catch (error) {
            reject();
        }
    });
}

module.exports.generateAccessAndRefreshToken = (data) => {
    return new Promise((resolve, reject) => {
        try {
            let accessToken = jwt.sign({
                data: data,
                exp: Math.floor(Date.now() / 1000) + (60 * process.env.ACCESS_TOKEN_EXPIRY),
            }, process.env.ACCESS_TOKEN_SECRET);

            let refreshToken = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * process.env.REFRESH_TOKEN_EXPIRY),
            }, process.env.REFRESH_TOKEN_SECRET);

            resolve({accessToken: accessToken, refreshToken: refreshToken});
        } catch (error) {
            reject();
        }
    });
}

//Decode JWT token
module.exports.decodeJWT = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, async(err, decoded) => {
            if (err){
                resolve();
            }else {          
                resolve(decoded);                           
            }
        });        
    });
};

//converting string to slug
module.exports.stringToSlug = (str) => {
    return new Promise((resolve, reject) => {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();
        
        // remove accents, swap ñ for n, etc
        var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
        var to   = "aaaaeeeeiiiioooouuuunc------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }
    
        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes
    
        resolve(str);
    });
}

//Sending message to whatsapp
module.exports.sendWhatsappMessage = (toMobileNo, template) => {
    return new Promise(async(resolve, reject) => {
        try {
            let fromPhoneNoID = '100745955996943';
            let apiURL = `https://graph.facebook.com/v13.0/${fromPhoneNoID}/messages`;
            let headers = {
                'Authorization': 'Bearer EAAX6oJjZBZATkBAF9GoAZBOn0y29x6p4d8BtXaDosqiVaRZBoltOJUbZBbQJHaes7y4TxPdRVarcRRjuwQ5zgEUu7D8Rm6OHaknAaSOVLEAnPOayvMssp64pZCduKYjDMU73NvNXKKvV2O0Thx9QcLJ49b51N2vUZBncoJIUQHN9sPvnuuvAp7KrQn2w71RZCTtoSIqBS3ClpgZDZD',
                'Content-Type': 'application/json'
            };
            let data = {
                messaging_product: 'whatsapp',
                to: toMobileNo,
                type: 'template',
                template: template
            }
            let apiResp = await this.externalApiRequest(apiURL, data, headers);
            console.log('sendWhatsappMessage apiResp', apiResp);
            if(apiResp){
                resolve(apiResp);
            }else{
                resolve(null);
            }
        } catch (error) {
            
        }        
    });
};

module.exports.externalApiRequest = (apiURL, data, headers) => new Promise(async (resolve, reject) => {
    const config = {
        method: 'post',
        url: apiURL,
        headers: headers,
        data : JSON.stringify(data)
    };

    axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
        resolve(response.data)
    })
    .catch(function (error) {
        console.log(error);
        winston.error({ [`Exception occured in ${apiURL} API with error`]: error });
        resolve(null);
    });

});

module.exports.externalApiRequest1 = (apiURL, data, headers) => new Promise(async (resolve, reject) => {
    const options = {
        headers,
        body: JSON.stringify(data),
        method: 'post',
    };
    fetch(apiURL, options)
    .then((response) => response.json())
    .then((result) => resolve(result))
    .catch((error) => {
        // eslint-disable-next-line no-console
        winston.error({ [`Exception occured in ${apiURL} API with error`]: error });
        reject(error);
    });
});