const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'store.json');

// Ensure directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

function readStore() {
  if (!fs.existsSync(DB_PATH)) {
    return {
      settings: {
        showroomName: "AURA LUXE FOOTWEAR",
        tagline: "Exclusive Artisanal Footwear & Contemporary Showcase",
        phone: "+91 98765 43210",
        whatsapp: "919876543210",
        email: "concierge@auraluxe.com",
        address: "Grand Boulevard Showroom, Sector 4, Luxury Pavilion",
        adminPasscode: "admin123"
      },
      products: []
    };
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading store:", err);
    return { settings: {}, products: [] };
  }
}

function writeStore(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Initial seed if empty
function initStoreWithSamples() {
  const store = readStore();
  if (store.products.length === 0) {
    const samples = [
      {
        id: "prod_001",
        title: "Artisan Leather Stitched Slide",
        sku: "AL-101",
        category: "Men",
        description: "Handcrafted top-grain leather slide with ergonomic arch contouring and brass accent.",
        price: "₹ 2,499",
        image: "/uploads/images1.jpeg",
        inStock: true,
        featured: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 11).toISOString()
      },
      {
        id: "prod_002",
        title: "Sovereign Cross-Strap Sandal",
        sku: "SS-102",
        category: "Men",
        description: "Classic cross-strap slide crafted with cushioned dual-density memory sole.",
        price: "₹ 1,899",
        image: "/uploads/images2.jpeg",
        inStock: true,
        featured: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      },
      {
        id: "prod_003",
        title: "Velvet Matte Urban Kolhapuri",
        sku: "VK-103",
        category: "Traditional",
        description: "Heritage silhouette reimagined for modern luxury with anti-slip micro-groove tread.",
        price: "₹ 2,199",
        image: "/uploads/images3.jpeg",
        inStock: true,
        featured: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString()
      },
      {
        id: "prod_004",
        title: "Royale Braided Comfort Slipper",
        sku: "RB-104",
        category: "Casual",
        description: "Premium braided strap finish paired with ultra-plush cloudbed cushioning.",
        price: "₹ 1,599",
        image: "/uploads/images4.jpeg",
        inStock: true,
        featured: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
      },
      {
        id: "prod_005",
        title: "Signature Tan Minimalist Slide",
        sku: "ST-105",
        category: "Men",
        description: "Bespoke Italian-style tan finish with reinforced dual edge-stitching.",
        price: "₹ 2,299",
        image: "/uploads/images5.jpeg",
        inStock: true,
        featured: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString()
      },
      {
        id: "prod_006",
        title: "Monarch Textured Casual Mules",
        sku: "MM-106",
        category: "Luxe",
        description: "High-density embossed textured upper with subtle burnished edges.",
        price: "₹ 2,699",
        image: "/uploads/images6.jpeg",
        inStock: true,
        featured: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString()
      },
      {
        id: "prod_007",
        title: "Aura Classic Daily Comfort",
        sku: "AC-107",
        category: "Daily",
        description: "Lightweight flexible sole engineered for all-day comfort without compromising elegance.",
        price: "₹ 1,299",
        image: "/uploads/images7.jpeg",
        inStock: true,
        featured: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        id: "prod_008",
        title: "Imperial Handwoven Ethnic Kolhapuri",
        sku: "IH-108",
        category: "Traditional",
        description: "Intricately handwoven strap with festive metallic braiding and leather sole.",
        price: "₹ 3,299",
        image: "/uploads/images8.jpeg",
        inStock: true,
        featured: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
      },
      {
        id: "prod_009",
        title: "Nordic Slate Waterproof Slide",
        sku: "NS-109",
        category: "Casual",
        description: "Water-resistant matte composite designed for poolside and resort comfort.",
        price: "₹ 1,499",
        image: "/uploads/images9.jpeg",
        inStock: true,
        featured: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString()
      },
      {
        id: "prod_0010",
        title: "Opulent Buckle Comfort Chappal",
        sku: "OB-110",
        category: "Luxe",
        description: "Adjustable brushed metal buckle on supple oil-pull leather.",
        price: "₹ 2,799",
        image: "/uploads/images10.jpeg",
        inStock: true,
        featured: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
      },
      {
        id: "prod_0011",
        title: "Vanguard Duo-Tone Festive Sandal",
        sku: "VD-111",
        category: "Festive",
        description: "Striking two-tone leather weave designed for festive and occasion wear.",
        price: "₹ 2,999",
        image: "/uploads/images11.jpeg",
        inStock: true,
        featured: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 1).toISOString()
      }
    ];
    store.products = samples;
    writeStore(store);
    console.log("Initialized store with 11 sample showroom products.");
  }
}

initStoreWithSamples();

module.exports = {
  getProducts({ inStockOnly = false, category = '', search = '' } = {}) {
    const store = readStore();
    let list = store.products;

    if (inStockOnly) {
      list = list.filter(p => p.inStock === true);
    }

    if (category && category !== 'All') {
      list = list.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  },

  getAllProductsAdmin() {
    const store = readStore();
    return store.products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getProductById(id) {
    const store = readStore();
    return store.products.find(p => p.id === id);
  },

  addProduct(productData) {
    const store = readStore();
    const newProduct = {
      id: "prod_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      title: productData.title || "Untitled Product",
      sku: productData.sku || ("SKU-" + Math.floor(100 + Math.random() * 900)),
      category: productData.category || "General",
      description: productData.description || "",
      price: productData.price || "",
      image: productData.image || "/uploads/placeholder.jpg",
      inStock: productData.inStock !== false && productData.inStock !== "false",
      featured: productData.featured === true || productData.featured === "true",
      createdAt: new Date().toISOString()
    };
    store.products.unshift(newProduct);
    writeStore(store);
    return newProduct;
  },

  updateProduct(id, updates) {
    const store = readStore();
    const idx = store.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    // Handle boolean coercion for inStock
    if (typeof updates.inStock !== 'undefined') {
      updates.inStock = updates.inStock === true || updates.inStock === 'true';
    }
    if (typeof updates.featured !== 'undefined') {
      updates.featured = updates.featured === true || updates.featured === 'true';
    }

    store.products[idx] = {
      ...store.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    writeStore(store);
    return store.products[idx];
  },

  toggleStock(id) {
    const store = readStore();
    const p = store.products.find(x => x.id === id);
    if (!p) return null;
    p.inStock = !p.inStock;
    p.updatedAt = new Date().toISOString();
    writeStore(store);
    return p;
  },

  deleteProduct(id) {
    const store = readStore();
    const idx = store.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    store.products.splice(idx, 1);
    writeStore(store);
    return true;
  },

  getSettings() {
    const store = readStore();
    return store.settings;
  },

  updateSettings(newSettings) {
    const store = readStore();
    store.settings = { ...store.settings, ...newSettings };
    writeStore(store);
    return store.settings;
  }
};
