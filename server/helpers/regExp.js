module.exports.mobileRegx = /^[6-9][0-9]{9}$/;
module.exports.passwordRegx = /^(?=.*\d)(?=.*[!@#$%^&*_])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
module.exports.emailRegx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,13}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
module.exports.pincodeRegx = /([1-9]{1}[0-9]{5}|[1-9]{1}[0-9]{3}\\s[0-9]{3})/;
module.exports.alnumRegx = /^[a-zA-z0-9]+([\s][a-zA-Z0-9]+)*$/;
module.exports.alphaRegx = /^[a-zA-z]+([\s][a-zA-Z]+)*$/;
module.exports.alphaSpecialRegx = /^[a-zA-z]+([\s][_-a-zA-Z]+)*$/;
module.exports.numRegx = /^[0-9]+$/;
module.exports.alnumSpecialRegx = /^[A-Za-z0-9? ,_-]+$/;
module.exports.addressRegx = /^[A-Za-z0-9 ./,&#-]+$/;
module.exports.fileTypeRegx = /^([a-zA-Z0-9\s_\\.\-:])+(.png|.jpg|.jpeg|.gif)+$/;
module.exports.urlRegx = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
module.exports.colorCodeRegx = /^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
module.exports.nonHTMLRegx = /^[A-Za-z0-9/ ,)(@#!*+=^._-]+$/;
module.exports.currencyCodeRegx = /^([a-zA-Z]){3}$/;
module.exports.dayMonthRegx = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])$/;
// module.exports.dateRegx = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
module.exports.dateRegx = /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/;