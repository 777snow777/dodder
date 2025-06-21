// const client = require('./db.js')
const express = require('express');
const { Client } = require('pg');
const fs = require('fs');
const port = 3000; 
const dbname = "dodder"
const app = express();
const path = require('path');
const multer  = require('multer')
var bodyParser = require('body-parser')
app.use(express.urlencoded({ extended: true })); 
app.use(
  bodyParser.json({
      limit: "50mb",
  })
);
// const storage = multer.memoryStorage()
// const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }});
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const fileNameArr = file.originalname.split('.');
    cb(null, `${Date.now()}.${fileNameArr[fileNameArr.length - 1]}`);
  },
});
const upload = multer({ storage });
app.use(express.static('uploads'));


app.use(express.static(path.join('')));
// app.use(express.urlencoded({
//   extended: true
//   }));

// const formidable = require('express-formidable');

// app.use(formidable());
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'webapp',
    password: 'dodder',
    port: 5432,
  });

client.connect()


async function createDodderTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS ${dbname} (
        id SERIAL PRIMARY KEY,
        message_id NUMERIC(10, 2),
        message VARCHAR(255),
        audio BYTEA,
        message_type VARCHAR(255)
      );
    `;
    await client.query(query);
    console.log('dodder table created');
  } catch (err) {
    console.error(err);
    console.error('dodder table creation failed');
  }
}

createDodderTable();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '', 'test.html'));
});

app.get('/init-dodder-web', (req, res) => {
  const query = `SELECT * FROM ${dbname};`;
  let dodder
  let audioFiles
  client.query(query, (error, result) => {
    if (error) {
      console.log('Error occurred:', error);
      res.status(500).send('An error occurred while retrieving data from the database.');
    } else {
      dodder = result.rows;
    }
    fs.readdir("uploads", (err, fileNames) => {
      if (err) {
        console.error('Error reading directory:', err);
        return;
      }
      audioFiles = fileNames
      let responseData = {
        dodder: dodder,
        audioFiles: audioFiles
      }
      res.status(200).json(responseData);
    })
    
  })
  
});

 app.post('/dodder-web-send', (req, res) => {
  try {
      client.query(`INSERT INTO ${dbname} (message, message_type) VALUES ($1, $2)`, [req.body.text_message,"text"]);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(error.err).send();
  }
  return
});


//use mutler to save audio into disk storage
app.post('/dodder-web-save-audio',upload.single('recording'), (req, res) => {
  try {
      let fn = "uploads/"+req.file.filename
      client.query(`INSERT INTO ${dbname} (message, message_type) VALUES ($1, $2)`, [fn,"audio"]);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(error.err).send();
  }
  return
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});