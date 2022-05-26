const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dcsdp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }

async function run() {
    try{

        await client.connect();
        const productsCollection = client
          .db("toolkits")
          .collection("products");
        const reviewsCollection = client.db("toolkits").collection("reviews");
        const usersCollection = client.db("toolkits").collection("users");
        const orderCollection = client.db("toolkits").collection("order")

         app.get('/product', async (req, res) =>{
             const query = {};
             const cursor = productsCollection.find(query);
             const products = await cursor.toArray();
             res.send(products);
         });

         app.get('/user', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
          });

          app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await usersCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
          });

        //   POST 

        app.post('/product', async(req, res) =>{
            const newItem = req.body;
            const result = await productsCollection.insertOne(newItem);
            res.send(result);
        });

        app.post('/review', async(req, res) =>{
            const newReview = req.body;
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result);
        });

        app.post('/order', async(req, res) =>{
            const query = req.body;
            const order = await orderCollection.insertOne(query);
            res.send(order);
        });

        // GET

        app.get('/order', async(req, res) =>{
            const query = req.body;
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });


        app.get("/myitems", async (req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const cursor = await orderCollection.find(query).toArray();
            res.send(cursor);
            // const decodedEmail = req.decoded.email;
            // if (email === decodedEmail) {
            //   const query = { email: email };
            //   const cursor = orderCollections.find(query);
            //   const result = await cursor.toArray();
            //   return res.send(result);
            // } else {
            //   return res.status(403).send({ message: "forbidden access" });
            // }
          });


        // PUT 

          app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
              $set: { role: 'admin' },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({result, token});
          }) 

         app.get('/product/:id', async (req, res) => {
             const id = req.params.id;
             const query = {_id: ObjectId(id)};
             const productId = await productsCollection.findOne(query);
             res.send(productId);
         })

         app.get('/review', async (req, res) => {
             const query = {};
             const cursor = reviewsCollection.find(query);
             const reviews = await cursor.toArray();
             res.send(reviews);
         });

        //  DELETE
        app.delete('/product/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        });

         app.put('/user/:email', async(req, res) =>{
             const email = req.params.email;
             const user = req.body;
             const filter = {email: email};
             const options = {upsert: true};
             const updateDoc = {
                $set: user,
              };
              const result = await usersCollection.updateOne(filter, updateDoc, options);
              const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
              res.send({result, token});
         })

    }
    finally {

    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello From ToolKits!");
  });

app.listen(port, () => {
    console.log(`Toolkits App listening on port ${port}`);
  });


//   git init
// git add README.md
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/programming-hero-web-course1/manufacturer-website-server-side-Mehadi-Hasan98.git
// git push -u origin main