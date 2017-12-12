'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());

app.get('/', (req, res) => res.send('Testing 1, 2, 3'));

app.get('/index', (request, response) => {
  response.sendFile('index.html', { root: '../book-list-client' });
});

app.get('/api/v1/books', (request, response) => {
  client.query(`SELECT book_id, title, author, image_url FROM books`)
    .then(result => {
      response.send(result.rows);
    })
    .catch(err => {
      console.error(err);
    });
});





// app.get('*', (req, res) => res.redirect(laksjflkasj_URL

// CLIENT_URL = http://localhost:8080
// DATABASE_URL = postgres://localhost:5432/

function loadBooks() {
  client.query('SELECT COUNT(*) FROM books')
    .then(result => {
      if (!parseInt(result.rows[0].count)) {
        fs.readFile('../book-list-client/data/books.json', (err, fd) => {
          JSON.parse(fd.toString()).forEach(ele => {
            client.query(`
              INSERT INTO
              books(title, author, isbn, image_url, description)
              VALUES ($1, $2, $3, $4, $5);
            `,
              [ele.title, ele.author, ele.isbn, ele.image_url, ele.description]
            );
          });
        });
      }
    });
}

function loadDB() {
  client.query(`
    CREATE TABLE IF NOT EXISTS books (
      book_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      isbn VARCHAR (255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      description TEXT NOT NULL); 
    `)
    .then(loadBooks)
    .catch(err => {
      console.error(err);
    });
}


loadDB();

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));