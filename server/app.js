const express = require('express');
const path = require('path');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');


var app = express();

require('./config/config');
require('./database');

const winston = require('./helpers/winston');
const morgan = require('morgan'); 

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

// Rate Limiting
const limit = rateLimit({
    max: 100,// max requests
    windowMs: 60 * 60 * 1000, // 1 Hour of 'ban' / lockout 
    message: 'Too many requests' // message to send
});

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(xss()); // Data Sanitization against XSS
app.use(helmet());

app.use(express.static(path.join(__dirname, 'dist')));

app.use('/api/auth', authRoutes);
app.use('/api', adminRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

winston.stream = {
    write: function (message, encoding) {
      winston.info(message);
    }
};
  
app.use(morgan(':remote-addr :remote-user [:date[iso]] :method :url :status - :response-time ms ":referrer" ":user-agent"', {
"stream": winston.stream
}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With,content-type, Authorization');
    next();
});

// error handler
app.use((err, req, res, next) => {
    if (err.name === 'ValidationError') {        
        let valErrors = [];
        Object.keys(err.errors).forEach(key => valErrors.push(err.errors[key].message));
        const respMsg = {responseCode: 0, message: "iw1003 :: Bad Request", errorCode: 'iw1003', errors: valErrors};
        res.status(400).send(respMsg)
    }else{
        respMsg = {responseCode: 0, errorCode: 'iw1004', message: "iw1004 :: Somthing went wrong ! Please try again."};
        res.status(200).send(respMsg)
    }
});


// start server
app.listen(process.env.PORT, () => console.log(`Server started at port : ${process.env.PORT}`));