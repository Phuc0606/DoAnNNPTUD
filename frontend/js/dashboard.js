if (!localStorage.getItem('token')) window.location.href = '/index.html';

const pageTitles = {
  dashboard: 'Tổng quan', tables: 'Quản lý bàn', reservations: 'Đặt bàn',
  customers: 'Khách hàng', categories: 'Danh mục', menu: 'Thực đơn',
  orders: 'Đơn hàng', invoices: 'Hóa đơn', payments: 'Lịch sử thanh toán',
  discounts: 'Mã giảm giá', users: 'Quản lý Users'
};

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('page-title').textContent = pageTitles[name];
  event.currentTarget && event.currentTarget.classList.add('active');
  loadPage(name);
}

function loadPage(name) {
  const loaders = {
    dashboard: loadDashboard, tables: loadTables, reservations: loadReservations,
    customers: loadCustomers, categories: loadCategories, menu: loadMenu,
    orders: loadOrders, invoices: loadInvoices, payments: loadPayments,
    discounts: loadDiscounts, users: loadUsers
  };
  if (loaders[name]) loaders[name]();
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/index.html';
}

// Load user info
async function loadMe() {
  const res = await apiFetch('/auth/me');
  if (res.ok) {
    const user = await res.json();
    document.getElementById('user-name').textContent = user.username || 'Admin';
  }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
  const [tables, menu, orders, customers] = await Promise.all([
    apiFetch('/tables').then(r => r.json()),
    apiFetch('/menu-items').then(r => r.json()),
    apiFetch('/orders').then(r => r.json()),
    apiFetch('/customers').then(r => r.json()),
  ]);
  document.getElementById('stat-tables').textContent = tables.length || 0;
  document.getElementById('stat-menu').textContent = menu.length || 0;
  document.getElementById('stat-orders').textContent = orders.length || 0;
  document.getElementById('stat-customers').textContent = customers.length || 0;

  const grid = document.getElementById('tables-status-grid');
  grid.innerHTML = (tables || []).map(t => `
    <div class="table-card ${t.status}">
      <h3>Bàn ${t.number}</h3>
      <p>${t.capacity} người</p>
      <div class="status-dot"></div>
      <p style="margin-top:6px;font-size:11px">${t.status === 'available' ? 'Trống' : 'Đang dùng'}</p>
    </div>`).join('');
}

// ==================== TABLES ====================
async function loadTables() {
  const res = await apiFetch('/tables');
  const data = await res.json();
  document.getElementById('tables-body').innerHTML = data.map(t => `
    <tr>
      <td>Bàn ${t.number}</td>
      <td>${t.capacity} người</td>
      <td><span class="badge ${t.status === 'available' ? 'badge-success' : 'badge-danger'}">${t.status === 'available' ? 'Trống' : 'Đang dùng'}</span></td>
      <td>
        <button class="btn-edit" onclick="editTable('${t._id}','${t.number}','${t.capacity}')">Sửa</button>
        <button class="btn-delete" onclick="deleteTable('${t._id}')">Xoá</button>
      </td>
    </tr>`).join('');
}

function editTable(id, number, capacity) {
  document.getElementById('table-id').value = id;
  document.getElementById('table-number').value = number;
  document.getElementById('table-capacity').value = capacity;
  openModal('modal-table');
}

async function saveTable() {
  const id = document.getElementById('table-id').value;
  const body = { number: +document.getElementById('table-number').value, capacity: +document.getElementById('table-capacity').value };
  const res = await apiFetch(id ? `/tables/${id}` : '/tables', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  if (res.ok) { showToast('Lưu thành công'); closeModal('modal-table'); loadTables(); document.getElementById('table-id').value = ''; }
  else showToast('Lỗi lưu bàn', 'error');
}

async function deleteTable(id) {
  if (!confirm('Xoá bàn này?')) return;
  await apiFetch(`/tables/${id}`, { method: 'DELETE' });
  showToast('Đã xoá'); loadTables();
}

// ==================== CUSTOMERS ====================
async function loadCustomers() {
  const res = await apiFetch('/customers');
  const data = await res.json();
  document.getElementById('customers-body').innerHTML = data.map(c => `
    <tr>
      <td>${c.name}</td><td>${c.phone}</td><td>${c.email || '-'}</td>
      <td>
        <button class="btn-edit" onclick="editCustomer('${c._id}','${c.name}','${c.phone}','${c.email||''}')">Sửa</button>
        <button class="btn-delete" onclick="deleteCustomer('${c._id}')">Xoá</button>
      </td>
    </tr>`).join('');
}

function editCustomer(id, name, phone, email) {
  document.getElementById('customer-id').value = id;
  document.getElementById('customer-name').value = name;
  document.getElementById('customer-phone').value = phone;
  document.getElementById('customer-email').value = email;
  openModal('modal-customer');
}

async function saveCustomer() {
  const id = document.getElementById('customer-id').value;
  const body = { name: document.getElementById('customer-name').value, phone: document.getElementById('customer-phone').value, email: document.getElementById('customer-email').value };
  const res = await apiFetch(id ? `/customers/${id}` : '/customers', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  if (res.ok) { showToast('Lưu thành công'); closeModal('modal-customer'); loadCustomers(); document.getElementById('customer-id').value = ''; }
  else showToast('Lỗi', 'error');
}

async function deleteCustomer(id) {
  if (!confirm('Xoá khách hàng?')) return;
  await apiFetch(`/customers/${id}`, { method: 'DELETE' });
  showToast('Đã xoá'); loadCustomers();
}

// ==================== CATEGORIES ====================
async function loadCategories() {
  const res = await apiFetch('/categories');
  const data = await res.json();
  document.getElementById('categories-body').innerHTML = data.map(c => `
    <tr>
      <td>${c.name}</td>
      <td><button class="btn-delete" onclick="deleteCategory('${c._id}')">Xoá</button></td>
    </tr>`).join('');
}

async function saveCategory() {
  const name = document.getElementById('category-name').value;
  const res = await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name }) });
  if (res.ok) { showToast('Đã thêm danh mục'); closeModal('modal-category'); loadCategories(); }
  else showToast('Lỗi', 'error');
}

