const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
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
router.post('/add-to-cart/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const quantity = req.body.quantity || 1;

    const product = await Product.findById(productId);

    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/');
    }

    // Initialize cart if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if the product is already in the cart
    const existingItem = req.session.cart.find(item => item.product._id.toString() === productId);

    if (existingItem) {
      // If product exists, update quantity
      existingItem.quantity += quantity;
    } else {
      // If product doesn't exist, add it to the cart
      req.session.cart.push({ product, quantity });
    }

    res.redirect('/cart');
  } catch (error) {
    console.error('Error adding product to cart:', error);
    req.flash('error', 'Error adding product to cart');
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

// Route to handle order submission
router.post('/submit-order', async (req, res) => {
  try {
    const { name, address, phone, email } = req.body;

    if (!name || !address || !phone || !email) {
      req.flash('error', 'All fields are required.');
      return res.redirect('/checkout');
    }

    // Create an order object
    const order = {
      user: {
        name,
        address,
        phone,
        email
      },
      items: req.session.cart,
      totalPrice: req.session.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0),
      status: 'Pending',  // Order status (you can update this later)
      date: new Date(),
    };

    // Save the order (assuming you have an Order model)
    const newOrder = await Order.create(order);

    // Clear the cart after order is placed
    req.session.cart = [];

    // Redirect to a confirmation page (or order details page)
    res.redirect(`/order-confirmation/${newOrder._id}`);
  } catch (error) {
    console.error('Error submitting order:', error);
    req.flash('error', 'There was an issue with your order.');
    res.redirect('/checkout');
  }
});





module.exports = router;
