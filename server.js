const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());

const MONGODB_URI = 'mongodb+srv://hjw1129:Server7*9)@cluster0.f262khh.mongodb.net/';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const savingSchema = new mongoose.Schema({
  title: String,
  amount: Number,
});

const Saving = mongoose.model('Saving', savingSchema);

app.get('/api/savings', async (req, res) => {
  try {
    const savings = await Saving.find();
    res.json(savings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching savings' });
  }
});

app.post('/api/savings', async (req, res) => {
  try {
    const { title, amount } = req.body;

    if (!title || typeof amount !== 'number' || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid data provided' });
    }

    const saving = new Saving({ title, amount });

    await saving.save((err, savedSaving) => {
      if (err) {
        console.error('Error saving to the database:', err);
        return res.status(500).json({ error: 'Error creating saving' });
      }
      res.status(201).json(savedSaving);
    });
  } catch (err) {
    console.error('Error creating saving:', err);
    res.status(500).json({ error: 'Error creating saving' });
  }
});

app.put('/api/savings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount } = req.body;
    const updatedSaving = await Saving.findByIdAndUpdate(id, { title, amount }, { new: true });
    res.json(updatedSaving);
  } catch (err) {
    res.status(500).json({ error: 'Error updating saving' });
  }
});

app.delete('/api/savings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Saving.findByIdAndRemove(id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Error deleting saving' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