async function deleteCategory(id) {
  if (!confirm('Xoá danh mục?')) return;
  await apiFetch(`/categories/${id}`, { method: 'DELETE' });
  showToast('Đã xoá'); loadCategories();
}

// ==================== MENU ====================
async function loadMenu() {
  const [items, cats] = await Promise.all([apiFetch('/menu-items').then(r => r.json()), apiFetch('/categories').then(r => r.json())]);
  document.getElementById('menu-body').innerHTML = items.map(m => `
    <tr>
      <td>${m.image ? `<img src="${m.image}" style="width:48px;height:48px;object-fit:cover;border-radius:6px">` : '<span style="color:#ccc;font-size:20px">🍽️</span>'}</td>
      <td>${m.name}</td>
      <td>${m.category?.name || '-'}</td>
      <td>${m.price?.toLocaleString('vi-VN')} đ</td>
      <td>${m.stock ?? '-'}</td>
      <td><span class="badge ${m.isAvailable ? 'badge-success' : 'badge-danger'}">${m.isAvailable ? 'Còn' : 'Hết'}</span></td>
      <td>
        <button class="btn-edit" onclick="editMenuItem('${m._id}','${m.name}','${m.price}','${m.category?._id||''}','${m.description||''}',${m.stock||0},'${m.image||''}')">Sửa</button>
        <button class="btn-delete" onclick="deleteMenuItem('${m._id}')">Xoá</button>
      </td>
    </tr>`).join('');

  const sel = document.getElementById('menu-category');
  sel.innerHTML = cats.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
}

function editMenuItem(id, name, price, catId, desc, stock, image) {
  document.getElementById('menu-id').value = id;
  document.getElementById('menu-name').value = name;
  document.getElementById('menu-price').value = price;
  document.getElementById('menu-desc').value = desc;
  document.getElementById('menu-stock').value = stock || 0;
  document.getElementById('menu-image-url').value = image || '';
  document.getElementById('menu-image-file').value = '';
  // Hiển thị ảnh hiện tại nếu có
  const preview = document.getElementById('menu-image-preview');
  const thumb = document.getElementById('menu-image-thumb');
  if (image) {
    thumb.src = image;
    document.getElementById('menu-image-status').textContent = 'Ảnh hiện tại';
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
  setTimeout(() => { document.getElementById('menu-category').value = catId; }, 100);
  openModal('modal-menu');
}

async function uploadMenuImage(input) {
  if (!input.files || !input.files[0]) return;
  // Preview ngay lập tức
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('menu-image-thumb').src = e.target.result;
    document.getElementById('menu-image-status').textContent = 'Đang upload...';
    document.getElementById('menu-image-status').style.color = '#e67e22';
    document.getElementById('menu-image-preview').style.display = 'block';
  };
  reader.readAsDataURL(input.files[0]);
  // Upload lên server ngay
  const formData = new FormData();
  formData.append('image', input.files[0]);
  const token = localStorage.getItem('token');
  const res = await fetch('/api/v1/menu-items/upload-image', {
    method: 'POST',
    headers: { 'Authorization': token },
    body: formData
  });
  if (res.ok) {
    const data = await res.json();
    document.getElementById('menu-image-url').value = data.imageUrl;
    document.getElementById('menu-image-thumb').src = data.imageUrl;
    document.getElementById('menu-image-status').textContent = '✅ Sẵn sàng lưu';
    document.getElementById('menu-image-status').style.color = '#27ae60';
  } else {
    document.getElementById('menu-image-status').textContent = '❌ Upload thất bại';
    document.getElementById('menu-image-status').style.color = '#e74c3c';
  }
}

