const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
});

// Check if the model already exists before defining it
module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);
