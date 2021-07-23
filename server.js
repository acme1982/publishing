const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

// Imports
const apiRouter = require('./api/api');

// Middleware
app.use(express.json());
const cors = require('cors');
app.use(cors());
const morgan = require('morgan');
app.use(morgan('dev'));
const errorHandler = require('errorhandler');
app.use(errorHandler());

// Routes
app.use('/api', apiRouter);

// Starting server on port 4001
app.listen(PORT, function () {
	console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
