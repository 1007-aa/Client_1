// Admin Inventory Logic
let adminKey = localStorage.getItem('showroom_admin_key') || 'admin123';
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  setupAdminEvents();
  checkAuthAndLoad();
  
  // Set shareable customer link to current host
  const host = window.location.origin;
  document.getElementById('customerShareLink').textContent = `${host}/`;
});

function setupAdminEvents() {
  // Login Unlock
  document.getElementById('btnLogin').addEventListener('click', () => {
    const key = document.getElementById('passcodeInput').value.trim();
    if (key) {
      adminKey = key;
      localStorage.setItem('showroom_admin_key', key);
      checkAuthAndLoad();
    }
  });

  // Copy customer link button
  document.getElementById('btnCopyLink').addEventListener('click', () => {
    const link = `${window.location.origin}/`;
    navigator.clipboard.writeText(link).then(() => {
      const btn = document.getElementById('btnCopyLink');
      const orig = btn.innerHTML;
      btn.innerHTML = '✔ Link Copied!';
      setTimeout(() => btn.innerHTML = orig, 2000);
    });
  });

  // Add Modal Open / Close
  const modal = document.getElementById('addModal');
  document.getElementById('btnOpenAddModal').addEventListener('click', () => {
    modal.classList.add('active');
  });
  document.getElementById('btnCloseAddModal').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Edit Modal Close
  const editModal = document.getElementById('editModal');
  document.getElementById('btnCloseEditModal').addEventListener('click', () => {
    editModal.classList.remove('active');
  });

  // Image preview in Add form
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const previewBox = document.getElementById('imgPreview');
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewBox.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    } else {
      previewBox.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">Preview</span>`;
    }
  });

  // Image preview in Edit form
  const editFileInput = document.getElementById('editFileInput');
  editFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const previewImg = document.getElementById('editCurrentImg');
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        previewImg.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Add Product Form Submit
  const form = document.getElementById('addProductForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitProduct');
    btn.disabled = true;
    btn.textContent = 'Uploading & Saving...';

    const formData = new FormData(form);
    formData.set('inStock', document.getElementById('inStockCheck').checked);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'x-admin-key': adminKey
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        modal.classList.remove('active');
        form.reset();
        document.getElementById('imgPreview').innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">Preview</span>`;
        loadProducts();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publish Product';
    }
  });

  // Edit Product Form Submit
  const editForm = document.getElementById('editProductForm');
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitEdit');
    const productId = document.getElementById('editProductId').value;
    btn.disabled = true;
    btn.textContent = 'Saving Changes...';

    const formData = new FormData(editForm);
    formData.set('inStock', document.getElementById('editInStockCheck').checked);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'x-admin-key': adminKey
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        editModal.classList.remove('active');
        loadProducts();
      } else {
        alert('Update error: ' + data.message);
      }
    } catch (err) {
      alert('Failed to update product: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save & Update Product';
    }
  });

  // Tab switching
  const tabCatalog = document.getElementById('tabCatalog');
  const tabSettings = document.getElementById('tabSettings');
  const secCatalog = document.getElementById('sectionCatalog');
  const secSettings = document.getElementById('sectionSettings');

  tabCatalog.addEventListener('click', () => {
    tabCatalog.classList.add('active');
    tabSettings.classList.remove('active');
    secCatalog.style.display = 'block';
    secSettings.style.display = 'none';
  });

  tabSettings.addEventListener('click', () => {
    tabSettings.classList.add('active');
    tabCatalog.classList.remove('active');
    secCatalog.style.display = 'none';
    secSettings.style.display = 'block';
    loadSettings();
  });

  // Settings Save
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      showroomName: document.getElementById('setBrandName').value,
      tagline: document.getElementById('setTagline').value,
      phone: document.getElementById('setPhone').value,
      whatsapp: document.getElementById('setWhatsapp').value,
      email: document.getElementById('setEmail').value,
      address: document.getElementById('setAddress').value
    };
    const newPasscode = document.getElementById('setPasscode').value.trim();
    if (newPasscode) {
      payload.adminPasscode = newPasscode;
      adminKey = newPasscode;
      localStorage.setItem('showroom_admin_key', newPasscode);
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Showroom branding updated successfully!');
      }
    } catch (err) {
      alert('Failed to update settings');
    }
  });
}

// Authentication check & load
async function checkAuthAndLoad() {
  try {
    const res = await fetch('/api/admin/products', {
      headers: { 'x-admin-key': adminKey }
    });
    if (res.status === 401) {
      document.getElementById('authOverlay').classList.add('active');
      document.getElementById('authError').style.display = 'block';
      return;
    }
    const data = await res.json();
    if (data.success) {
      document.getElementById('authOverlay').classList.remove('active');
      allProducts = data.products;
      updateStats(data.stats);
      renderTable(data.products);
    }
  } catch (err) {
    console.error(err);
  }
}

