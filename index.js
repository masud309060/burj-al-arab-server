const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const admin = require('firebase-admin');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;

const port = 5000
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rrq7z.mongodb.net/burj-al-arab?retryWrites=true&w=majority`;



var serviceAccount = require("./configs/burj-al-arab-78e62-firebase-adminsdk-dpz7m-aac6b4734c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_URL
});

const app = express()
app.use(bodyParser.json())
app.use(cors())


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookingCollection = client.db("burj-al-arab").collection("bookings");
  
  app.post('/addbooking', (req, res) => {
      const newBooking = req.body;
      bookingCollection.insertOne(newBooking)
      .then(result => {
          res.send(result.insertedCount > 0)
          res.redirect('/')
      })
  })

  app.get('/bookings', (req,res) => {
      // console.log(req.headers.authorization)
      const bearer = req.headers.authorization
      if( bearer && bearer.startsWith('Bearer ')){
          const idToken = bearer.split(' ')[1]
          admin.auth().verifyIdToken(idToken)
          .then(function(decodedToken) {
            let uid = decodedToken.uid;
            const tokenEmail = decodedToken.email;

          if( tokenEmail == req.query.email){
            bookingCollection.find({email: req.query.email})
            .toArray((err, documents) => {
              res.send(documents)
            })
          }
          else{res.status(401).send("Un-authorization")}
        }).catch(function(error) {
            res.status(401).send('Un-authorization')
        });
      }
      else{
        res.status(401).send('Un-authorized')
      }
  })
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)