async function saveMenuItem() {
  const id = document.getElementById('menu-id').value;
  const stock = +document.getElementById('menu-stock').value;
  const body = {
    name: document.getElementById('menu-name').value,
    price: +document.getElementById('menu-price').value,
    category: document.getElementById('menu-category').value,
    description: document.getElementById('menu-desc').value,
    stock,
    isAvailable: stock > 0
  };
  const imageUrl = document.getElementById('menu-image-url').value;
  if (imageUrl) body.image = imageUrl;
  const res = await apiFetch(id ? `/menu-items/${id}` : '/menu-items', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  if (res.ok) {
    showToast('Lưu thành công');
    closeModal('modal-menu');
    loadMenu();
    document.getElementById('menu-id').value = '';
    document.getElementById('menu-image-url').value = '';
    document.getElementById('menu-image-preview').style.display = 'none';
  } else showToast('Lỗi', 'error');
}

async function deleteMenuItem(id) {
  if (!confirm('Xoá món ăn?')) return;
  await apiFetch(`/menu-items/${id}`, { method: 'DELETE' });
  showToast('Đã xoá'); loadMenu();
}

// ==================== RESERVATIONS ====================
async function loadReservations() {
  const [data, tables] = await Promise.all([
    apiFetch('/reservations').then(r => r.json()),
    apiFetch('/tables').then(r => r.json())
  ]);

  const statusMap = {
    pending:    { label: '⏳ Chờ xác nhận', cls: 'badge-warning' },
    confirmed:  { label: '✅ Đã xác nhận',  cls: 'badge-info' },
    checked_in: { label: '🟢 Đã check-in',  cls: 'badge-success' },
    cancelled:  { label: '❌ Đã huỷ',       cls: 'badge-danger' },
    no_show:    { label: '👻 Không đến',     cls: 'badge-danger' }
  };

  document.getElementById('reservations-body').innerHTML = data.map(r => {
    const s = statusMap[r.status] || { label: r.status, cls: '' };
    const isPast = new Date(r.reservationDate) < new Date();
    let actions = '';
    if (r.status === 'pending') {
      actions = `<button class="btn-confirm" onclick="openConfirmRes('${r._id}','${r.customerName}','${r.phone}',${r.guestCount},'${new Date(r.reservationDate).toLocaleString('vi-VN')}')">✅ Xác nhận</button>
                 <button class="btn-delete" onclick="cancelRes('${r._id}')">Huỷ</button>`;
    } else if (r.status === 'confirmed') {
      actions = `<button class="btn-confirm" style="background:#27ae60" onclick="checkinRes('${r._id}')">🟢 Check-in</button>
                 ${isPast ? `<button class="btn-delete" onclick="noShowRes('${r._id}')">👻 No-show</button>` : ''}
                 <button class="btn-delete" onclick="cancelRes('${r._id}')">Huỷ</button>`;
    }
    return `<tr>
      <td>${r.customerName}</td>
      <td><a href="tel:${r.phone}" style="color:#3498db">${r.phone}</a></td>
      <td>${r.table ? 'Bàn ' + r.table.number : '<span style="color:#aaa">Chưa gán</span>'}</td>
      <td>${new Date(r.reservationDate).toLocaleString('vi-VN')}</td>
      <td>${r.guestCount} người</td>
      <td><span class="badge ${s.cls}">${s.label}</span></td>
      <td>${actions}</td>
    </tr>`;
  }).join('');

  // Populate select bàn cho modal confirm (chỉ bàn trống)
  const availTables = tables.filter(t => t.status === 'available');
  document.getElementById('confirm-res-table').innerHTML = availTables.length
    ? availTables.map(t => `<option value="${t._id}">Bàn ${t.number} (${t.capacity} người)</option>`).join('')
    : '<option value="">-- Không có bàn trống --</option>';

  // Populate select bàn cho modal tạo mới (dashboard)
  document.getElementById('res-date').min = new Date().toISOString().slice(0, 16);
}

function openConfirmRes(id, name, phone, guests, dateStr) {
  document.getElementById('confirm-res-id').value = id;
  document.getElementById('confirm-res-info').innerHTML = `
    <p>👤 <b>${name}</b> — 📞 ${phone}</p>
    <p>👥 ${guests} người — 🕐 ${dateStr}</p>`;
  openModal('modal-confirm-res');
}

async function confirmReservation() {
  const id = document.getElementById('confirm-res-id').value;
  const tableId = document.getElementById('confirm-res-table').value;
  if (!tableId) { showToast('Không có bàn trống để gán', 'error'); return; }
  const res = await apiFetch(`/reservations/${id}/confirm`, { method: 'PUT', body: JSON.stringify({ tableId }) });
  if (res.ok) {
    showToast('Đã xác nhận & gửi email cho khách');
    closeModal('modal-confirm-res');
    loadReservations();
  } else {
    const e = await res.json(); showToast(e.message || 'Lỗi', 'error');
  }
}

async function checkinRes(id) {
  if (!confirm('Xác nhận khách đã đến? Bàn sẽ chuyển sang Đang dùng và tạo đơn hàng mới.')) return;
  const res = await apiFetch(`/reservations/${id}/checkin`, { method: 'PUT' });
  if (res.ok) {
    showToast('Check-in thành công! Đơn hàng đã được tạo.');
    loadReservations();
  } else {
    const e = await res.json(); showToast(e.message || 'Lỗi', 'error');
  }
}

async function noShowRes(id) {
  if (!confirm('Đánh dấu khách không đến?')) return;
  await apiFetch(`/reservations/${id}/no-show`, { method: 'PUT' });
  showToast('Đã đánh dấu no-show'); loadReservations();
}

async function cancelRes(id) {
  if (!confirm('Huỷ đặt bàn này?')) return;
  await apiFetch(`/reservations/${id}/cancel`, { method: 'PUT' });
  showToast('Đã huỷ'); loadReservations();
}

async function saveReservation() {
  const name = document.getElementById('res-name').value.trim();
  const phone = document.getElementById('res-phone').value.trim();
  const email = document.getElementById('res-email').value.trim();
  const date = document.getElementById('res-date').value;
  const guests = +document.getElementById('res-guests').value;
  const note = document.getElementById('res-note').value;
  if (!name || !phone || !date) { showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error'); return; }
  const res = await apiFetch('/reservations', {
    method: 'POST',
    body: JSON.stringify({ customerName: name, phone, email, reservationDate: date, guestCount: guests, note })
  });
  if (res.ok) {
    showToast('Đặt bàn thành công');
    closeModal('modal-reservation');
    loadReservations();
    document.getElementById('res-name').value = '';
    document.getElementById('res-phone').value = '';
    document.getElementById('res-email').value = '';
  } else {
    const e = await res.json(); showToast(e.message || 'Lỗi', 'error');
  }
}

// ==================== ORDERS ====================
async function loadOrders() {
  const filter = document.getElementById('order-filter')?.value || 'active';
  const [orders, tables, customers] = await Promise.all([
    apiFetch('/orders').then(r => r.json()),
    apiFetch('/tables').then(r => r.json()),
    apiFetch('/customers').then(r => r.json())
  ]);

  const activeStatuses = ['pending', 'open', 'waiting_payment'];
  const filtered = filter === 'active'
    ? orders.filter(o => activeStatuses.includes(o.status))
    : filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);
  document.getElementById('orders-body').innerHTML = filtered.map(o => {
    let statusBadge, actions = '';
    if (o.status === 'pending') {
      statusBadge = '<span class="badge badge-warning">⏳ Chờ xác nhận</span>';
      actions = `<button class="btn-confirm" onclick="confirmOrder('${o._id}')">✅ Xác nhận</button> <button class="btn-delete" onclick="cancelOrder('${o._id}')">Huỷ</button>`;
    } else if (o.status === 'open') {
      statusBadge = '<span class="badge badge-info">Đang phục vụ</span>';
      actions = `<button class="btn-edit" onclick="openAddItem('${o._id}')">+ Món</button> <button class="btn-confirm" onclick="closeOrder('${o._id}')">Đóng đơn</button>`;
    } else if (o.status === 'waiting_payment') {
      const method = o.paymentMethod === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản';
      statusBadge = `<span class="badge" style="background:#f39c12;color:#fff">💳 Chờ thanh toán (${method})</span>`;
      actions = `<button class="btn-confirm" style="background:#27ae60" onclick="openApprovePayment('${o._id}')">✅ Duyệt thanh toán</button>`;
    } else if (o.status === 'closed') {
      statusBadge = '<span class="badge badge-success">Đã đóng</span>';
    } else {
      statusBadge = '<span class="badge badge-danger">Đã huỷ</span>';
    }
    return `<tr>
      <td>Bàn ${o.table?.number || '-'}</td>
      <td>${o.user?.username || o.customer?.name || '-'}</td>
      <td>${statusBadge}</td>
      <td>${new Date(o.createdAt).toLocaleString('vi-VN')}</td>
      <td>
        <button class="btn-edit" onclick="viewOrderDetail('${o._id}')">Chi tiết</button>
        ${actions}
      </td>
    </tr>`;
  }).join('');

  document.getElementById('order-table').innerHTML = tables.map(t => `<option value="${t._id}">Bàn ${t.number}</option>`).join('');
  const custSel = document.getElementById('order-customer');
  custSel.innerHTML = '<option value="">-- Không chọn --</option>' + customers.map(c => `<option value="${c._id}">${c.name}</option>`).join('');

  // Load menu for add-item modal
  const menu = await apiFetch('/menu-items').then(r => r.json());
  document.getElementById('add-item-menu').innerHTML = menu.map(m => `<option value="${m._id}" data-price="${m.price}">${m.name} - ${m.price?.toLocaleString('vi-VN')}đ</option>`).join('');
}

async function saveOrder() {
  const body = { table: document.getElementById('order-table').value };
  const cust = document.getElementById('order-customer').value;
  if (cust) body.customer = cust;
  const res = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(body) });
  if (res.ok) { showToast('Tạo đơn thành công'); closeModal('modal-order'); loadOrders(); }
  else showToast('Lỗi', 'error');
}