// Update Stats Cards
function updateStats(stats) {
  if (!stats) return;
  document.getElementById('statTotal').textContent = stats.total;
  document.getElementById('statInStock').textContent = stats.inStock;
  document.getElementById('statOutOfStock').textContent = stats.outOfStock;
  document.getElementById('statPages').textContent = Math.ceil(stats.inStock / 10) || 1;
  document.getElementById('tabCount').textContent = stats.total;
}

// Load Products
async function loadProducts() {
  checkAuthAndLoad();
}

// Open Edit Modal for a given product
function openEditModal(product) {
  if (product.inStock) {
    alert('Product is currently IN STOCK. Please toggle it to "OUT OF STOCK" first to edit its details.');
    return;
  }

  document.getElementById('editProductId').value = product.id;
  document.getElementById('editTitle').value = product.title || '';
  document.getElementById('editSku').value = product.sku || '';
  document.getElementById('editCategory').value = product.category || '';
  document.getElementById('editPrice').value = product.price || '';
  document.getElementById('editDescription').value = product.description || '';
  document.getElementById('editCurrentImg').src = product.image;
  document.getElementById('editFileInput').value = '';
  document.getElementById('editInStockCheck').checked = false;

  document.getElementById('editModal').classList.add('active');
}

// Render Products Table
function renderTable(products) {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '';

  if (!products || products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">No products listed yet. Click "Add New Product" to upload one.</td></tr>`;
    return;
  }

  products.forEach(p => {
    const isOut = !p.inStock;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <img src="${p.image}" alt="${p.title}" class="prod-thumb">
      </td>
      <td>
        <div style="font-weight: 600; color: #fff;">${p.title}</div>
        <div style="font-size: 0.78rem; color: var(--primary);">SKU: ${p.sku || 'N/A'}</div>
      </td>
      <td><span style="background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">${p.category || 'General'}</span></td>
      <td style="font-weight: 600; color: var(--primary);">${p.price || '---'}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <label class="switch">
            <input type="checkbox" ${p.inStock ? 'checked' : ''} data-id="${p.id}" class="stock-toggle">
            <span class="slider"></span>
          </label>
          <span class="badge-status ${p.inStock ? 'badge-in' : 'badge-out'}">
            ${p.inStock ? '● IN STOCK (Customer can see)' : '○ OUT OF STOCK (Hidden)'}
          </span>
        </div>
      </td>
      <td>
        <div class="action-cell">
          <button class="btn btn-edit" data-id="${p.id}" ${isOut ? '' : 'disabled'} title="${isOut ? 'Click to edit product details' : 'Toggle OUT OF STOCK first to enable editing'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button class="btn btn-outline btn-delete" data-id="${p.id}" style="padding: 5px 12px; color: var(--red); border-color: rgba(239, 68, 68, 0.3);">
            Delete
          </button>
        </div>
      </td>
    `;

    // Fast Stock Toggle handler
    const toggle = tr.querySelector('.stock-toggle');
    toggle.addEventListener('change', async () => {
      try {
        const res = await fetch(`/api/admin/products/${p.id}/toggle-stock`, {
          method: 'PATCH',
          headers: { 'x-admin-key': adminKey }
        });
        const result = await res.json();
        if (result.success) {
          loadProducts();
        }
      } catch (e) {
        alert('Failed to toggle stock status');
      }
    });

    // Edit handler (active only when out of stock)
    const editBtn = tr.querySelector('.btn-edit');
    editBtn.addEventListener('click', () => {
      openEditModal(p);
    });

    // Delete handler
    const deleteBtn = tr.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to delete "${p.title}"?`)) {
        try {
          const res = await fetch(`/api/admin/products/${p.id}`, {
            method: 'DELETE',
            headers: { 'x-admin-key': adminKey }
          });
          const result = await res.json();
          if (result.success) {
            loadProducts();
          }
        } catch (e) {
          alert('Delete failed');
        }
      }
    });

    tbody.appendChild(tr);
  });
}

// Load Showroom Settings
async function loadSettings() {
  try {
    const res = await fetch('/api/admin/settings', {
      headers: { 'x-admin-key': adminKey }
    });
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      document.getElementById('setBrandName').value = s.showroomName || '';
      document.getElementById('setTagline').value = s.tagline || '';
      document.getElementById('setPhone').value = s.phone || '';
      document.getElementById('setWhatsapp').value = s.whatsapp || '';
      document.getElementById('setEmail').value = s.email || '';
      document.getElementById('setAddress').value = s.address || '';
    }
  } catch (err) {
    console.error(err);
  }
}
