const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    name: String,
    address: String,
    phone: String,
    email: String,
  },
  shippingMethod: String,
  paymentMethod: String,
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: Number,
    },
  ],
  totalPrice: Number,
  status: {
    type: String,
    default: 'Pending',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', orderSchema);
