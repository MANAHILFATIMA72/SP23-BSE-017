const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
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
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
      },
      quantity: Number,
    },
  ],
  totalPrice: Number,
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', OrderSchema);
