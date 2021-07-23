const express = require('express');
const seriesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
	process.env.TEST_DATABASE || './database.sqlite',
);
// Import issues router and merge it on /:serriesId/issue
const issuesRouter = require('./issues');

// Handle seriesId and attach it to req.series
seriesRouter.param('seriesId', (req, res, next, seriesId) => {
	const sql = `SELECT * FROM Series WHERE Series.id = $seriesId`;
	const values = { $seriesId: seriesId };
	db.get(sql, values, (err, series) => {
		if (err) {
			next(err);
		} else if (series) {
			req.series = series;
			next();
		} else {
			res.sendStatus(404);
		}
	});
});
// mount /:seriesId/issues routes
seriesRouter.use('/:seriesId/issues', issuesRouter);

// Get all series
seriesRouter.get('/', function (req, res, next) {
	const sql = `SELECT * FROM Series`;
	db.all(sql, function (err, series) {
		if (err) {
			res.status(500).json({ error: err });
			next(err);
		} else {
			res.status(200).json({ series: series });
			next();
		}
	});
});
// Get a specific series
seriesRouter.get('/:seriesId', (req, res) => {
	res.status(200).json({ series: req.series });
});
// Add new series
seriesRouter.post('/', function (req, res, next) {
	const sql = `INSERT INTO Series (name, description) VALUES ($name, $description)`;
	const name = req.body.series.name;
	const description = req.body.series.description;
	const values = {
		$name: name,
		$description: description,
	};
	db.run(sql, values, function (err) {
		if (err) {
			next(err);
		} else if (!name || !description) {
			res.sendStatus(500);
		} else {
			db.get(
				`SELECT * FROM Series WHERE Series.id = ${this.lastID}`,
				function (err, series) {
					if (err) {
						return next(err);
					} else {
						res.status(201).json({ series: series });
					}
				},
			);
		}
	});
});
// Update selected series with
seriesRouter.put('/:seriesId', function (req, res, next) {
	const sql = `UPDATE Series SET name = $name, description = $description WHERE Series.id = $seriesId`;
	const name = req.body.series.name;
	const description = req.body.series.description;
	const values = {
		$name: name,
		$description: description,
		$seriesId: req.params.seriesId,
	};
	db.run(sql, values, function (err) {
		if (err) {
			res.status(400).json({ error: err.message });
			return next(err);
		} else if (!name || !description) {
			return res.sendStatus(400);
		} else {
			db.get(
				`SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`,
				function (err, series) {
					if (err) {
						next(err);
					} else {
						res.status(200).json({ series: series });
					}
				},
			);
		}
	});
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
	const sqlGetIssues = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
	const issuesValues = { $seriesId: req.params.seriesId };

	db.all(sqlGetIssues, issuesValues, function (err, series) {
		if (err) {
			next(err);
		} else if (series !== null) {
			const sqlDeleteSeries = 'DELETE FROM Series WHERE id = $seriesId';
			const seriesValues = { $seriesId: req.params.seriesId };

			db.run(sqlDeleteSeries, seriesValues, function (err) {
				if (err) {
					next(err);
				} else {
					return res.sendStatus(204);
				}

				return res.sendStatus(500);
			});
		}
	});
});
//Export for testing purposes
module.exports = seriesRouter;
