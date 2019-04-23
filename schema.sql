DROP TABLE IF EXISTS weathers;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS yelp;
DROP TABLE IF EXISTS trails;
DROP TABLE IF EXISTS locations;


CREATE TABLE locations ( 
    id SERIAL PRIMARY KEY, 
    search_query VARCHAR(255), 
    formatted_query VARCHAR(255), 
    latitude NUMERIC(10, 7), 
    longitude NUMERIC(10, 7)
  );

CREATE TABLE weathers (
  id SERIAL PRIMARY KEY,
  summary VARCHAR(255),
  time VARCHAR(255),
  date_created VARCHAR(255),
  location_id INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations (id)
);

CREATE TABLE movies ( 
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  overview TEXT,
  average_votes FLOAT,
  total_votes INTEGER,
--image_url VARCHAR(255),
  popularity FLOAT,
  released_on VARCHAR(255),
  -- date_created VARCHAR(255),
  location_id INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations (id)
);

CREATE TABLE yelp (
  id SERIAL PRIMARY KEY,
  image_url VARCHAR(255),
  name VARCHAR(255),
  price VARCHAR(255),
  rating FLOAT,
  url VARCHAR(255),
  -- date_created VARCHAR(255),
  location_id INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations (id)
);


CREATE TABLE trails (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  length FLOAT,
  stars FLOAT,
  star_votes INTEGER,
  summary VARCHAR(255),
  trail_url VARCHAR(255),
  conditions TEXT,
condition_date VARCHAR(255),
--condition_time VARCHAR(255)
-- "conditionDate": "2019-02-28 19:09:17"
  -- date_created VARCHAR(255),
  location_id INTEGER NOT NULL,
  FOREIGN KEY (location_id) REFERENCES locations (id)
);

 