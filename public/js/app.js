// Showroom Customer Catalog Logic
let state = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  category: 'All',
  searchQuery: '',
  items: [],
  branding: {}
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  loadCategories();
  loadCatalog(1);
  setupEvents();
});

// Setup DOM Event Listeners
function setupEvents() {
  // Search input debounce
  let searchTimer;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        state.currentPage = 1;
        loadCatalog(1);
      }, 300);
    });
  }

  // Lightbox Close
  const closeBtn = document.getElementById('closeLightboxBtn');
  const modal = document.getElementById('lightboxModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });
  }

  // Keyboard navigation for Lightbox
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// Fetch Categories
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success && data.categories) {
      renderCategoryTabs(data.categories);
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// Render Category Filter Tabs
function renderCategoryTabs(categories) {
  const container = document.getElementById('categoryTabs');
  if (!container) return;

  container.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `cat-btn ${cat === state.category ? 'active' : ''}`;
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.category = cat;
      state.currentPage = 1;
      loadCatalog(1);
    });
    container.appendChild(btn);
  });
}

// Fetch Catalog from Backend (Always 10 items per page, strictly in stock)
async function loadCatalog(page = 1) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: var(--gold-light);">
      <div class="pulse-dot" style="margin: 0 auto 12px auto; width: 14px; height: 14px;"></div>
      Loading verified in-stock collection...
    </div>
  `;

  try {
    const queryParams = new URLSearchParams({
      page: page,
      category: state.category,
      search: state.searchQuery
    });

    const res = await fetch(`/api/showroom?${queryParams.toString()}`);
    const result = await res.json();

    if (result.success) {
      state.items = result.data.items;
      state.currentPage = result.data.pagination.currentPage;
      state.totalPages = result.data.pagination.totalPages;
      state.totalItems = result.data.pagination.totalItems;
      state.branding = result.data.branding;

      updateBrandingUI(result.data.branding);
      renderGrid(result.data.items);
      renderPagination(result.data.pagination);
    } else {
      grid.innerHTML = `<div class="empty-state">Unable to load showroom catalog.</div>`;
    }
  } catch (err) {
    console.error('Failed to fetch showroom data:', err);
    grid.innerHTML = `<div class="empty-state">Network error connecting to showroom.</div>`;
  }
}

// Update Branding Elements
function updateBrandingUI(brand) {
  if (!brand) return;
  if (brand.showroomName) {
    document.getElementById('brandTitle').textContent = brand.showroomName;
    document.getElementById('footerBrand').textContent = brand.showroomName;
  }
  if (brand.tagline) {
    document.getElementById('brandTagline').textContent = brand.tagline;
    document.getElementById('footerTagline').textContent = brand.tagline;
  }
  if (brand.phone) {
    document.getElementById('topPhone').textContent = brand.phone;
    document.getElementById('topPhone').href = `tel:${brand.phone.replace(/[^0-9+]/g, '')}`;
    document.getElementById('footerPhone').textContent = `Direct: ${brand.phone}`;
  }
  if (brand.email) {
    document.getElementById('footerEmail').textContent = `Email: ${brand.email}`;
  }
  if (brand.address) {
    document.getElementById('footerAddress').textContent = brand.address;
  }
  const headerWa = document.getElementById('headerWhatsappBtn');
  if (brand.whatsapp && headerWa) {
    const waClean = brand.whatsapp.replace(/[^0-9]/g, '');
    const defaultMsg = encodeURIComponent("Hello, I was viewing your online catalog and would like to inquire about your in-stock footwear.");
    headerWa.href = `https://wa.me/${waClean}?text=${defaultMsg}`;
  }

  // Live stock badge
  document.getElementById('liveStockCount').textContent = `${state.totalItems} In-Stock Available`;
}

