const express = require('express');
const Product = require('../models/products');
const Category = require('../models/category');
const upload = require('../middleware/multer');
const jwt = require('jsonwebtoken'); // Import jwt here
const { optionalAuthenticateJWT, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// Middleware to authenticate JWT and authorize admin role
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login'); // Redirect to login if no token
    }

    jwt.verify(token, process.env.JWT_SECRET || 'you_are_strong_enough', (err, user) => {
        if (err) {
            return res.redirect('/login'); // Redirect to login if token is invalid
        }
        req.user = user;
        next();
    });
}

// Admin Dashboard Route (Protected)
router.get('/dashboard', authenticateToken, authorizeRole('admin'), async (req, res) => {
    res.render('admin/dashboard', {
        layout: "layouts/adminLayout",
        title: "Admin Dashboard",
        user: req.user, // Pass user details to the template
    });
});

// List Products (Protected)
router.get('/products', authenticateToken, authorizeRole('admin'), async (req, res) => {
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

// Create Product (Protected)
router.post('/products/create', authenticateToken, authorizeRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, category } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(400).send('Invalid Category');
        }

        const product = new Product({ name, price, description, category, image });
        await product.save();
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Error saving product:', err);
        res.status(500).send('Error saving product');
    }
});

// Edit Product (Protected)
router.post('/products/edit/:id', authenticateToken, authorizeRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, category } = req.body;

        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(400).send('Invalid Category');
        }

        await Product.findByIdAndUpdate(id, {
            name,
            price,
            description,
            category,
        });

        res.redirect('/admin/products');
    } catch (err) {
        console.error('Error editing product:', err);
        res.status(500).send('Error editing product');
    }
});

// Delete Product (Protected)
router.get('/products/delete/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.redirect('/admin/products');
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).send('Error deleting product');
    }
});

// List Categories (Protected)
router.get('/categories', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/categories', { layout: "layouts/adminLayout", categories });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Error fetching categories');
    }
});

// Create Category (Protected)
router.post('/categories/create', authenticateToken, authorizeRole('admin'), async (req, res) => {
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

// Edit Category (Protected)
router.post('/categories/edit/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
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

// Delete Category (Protected)
router.get('/categories/delete/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Error deleting category:', err);
        res.status(500).send('Error deleting category');
    }
});

// Logout Route (Protected)
router.post('/logout', authenticateToken, (req, res) => {
  // Clear the token from cookies
  res.clearCookie('token').redirect('/'); // Redirect to homepage or login page
});


module.exports = router;
