const authRoutes = require('./src/routes/authRoute');
const eventRoute = require('./src/routes/eventRoute');
const cors = require("cors");
const express = require('express');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/event', eventRoute)

app.get('/status', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is healthy',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

module.exports = app;
