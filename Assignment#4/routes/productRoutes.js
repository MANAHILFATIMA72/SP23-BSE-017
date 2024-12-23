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

module.exports = router;
