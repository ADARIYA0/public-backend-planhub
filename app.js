const { corsOptions } = require('./src/config/corsOption');
const adminRoute = require('./src/routes/adminRoute');
const authRoute = require('./src/routes/authRoute');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const eventRoute = require('./src/routes/eventRoute');
const express = require('express');
const path = require('path');

const app = express();

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoute);
app.use('/api/auth/admin', adminRoute);
app.use('/api/event', eventRoute)

app.get('/status', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is healthy',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;