function openAddItem(orderId) {
  document.getElementById('add-item-order-id').value = orderId;
  openModal('modal-add-item');
}

async function addItemToOrder() {
  const orderId = document.getElementById('add-item-order-id').value;
  const menuSel = document.getElementById('add-item-menu');
  const price = +menuSel.options[menuSel.selectedIndex].dataset.price;
  const body = { menuItem: menuSel.value, quantity: +document.getElementById('add-item-qty').value, price, note: document.getElementById('add-item-note').value };
  const res = await apiFetch(`/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify(body) });
  if (res.ok) { showToast('Đã thêm món'); closeModal('modal-add-item'); }
  else showToast('Lỗi', 'error');
}

async function closeOrder(id) {
  if (!confirm('Đóng đơn hàng này?')) return;
  await apiFetch(`/orders/${id}/close`, { method: 'PUT' });
  showToast('Đã đóng đơn'); loadOrders();
}

async function confirmOrder(id) {
  await apiFetch(`/orders/${id}/confirm`, { method: 'PUT' });
  showToast('Đã xác nhận đơn'); loadOrders();
}

async function viewOrderDetail(id) {
  const res = await apiFetch(`/orders/${id}`);
  const { order, details } = await res.json();
  const total = details.reduce((s, d) => s + d.price * d.quantity, 0);
  const html = `
    <p><strong>Bàn:</strong> ${order.table?.number} | <strong>Người đặt:</strong> ${order.user?.username || order.customer?.name || 'Khách vãng lai'}</p>
    <p><strong>Trạng thái:</strong> ${order.status} | <strong>Thời gian:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
    <hr style="margin:12px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8f9fa"><th style="padding:8px;text-align:left">Món</th><th style="padding:8px;text-align:center">SL</th><th style="padding:8px;text-align:right">Giá</th><th style="padding:8px;text-align:right">Thành tiền</th></tr></thead>
      <tbody>${details.map(d => `<tr><td style="padding:8px">${d.menuItem?.name}</td><td style="padding:8px;text-align:center">${d.quantity}</td><td style="padding:8px;text-align:right">${d.price?.toLocaleString('vi-VN')}đ</td><td style="padding:8px;text-align:right">${(d.price*d.quantity)?.toLocaleString('vi-VN')}đ</td></tr>`).join('')}</tbody>
    </table>
    <hr style="margin:12px 0">
    <p style="text-align:right;font-size:16px;font-weight:700">Tổng: ${total.toLocaleString('vi-VN')}đ</p>`;
  document.getElementById('order-detail-content').innerHTML = html;
  openModal('modal-order-detail');
}
async function cancelOrder(id) {
  if (!confirm('Huỷ đơn này?')) return;
  await apiFetch(`/orders/${id}/cancel`, { method: 'PUT' });
  showToast('Đã huỷ đơn'); loadOrders();
}

// ==================== INVOICES ====================
async function loadInvoices() {
  const [invoices, orders] = await Promise.all([
    apiFetch('/invoices').then(r => r.json()),
    apiFetch('/orders').then(r => r.json())
  ]);
  document.getElementById('invoices-body').innerHTML = invoices.map(i => `
    <tr>
      <td>Bàn ${i.order?.table?.number || '-'}</td>
      <td>${i.totalAmount?.toLocaleString('vi-VN')} đ</td>
      <td>${i.discount > 0 ? i.discount.toLocaleString('vi-VN') + ' đ' : '-'}</td>
      <td><strong>${i.finalAmount?.toLocaleString('vi-VN')} đ</strong></td>
      <td><span class="badge badge-success">${i.paymentMethod === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}</span></td>
      <td>${new Date(i.createdAt).toLocaleString('vi-VN')}</td>
      <td><button class="btn-edit" onclick="viewInvoiceDetail('${i._id}')">Xem</button></td>
    </tr>`).join('');

  // Chỉ lấy đơn đang open để xuất hóa đơn
  const openOrders = orders.filter(o => o.status === 'open');
  document.getElementById('invoice-order').innerHTML = openOrders.length
    ? openOrders.map(o => `<option value="${o._id}">Đơn - Bàn ${o.table?.number || o._id}</option>`).join('')
    : '<option value="">-- Không có đơn nào đang phục vụ --</option>';
}

function openInvoiceModal() {
  // Reset form
  document.getElementById('invoice-discount-code').value = '';
  document.getElementById('invoice-discount-msg').style.display = 'none';
  document.getElementById('invoice-preview').innerHTML = '<p style="color:#aaa;text-align:center">Chọn đơn hàng để xem tạm tính</p>';
  window._invoiceDiscountAmount = 0;
  window._invoiceDiscountCode = null;
  loadInvoices(); // refresh danh sách đơn
  openModal('modal-invoice');
}

async function previewInvoice() {
  const orderId = document.getElementById('invoice-order').value;
  if (!orderId) return;
  window._invoiceDiscountAmount = 0;
  window._invoiceDiscountCode = null;
  document.getElementById('invoice-discount-msg').style.display = 'none';
  await _renderPreview(orderId, 0, null);
}

async function _renderPreview(orderId, discountAmount, discountInfo) {
  const res = await apiFetch('/invoices/preview', {
    method: 'POST',
    body: JSON.stringify({ orderId, discountCode: window._invoiceDiscountCode || undefined })
  });
  if (!res.ok) { const e = await res.json(); showToast(e.message, 'error'); return; }
  const data = await res.json();
  const rows = data.details.map(d =>
    `<tr><td>${d.menuItem?.name}</td><td style="text-align:center">${d.quantity}</td><td style="text-align:right">${(d.price * d.quantity).toLocaleString('vi-VN')}đ</td></tr>`
  ).join('');
  document.getElementById('invoice-preview').innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px">
      <thead><tr style="background:#f0f0f0"><th style="padding:6px;text-align:left">Món</th><th style="padding:6px;text-align:center">SL</th><th style="padding:6px;text-align:right">Thành tiền</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="border-top:1px solid #eee;padding-top:10px;font-size:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Tổng cộng:</span><span>${data.totalAmount.toLocaleString('vi-VN')}đ</span></div>
      ${data.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#e74c3c"><span>Giảm giá${data.discountInfo ? ' (' + data.discountInfo.code + ')' : ''}:</span><span>-${data.discountAmount.toLocaleString('vi-VN')}đ</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;color:#27ae60"><span>Thành tiền:</span><span>${data.finalAmount.toLocaleString('vi-VN')}đ</span></div>
    </div>`;
}

async function applyDiscountCode() {
  const orderId = document.getElementById('invoice-order').value;
  const code = document.getElementById('invoice-discount-code').value.trim();
  const msgEl = document.getElementById('invoice-discount-msg');
  if (!orderId) { showToast('Vui lòng chọn đơn hàng trước', 'error'); return; }
  if (!code) { showToast('Nhập mã giảm giá', 'error'); return; }

  window._invoiceDiscountCode = code;
  const res = await apiFetch('/invoices/preview', {
    method: 'POST',
    body: JSON.stringify({ orderId, discountCode: code })
  });
  if (!res.ok) {
    const e = await res.json();
    msgEl.style.color = '#e74c3c';
    msgEl.textContent = '❌ ' + e.message;
    msgEl.style.display = 'block';
    window._invoiceDiscountCode = null;
    return;
  }
  const data = await res.json();
  window._invoiceDiscountAmount = data.discountAmount;
  msgEl.style.color = '#27ae60';
  msgEl.textContent = `✅ Áp dụng thành công! Giảm ${data.discountAmount.toLocaleString('vi-VN')}đ`;
  msgEl.style.display = 'block';
  document.getElementById('invoice-preview').innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px">
      <thead><tr style="background:#f0f0f0"><th style="padding:6px;text-align:left">Món</th><th style="padding:6px;text-align:center">SL</th><th style="padding:6px;text-align:right">Thành tiền</th></tr></thead>
      <tbody>${data.details.map(d => `<tr><td style="padding:4px">${d.menuItem?.name}</td><td style="padding:4px;text-align:center">${d.quantity}</td><td style="padding:4px;text-align:right">${(d.price*d.quantity).toLocaleString('vi-VN')}đ</td></tr>`).join('')}</tbody>
    </table>
    <div style="border-top:1px solid #eee;padding-top:10px;font-size:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Tổng cộng:</span><span>${data.totalAmount.toLocaleString('vi-VN')}đ</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#e74c3c"><span>Giảm giá (${data.discountInfo?.code}):</span><span>-${data.discountAmount.toLocaleString('vi-VN')}đ</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;color:#27ae60"><span>Thành tiền:</span><span>${data.finalAmount.toLocaleString('vi-VN')}đ</span></div>
    </div>`;
}

async function saveInvoice() {
  const orderId = document.getElementById('invoice-order').value;
  const paymentMethod = document.getElementById('invoice-payment-method').value;
  if (!orderId) { showToast('Vui lòng chọn đơn hàng', 'error'); return; }

  const body = { orderId, paymentMethod };
  if (window._invoiceDiscountCode) body.discountCode = window._invoiceDiscountCode;

  const res = await apiFetch('/invoices', { method: 'POST', body: JSON.stringify(body) });
  if (res.ok) {
    showToast('Thanh toán thành công');
    closeModal('modal-invoice');
    loadInvoices();
    // Refresh orders nếu đang xem
    const activePage = document.querySelector('.page.active');
    if (activePage?.id === 'page-orders') loadOrders();
  } else {
    const err = await res.json();
    showToast(err.message || 'Lỗi', 'error');
  }
}

async function viewInvoiceDetail(id) {
  const res = await apiFetch(`/invoices/${id}`);
  const { invoice, details } = await res.json();
  const rows = details.map(d =>
    `<tr><td style="padding:8px">${d.menuItem?.name}</td><td style="padding:8px;text-align:center">${d.quantity}</td><td style="padding:8px;text-align:right">${d.price?.toLocaleString('vi-VN')}đ</td><td style="padding:8px;text-align:right">${(d.price*d.quantity)?.toLocaleString('vi-VN')}đ</td></tr>`
  ).join('');
  document.getElementById('invoice-detail-content').innerHTML = `
    <p><strong>Bàn:</strong> ${invoice.order?.table?.number || '-'} | <strong>Khách:</strong> ${invoice.order?.customer?.name || 'Khách vãng lai'}</p>
    <p><strong>Thanh toán:</strong> ${invoice.paymentMethod === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'} | <strong>Thời gian:</strong> ${new Date(invoice.createdAt).toLocaleString('vi-VN')}</p>
    <hr style="margin:12px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f8f9fa"><th style="padding:8px;text-align:left">Món</th><th style="padding:8px;text-align:center">SL</th><th style="padding:8px;text-align:right">Đơn giá</th><th style="padding:8px;text-align:right">Thành tiền</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <hr style="margin:12px 0">
    <div style="font-size:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Tổng cộng:</span><span>${invoice.totalAmount?.toLocaleString('vi-VN')}đ</span></div>
      ${invoice.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#e74c3c"><span>Giảm giá${invoice.discountCode ? ' (' + invoice.discountCode + ')' : ''}:</span><span>-${invoice.discount?.toLocaleString('vi-VN')}đ</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;color:#27ae60"><span>Thành tiền:</span><span>${invoice.finalAmount?.toLocaleString('vi-VN')}đ</span></div>
    </div>`;
  openModal('modal-invoice-detail');
}

// ==================== PAYMENTS (lịch sử) ====================
async function loadPayments() {
  const res = await apiFetch('/payments');
  const data = await res.json();
  document.getElementById('payments-body').innerHTML = data.map(i => `
    <tr>
      <td>Bàn ${i.order?.table?.number || '-'}</td>
      <td>${i.totalAmount?.toLocaleString('vi-VN')} đ</td>
      <td>${i.discount > 0 ? i.discount.toLocaleString('vi-VN') + ' đ' : '-'}</td>
      <td><strong>${i.finalAmount?.toLocaleString('vi-VN')} đ</strong></td>
      <td>${i.paymentMethod === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}</td>
      <td>${i.discountCode || '-'}</td>
      <td>${new Date(i.createdAt).toLocaleString('vi-VN')}</td>
    </tr>`).join('');
}

// ==================== DISCOUNTS ====================
async function loadDiscounts() {
  const res = await apiFetch('/discounts');
  const data = await res.json();
  const now = new Date();
  document.getElementById('discounts-body').innerHTML = data.map(d => {
    const started = now >= new Date(d.startDate);
    const expired = now > new Date(d.expiryDate);
    let statusLabel, statusClass;
    if (!d.isActive) { statusLabel = '⏸ Tắt'; statusClass = 'badge-danger'; }
    else if (!started) { statusLabel = '⏳ Chưa bắt đầu'; statusClass = 'badge-warning'; }
    else if (expired) { statusLabel = '❌ Hết hạn'; statusClass = 'badge-danger'; }
    else { statusLabel = '✅ Đang hoạt động'; statusClass = 'badge-success'; }
    return `<tr>
      <td><strong>${d.code}</strong></td>
      <td>${d.type === 'amount' ? 'Số tiền' : 'Phần trăm'}</td>
      <td>${d.type === 'amount' ? d.value.toLocaleString('vi-VN') + 'đ' : d.value + '%'}</td>
      <td>${d.minOrderValue > 0 ? d.minOrderValue.toLocaleString('vi-VN') + 'đ' : '<span style="color:#aaa">Không giới hạn</span>'}</td>
      <td>${new Date(d.startDate).toLocaleString('vi-VN')}</td>
      <td>${new Date(d.expiryDate).toLocaleString('vi-VN')}</td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td>
        <button class="btn-edit" onclick="editDiscount('${d._id}','${d.code}','${d.type}',${d.value},${d.minOrderValue||0},'${d.startDate}','${d.expiryDate}')">✏️ Sửa</button>
        <button class="btn-edit" onclick="toggleDiscount('${d._id}')">${d.isActive ? '⏸ Tắt' : '▶ Bật'}</button>
        <button class="btn-delete" onclick="deleteDiscount('${d._id}')">Xoá</button>
      </td>
    </tr>`;
  }).join('');
}

function updateDiscountValueHint() {
  const type = document.getElementById('discount-type').value;
  const label = document.getElementById('discount-value-label');
  const input = document.getElementById('discount-value');
  if (type === 'percent') {
    label.textContent = 'Giá trị (%)';
    input.placeholder = 'VD: 10 (tức 10%)';
    input.max = 100;
  } else {
    label.textContent = 'Giá trị (VNĐ)';
    input.placeholder = 'VD: 20000';
    input.removeAttribute('max');
  }
}

function editDiscount(id, code, type, value, minOrderValue, startDate, expiryDate) {
  document.getElementById('discount-id').value = id;
  document.getElementById('discount-code').value = code;
  document.getElementById('discount-type').value = type;
  document.getElementById('discount-value').value = value;
  document.getElementById('discount-min-order').value = minOrderValue || '';
  // Format datetime-local (cắt milliseconds)
  document.getElementById('discount-start').value = new Date(startDate).toISOString().slice(0, 16);
  document.getElementById('discount-expiry').value = new Date(expiryDate).toISOString().slice(0, 16);
  document.getElementById('discount-modal-title').textContent = 'Sửa mã giảm giá';
  document.getElementById('discount-save-btn').textContent = 'Lưu thay đổi';
  updateDiscountValueHint();
  openModal('modal-discount');
}

async function saveDiscount() {
  const id = document.getElementById('discount-id').value;
  const code = document.getElementById('discount-code').value.trim().toUpperCase();
  const type = document.getElementById('discount-type').value;
  const value = +document.getElementById('discount-value').value;
  const minOrderValue = +document.getElementById('discount-min-order').value || 0;
  const startDate = document.getElementById('discount-start').value;
  const expiryDate = document.getElementById('discount-expiry').value;
  if (!code || !value || !startDate || !expiryDate) { showToast('Vui lòng điền đầy đủ thông tin', 'error'); return; }
  if (new Date(startDate) >= new Date(expiryDate)) { showToast('Ngày bắt đầu phải trước ngày kết thúc', 'error'); return; }

  const url = id ? `/discounts/${id}` : '/discounts';
  const method = id ? 'PUT' : 'POST';
  const res = await apiFetch(url, { method, body: JSON.stringify({ code, type, value, minOrderValue, startDate, expiryDate }) });
  if (res.ok) {
    showToast(id ? 'Đã cập nhật mã' : 'Tạo mã thành công');
    closeModal('modal-discount');
    // Reset form
    document.getElementById('discount-id').value = '';
    document.getElementById('discount-modal-title').textContent = 'Tạo mã giảm giá';
    document.getElementById('discount-save-btn').textContent = 'Tạo mã';
    loadDiscounts();
  } else { const e = await res.json(); showToast(e.message || 'Lỗi', 'error'); }
}

async function toggleDiscount(id) {
  const res = await apiFetch(`/discounts/${id}/toggle`, { method: 'PATCH' });
  if (res.ok) { loadDiscounts(); }
  else showToast('Lỗi', 'error');
}

async function deleteDiscount(id) {
  if (!confirm('Xoá mã giảm giá này?')) return;
  await apiFetch(`/discounts/${id}`, { method: 'DELETE' });
  showToast('Đã xoá'); loadDiscounts();
}

// ==================== USERS (Admin only) ====================
async function loadUsers() {
  const res = await apiFetch('/users');
  if (!res.ok) { showToast('Bạn không có quyền truy cập', 'error'); return; }
  const data = await res.json();
  document.getElementById('users-body').innerHTML = data.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.email}</td>
      <td><span class="badge ${u.role?.name==='admin'?'badge-danger':u.role?.name==='nhanvien'?'badge-info':'badge-success'}">${u.role?.name || '-'}</span></td>
      <td>
        <select onchange="changeRole('${u._id}', this.value)" style="padding:6px 10px;border-radius:6px;border:1px solid #ddd;font-size:13px;">
          <option value="user" ${u.role?.name==='user'?'selected':''}>user</option>
          <option value="nhanvien" ${u.role?.name==='nhanvien'?'selected':''}>nhanvien</option>
          <option value="admin" ${u.role?.name==='admin'?'selected':''}>admin</option>
        </select>
      </td>
    </tr>`).join('');
}

async function changeRole(userId, roleName) {
  const res = await apiFetch(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ roleName })
  });
  if (res.ok) showToast(`Đã đổi role thành ${roleName}`);
  else showToast('Lỗi đổi role', 'error');
}

