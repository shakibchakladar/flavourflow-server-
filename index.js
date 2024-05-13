const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app=express();
const port=process.env.PORT ||5000;

// midleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9ttivus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const foodCollection=client.db('flavorflow').collection('foods');
    const purchaseCollection=client.db('flavorflow').collection('purchase')
    // get all foods data 
    app.get('/foods',async(req,res)=>{
      const cursor=foodCollection.find();
      const result=await cursor.toArray();
      res.send(result);
    })



    app.get("/singleFood/:id",async(req,res)=>{
      const result=await foodCollection.findOne({_id:new ObjectId(req.params.id)})
      res.send(result);
    })

    // purchase
    app.post("/purchase",async(req,res)=>{
      const purchase=req.body;
      console.log(purchase);
      const result=await purchaseCollection.insertOne(purchase);
      res.send(result);
    })
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('flavorFlow server is running')
})

app.listen(port,()=>{
    console.log(`flavorFlow server is running on port ${port}`);
})