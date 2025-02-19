const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


app.use(express.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wwm8j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const db = client.db("TODO")
        const usersCollection = db.collection("users")

        // save user in db
        app.post("/user/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = req.body;
            // check user already exist in db
            const isExistUser = await usersCollection.findOne(query)
            if (isExistUser) {
                return res.send(isExistUser)
            }

            const result = await usersCollection.insertOne({ ...user, timestamp: Date.now() })
            res.send(result)
        })

        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("TODO API is running...");
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
