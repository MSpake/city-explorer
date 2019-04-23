'use strict';

//==========================================
// Configure
//==========================================

require('dotenv').config();

//==========================================
// Global Variables
//==========================================

const PORT = process.env.PORT || 3000;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

//==========================================
// Postgres Client Setup
//==========================================

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => console.error(error));

//==========================================
// Server Definition
//==========================================

const app = express();
app.use(cors());

//==========================================
// SQL
//==========================================

const SQL = {};
SQL.getLocation = 'SELECT * FROM locations WHERE search_query=$1';
SQL.insertLocation = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)';
SQL.getLocationReference = 'SELECT id FROM locations WHERE latitude=$1 AND longitude=$2';
// SQL.getData = `SELECT * FROM ${route} WHERE location_id=${locationId}`;

//==========================================
// Constructors
//==========================================

function Location(query, data) {
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
}

function DailyWeather(data) {
  this.forecast = data.summary;
  this.time = new Date(data.time * 1000).toString().slice(0, 15);
  // this.created = Date.now()
}

function Movie(data) {
  this.title = data.title,
  this.overview = data.overview,
  this.average_votes = data.vote_average,
  this.total_votes = data.vote_count,
  // this.image_url = data.poster_path,
  this.popularity = data.popularity,
  this.released_on = data.release_date;
}


//==========================================
// Helper Functions
//==========================================

function locationQuery(request, response) {
  console.log('location');

  const query = request.query.data;
  client.query(SQL.getLocation, [query])
    .then(result => {
      if (result.rows.length) {
        console.log('from database');
        response.send(result.rows[0]);
      } else {
        console.log('from internet');
        searchLocation(query, response);
      }
    });
}

function searchLocation(query, response) {
  const geocodeData = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

  superagent.get(geocodeData).then(result => {
    console.log('location get');
    const firstResult = result.body.results[0];
    const location = new Location(query, firstResult);
    client.query(SQL.insertLocation, [location.search_query, location.formatted_query, location.latitude, location.longitude]);
    client.query('SELECT * FROM locations;').then(result => {
      console.log(result.rows);
      response.send(location);
    });
  });
}

function weatherQuery(request, response) {
  console.log('weather');
  const query = request.query.data;
  const route = 'weathers';
  checkDatabase(route, query).then(result => {
    if (result) {
      console.log('from database');
      console.log(result.rows);
      const difference = (Date.now() / 1000) - (parseInt(result.rows[0].time, 10));
      console.log(difference);
      if (difference < 86400) {
        response.send(result.rows.map(dayObj => new DailyWeather(dayObj.forecast, dayObj.time)));
      } else {
        searchWeather(query, result.rows[0].location_id, response, true);
      }
    } else {
      console.log('from internet');
      searchWeather(query, result.rows[0].location_id, response, false);
    }
  });
}

function searchWeather(query, locationId, response, update) {
  const weatherData = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${query.latitude},${query.longitude}`;

  superagent.get(weatherData).then(result => {
    const weeklyWeatherArray = result.body.daily.data.map(dayObj => {
      if (update) {
        client.query('UPDATE weathers SET forecast=$1, time=$2 WHERE location_id=$3', [dayObj.summary, dayObj.time, locationId]);
      } else {
        client.query('INSERT INTO weathers (forecast, time, location_id) VALUES ($1, $2, $3)', [dayObj.summary, dayObj.time, locationId]);
      }
      return new DailyWeather(dayObj);
    });
    response.send(weeklyWeatherArray);
  });
}

function moviesQuery(request, response) {
  const query = request.query.data;
  const route = 'movies';

  // checkDatabase(route, query).then(result => {
  //   if (result) {
  //     console.log('from database');
  //     console.log(result.rows);
  //     if () {
  //     } else {
  //     }
  //   } else {
  //   }
  // });

  const movieData = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${request.query.data.search_query}`;

  superagent.get(movieData).then(result => {
    const movieArray = [];
    for (let i = 0; i < 20; i++) {
      movieArray.push(new Movie(result.body.results[i]));
    }
    response.send(movieArray);
  });
}

function yelpQuery(request, response) {
  const query = request.query.data;

  //
}

function trailsQuery(request, response) {
  const query = request.query.data;

  //
}

function checkDatabase(route, query) {
  let check = client.query(SQL.getLocationReference, [query.latitude, query.longitude]).then(result => {
    const locationId = result.rows[0].id;
    const inDatabase = client.query(`SELECT * FROM ${route} WHERE location_id=$1`, [locationId]).then(result => {
      if (result.rows.length) return result;
      else return false;
    });
    return inDatabase;
  });
  return check;
}

function handleError(error, response) {
  console.log(error);
  if (response) response.status(500).send('Something has gone wrong, unable to complete yor request');
}

//==========================================
// Server
//==========================================

app.get('/location', locationQuery);

app.get('/weather', weatherQuery);

app.get('/movies', moviesQuery);

app.get('/yelp', yelpQuery);

app.get('/trails', trailsQuery);



// Standard response for when a route that does not exist is accessed.
app.use('*', (request, response) => {
  response.send('Route not available');
});

//==========================================

//server start
app.listen(PORT, () => {
  console.log(`app is up on PORT ${PORT}`);
});
