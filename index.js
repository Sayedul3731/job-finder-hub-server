const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware 
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dvnw110.mongodb.net/?retryWrites=true&w=majority`;

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
    const verifyToken = async (req, res, next) => {
      const token = req.cookies?.token;
      console.log('token in the middleware', token);
      if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized' })
        }
        console.log('value in the token ', decoded);
        req.user = decoded;
        next()
      })
    }

    const jobsCollection = client.db('jobDB').collection('jobs')
    const appliedJobsCollection = client.db('jobDB').collection('appliedJobs')

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false
        })
        .send({ success: true })
    })


    app.post('/addAJob', verifyToken, async (req, res) => {
      const newJob = req.body;
      console.log('in the addAJob', req.body?.email , req.user.email);
      if(req.body?.email !== req.user.email){
        return res.status(403).send({ message: 'forbidden access' })
      }
      const result = await jobsCollection.insertOne(newJob)
      res.send(result)
    })

    app.get('/allJobs', async (req, res) => {
      const user = req.query;
      let query = {}
      if (user?.email) {
        query.email = user?.email
      }
      const result = await jobsCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/appliedJobs', verifyToken, async (req, res) => {
      const user = req.query;
      console.log(user);
      console.log('user in the valid token', req.user);
      console.log(req.query.email, req.user.email);
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const result = await appliedJobsCollection.find(user).toArray()
      res.send(result)
    })

    app.get('/allJobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })

    app.get('/update/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })

    app.delete('/myJobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.deleteOne(query)
      res.send(result)
      console.log(id);
    })

    app.patch('/update/:id', async (req, res) => {

      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const updateJob = req.body;
        const update = {
          $set: {
            name: updateJob.name,
            email: updateJob.email,
            category: updateJob.category,
            title: updateJob.title,
            salary: updateJob.salary,
            description: updateJob.description,
            jobPostingDate: updateJob.jobPostingDate,
            deadline: updateJob.deadline,
            applicants: updateJob.applicants,
            logo: updateJob.logo,
            photo: updateJob.photo
          }
        }
        const result = await jobsCollection.updateOne(filter, update)
        res.send(result)
      }
      catch {
        console.error(error)
      }
    })

    app.post('/allJobs', async (req, res) => {
      const appliedJob = req.body;
      const result = await appliedJobsCollection.insertOne(appliedJob)
      res.send(result)
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


app.get('/', (req, res) => {
  res.send('Job Finder Hub is running...')
})

app.listen(port, () => {
  console.log(`Job Finder Hub is running on port ${port}`)
})