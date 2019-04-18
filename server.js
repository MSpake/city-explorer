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

  superagent.get(geocodeData).then(locationResult => {
    const first = locationResult.body.results[0];
    const location = new Location(query, first);
    client.query('INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)', [location.search_query, location.formatted_query, location.latitude, location.longitude]);
    response.send(location);
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
