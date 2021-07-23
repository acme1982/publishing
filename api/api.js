const express = require('express');
const apiRouter = express.Router();
const artistRouter = require('./artists');
const seriesRouter = require('./series');

// Routes
apiRouter.get('/', (req, res) => {
	res.status(200).send('Api Router main route');
});
apiRouter.use('/artists', artistRouter);
apiRouter.use('/series', seriesRouter);

module.exports = apiRouter;
