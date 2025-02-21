const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(express.json([
    "https://todo-projects-2051b.web.app",
    "http://localhost:5173"
]));
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
        const tasksCollection = db.collection("tasks")

        app.post("/user/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email:email };
            const user = req.body;
        
            // check user already exist in db
            const isExistUser = await usersCollection.findOne(query);
            if (isExistUser) {
                return res.send({ message: "User already exists", user: isExistUser });
            }
        
            const result = await usersCollection.insertOne({ ...user, timestamp: Date.now() });
            res.send(result);
        });
        
        // task store in db
        app.post("/tasks", async (req, res) => {
            const user = req.body;
            const result = await tasksCollection.insertOne(user)
            res.send(result)
        })

        // task get by email in db
        app.get("/tasks/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };

            const result = await tasksCollection.find(query).toArray();
            res.send(result)
        })

        // Helper function to convert ID to ObjectId if valid
        const convertToObjectId = (id) => {
            return ObjectId.isValid(id) ? new ObjectId(id) : id; // Return ObjectId or original ID
        };

        // Task delete in db
        app.delete("/tasks/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: convertToObjectId(id) }; // Convert ID for query
            const result = await tasksCollection.deleteOne(query);
            res.send(result);
        });

        // Task update in db
        app.put("/tasks-update/:id", async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const query = { _id: convertToObjectId(id) }; // Convert ID for query
            const updateDoc = {
                $set: {
                    title: data?.title,
                    description: data?.description,
                    category: data?.category,
                    date: data?.date,
                    email: data?.email
                }
            };
            const result = await tasksCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        // Drag & Drop Reorder Tasks API
        app.put('/tasks/reorder', async (req, res) => {
            const { tasks } = req.body;

            try {
                // Clear the existing tasks
                await tasksCollection.deleteMany({});

                // Convert task IDs before inserting
                const tasksWithConvertedIds = tasks.map(task => ({
                    ...task,
                    _id: convertToObjectId(task._id) // Convert ID for each task
                }));

                // Insert the new order of tasks
                await tasksCollection.insertMany(tasksWithConvertedIds);

                res.status(200).send('Tasks reordered successfully');
            } catch (error) {
                console.error(error);
                res.status(500).send('Error reordering tasks');
            }
        });


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
