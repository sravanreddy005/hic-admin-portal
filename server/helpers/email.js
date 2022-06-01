const nodemailer = require('nodemailer');
var handlebars = require('handlebars');
var fs = require('fs');
var fromMail = 'info@innowig.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'emailsending.smtp@gmail.com',
        pass: 'emailsending_123'
    }
});

module.exports.sendMail = (toMail, replaceData, type) => {    
    return new Promise((resolve, reject) => {
        switch(type){
            case 'sendUserNamePassword':
                var templateFile = 'send-username-password.html';
                var subject = 'Authentication Details';
                break;
            case 'sendResetPassword':
                var templateFile = 'reset-password.html';
                var subject = 'Reset your password';
                break;
            default:
                subject = '';
                break;
        }

        fs.readFile(`./server/emails/${templateFile}`, {encoding: 'utf-8'}, function (err, html) {
            if (err) {
                console.log(err);
                reject(err)
              } else {
                const template = handlebars.compile(html);
                const htmlToSend = template(replaceData);
                const mailOptions = {
                    from: 'InnoWig ' + fromMail,
                    to: toMail,
                    subject: subject,
                    html: htmlToSend
                };
                transporter.sendMail(mailOptions, function(error, responseStatus) {
                  if (error) {
                    console.log(error);
                    reject(error);
                  } else {
                    resolve(responseStatus)
                  }
                });
              }
        });
    });
}