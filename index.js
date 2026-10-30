const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const store = require('./server/store');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend and uploaded images
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpeg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'item_' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// ==========================================
// PUBLIC CUSTOMER API
// ==========================================

// GET /api/showroom - Public customer items: ONLY IN-STOCK ITEMS
app.get('/api/showroom', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Exactly 10 items per page as requested
    const category = req.query.category || '';
    const search = req.query.search || '';

    // Strictly enforce inStockOnly: true for customer view
    const allInStock = store.getProducts({ inStockOnly: true, category, search });
    const totalCount = allInStock.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (safePage - 1) * limit;
    const paginatedItems = allInStock.slice(startIndex, startIndex + limit);

    const settings = store.getSettings();

    res.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          currentPage: safePage,
          totalPages: totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: safePage < totalPages,
          hasPrevPage: safePage > 1
        },
        branding: {
          showroomName: settings.showroomName,
          tagline: settings.tagline,
          phone: settings.phone,
          whatsapp: settings.whatsapp,
          email: settings.email,
          address: settings.address
        }
      }
    });
  } catch (err) {
    console.error('Error in /api/showroom:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving showroom items' });
  }
});

// GET /api/categories - Get distinct categories of in-stock items
app.get('/api/categories', (req, res) => {
  try {
    const items = store.getProducts({ inStockOnly: true });
    const cats = new Set(['All']);
    items.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    res.json({ success: true, categories: Array.from(cats) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

// ==========================================
// DEVELOPER / ADMIN API
// ==========================================

// Authentication helper (passcode validation)
function getValidAdminPasscode() {
  const settings = store.getSettings();
  return process.env.ADMIN_PASSCODE || settings.adminPasscode || 'admin123';
}

function checkAuth(req, res, next) {
  const passcode = req.headers['x-admin-key'] || req.query.key || (req.body && req.body.key);
  const validPasscode = getValidAdminPasscode();
  if (passcode && passcode === validPasscode) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Unauthorized: Invalid administrative key' });
}

// POST /api/admin/login - Verify admin passcode
app.post('/api/admin/login', (req, res) => {
  const { passcode } = req.body || {};
  const validPasscode = getValidAdminPasscode();
  if (passcode && passcode === validPasscode) {
    return res.json({ success: true, message: 'Authentication successful' });
  }
  return res.status(401).json({ success: false, message: 'Invalid administrative passcode' });
});

// GET /api/admin/products - List all products (in-stock AND out-of-stock)
app.get('/api/admin/products', checkAuth, (req, res) => {
  try {
    const products = store.getAllProductsAdmin();
    const stats = {
      total: products.length,
      inStock: products.filter(p => p.inStock).length,
      outOfStock: products.filter(p => !p.inStock).length
    };
    res.json({ success: true, products, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving admin catalog' });
  }
});

// POST /api/admin/products - Add a new product with image
app.post('/api/admin/products', checkAuth, upload.single('image'), (req, res) => {
  try {
    const { title, sku, category, price, description, inStock, featured } = req.body;
    
    let imageUrl = '/uploads/placeholder.jpg';
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const created = store.addProduct({
      title,
      sku,
      category,
      price,
      description,
      image: imageUrl,
      inStock: inStock === 'true' || inStock === true,
      featured: featured === 'true' || featured === true
    });

    res.json({ success: true, product: created, message: 'Product added successfully' });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ success: false, message: 'Failed to add product: ' + err.message });
  }
});

// PUT /api/admin/products/:id - Update product details
app.put('/api/admin/products/:id', checkAuth, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (req.file) {
      updates.image = '/uploads/' + req.file.filename;
    }

    const updated = store.updateProduct(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product: updated, message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating product' });
  }
});

// PATCH /api/admin/products/:id/toggle-stock - Fast one-click toggle
app.patch('/api/admin/products/:id/toggle-stock', checkAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updated = store.toggleStock(id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product: updated, message: `Status changed to ${updated.inStock ? 'IN STOCK' : 'OUT OF STOCK'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling stock' });
  }
});

// DELETE /api/admin/products/:id - Delete product
app.delete('/api/admin/products/:id', checkAuth, (req, res) => {
  try {
    const { id } = req.params;
    const ok = store.deleteProduct(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
});

// GET /api/admin/settings
app.get('/api/admin/settings', checkAuth, (req, res) => {
  res.json({ success: true, settings: store.getSettings() });
});

// POST /api/admin/settings
app.post('/api/admin/settings', checkAuth, (req, res) => {
  try {
    const updated = store.updateSettings(req.body);
    res.json({ success: true, settings: updated, message: 'Branding & settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating settings' });
  }
});

// Fallback route for admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`✨ Showroom Catalog Server running at http://localhost:${PORT}`);
  console.log(`👥 Customer View: http://localhost:${PORT}/`);
  console.log(`🛠️ Admin Management: http://localhost:${PORT}/admin`);
  console.log(`====================================================`);
});
