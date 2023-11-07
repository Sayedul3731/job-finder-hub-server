const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware 
app.use(cors())
app.use(express.json())

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

    const jobsCollection = client.db('jobDB').collection('jobs')
    const appliedJobsCollection = client.db('jobDB').collection('appliedJobs')

    app.post('/addAJob', async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob)
      res.send(result)
    })

    app.get('/allJobs', async (req, res) => {
      const user = req.query;
      console.log(user.email);
      let query = {}
      if (user?.email) {
        query.email = user?.email
      }
      console.log(query);
      const result = await jobsCollection.find(query).toArray()
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
    app.patch('/update/:id', async (req, res) => {

      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const updateJob = req.body;
        console.log(filter, updateJob);
        const update = {
          $set: {
            name:updateJob.name,
            email:updateJob.email,
            category:updateJob.category,
            title:updateJob.title,
            salary:updateJob.salary,
            description:updateJob.description,
            jobPostingDate:updateJob.jobPostingDate,
            deadline:updateJob.deadline,
            applicants:updateJob.applicants,
            logo:updateJob.logo,
            photo:updateJob.photo
          }
        }
        const result = await jobsCollection.updateOne(filter, update)
        res.send(result)
      }
      catch {
        console.error(error)
      }
    })

    app.post('/allJobs/:id', async (req, res) => {
      const appliedJob = req.body;
      const result = await appliedJobsCollection.insertOne(appliedJob)
      res.send(result)
    })

    // myJobs here 
    // app.get('/myJobs', async(req, res) => {
    // const query = req.body;
    // console.log(query);
    // })
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