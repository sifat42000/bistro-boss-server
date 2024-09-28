const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URI from environment variables
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cfnw7jn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with options to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');

    // Defining collections
    const MenuCollection = client.db("Bistro_Boss").collection("Menu");
    const CartCollection = client.db("Bistro_Boss").collection("Cart");
    const UsersCollection = client.db("Bistro_Boss").collection("Users");

    // Fetch menu items
    app.get('/Menu', async (req, res) => {
      try {
        const result = await MenuCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch menu items' });
      }
    });

    // Fetch all users
    app.get('/Users', async (req, res) => {
      try {
        const result = await UsersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch users' });
      }
    });

    // Patch users
    app.patch('/Users/admin/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: 'Invalid user ID' });
      }
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      };
      try {
        const result = await UsersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to update user role' });
      }
    });

    // Register new user
    app.post('/Users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await UsersCollection.findOne(query);
      if (existingUser) { 
        return res.send({ message: 'User Already Exists', insertId: null });
      }
      try {
        const result = await UsersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to register user' });
      }
    });

    // Delete user by ID
    app.delete('/Users/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: 'Invalid user ID' });
      }
      const query = { _id: new ObjectId(id) };
      try {
        const result = await UsersCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to delete user' });
      }
    });

    // Get cart items by user email
    app.get('/Cart', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ error: 'Email query parameter is required' });
      }
      const query = { email: email };
      try {
        const result = await CartCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch cart items' });
      }
    });

    // Add item to cart
    app.post('/Cart', async (req, res) => {
      const CartItem = req.body;
      try {
        const result = await CartCollection.insertOne(CartItem);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to add item to cart' });
      }
    });

    // Delete cart item by ID
    app.delete('/Cart/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: 'Invalid cart item ID' });
      }
      const query = { _id: new ObjectId(id) };
      try {
        const result = await CartCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to delete cart item' });
      }
    });

    // Send a ping to confirm successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

run().catch(console.dir);

// Root route for basic server response
app.get('/', (req, res) => {
  res.send('Boss is sitting!');
});

// Start the server
app.listen(port, () => {
  console.log(`Bistro Boss is running on port ${port}`);
});