// ==================== NOTIFICATIONS ====================
let _notifOpen = false;
let _prevWaitingCount = 0;

function toggleNotifications() {
  _notifOpen = !_notifOpen;
  document.getElementById('notif-dropdown').style.display = _notifOpen ? 'block' : 'none';
  if (_notifOpen) pollNotifications();
}

// Đóng dropdown khi click ra ngoài
document.addEventListener('click', e => {
  if (!e.target.closest('[onclick="toggleNotifications()"]') && !e.target.closest('#notif-dropdown')) {
    _notifOpen = false;
    document.getElementById('notif-dropdown').style.display = 'none';
  }
});

async function pollNotifications() {
  try {
    const res = await apiFetch('/orders/waiting-payment');
    if (!res.ok) return;
    const orders = await res.json();
    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');

    if (orders.length > 0) {
      badge.textContent = orders.length;
      badge.style.display = 'flex';
      // Toast nếu có đơn mới
      if (orders.length > _prevWaitingCount) {
        const newest = orders[0];
        showToast(`🔔 Bàn ${newest.table?.number} yêu cầu thanh toán (${newest.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'})`, 'success');
      }
      list.innerHTML = orders.map(o => `
        <div style="padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer" onclick="openApprovePayment('${o._id}');toggleNotifications()">
          <div style="font-weight:600;font-size:13px">🪑 Bàn ${o.table?.number} — ${o.paymentMethod === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}</div>
          <div style="font-size:12px;color:#888;margin-top:2px">${new Date(o.updatedAt).toLocaleString('vi-VN')}</div>
          <div style="font-size:12px;color:#e74c3c;margin-top:2px">Nhấn để duyệt thanh toán</div>
        </div>`).join('');
    } else {
      badge.style.display = 'none';
      list.innerHTML = '<div style="padding:16px;text-align:center;color:#aaa;font-size:13px">Không có yêu cầu mới</div>';
    }
    _prevWaitingCount = orders.length;
  } catch {}
}

