'use strict';

// CLIENT_URL = http://localhost:8080
// DATABASE_URL = postgres://localhost:5432/

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const page = require('page');
const bodyParser = require('body-parser').urlencoded({extended: true});

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL;
const TOKEN = process.env.TOKEN;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());


app.get('/api/v1/books', (request, response) => { //from db
  client.query(`
    SELECT book_id, title, author, isbn, image_url 
    FROM books;`) //add ISBN if needed?
    .then(results => response.send(results.rows))
    .catch(console.error);
});

app.get('/api/v1/books/:book_id', (request, response) => {
  client.query(`
    SELECT * 
    FROM books 
    WHERE book_id=$1;`,
    [
      request.params.book_id
    ])
    .then(results => response.send(results.rows))
    .catch(console.error);
});

app.get('/api/v1/admin', (request, response) => {
  response.send(TOKEN === parseInt(request.query.token));
});
//or remove the {} and just have ))) after .token

app.post('/api/v1/books', bodyParser, (request, response) => { //put/post uses insert into
  console.log(request.body);
  client.query(`
    INSERT INTO books (title, author, isbn, image_url, description) 
    VALUES ($1, $2, $3, $4, $5)`,
    [
      request.body.title,
      request.body.author,
      request.body.isbn,
      request.body.image_url,
      request.body.description
    ])
    .then(() => response.sendStatus(201))
    .catch(console.error);
});

app.put('/api/v1/books/:book_id', bodyParser, (request, response) => {
  client.query(`
    UPDATE books 
    SET title=$2, author=$3, isbn=$4, image_url=$5, description=$6) 
    WHERE book_id=$1`,
    [
      request.params.book_id,
      request.body.title,
      request.body.author,
      request.body.isbn,
      request.body.image_url,
      request.body.description
    ])
    .then(() => response.sendStatus(201))
    .catch(console.error);
});

app.delete('/api/v1/books/:book_id', (request, response) => {
  client.query(`
    DELETE FROM books
    WHERE book_id=$1`,
    [
      request.params.book_id
    ])
    .then(() => response.sendStatus(201))
    .catch(console.error);
});


loadDB();

app.get('/*', (request, response) => response.redirect(CLIENT_URL));
app.get('/api/*', (request, response) => response.redirect(CLIENT_URL));
app.get('*', (request, response) => response.redirect(CLIENT_URL));
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