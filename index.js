const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./modules/user'); // Import the User model

const app = express();
const PORT = 3001;
app.use(cors({
  origin: "https://nova-line.vercel.app", // آدرس فرانت
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// --- Database Connection ---
// 2. Paste your connection string here and replace <password> with your actual password
const MONGO_URI = "mongodb+srv://NovaLine:123123qwe@cluster0.etvrjr0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// --- Mongoose Schema and Model ---
// 3. Define the structure of a transaction (the blueprint)
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'income' or 'expense'
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: String,
  date: { type: Date, default: Date.now }
});

// 4. Create a "Model" based on the schema. This is our tool to interact with the 'transactions' collection.
const Transaction = mongoose.model('Transaction', transactionSchema);


// Middlewares (remain the same)
app.use(cors());
app.use(express.json());


// --- API Routes (Now using the database) ---

// API for User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new user
    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// API for Login (remains the same for now)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log("Login attempt with:", req.body);-
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    //check pass
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }
    //create JWT
    const payload ={
      user:{
        id:user.id, // The user's unique ID from the database
      },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );    
    
  }catch(error){
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. REPLACED: API to GET all transactions from the database
app.get('/api/transactions', async (req, res) => {
  try {
    const allTransactions = await Transaction.find(); // .find() gets all documents
    res.json(allTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. REPLACED: API to POST a new transaction to the database
app.post('/api/transactions', async (req, res) => {
  try {
    const newTransaction = await Transaction.create(req.body); // .create() builds and saves a new document
    console.log('New transaction created in DB:', newTransaction);
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 7. REPLACED: API to DELETE a transaction from the database
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    console.log(`Transaction with ID ${req.params.id} deleted from DB.`);
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profile routes (we can connect these to a User model later)
let userProfile = { name: "Sample User", email: "user@example.com" };
app.get('/api/profile', (req, res) => res.json(userProfile));
app.put('/api/profile', (req, res) => {
  const { name, email } = req.body;
  if (name) userProfile.name = name;
  if (email) userProfile.email = email;
  res.json({ success: true, message: 'Profile updated successfully.', profile: userProfile });
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`NovaLine backend server is running on port ${PORT}...`);
});