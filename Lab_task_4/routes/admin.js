const express = require('express');
const Product = require('../models/products');
const Category = require('../models/category');
const upload = require('../middleware/multer');
const router = express.Router();

router.get('/', async (req, res) => {
  res.render('admin/dashboard', {
    layout: "layouts/adminLayout"
  });
});

// List Products
// router.get('/products', async (req, res) => {
//   try {
//     const products = await Product.find().populate('category');
//     const categories = await Category.find();
//     res.render('admin/products', {layout: "layouts/adminLayout", products, categories });
//   } catch (err) {
//     console.error('Error fetching products or categories:', err);
//     res.status(500).send('Error fetching products or categories');
//   }
// });


router.post('/products/create',upload.single('image'), async (req, res) => {
  try {
    const { name, price, description, category } = req.body; // 'category' is the selected category ID
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Validate category ID
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).send('Invalid Category');
    }

    // Create new product
    const product = new Product({ name, price, description, category, image });

    await product.save();
    const redirectUrl = `/admin/products?search=${req.query.search || ''}&category=${req.query.category || ''}&sort=${req.query.sort || ''}&order=${req.query.order || ''}`;
res.redirect(redirectUrl);
  } catch (err) {
    console.error('Error saving product:', err);
    res.status(500).send('Error saving product');
  }
});

// Edit Product
router.post('/products/edit/:id',upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category } = req.body;

    const categoryDoc = await Category.findOne({ _id: category });

    if (!categoryDoc) {
      return res.status(400).send('Invalid category');
    }

    await Product.findByIdAndUpdate(id, {
      name,
      price,
      description,
      category: categoryDoc._id,
    });

    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error editing product:', err);
    res.status(500).send('Error editing product');
  }
});




// Delete Product
router.get('/products/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).send('Error deleting product');
  }
});

router.get('/products', async (req, res) => {
  try {
    const search = req.query.search || '';
    const categoryFilter = req.query.category || '';
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'asc';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (categoryFilter) {
      query.category = categoryFilter;
    }

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category')
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const categories = await Category.find();
    const totalPages = Math.ceil(totalProducts / limit);

    res.render('admin/products', {
      layout: "layouts/adminLayout",
      products,
      categories,
      search,
      category: categoryFilter,
      sort,
      order,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.render('admin/categories', { layout: "layouts/adminLayout", categories }); // Pass only categories
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).send('Error fetching categories');
  }
});

// Create Category
router.post('/categories/create', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).send('Category name is required');
    }

    const category = new Category({ name, description });
    await category.save();
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).send('Error creating category');
  }
});

// Edit Category
router.post('/categories/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).send('Category name is required');
    }

    await Category.findByIdAndUpdate(id, { name, description });
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Error editing category:', err);
    res.status(500).send('Error editing category');
  }
});

// Delete Category
router.get('/categories/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).send('Error deleting category');
  }
});

module.exports = router;