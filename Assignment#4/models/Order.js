const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    name: String,
    address: String,
    phone: String,
    email: String,
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
  }],
  totalPrice: Number,
  status: String,  // You can update the status later (e.g., "Pending", "Shipped")
  date: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
