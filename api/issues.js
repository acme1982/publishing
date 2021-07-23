const express = require('express');
const issuesRouter = express.Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
	process.env.TEST_DATABASE || './database.sqlite',
);

// Get all records that have issues
issuesRouter.get('/', (req, res, next) => {
	const sql = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
	const values = { $seriesId: req.params.seriesId };
	db.all(sql, values, (err, issues) => {
		if (err) {
			next(err);
		} else if (issues) {
			return res.status(200).json({ issues: issues });
		} else {
			res.sendStatus(500);
		}
	});
});
// Create a new issues for specific series and return errors if not found on not present.
issuesRouter.post('/', (req, res, next) => {
	const sql = `INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)`;
	const name = req.body.issue.name;
	const issueNumber = req.body.issue.issueNumber;
	const publicationDate = req.body.issue.publicationDate;
	const artistId = req.body.issue.artistId;
	const artistData = 'SELECT * FROM Artist WHERE id = $artistId';
	const artistValues = { $artistId: artistId };
	const values = {
		$name: name,
		$issueNumber: issueNumber,
		$publicationDate: publicationDate,
		$artistId: artistId,
		$seriesId: req.params.seriesId,
	};
	db.get(artistData, artistValues, (err, artist) => {
		if (err) {
			next(err);
		} else if (!name || !issueNumber || !publicationDate || !artist) {
			return res.sendStatus(400);
		}
		db.run(sql, values, function (err) {
			if (err) {
				next(err);
			} else {
				db.get(
					`SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`,
					function (err, issue) {
						if (err) {
							next(err);
						} else {
							return res.status(201).json({ issue: issue });
						}
					},
				);
			}
		});
	});
});
// add issueId params
issuesRouter.param('issueId', (req, res, next, issueId) => {
	const sql = `SELECT * FROM Issue WHERE Issue.id = $issueId`;
	values = { $issueId: issueId };
	db.get(sql, values, (err, issue) => {
		if (err) {
			next(err);
		} else if (issue) {
			req.issue = issue;
			next();
		} else {
			res.sendStatus(500);
		}
	});
});

issuesRouter.put('/:issueId', (req, res, next) => {
	const name = req.body.issue.name;
	const issueNumber = req.body.issue.issueNumber;
	const publicationDate = req.body.issue.publicationDate;
	const artistId = req.body.issue.artistId;
	const artistData = 'SELECT * FROM Artist WHERE id = $artistId';
	const artistValues = { $artistId: artistId };

	db.get(artistData, artistValues, (err, artist) => {
		if (err) {
			next(err);
		} else if (!name || !issueNumber || !publicationDate || !artist) {
			return res.sendStatus(400);
		}
		const sql =
			'UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId WHERE Issue.id = $issueId';
		const values = {
			$name: name,
			$issueNumber: issueNumber,
			$publicationDate: publicationDate,
			$artistId: artistId,
			$issueId: req.params.issueId,
		};
		db.run(sql, values, (err) => {
			if (err) {
				next(err);
			} else {
				db.get(
					`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`,
					(err, issue) => {
						if (err) {
							next(err);
						} else {
							res.status(200).json({ issue: issue });
						}
					},
				);
			}
		});
	});
});

issuesRouter.delete('/:issueId', (req, res, next) => {
	const sql = 'DELETE FROM Issue WHERE Issue.id = $issueId';
	const values = { $issueId: req.params.issueId };

	db.run(sql, values, (err) => {
		if (err) {
			next(err);
		} else {
			res.sendStatus(204);
		}
	});
});

module.exports = issuesRouter;
