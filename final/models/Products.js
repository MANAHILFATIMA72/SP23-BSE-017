const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String, required: false },
});

// Check if the model already exists before defining it
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

