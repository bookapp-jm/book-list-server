'use strict';

// CLIENT_URL = http://localhost:8080
// DATABASE_URL = postgres://localhost:5432/

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const page = require('page');
const bodyparser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());
app.use(bodyparser());

app.get('/index', (request, response) => {
  response.sendFile('index.html', { root: '../book-list-client' });
});

app.get('/new', (request, response) => {
  response.sendFile('new.html', { root: '../book-list-client' });
});

app.get('/api/v1/books', (req, res) => {
  client.query(`SELECT book_id, title, author, isbn, image_url FROM books;`) //add ISBN if needed?
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.get('/api/v1/books/:book_id', (request, response) => {
  client.query(`
    SELECT * 
    FROM books 
    WHERE book_id=$1;
    `,
    [
      request.params.book_id
    ])
    .then(results => response.send(results.rows))
    .catch(console.error);
});

app.post('/books/new', (req, res) => {
  client.query(`
    INSERT INTO books (book_id, title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      req.body.book_id,
      req.body.title,
      req.body.author,
      req.body.isbn,
      req.body.image_url,
      req.body.description
    ])
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.post('/api/vi/books', (req, res) => {
  client.query(`
    INSERT INTO books (book_id, title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      req.body.book_id,
      req.body.title,
      req.body.author,
      req.body.isbn,
      req.body.image_url,
      req.body.description
    ])
    .then(results => res.send(results.rows))
    .catch(console.error);
});



loadDB();

// app.get('/api/*', (req, res) => res.redirect(CLIENT_URL));
app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));


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