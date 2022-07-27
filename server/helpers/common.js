const jwt = require('jsonwebtoken');
const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const crypto = require('crypto');
const RandExp = require('randexp');
const winston = require('../helpers/winston');
const passwordGenRegx = /^([a-zA-Z0-9]){1}^([!@#$*_]){2}^([a-z0-9]){4}^([0-9]){2}^([A-Z0-9]){4}^([!@#$*_]){2}^([0-9]){1}$/;
const { emailRegx, alphaRegx, alnumRegx, alnumSpecialRegx, alphaSpecialRegx, addressRegx, mobileRegx, nonHTMLRegx, numRegx, pincodeRegx, dateRegx, dateRegx2, passwordRegx, urlRegx, aadharRegx, panCardRegx, gstnRegx, passportRegx } = require('./regExp');

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
        case 'date2':
            return dateRegx2.test(data);
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
        case 'aadhar':
            return aadharRegx.test(data);
            break;
        case 'pancard':
            return panCardRegx.test(data);
            break;
        case 'gstn':
            return gstnRegx.test(data);
            break;
        case 'passport':
            return passportRegx.test(data);
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
            let fromPhoneNoID = '100231582742912';
            let apiURL = `https://graph.facebook.com/v13.0/${fromPhoneNoID}/messages`;
            let headers = {
                'Authorization': 'Bearer ',
                'Content-Type': 'application/json'
            };
            let data = {
                messaging_product: 'whatsapp',
                to: toMobileNo,
                type: 'template',
                template: template,
                preview_url: true,
            }
            let apiResp = await this.externalApiRequest(apiURL, data, headers);
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

module.exports.amountInwords = (amount) => {
    return new Promise((resolve, reject) => {
      amount = parseInt(amount);
      const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
      const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
      n = ('000000000' + amount).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) resolve(); var str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only' : '';
      resolve((str.charAt(0).toUpperCase() + str.slice(1)).toUpperCase() + ' ONLY');
    });
  }
  
  module.exports.formatDate = (date, format = 'dd/mm/yyyy') => {
    return new Promise((resolve, reject) => {
      if(date){
        let formattedDate = new Date(date);
        let day = formattedDate.getDate().toString();
        let month = (formattedDate.getMonth() + 1).toString();
        let year = formattedDate.getFullYear().toString();
        let returnDate = day + '/' + month + '/' + year;
        if(format && format === 'dd/mm/yyyy'){
          returnDate = day + '/' + month + '/' + year;
        }else if(format && format === 'yyyy/mm/dd'){
          returnDate = year + '/' + month + '/' + day;
        }else if(format && format === 'mm/dd/yyyy'){
          returnDate = month + '/' + day + '/' + year;
        }else if(format && format === 'dd-mm-yyyy'){
          returnDate = day + '-' + month + '-' + year;
        }
        resolve(returnDate);
      }else{
        resolve();
      }
    });
  }

module.exports.getSumByKey = (arr, key) => {
    return new Promise((resolve, reject) => {
        let value = arr.reduce((accumulator, current) => accumulator + Number(current[key]), 0);
        resolve(value);
    });
}

module.exports.getSumByKeyWithFilter = (arr, key, compareKey ='', compareVal = '') => {
    return new Promise((resolve, reject) => {
        let value = arr.filter((data) => data[compareKey] === compareVal).reduce((accumulator, current) => accumulator + Number(current[key]), 0);
        resolve(value);
    });
}

module.exports.getSumByKeyWithFilters = (arr, key, compareKey1 = '', compareVal1 = '', compareKey2 = '', compareVal2 = '') => {
    return new Promise((resolve, reject) => {        
        let value = arr.filter((data) => data[compareKey1] === compareVal1 && data[compareKey2] === compareVal2).reduce((accumulator, current) => accumulator + Number(current[key]), 0);
        resolve(value);
    });
}

module.exports.parseExcel = (filePath, unlinkFile = true) => {
    return new Promise((resolve, reject) => {        
        const file = xlsx.readFile(filePath);
        let data = [];
        const sheets = file.SheetNames;        
        for(let i = 0; i < sheets.length; i++){
            const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]])
            temp.forEach((res) => {
                data.push(res);
            });
        }  
        if(unlinkFile){     
            fs.unlinkSync(filePath); 
        }
        resolve(data);
    });
}

module.exports.roundOffWeight = (weight) => {
    return new Promise((resolve, reject) => {
        let decimal =  parseFloat((weight - Math.floor(weight)).toFixed(2));
        let finalWeight = weight;
        if(decimal !== 0 && weight > 20){
            finalWeight = Math.trunc(weight) + 1;
        }else if(decimal !== 0 && decimal <= 0.5){
            finalWeight = Math.trunc(weight) + 0.5;
        }else if(decimal !== 0 && decimal > 0.5){
            finalWeight = Math.trunc(weight) + 1;
        }

        resolve(finalWeight);
    });
}

module.exports.groupArrayOfObjects = (list, key) => {
    return new Promise((resolve, reject) => {
        let data =  list.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
        let result = [];

        const groups = Object.keys(data).map(function (key) {
            return {group: key, values: data[key]};
        });

        resolve(groups);
    });
}