// Render Product Cards (Up to 10 items on the current page)
function renderGrid(items) {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';

  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <h3 style="font-family: var(--font-serif); font-size: 1.6rem; color: #fff; margin-bottom: 6px;">No in-stock items found</h3>
        <p style="color: var(--text-muted);">Please check back soon or try selecting a different category.</p>
      </div>
    `;
    return;
  }

  items.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="card-image-wrap">
        <span class="card-badge-instock">In Stock</span>
        <div class="card-zoom-hint" title="Click to view full image">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </div>
        <img src="${product.image}" alt="${product.title}" class="card-image" loading="lazy">
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-sku">${product.sku || 'SKU'}</span>
          <span class="card-category">${product.category || 'Footwear'}</span>
        </div>
        <h3 class="card-title">${product.title}</h3>
        <div class="card-price">
          <span>${product.price || ''}</span>
          <button class="btn-card-inquire">View &bull; Inquire</button>
        </div>
      </div>
    `;

    // Click anywhere on card opens high-resolution lightbox
    card.addEventListener('click', () => openLightbox(product));
    grid.appendChild(card);
  });
}

// Render 10-Item Strict Pagination Controls
function renderPagination(pagination) {
  const container = document.getElementById('paginationControls');
  const summary = document.getElementById('paginationSummary');
  const showingRangeText = document.getElementById('showingRangeText');
  const currentPageNum = document.getElementById('currentPageNum');
  const totalPagesNum = document.getElementById('totalPagesNum');

  currentPageNum.textContent = pagination.currentPage;
  totalPagesNum.textContent = pagination.totalPages;

  const startItem = (pagination.currentPage - 1) * 10 + 1;
  const endItem = Math.min(pagination.currentPage * 10, pagination.totalItems);

  if (pagination.totalItems > 0) {
    showingRangeText.innerHTML = `Displaying items <strong>${startItem} - ${endItem}</strong> of <strong>${pagination.totalItems}</strong> in-stock designs (10 images per page)`;
    summary.innerHTML = `Page <span>${pagination.currentPage}</span> of <span>${pagination.totalPages}</span> &bull; <span>${pagination.totalItems}</span> total available products`;
  } else {
    showingRangeText.textContent = `Showing 0 items`;
    summary.textContent = `No items found`;
  }

  container.innerHTML = '';

  // Previous Button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn page-btn-nav';
  prevBtn.disabled = !pagination.hasPrevPage;
  prevBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
    Previous
  `;
  prevBtn.addEventListener('click', () => {
    if (pagination.hasPrevPage) {
      window.scrollTo({ top: 350, behavior: 'smooth' });
      loadCatalog(pagination.currentPage - 1);
    }
  });
  container.appendChild(prevBtn);

  // Numeric Page Buttons (Dynamic calculation based on total items)
  for (let i = 1; i <= pagination.totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${i === pagination.currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      window.scrollTo({ top: 350, behavior: 'smooth' });
      loadCatalog(i);
    });
    container.appendChild(pageBtn);
  }

  // Next Button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn page-btn-nav';
  nextBtn.disabled = !pagination.hasNextPage;
  nextBtn.innerHTML = `
    Next
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;
  nextBtn.addEventListener('click', () => {
    if (pagination.hasNextPage) {
      window.scrollTo({ top: 350, behavior: 'smooth' });
      loadCatalog(pagination.currentPage + 1);
    }
  });
  container.appendChild(nextBtn);
}

// Open Product High-Res Lightbox Modal
function openLightbox(product) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  const title = document.getElementById('lbTitle');
  const sku = document.getElementById('lbSku');
  const price = document.getElementById('lbPrice');
  const desc = document.getElementById('lbDesc');
  const waBtn = document.getElementById('lbWhatsappBtn');

  img.src = product.image;
  title.textContent = product.title;
  sku.textContent = `Article Code / SKU: ${product.sku || 'N/A'}`;
  price.textContent = product.price || 'Price on Inquiry';
  desc.textContent = product.description || 'Premium handcrafted design available for immediate dispatch in our showroom inventory.';

  // Build WhatsApp Inquiry Message with Product Details
  if (waBtn) {
    const waClean = (state.branding.whatsapp || '919876543210').replace(/[^0-9]/g, '');
    const msgText = `Hello, I saw "${product.title}" (SKU: ${product.sku}) on your catalog website and I am interested in purchasing it. Is this size available?`;
    waBtn.href = `https://wa.me/${waClean}?text=${encodeURIComponent(msgText)}`;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Close Lightbox
function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}
