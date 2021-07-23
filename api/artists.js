const express = require('express');
const artistRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
	process.env.TEST_DATABASE || './database.sqlite',
);

// Routes
artistRouter.get('/', (req, res, next) => {
	const sql = `SELECT * FROM Artist WHERE is_currently_employed = 1`;
	db.all(sql, (err, rows) => {
		if (err) {
			next(err);
		}
		res.status(200).json({ artists: rows });
	});
});
// Helper: to have artistID when we need it
artistRouter.param('artistId', (req, res, next, artistId) => {
	const sql = `SELECT * FROM Artist WHERE Artist.id = $artistId;`;
	const values = { $artistId: artistId };
	db.get(sql, values, (err, artist) => {
		if (err) {
			console.log('in params error');
			next(err);
		} else if (artist) {
			req.artist = artist;
			next();
		} else {
			res.status(404).json({ error: err });
		}
	});
});
// Get artist
artistRouter.get('/:artistId', (req, res, next) => {
	res.status(200).json({ artist: req.artist });
});
// Add artist
artistRouter.post('/', (req, res, next) => {
	const sql = `INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)`;
	const name = req.body.artist.name;
	const dateOfBirth = req.body.artist.dateOfBirth;
	const biography = req.body.artist.biography;
	const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed;
	const values = {
		$name: name,
		$dateOfBirth: dateOfBirth,
		$biography: biography,
		$isCurrentlyEmployed: isCurrentlyEmployed,
	};
	db.run(sql, values, function (err) {
		if (err) {
			next(err);
		} else if (!name || !dateOfBirth || !biography) {
			res.sendStatus(400);
			return;
		} else {
			db.get(
				`SELECT * FROM Artist WHERE Artist.id = ${this.lastID}`, // when using this.lastID you cannot use => just a normal functions allowed.
				function (err, artist) {
					if (err) {
						next(err);
					} else {
						res.status(201).json({ artist: artist });
						return;
					}
				},
			);
		}
	});
});
// Update artist
artistRouter.put('/:artistId', function (req, res, next) {
	const sql = `UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId`;
	const name = req.body.artist.name;
	const dateOfBirth = req.body.artist.dateOfBirth;
	const biography = req.body.artist.biography;
	const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed ? 0 : 1;
	const values = {
		$name: name,
		$dateOfBirth: dateOfBirth,
		$biography: biography,
		$isCurrentlyEmployed: isCurrentlyEmployed,
		$artistId: req.params.artistId,
	};
	db.run(sql, values, function (err) {
		if (err) {
			next(err);
		} else if (!name || !dateOfBirth || !biography) {
			res.sendStatus(400);
		} else {
			db.get(
				`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
				function (err, artist) {
					if (err) {
						next(err);
					} else {
						res.status(200).json({ artist: artist });
					}
				},
			);
		}
	});
});
// Hide artist, we will change is_currently_employed to 0, this way we wont be able to see them.
artistRouter.delete('/:artistId', function (req, res, next) {
	const sql = `UPDATE Artist SET is_currently_employed = 0 WHERE Artist.id = ${req.params.artistId}`;
	db.run(sql, function (err) {
		if (err) {
			next(err);
		} else {
			db.get(
				`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`,
				function (err, artist) {
					if (err) {
						next(err);
					} else {
						res.status(200).json({ artist: artist });
					}
				},
			);
		}
	});
});

module.exports = artistRouter;
