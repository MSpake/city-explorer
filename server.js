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

const client = pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => console.error(error));

//==========================================
// Server Definition
//==========================================

const app = express();
app.use(cors());


//==========================================
// Constructors
//==========================================

function Location(query, data) {
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
}

function DailyWeather(forecast, time) {
  this.forecast = forecast;
  this.time = new Date(time * 1000).toString().slice(0, 15);
}


//==========================================
// Helper Functions
//==========================================

function searchLatLng(request, response) {
  // take the data from the front end
  const query = request.query.data;
  const geocodeData = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  console.log('checking the DATABASE');
  client.query('SELECT * FROM locations WHERE search_query=$1', [query])
    .then(result => {
      console.log('result from DATABASE');
      if (result.rows.length) { // (stuff in the db)
        console.log('Exists in the DATABASE');
        response.send(result.rows[0]);
      } else {
        superagent.get(geocodeData).then(locationResult => {
          const first = locationResult.body.results[0];
          const responseObject = new Location(query, first);
          response.send(responseObject);
        });
      }
    });
}

function searchWeather(request, response) {
  const weatherQuery = request.query.data;
  const weatherData = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${weatherQuery.latitude},${weatherQuery.longitude}`;

  superagent.get(weatherData).then(weatherResult => {
    const weeklyWeatherArray = weatherResult.body.daily.data.map(dayObj => new DailyWeather(dayObj.summary, dayObj.time));
    response.send(weeklyWeatherArray);
  });
}


//==========================================
// Server
//==========================================

app.get('/location', searchLatLng);

app.get('/weather', searchWeather);

// Standard response for when a route that does not exist is accessed.
app.use('*', (request, response) => {
  response.send('Route not available');
});

//==========================================

//server start
app.listen(PORT, () => {
  console.log(`app is up on PORT ${PORT}`);
});
