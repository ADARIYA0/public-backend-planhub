const authRoutes = require('./src/routes/authRoute');
const adminAuthRoutes = require('./src/routes/adminAuthRoute');
const eventRoute = require('./src/routes/eventRoute');
const cors = require("cors");
const express = require('express');
const path = require('path');

const app = express();

app.use(cors({
    origin: [/http:\/\/localhost:\d+$/],
    credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
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
