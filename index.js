const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const port = process.env.PORT || 9000;
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

const uri = process.env.MONGODB_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // define the database name
    const dbName = client.db("soloSphere");
    const jobsCollection = dbName.collection("jobs");

    // 1.store jobs
    app.post("/jobs", async (req, res) => {
      // 1. collect data to req.body
      const data = req.body;
      // 2. insert data into db using insertOne method
      const result = await jobsCollection.insertOne(data);
      res.status(201).json({
        success: true,
        message: "Job created successfully",
        data: result,
      });
      console.log(result);
    });

    // 2.get jobs by bayer email
    app.get("/jobs/:email", async (req, res) => {
      // 1.collect email from req.body
      const email = req.params.email;

      if (!email) return res.send({ message: "invalid email" });
      // 2.find jobs by email
      const query = { email };
      const result = await jobsCollection.find(query).toArray();
      // 3. response sent client side
      res.status(200).json({
        message: "Successfully found all job data",
        data: result,
        success: true,
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello from SoloSphere Server....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
