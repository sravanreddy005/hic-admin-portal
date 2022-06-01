const Cacheman = require('cacheman');
const cache = new Cacheman();

module.exports.setCache = (data, key, time = '24h') => {
    return new Promise((resolve, reject) => {
        cache.set(key, data, `${time}`, function (err, value) {
            if (err){
                console.log('cache set err', err);
                reject(err);
            }
            resolve();
        });
    });
} 

module.exports.getCache = (key) => {
    return new Promise((resolve, reject) => {
        cache.get(key, function (err, value) {            
            if (err){
                console.log('cache get err', err);
                reject(err);
            }
            resolve(value);
        });
    });    
} 

module.exports.deleteCache = (key) => {
    return new Promise((resolve, reject) => {
        cache.del(key, function (err) {
            if (err){
                console.log('cache delete err', err);
                reject(err);
            }
            cache.del(key+'_filter', function (err) {
                if (err){
                    reject(err);
                }
                resolve();
            });
        });
    });
} 

module.exports.clearAllCache = (key) => {
    cache.clear(function (err) {
        if (err) throw err;
        return true;
    });
} 