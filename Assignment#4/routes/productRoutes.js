const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const Order = require('../models/Order');
const Category = require('../models/Category');

// Route to display products by category
router.get('/category/:categoryName', async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const category = await Category.findOne({ name: categoryName });

    if (!category) {
      req.flash('error', 'Category not found');
      return res.status(404).render('users/index', { title: 'Home', message: 'Category not found' });
    }

    const products = await Product.find({ category: category._id });

    res.render('users/category', {
      layout: './layouts/main', 
      title: `Products in ${categoryName}`,
      products,
      categoryName,
    });
  } catch (error) {
    req.flash('error', 'Error fetching products');
    console.error('Error fetching products:', error);
    res.status(500).render('users/index', { title: 'Home', message: 'Error fetching products' });
  }
});

// Route to display product details
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId).populate('category');

    if (!product) {
      req.flash('error', 'Product not found');
      return res.status(404).render('users/index', { title: 'Home', message: 'Product not found' });
    }

    res.render('users/productDetail', {
      layout: './layouts/main',
      title: product.name,
      product,
    });
  } catch (error) {
    req.flash('error', 'Error fetching product details');
    console.error('Error fetching product details:', error);
    res.status(500).render('users/index', { title: 'Home', message: 'Error fetching product details' });
  }
});

// Route for adding product to the cart
// Route to add a product to the cart
router.post('/add-to-cart/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity, 10) || 1;

    // Fetch product details from the database
    const product = await Product.findById(productId);

    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/');
    }

    // Initialize cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if the product is already in the cart
    const existingProductIndex = req.session.cart.findIndex(
      (item) => item.product._id.toString() === productId
    );

    if (existingProductIndex > -1) {
      // Update quantity if product exists
      req.session.cart[existingProductIndex].quantity += quantity;
    } else {
      // Add new product to the cart
      req.session.cart.push({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
        },
        quantity,
      });
    }

    req.flash('success', 'Product added to cart.');
    res.redirect('/cart'); // Redirect to cart page
  } catch (error) {
    console.error('Error adding product to cart:', error);
    req.flash('error', 'Something went wrong.');
    res.redirect('/');
  }
});

// Route to display cart page
router.get('/cart', (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.render('users/cart', {
      layout: './layouts/main',
      title: 'Your Cart',
      message: 'Your cart is empty.',
      cart: []  // Pass an empty cart if there are no items
    });
  }

  let totalPrice = 0;
  req.session.cart.forEach(item => {
    totalPrice += item.product.price * item.quantity;
  });

  res.render('users/cart', {
    layout: './layouts/main',
    title: 'Your Cart',
    cart: req.session.cart,  // Pass the cart data to the view
    totalPrice,  // Pass the total price to the view
  });
});

// Route for displaying the checkout form
router.get('/checkout', (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.redirect('/cart'); // Redirect to cart if it's empty
  }

  let totalPrice = 0;
  req.session.cart.forEach(item => {
    totalPrice += item.product.price * item.quantity;
  });

  res.render('users/checkoutForm', {
    layout: './layouts/main',
    title: 'Checkout',
    cart: req.session.cart,
    totalPrice,  // Pass the total price to the view
  });
});

router.post('/submit-order', async (req, res) => {
  try {
    const { name, address, phone, email, shippingMethod, paymentMethod } = req.body;

    // Validate required fields
    if (!name || !address || !phone || !email || !shippingMethod || !paymentMethod) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/checkout');
    }

    // Calculate total price with shipping
    const shippingCost = shippingMethod === 'Express Shipping' ? 200 : 0;
    const totalPrice = req.session.cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    ) + shippingCost;

    // Create a new order object
    const order = {
      user: {
        name,
        address,
        phone,
        email,
      },
      shippingMethod,
      paymentMethod,
      items: req.session.cart,
      totalPrice,
      status: 'Pending', // Default order status
      date: new Date(),
    };

    // Save the order to the database
    const newOrder = await Order.create(order);

    // Clear the cart after order is placed
    req.session.cart = [];

    // Store the new order in the session for confirmation
    req.session.order = newOrder;

    // Redirect to the confirmation page
    res.redirect('/order-confirmation');
  } catch (error) {
    console.error('Error submitting order:', error);
    req.flash('error', 'There was an issue with your order.');
    res.redirect('/checkout');
  }
});


router.get('/order-confirmation', (req, res) => {
  const order = req.session.order;

  if (!order) {
    req.flash('error', 'No order found.');
    return res.redirect('/');
  }

  res.render('users/orderConfirmation', {
    layout: './layouts/main',
    title: 'Order Confirmation',
    order,
  });
});


// Route to remove a product from the cart
router.post('/cart/remove/:index', (req, res) => {
  const index = parseInt(req.params.index);

  if (req.session.cart && req.session.cart[index]) {
    req.session.cart.splice(index, 1); // Remove the product from the cart
  }

  res.redirect('/cart'); // Redirect back to the cart page
});

module.exports = router;
