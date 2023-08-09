require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully!');
});

const savingSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  date: { type: Date, default: Date.now },
  category: String,
  repeat: Boolean,
  repeatInterval: String,
  repeatDuration: { type: Date, default: Date.now },
});

const Saving = mongoose.model('Saving', savingSchema);

// Read all savings
app.get('/api/savings/read', async (req, res) => {
  try {
    const savings = await Saving.find();
    res.json(savings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching savings' });
  }
});

// Read by date interval "GET /api/savings/read/date-interval?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD"
app.get('/api/savings/read/date-interval', async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const filter = startDate.toISOString() === endDate.toISOString() ? 
      { date: startDate } : 
      { date: { $gte: startDate, $lte: endDate } };

    const savings = await Saving.find(filter);
    res.json(savings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching savings by date interval' });
  }
});

// Read by category
app.get('/api/savings/read/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const savings = await Saving.find({ category: category });
    res.json(savings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching savings by category' });
  }
});

app.post('/api/savings/save', async (req, res) => {
  try {
    const { title, amount, date, category, repeat, repeatInterval, repeatDuration } = req.body;

    if (!title || typeof amount !== 'number' || isNaN(amount) || typeof repeat !== 'boolean') {
      return res.status(400).json({ error: 'Invalid data provided' });
    }

    const saving = new Saving({
      title,
      amount,
      date,
      category,
      repeat,
      repeatInterval,
      repeatDuration,
    });

    const savedSaving = await saving.save();
    res.status(201).json(savedSaving);

  } catch (err) {
    console.error('Error creating saving:', err);
    res.status(500).json({ error: 'Error creating saving' });
  }
});

app.put('/api/savings/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, date, category, repeat, repeatInterval, repeatDuration } = req.body;
    const updatedSaving = await Saving.findByIdAndUpdate(
      id,
      { title, amount, date, category, repeat, repeatInterval, repeatDuration },
      { new: true }
    );

    if (!updatedSaving) {
      return res.status(404).json({ error: 'Saving not found' });
    }

    res.json(updatedSaving);
  } catch (err) {
    res.status(500).json({ error: 'Error updating saving' });
  }
});

app.delete('/api/savings/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Saving.findByIdAndRemove(id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Error deleting saving' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'An unexpected error occurred' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
