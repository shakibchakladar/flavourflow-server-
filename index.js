const express = require('express');
const cors = require('cors');
const jwt=require('jsonwebtoken')
const cookieParser=require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app=express();
const port=process.env.PORT ||5000;

// midleware
app.use(cors({
  origin:[
    'http://localhost:5173',
    'https://flavorflow-6eaef.web.app',
    'https://flavorflow-6eaef.firebaseapp.com'
  ],
  credentials:true,
  // optionsSuccessStatus:200,
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9ttivus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares
const logger=(req,res,next)=>{
  console.log('log:info', req.method,req.url);
  next()
}

const verifyToken=(req,res,next)=>{
  const token=req?.cookies?.token;
  // console.log('token in the midleware',token);
  if(!token){
    return res.status(401).send({message: 'unauthorise acces'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({message: 'unauthorised acces'})
    }
    req.user=decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const foodCollection=client.db('flavorflow').collection('foods');
    const purchaseCollection=client.db('flavorflow').collection('purchase')

    // auth related api
    app.post("/jwt",logger, async(req,res)=>{
      const user=req.body;
      console.log('user for token',user);
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
      res.cookie('token',token,{
        httpOnly:true,
        secure:true,
        sameSite: 'none'
      })
      .send({success: true})
    })

    app.post("/logout",async(req,res)=>{
      const user=req.body;
      console.log('logging out',user);
      res.clearCookie('token',{maxAge: 0}).send({success: true})
    })


    // food
    app.get("/myfood/:email",logger,verifyToken, async(req,res)=>{
      // console.log(req.params.email);
      console.log('token owner info',req.user);
      if(req.user.email !== req.params.email){
        return res.status(403).send({message: 'forbidden acces'})
      }
      const result=await foodCollection.find({email:req.params.email}).toArray()
      res.send(result)

    })

    // add food
    app.post("/addfood",async(req,res)=>{
      // console.log(req.body);
      const result=await foodCollection.insertOne(req.body);
      res.send(result);

    })
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

    app.get("/purchase",async(req,res)=>{
      // console.log(req.query.email);
      let query={}
      if(req.query?.email){
        query={email:req.query.email}
      }
      const result=await purchaseCollection.find(query).toArray();
      res.send(result);
    })

    app.post("/purchase",async(req,res)=>{
      const purchase=req.body;
      // console.log(purchase);
      const result=await purchaseCollection.insertOne(purchase);
      res.send(result);
    })

    app.delete("/purchase/:id",async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await purchaseCollection.deleteOne(query)
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