async function openApprovePayment(orderId) {
  const res = await apiFetch(`/orders/${orderId}`);
  const { order, details } = await res.json();
  const total = details.reduce((s, d) => s + d.price * d.quantity, 0);
  const discount = order.discountAmount || 0;
  const final = order.finalAmount || (total - discount);

  document.getElementById('approve-order-id').value = orderId;
  document.getElementById('approve-payment-content').innerHTML = `
    <div style="background:#fff8e1;border:1px solid #f39c12;border-radius:8px;padding:12px;margin-bottom:16px;font-size:14px">
      <strong>🪑 Bàn ${order.table?.number}</strong> — Phương thức: <strong>${order.paymentMethod === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}</strong>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px">
      <thead><tr style="background:#f8f9fa"><th style="padding:8px;text-align:left">Món</th><th style="padding:8px;text-align:center">SL</th><th style="padding:8px;text-align:right">Thành tiền</th></tr></thead>
      <tbody>${details.map(d => `<tr><td style="padding:6px 8px">${d.menuItem?.name}</td><td style="padding:6px 8px;text-align:center">${d.quantity}</td><td style="padding:6px 8px;text-align:right">${(d.price*d.quantity).toLocaleString('vi-VN')}đ</td></tr>`).join('')}</tbody>
    </table>
    <div style="border-top:1px solid #eee;padding-top:10px;font-size:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Tạm tính:</span><span>${total.toLocaleString('vi-VN')}đ</span></div>
      ${discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#e74c3c"><span>Giảm giá${order.discountCode ? ' (' + order.discountCode + ')' : ''}:</span><span>-${discount.toLocaleString('vi-VN')}đ</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px;color:#27ae60"><span>Thành tiền:</span><span>${final.toLocaleString('vi-VN')}đ</span></div>
    </div>`;
  openModal('modal-approve-payment');
}

async function approvePayment() {
  const orderId = document.getElementById('approve-order-id').value;
  const res = await apiFetch(`/orders/${orderId}/approve-payment`, { method: 'PATCH' });
  if (res.ok) {
    showToast('Đã duyệt thanh toán, bàn đã được giải phóng');
    closeModal('modal-approve-payment');
    loadOrders();
    pollNotifications();
  } else {
    const err = await res.json();
    showToast(err.message || 'Lỗi', 'error');
  }
}

// Init
loadMe();
loadDashboard();
pollNotifications();

// Auto refresh orders mỗi 15 giây để nhân viên thấy đơn mới + check notifications
setInterval(() => {
  const activePage = document.querySelector('.page.active');
  if (activePage && activePage.id === 'page-orders') loadOrders();
  pollNotifications();
}, 15000);

// Phân quyền menu theo role
const role = localStorage.getItem('role');
if (role !== 'admin') {
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
}

// Nhanvien chỉ thấy: Tổng quan, Bàn, Order, Hóa đơn
if (role === 'nhanvien') {
  document.querySelectorAll('.staff-hidden').forEach(el => el.style.display = 'none');
}
