const multer = require('multer');
var fileExtension = require('file-extension')

module.exports.uploadCSVFiles = multer({   
    // Configure Storage 
    storage: multer.diskStorage({
        // Setting directory on disk to save uploaded files
        destination: function (req, file, cb) {
            cb(null, `./server/uploads/${req.body.file_path}`)
        },
        // Setting name of file saved
        filename: function (req, file, cb) {
            cb(null, (file.fieldname).replace(/_/g, '-') + '-' + Date.now() + '.' + fileExtension(file.originalname))
        }
    }),
    limits: {
        // Setting Image Size Limit to 2MBs
        fileSize: 10000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(csv|xls|xlsx)$/)) {
            //Error 
            cb(new Error('Please upload CSV, XLX and XLSX files only!'))
        }
        //Success 
        cb(undefined, true)
    }
});
module.exports.uploadImages = multer({   
    // Configure Storage 
    storage: multer.diskStorage({
        // Setting directory on disk to save uploaded files
        destination: function (req, file, cb) {
            cb(null, `./server/uploads/${req.body.image_path}`)
        },
        // Setting name of file saved
        filename: function (req, file, cb) {
            cb(null, (file.fieldname).replace(/_/g, '-') + '-' + Date.now() + '.' + fileExtension(file.originalname))
        }
    }),
    limits: {
        // Setting Image Size Limit to 2MBs
        fileSize: 2000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            //Error 
            cb(new Error('Please upload JPG, JPEG and PNG and images only!'))
        }
        //Success 
        cb(undefined, true)
    }
});

module.exports.uploadFiles = multer({   
    // Configure Storage 
    storage: multer.diskStorage({
        // Setting directory on disk to save uploaded files
        destination: function (req, file, cb) {
            cb(null, `./server/uploads/${req.body.file_path}`)
        },
        // Setting name of file saved
        filename: function (req, file, cb) {
            cb(null, (file.fieldname).replace(/_/g, '-') + '-' + Date.now() + '.' + fileExtension(file.originalname))
        }
    }),
    limits: {
        // Setting File Size Limit to 2MBs
        fileSize: 2000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
            //Error 
            cb(new Error('Please upload PDF, JPG, JPEG and PNG files only!'))
        }
        //Success 
        cb(undefined, true)
    }
});