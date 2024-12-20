const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const bidsCollection = dbName.collection("bids");

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
    });

    // 2.get jobs by bayer email
    app.get("/jobs/:id", async (req, res) => {
      // 1.collect email from req.body
      const id = req.params.id;

      if (!id) return res.send({ message: "invalid id" });
      // 2.find jobs by email
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      // 3. response sent client side
      res.status(200).json({
        message: "Successfully found all job data",
        data: result,
        success: true,
      });
    });

    // 3. Get all jobs
    app.get("/jobs", async (req, res) => {
      // 0.query params
      const { category, sort, search, email } = req.query;
      let query = {};
      let sortOptions = {};
      if (category) {
        query.category = category;
      }
      if (sort) {
        sortOptions = { deadline: sort === "asc" ? 1 : -1 };
      }
      if (search) {
        query = { job_title: { $regex: search, $options: "i" } };
      }
      if (email) {
        query = { email };
      }
      // 1. query to db and fetching all job data
      const result = await jobsCollection
        .find(query)
        .sort(sortOptions)
        .toArray();
      // 2. response send to client side
      res.status(200).json({
        success: true,
        message: "Successfully found all job data",
        data: result,
      });
    });

    // 4. employer
    app.post("/bids", async (req, res) => {
      const bidData = req.body;
      // validate
      const query = {
        job_id: bidData.job_id,
        employer_email: bidData.employer_email,
      };
      const bidExist = await bidsCollection.findOne(query);
      if (bidExist) {
        res.status(200).json({
          success: true,
          message: "Employer already attend this bid",
        });
        return;
      }
      const result = await bidsCollection.insertOne(bidData);
      const update = { $inc: { bid_count: 1 } };
      const updated = await jobsCollection.updateOne(
        { _id: new ObjectId(bidData.job_id) },
        update
      );
      res.status(201).json({
        success: true,
        message: "bid request success",
        data: result,
      });
    });

    // 5. get bids by email
    app.get("/bids/:email", async (req, res) => {
      const email = req.params.email;
      const { employer } = req.query;
      let query = { email };
      if (employer) {
        query = { employer_email: email };
      }
      const result = await bidsCollection.find(query).toArray();
      res.status(201).json({
        success: true,
        message: "bids fetching success",
        data: result,
      });
    });

    //6. status update
    app.patch("/status/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const update = { $set: { status: status } };
      const updated = await bidsCollection.updateOne(
        { _id: new ObjectId(id) },
        update
      );
      res.status(200).json({
        success: true,
        message: "Status updated success",
        // data: updated,
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
