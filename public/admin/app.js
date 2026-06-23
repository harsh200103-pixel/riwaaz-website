/* =====================================================
   RIWAAZ BY ESHMIRA — BILLING SOFTWARE v1.0
   app.js — All application logic
   ===================================================== */

'use strict';

// ════════════════════════════════════════ CONFIG ════
const CONFIG = {
  shopName:  'Riwaaz by Eshmira',
  shopName2: 'Riwaaz',
  tagline:   'by Eshmira',
  phone1:    '9827788773',
  phone2:    '9770496796',
  address:   '50/2, Shivam Apartment, Bholaram Ustad Marg, Indore',
  city:      'Indore',
  currency:  '₹',
  categories: ['Cotton Suit', 'Silk Suit', 'Crepe Suit', 'Cord Set', 'Readymade Suit', 'Unstitched Suit', 'Stitched Suit', 'Rumalla Saheb', 'Kurtis', 'Customised'],
  paymentModes: ['Cash', 'UPI', 'Card', 'Pending'],
  lowStockThreshold: 5
};

// ═══════════════════════════════════════ HELPERS ════
const H = {
  fmt: (n) => CONFIG.currency + Number(n || 0).toLocaleString('en-IN'),
  fmtNum: (n) => Number(n || 0).toLocaleString('en-IN'),
  today: () => new Date().toISOString().split('T')[0],
  formatDate: (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  formatDateShort: (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  },
  greet: () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  },
  id: (prefix) => prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,6).toUpperCase(),
  initials: (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  },
  escHtml: (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
  debounce: (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
};

// ═══════════════════════════════════════ STORE ═════
const Store = {
  // Bills
  getBills: () => JSON.parse(localStorage.getItem('rbe_bills') || '[]'),
  saveBills: (bills) => localStorage.setItem('rbe_bills', JSON.stringify(bills)),
  addBill: (bill) => {
    const bills = Store.getBills();
    bills.unshift(bill);
    Store.saveBills(bills);
    Store.upsertCustomer(bill.customer, bill.id, bill.total);
  },
  updateBill: (id, changes) => {
    const bills = Store.getBills().map(b => b.id === id ? { ...b, ...changes } : b);
    Store.saveBills(bills);
  },
  deleteBill: (id) => {
    Store.saveBills(Store.getBills().filter(b => b.id !== id));
  },
  getBill: (id) => Store.getBills().find(b => b.id === id) || null,
  nextBillNumber: () => {
    const n = parseInt(localStorage.getItem('rbe_bill_counter') || '0') + 1;
    localStorage.setItem('rbe_bill_counter', String(n));
    return 'RBE-' + new Date().getFullYear() + '-' + String(n).padStart(4, '0');
  },

  // Products
  getProducts: () => JSON.parse(localStorage.getItem('rbe_products') || '[]'),
  saveProducts: (p) => localStorage.setItem('rbe_products', JSON.stringify(p)),
  addProduct: (p) => { const ps = Store.getProducts(); ps.unshift(p); Store.saveProducts(ps); },
  updateProduct: (id, changes) => { Store.saveProducts(Store.getProducts().map(p => p.id === id ? { ...p, ...changes } : p)); },
  deleteProduct: (id) => { Store.saveProducts(Store.getProducts().filter(p => p.id !== id)); },
  getProduct: (id) => Store.getProducts().find(p => p.id === id) || null,
  decrementStock: (productId, qty) => {
    const p = Store.getProduct(productId);
    if (p && p.stock > 0) Store.updateProduct(productId, { stock: Math.max(0, p.stock - qty) });
  },

  // Customers
  getCustomers: () => JSON.parse(localStorage.getItem('rbe_customers') || '[]'),
  saveCustomers: (c) => localStorage.setItem('rbe_customers', JSON.stringify(c)),
  upsertCustomer: (customer, billId, amount) => {
    if (!customer || !customer.name) return;
    const customers = Store.getCustomers();
    const phone = (customer.phone || '').trim();
    let existing = phone ? customers.find(c => c.phone === phone) : customers.find(c => c.name.toLowerCase() === customer.name.toLowerCase());
    if (existing) {
      existing.bills = existing.bills || [];
      if (!existing.bills.includes(billId)) existing.bills.push(billId);
      existing.totalSpent = (existing.totalSpent || 0) + (amount || 0);
      existing.lastVisit = H.today();
      Store.saveCustomers(customers);
    } else {
      const newCust = {
        id: H.id('CUST'),
        name: customer.name,
        phone: phone,
        bills: [billId],
        totalSpent: amount || 0,
        joinedDate: H.today(),
        lastVisit: H.today()
      };
      customers.unshift(newCust);
      Store.saveCustomers(customers);
    }
  },
  deleteCustomer: (id) => { Store.saveCustomers(Store.getCustomers().filter(c => c.id !== id)); },

  // Returns
  getReturns: () => JSON.parse(localStorage.getItem('rbe_returns') || '[]'),
  saveReturns: (r) => localStorage.setItem('rbe_returns', JSON.stringify(r)),
  addReturn: (ret) => { const rs = Store.getReturns(); rs.unshift(ret); Store.saveReturns(rs); },

  // Analytics helpers
  todaySales: () => {
    const today = H.today();
    return Store.getBills().filter(b => b.date === today && b.status !== 'return')
      .reduce((sum, b) => sum + (b.total || 0), 0);
  },
  todayBillCount: () => {
    const today = H.today();
    return Store.getBills().filter(b => b.date === today).length;
  },
  totalSales: () => Store.getBills().filter(b => b.status !== 'return').reduce((s, b) => s + (b.total || 0), 0),
  lowStockCount: () => Store.getProducts().filter(p => p.stock !== null && p.stock <= CONFIG.lowStockThreshold).length,

  // Cloud Backup & Restore
  cloudBackup: async (token) => {
    const owner = 'harsh200103-pixel';
    const repo = 'riwaaz-website';
    const path = 'backups/billing_backup.json';
    
    const backupData = {
      timestamp: new Date().toISOString(),
      bills: Store.getBills(),
      products: Store.getProducts(),
      customers: Store.getCustomers(),
      returns: Store.getReturns(),
      billCounter: localStorage.getItem('rbe_bill_counter') || '0',
      seeded: localStorage.getItem('rbe_seeded') || '0'
    };
    
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(backupData, null, 2))));
    
    // Check if file exists to get SHA
    let sha = null;
    try {
      const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: { 'Authorization': `token ${token}` }
      });
      if (getRes.ok) {
        const json = await getRes.json();
        sha = json.sha;
      }
    } catch(e) {}
    
    const body = { message: `Billing backup - ${new Date().toLocaleString('en-IN')}`, content: encoded };
    if (sha) body.sha = sha;
    
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) throw new Error('Backup failed. Check your token.');
    return backupData;
  },

  cloudRestore: async (token) => {
    const owner = 'harsh200103-pixel';
    const repo = 'riwaaz-website';
    const path = 'backups/billing_backup.json';
    
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { 'Authorization': `token ${token}` }
    });
    
    if (!res.ok) throw new Error('No backup found or token invalid.');
    const json = await res.json();
    const backupData = JSON.parse(decodeURIComponent(escape(atob(json.content))));
    
    // Restore everything
    if (backupData.bills) Store.saveBills(backupData.bills);
    if (backupData.products) Store.saveProducts(backupData.products);
    if (backupData.customers) Store.saveCustomers(backupData.customers);
    if (backupData.returns) Store.saveReturns(backupData.returns);
    if (backupData.billCounter) localStorage.setItem('rbe_bill_counter', backupData.billCounter);
    if (backupData.seeded) localStorage.setItem('rbe_seeded', backupData.seeded);
    
    return backupData;
  }
};

// ══════════════════════════════════════ TOAST ══════
const Toast = {
  show: (msg, type = '', ms = 3000) => {
    const el = document.getElementById('toast-notification');
    el.textContent = msg;
    el.className = `toast ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), ms);
  }
};

// ══════════════════════════════════════ MODAL ══════
const Modal = {
  open: (title, bodyHtml, footerHtml = '') => {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    const footer = document.getElementById('modal-footer');
    if (footerHtml) { footer.innerHTML = footerHtml; footer.classList.remove('hidden'); }
    else { footer.innerHTML = ''; footer.classList.add('hidden'); }
    document.getElementById('modal-overlay').classList.remove('hidden');
  },
  close: () => { document.getElementById('modal-overlay').classList.add('hidden'); },
  mountFooter: (fn) => {
    const footer = document.getElementById('modal-footer');
    if (footer) fn(footer);
  }
};

const ShareModal = {
  open: (bodyHtml) => {
    document.getElementById('share-modal-body').innerHTML = bodyHtml;
    document.getElementById('share-modal-overlay').classList.remove('hidden');
  },
  close: () => { document.getElementById('share-modal-overlay').classList.add('hidden'); }
};

// ══════════════════════════════════════ ROUTER ══════
const Router = {
  current: 'dashboard',
  go: (view) => {
    Router.current = view;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });
    const viewEl = document.getElementById('app-view');
    viewEl.innerHTML = '';
    viewEl.style.animation = 'none';
    viewEl.offsetHeight; // reflow
    viewEl.style.animation = '';
    Views[view] ? Views[view].render() : (viewEl.innerHTML = '<div class="empty-state"><p>View not found.</p></div>');
  }
};

// ═════════════════════════════════════ SHARING ══════
const Share = {
  buildWhatsAppText: (bill) => {
    const items = bill.items.map(it => {
      const detailsText = it.details ? ` (${it.details})` : '';
      return `• *${it.category}* — ${it.description || 'Item'}${detailsText}\n  Qty: ${it.qty} × ${CONFIG.currency}${H.fmtNum(it.price)} = *${CONFIG.currency}${H.fmtNum(it.total)}*`;
    }).join('\n');
    const payStatus = bill.payment.status === 'paid' ? '[PAID]' : bill.payment.status === 'partial' ? '[PARTIAL]' : '[PENDING]';
    const due = bill.payment.due > 0 ? `\n- Due: *${CONFIG.currency}${H.fmtNum(bill.payment.due)}*` : '';
    return `*RIWAAZ BY ESHMIRA*
_Premium Indian Fashion Boutique_
- ${CONFIG.address}
- ${CONFIG.phone1} | ${CONFIG.phone2}
-------------------------
*Bill No: ${bill.billNumber}*
Date: ${H.formatDate(bill.date)}
-------------------------
Customer: *${bill.customer.name || 'Valued Customer'}*${bill.customer.phone ? '\nPhone: ' + bill.customer.phone : ''}
${bill.isOnline ? `\n*📦 SHIPPING DETAILS:*
Address: ${bill.customer.address}
Pincode: ${bill.customer.pincode}
Alt Phone: ${bill.customer.altPhone || 'N/A'}
` : ''}
*ITEMS PURCHASED:*
${items}

-------------------------
Subtotal: ${CONFIG.currency}${H.fmtNum(bill.subtotal)}${bill.discount > 0 ? `\nDiscount: -${CONFIG.currency}${H.fmtNum(bill.discount)}` : ''}
*TOTAL: ${CONFIG.currency}${H.fmtNum(bill.total)}*
-------------------------
Payment: *${bill.payment.mode}*  ${payStatus}${due}

_Thank you for choosing Riwaaz!_
_May every thread bring you joy_

_For queries: ${CONFIG.phone1}_`;
  },

  sendBillPDF: async (bill) => {
    const phone = (bill.customer.phone || '').replace(/\D/g,'').slice(-10);

    if (!window.html2canvas || !window.jspdf) {
      // Libraries not loaded — just open WhatsApp with text
      const waUrl = phone
        ? `https://wa.me/91${phone}?text=${encodeURIComponent(Share.buildWhatsAppText(bill))}`
        : `https://wa.me/?text=${encodeURIComponent(Share.buildWhatsAppText(bill))}`;
      window.open(waUrl, '_blank');
      Toast.show('⚠️ PDF library not loaded — opened WhatsApp with text bill.', 'error', 5000);
      return;
    }

    // Step 1 — Generate & download the PDF
    Toast.show('⏳ Generating PDF bill…', 'gold', 10000);
    try {
      await PDF.generate(bill);   // downloads the PDF file
    } catch (e) {
      Toast.show('⚠️ PDF generation failed.', 'error');
      return;
    }

    // Step 2 — Open WhatsApp directly to the customer’s number
    const msg = `Hi! 🙏 Your bill *${bill.billNumber}* from *Riwaaz by Eshmira* is ready.\n\n` +
      `Total: *${CONFIG.currency}${H.fmtNum(bill.total)}* | Payment: ${bill.payment.mode}`;
    const waUrl = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    // Short delay so the PDF download starts first
    await new Promise(r => setTimeout(r, 1200));
    window.open(waUrl, '_blank');

    Toast.show(
      phone
        ? `✓ PDF downloaded! WhatsApp opened to +91 ${phone} — attach the PDF with 📎`
        : '✓ PDF downloaded! Attach it in WhatsApp with 📎',
      'success', 8000
    );
  },

  buildMagicLinkText: async (bill) => {
    // Securely upload the bill data to the cloud bucket
    try {
      const res = await fetch('https://bytebin.lucko.me/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bill)
      });
      if (!res.ok) throw new Error("Upload failed");
      
      const { key } = await res.json();
      
      // Automatically use the current live domain
      const origin = window.location.origin;
      const brandedLink = `${origin}/bill?id=${key}`;
      
      return `Hi! Your bill from Riwaaz by Eshmira is ready. Click here to view and download your bill: ${brandedLink}`;
    } catch (e) {
      console.error("Failed to generate magic link", e);
      alert("Error generating secure link. Please try again or check your connection.");
      return null;
    }
  },

  whatsapp: async (bill) => {
    const tab = window.open('about:blank', '_blank');
    tab.document.write('<div style="font-family: sans-serif; text-align: center; padding: 50px;"><h2>⏳ Generating Secure Bill Link...</h2><p>Please wait, opening WhatsApp...</p></div>');
    
    const text = await Share.buildMagicLinkText(bill);
    if (!text) { tab.close(); return; }
    
    const phone = bill.customer.phone ? '91' + bill.customer.phone.replace(/\D/g,'').slice(-10) : '';
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    tab.location.href = url;
  },

  sms: async (bill) => {
    const text = await Share.buildMagicLinkText(bill);
    const phone = bill.customer.phone ? bill.customer.phone.replace(/\D/g,'').slice(-10) : '';
    const url = `sms:${phone}?body=${encodeURIComponent(text)}`;
    window.location.href = url;
  },

  copyText: (bill) => {
    const text = Share.buildWhatsAppText(bill);
    navigator.clipboard.writeText(text).then(() => Toast.show('✓ Bill text copied to clipboard!', 'gold'));
  },

  openShareModal: (bill) => {
    const phone = (bill.customer.phone || '').replace(/\D/g,'').slice(-10);
    const waText = Share.buildWhatsAppText(bill);
    const waUrl  = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(waText)}`
      : `https://wa.me/?text=${encodeURIComponent(waText)}`;

    const html = `
      <div class="share-modal-grid">
        <div class="share-preview-col">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:12px">📄 Bill Preview</div>
          ${Billing.buildBillPreviewHtml(bill)}
        </div>
        <div class="share-actions-col">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:10px">Share Options</div>

          ${phone ? `<div style="background:var(--gold-100);border:1.5px solid var(--gold-300);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px;line-height:1.5">
            <div style="color:var(--text-muted);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Sending to customer</div>
            <div style="font-weight:700;color:var(--dark-800);font-size:15px;margin-top:2px">+91 ${phone}</div>
          </div>` : '<div style="background:var(--cream-100);border:1px dashed var(--cream-200);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12px;color:var(--text-muted)">No phone on bill — WhatsApp will let you choose contact</div>'}

          <button class="btn btn-whatsapp btn-full" style="display:flex;align-items:center;gap:8px;justify-content:center;padding:13px 20px;font-size:14px" onclick="Share.whatsapp(Store.getBill('${bill.id}'))">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49"/></svg>
            ${phone ? `💬 Send Full Bill via WhatsApp to +91 ${phone}` : '💬 Send Full Bill via WhatsApp'}
          </button>

          <button class="btn btn-full" style="background:linear-gradient(135deg,#6B2737,#8B3547);color:#fff;padding:13px 20px;font-size:14px;border-radius:8px;box-shadow:0 4px 12px rgba(107,39,55,0.3);gap:8px;display:flex;align-items:center;justify-content:center" onclick="PDF.generate(Store.getBill('${bill.id}'))">
            ⬇️ Download PDF Invoice
          </button>

          <button class="btn btn-sms btn-full" onclick="Share.sms(Store.getBill('${bill.id}'))">
            💬 Send via SMS
          </button>
          <button class="btn btn-copy btn-full" onclick="Share.copyText(Store.getBill('${bill.id}'))">
            📋 Copy Bill Text
          </button>
          <div style="height:1px;background:var(--cream-200);margin:6px 0"></div>
          <button class="btn btn-print btn-full" onclick="Print.bill(Store.getBill('${bill.id}'))">
            🖨️ Print Invoice
          </button>
          <button class="btn btn-ghost btn-full" onclick="ShareModal.close()">Done</button>
        </div>
      </div>`;
    ShareModal.open(html);
  }
};

// ══════════════════════════════════════ PRINT ══════
const Print = {
  buildHtml: (bill) => {
    const items = bill.items.map((it, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${H.escHtml(it.category)}</td>
        <td>${H.escHtml(it.description || '—')}</td>
        <td style="text-align:center">${it.qty}</td>
        <td style="text-align:right">${H.fmt(it.price)}</td>
        <td style="text-align:right;font-weight:600">${H.fmt(it.total)}</td>
      </tr>`).join('');

    const payLine = bill.payment.status === 'paid'
      ? `<span style="color:#27AE60;font-weight:700">✓ PAID</span>`
      : `<span style="color:#E67E22">⏳ Due: ${H.fmt(bill.payment.due)}</span>`;

    return `
      <div class="print-invoice">
        <div class="pi-header">
          <div>
            <div class="pi-shop-name">Riwaaz</div>
            <div class="pi-tagline">by Eshmira</div>
          </div>
          <div class="pi-address">
            ${CONFIG.address}<br/>
            Tel: ${CONFIG.phone1} | ${CONFIG.phone2}
          </div>
        </div>
        <div class="pi-meta">
          <div>
            <div class="pi-bill-no">Bill #: ${bill.billNumber}</div>
            <div style="font-size:13px;color:#666;margin-top:4px">Date: ${H.formatDate(bill.date)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:600">${H.escHtml(bill.customer.name || 'Walk-in Customer')}</div>
            ${bill.customer.phone ? `<div style="font-size:12px;color:#666">${bill.customer.phone}</div>` : ''}
          </div>
        </div>
        ${bill.isOnline ? `
        <div style="margin-bottom:20px;padding:12px;background:#f9f9f9;border:1px solid #eee;border-radius:6px;font-size:13px;line-height:1.5">
          <div style="font-weight:700;margin-bottom:4px;color:#333;text-transform:uppercase;font-size:11px;letter-spacing:0.05em">📦 Shipping Details</div>
          <div><strong>Address:</strong> ${H.escHtml(bill.customer.address)}</div>
          <div><strong>Pincode:</strong> ${H.escHtml(bill.customer.pincode)}</div>
          <div><strong>Alt Phone:</strong> ${H.escHtml(bill.customer.altPhone || '—')}</div>
        </div>
        ` : ''}
        <table>
          <thead>
            <tr>
              <th>#</th><th>Category</th><th>Description</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
        <div class="pi-totals">
          <div class="pi-total-row"><span>Subtotal</span><span>${H.fmt(bill.subtotal)}</span></div>
          ${bill.discount > 0 ? `<div class="pi-total-row"><span>Discount</span><span>- ${H.fmt(bill.discount)}</span></div>` : ''}
          <div class="pi-total-row pi-grand"><span>TOTAL</span><span>${H.fmt(bill.total)}</span></div>
          <div style="font-size:12px;color:#888;margin-top:8px">Payment: ${bill.payment.mode} | ${payLine}</div>
        </div>
        <div class="pi-footer">
          <div class="thanks">Thank you for shopping with us!</div>
          <div style="margin-top:4px">Riwaaz by Eshmira | ${CONFIG.address}</div>
          <div>Tel: ${CONFIG.phone1} | ${CONFIG.phone2}</div>
        </div>
      </div>`;
  },

  bill: (bill) => {
    if (!bill) return;
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = Print.buildHtml(bill);
    printArea.classList.remove('hidden');
    window.print();
    printArea.classList.add('hidden');
  },

  shippingLabel: (bill) => {
    if (!bill || !bill.isOnline) return;
    const printArea = document.getElementById('print-area');
    
    printArea.innerHTML = `
      <div style="font-family:Arial,sans-serif;width:4in;height:6in;padding:24px;border:2px solid #000;box-sizing:border-box;margin:0 auto;position:relative">
        
        <!-- From Section -->
        <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:16px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:4px">From:</div>
          <div style="font-size:18px;font-weight:900;margin-bottom:4px">Riwaaz by Eshmira</div>
          <div style="font-size:14px;line-height:1.4">
            ${CONFIG.address}<br>
            Ph: ${CONFIG.phone1} | ${CONFIG.phone2}
          </div>
        </div>
        
        <!-- To Section -->
        <div style="margin-bottom:16px">
          <div style="font-size:14px;font-weight:900;text-transform:uppercase;margin-bottom:8px">To:</div>
          <div style="font-size:24px;font-weight:900;margin-bottom:8px">${H.escHtml(bill.customer.name || 'Customer')}</div>
          
          <div style="font-size:16px;line-height:1.5;margin-bottom:16px">
            ${H.escHtml(bill.customer.address)}<br>
            <strong style="font-size:18px">PIN: ${H.escHtml(bill.customer.pincode)}</strong>
          </div>
          
          <div style="font-size:16px;font-weight:700;padding:12px;border:2px dashed #000;background:#f9f9f9;display:inline-block">
            📞 Phone: ${bill.customer.phone || 'N/A'}
            ${bill.customer.altPhone ? `<br>📞 Alt: ${bill.customer.altPhone}` : ''}
          </div>
        </div>

        <!-- Order Meta -->
        <div style="position:absolute;bottom:24px;left:24px;right:24px;border-top:2px solid #000;padding-top:16px;font-size:12px;display:flex;justify-content:space-between">
          <div>Order: <strong>${bill.billNumber}</strong></div>
          <div>Date: <strong>${H.formatDateShort(bill.date)}</strong></div>
        </div>
        
      </div>
    `;
    
    printArea.classList.remove('hidden');
    window.print();
    printArea.classList.add('hidden');
  }
};

// ════════════════════════════════════════ PDF ═══════
const PDF = {
  generate: async (bill) => {
    if (!window.html2canvas || !window.jspdf) {
      Toast.show('⚠️ PDF library not loaded — check internet connection.', 'error', 4000);
      return;
    }
    Toast.show('⏳ Generating PDF, please wait…', 'gold', 8000);
    try {
      // Build a self-contained HTML fragment with inline styles for PDF rendering
      const items = bill.items.map((it, i) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #F0E8D5;font-size:13px">${i+1}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0E8D5;font-size:13px">${H.escHtml(it.category)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0E8D5;font-size:13px">${H.escHtml(it.description || '—')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0E8D5;font-size:13px;text-align:center">${it.qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0E8D5;font-size:13px;text-align:right">${H.fmt(it.price)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0E8D5;font-size:13px;text-align:right;font-weight:700">${H.fmt(it.total)}</td>
        </tr>`).join('');

      const payStatus = bill.payment.status === 'paid'
        ? '<span style="color:#27AE60;font-weight:700">✓ PAID</span>'
        : `<span style="color:#E67E22;font-weight:700">Due: ${H.fmt(bill.payment.due)}</span>`;

      const pdfHtml = `
        <div style="font-family:Arial,Helvetica,sans-serif;width:750px;background:#fff;padding:48px;color:#222;box-sizing:border-box">
          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #C9A458;padding-bottom:24px;margin-bottom:28px">
            <div>
              <div style="font-family:Georgia,serif;font-size:42px;font-weight:700;color:#2C1810;line-height:1">Riwaaz</div>
              <div style="font-size:13px;letter-spacing:.2em;color:#B8860B;text-transform:uppercase;margin-top:6px">by Eshmira</div>
              <div style="width:60px;height:2px;background:#C9A458;margin-top:10px"></div>
            </div>
            <div style="text-align:right;font-size:12px;color:#555;line-height:1.8">
              <div style="font-weight:700;color:#2C1810;font-size:13px">Riwaaz by Eshmira</div>
              <div>${CONFIG.address}</div>
              <div>Tel: ${CONFIG.phone1} | ${CONFIG.phone2}</div>
            </div>
          </div>

          <!-- Bill Meta -->
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
            <div>
              <div style="font-size:22px;font-weight:700;color:#2C1810">${bill.billNumber}</div>
              <div style="font-size:13px;color:#888;margin-top:4px">Date: ${H.formatDate(bill.date)}</div>
            </div>
            <div style="background:#F8F3EA;border-radius:10px;padding:14px 20px;text-align:right">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#B8860B;font-weight:700">Customer</div>
              <div style="font-size:16px;font-weight:700;color:#2C1810;margin-top:4px">${H.escHtml(bill.customer.name || 'Walk-in Customer')}</div>
              ${bill.customer.phone ? `<div style="font-size:13px;color:#666;margin-top:2px">${bill.customer.phone}</div>` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <thead>
              <tr style="background:#F8F3EA">
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9A7030;border-bottom:2px solid #E8CB7A">#</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9A7030;border-bottom:2px solid #E8CB7A">Category</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9A7030;border-bottom:2px solid #E8CB7A">Description</th>
                <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9A7030;border-bottom:2px solid #E8CB7A">Qty</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9A7030;border-bottom:2px solid #E8CB7A">Price</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9A7030;border-bottom:2px solid #E8CB7A">Amount</th>
              </tr>
            </thead>
            <tbody>${items}</tbody>
          </table>

          <!-- Totals -->
          <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
            <div style="width:260px">
              <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#666">
                <span>Subtotal</span><span>${H.fmt(bill.subtotal)}</span>
              </div>
              ${bill.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#27AE60">
                <span>Discount</span><span>− ${H.fmt(bill.discount)}</span>
              </div>` : ''}
              <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:20px;font-weight:700;color:#2C1810;border-top:2px solid #C9A458;margin-top:6px">
                <span>TOTAL</span><span style="color:#B8860B">${H.fmt(bill.total)}</span>
              </div>
              <div style="font-size:13px;color:#888;margin-top:4px">Payment: ${bill.payment.mode} · ${payStatus}</div>
              ${bill.payment.due > 0 ? `<div style="font-size:13px;color:#E67E22;margin-top:4px;font-weight:600">Due Amount: ${H.fmt(bill.payment.due)}</div>` : ''}
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top:1px solid #EEE;padding-top:24px;text-align:center">
            <div style="font-family:Georgia,serif;font-size:20px;color:#B8860B;margin-bottom:6px">Thank you for shopping with us!</div>
            <div style="font-size:12px;color:#999;line-height:1.8">
              Riwaaz by Eshmira · ${CONFIG.address}<br/>
              Tel: ${CONFIG.phone1} | ${CONFIG.phone2}
            </div>
          </div>
        </div>`;

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:846px;background:#fff;z-index:-999;overflow:hidden';
      container.innerHTML = pdfHtml;
      document.body.appendChild(container);

      await new Promise(r => setTimeout(r, 700));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 846
      });
      document.body.removeChild(container);

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth  = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${bill.billNumber}_Riwaaz_by_Eshmira.pdf`);
      Toast.show('✓ PDF downloaded! You can attach it in WhatsApp.', 'success', 4000);
    } catch (err) {
      console.error('PDF error:', err);
      Toast.show('⚠️ PDF failed. Use Print Invoice instead.', 'error');
    }
  }
};

// ═══════════════════════════════════ VIEW: DASHBOARD ══
const Views = {};

Views.dashboard = {
  doBackup: async () => {
    const token = document.getElementById('backup-token').value;
    const statEl = document.getElementById('backup-status');
    if (!token) { Toast.show('⚠️ Please enter Admin Token first', 'error'); return; }
    
    statEl.style.display = 'block';
    statEl.style.color = 'var(--text-muted)';
    statEl.textContent = '⏳ Backing up to cloud...';
    
    try {
      await Store.cloudBackup(token);
      statEl.style.color = '#166534';
      statEl.textContent = '✅ Backup successful! Data safely saved to cloud.';
      Toast.show('Backup successful!', 'success');
    } catch (e) {
      statEl.style.color = '#991B1B';
      statEl.textContent = '❌ ' + e.message;
      Toast.show('Backup failed.', 'error');
    }
  },

  doRestore: async () => {
    const token = document.getElementById('backup-token').value;
    const statEl = document.getElementById('backup-status');
    if (!token) { Toast.show('⚠️ Please enter Admin Token first', 'error'); return; }
    
    if (!confirm('⚠️ This will overwrite your current local data with the cloud backup. Proceed?')) return;

    statEl.style.display = 'block';
    statEl.style.color = 'var(--text-muted)';
    statEl.textContent = '⏳ Restoring from cloud...';
    
    try {
      await Store.cloudRestore(token);
      statEl.style.color = '#166534';
      statEl.textContent = '✅ Restore successful! Reloading...';
      Toast.show('Restore successful!', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (e) {
      statEl.style.color = '#991B1B';
      statEl.textContent = '❌ ' + e.message;
      Toast.show('Restore failed.', 'error');
    }
  },

  render: () => {
    const v = document.getElementById('app-view');
    const bills = Store.getBills();
    const customers = Store.getCustomers();
    const todaySales = Store.todaySales();
    const todayBills = Store.todayBillCount();
    const lowStock = Store.lowStockCount();
    const recentBills = bills.slice(0, 6);

    const recentRows = recentBills.map(b => `
      <tr>
        <td><span style="font-weight:600;color:var(--gold-600)">${b.billNumber}</span></td>
        <td>${H.escHtml(b.customer.name || 'Walk-in')}</td>
        <td>${H.formatDateShort(b.date)}</td>
        <td style="font-weight:600">${H.fmt(b.total)}</td>
        <td><span class="badge badge-${b.payment.status}">${b.payment.status}</span></td>
        <td>
          <button class="btn btn-sm btn-whatsapp" onclick="Share.openShareModal(Store.getBill('${b.id}'))">Share</button>
        </td>
      </tr>`).join('') || `<tr><td colspan="6" class="text-center text-muted" style="padding:24px">No bills yet. Create your first bill!</td></tr>`;

    const lowStockAlert = lowStock > 0 ? `
      <div class="low-stock-alert">
        ⚠️ <strong>${lowStock} item${lowStock>1?'s':''}</strong> are running low on stock.
        <button class="btn btn-sm btn-outline" style="margin-left:auto" onclick="Router.go('inventory')">View Inventory</button>
      </div>` : '';

    v.innerHTML = `
      <div class="view-header">
        <h1>${H.greet()}, Eshmira! 👋</h1>
        <p style="color:var(--text-muted);font-size:14px">Welcome to Riwaaz by Eshmira · ${H.formatDate(H.today())}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Today's Sales</div>
          <div class="stat-value">${H.fmt(todaySales)}</div>
          <div class="stat-sub">${todayBills} bill${todayBills!==1?'s':''} today</div>
          <div class="stat-icon">💰</div>
        </div>
        <div class="stat-card maroon">
          <div class="stat-label">Total Customers</div>
          <div class="stat-value">${customers.length}</div>
          <div class="stat-sub">All time</div>
          <div class="stat-icon">👥</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">${H.fmt(Store.totalSales())}</div>
          <div class="stat-sub">${bills.length} total bills</div>
          <div class="stat-icon">📈</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">Low Stock Items</div>
          <div class="stat-value">${lowStock}</div>
          <div class="stat-sub">${lowStock > 0 ? 'Need restocking' : 'All good!'}</div>
          <div class="stat-icon">📦</div>
        </div>
      </div>

      ${lowStockAlert}

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3>Recent Bills</h3>
            <button class="btn btn-sm btn-ghost" onclick="Router.go('bills')">View All</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Bill #</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>${recentRows}</tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="section-title" style="margin-bottom:12px">Quick Actions</div>
          <div class="quick-actions">
            <button class="quick-action-btn" onclick="Router.go('new-bill')">
              <div class="qa-icon qa-gold">✦</div>
              <div><div style="font-weight:600">New Bill</div><div style="font-size:11px;color:var(--text-muted)">Create & share digitally</div></div>
            </button>
            <button class="quick-action-btn" onclick="Views['inventory'].openAddModal()">
              <div class="qa-icon qa-green">📦</div>
              <div><div style="font-weight:600">Add Product</div><div style="font-size:11px;color:var(--text-muted)">Update inventory</div></div>
            </button>
            <button class="quick-action-btn" onclick="Router.go('reports')">
              <div class="qa-icon qa-blue">📊</div>
              <div><div style="font-weight:600">View Reports</div><div style="font-size:11px;color:var(--text-muted)">Sales analytics</div></div>
            </button>
            <button class="quick-action-btn" onclick="Router.go('returns')">
              <div class="qa-icon qa-purple">↩️</div>
              <div><div style="font-weight:600">Log Return</div><div style="font-size:11px;color:var(--text-muted)">Return or exchange</div></div>
            </button>
          </div>

          <!-- Cloud Backup & Restore -->
          <div class="card" style="border:2px solid #DBEAFE;background:#F0F7FF;margin-top:24px">
            <div class="card-header" style="border:none">
              <h3>☁️ Cloud Backup & Restore</h3>
            </div>
            <div style="padding:0 24px 24px">
              <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Save all your billing data securely to the cloud. Use this before switching to a new computer.</p>
              <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
                <div style="flex:1;min-width:200px">
                  <label style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:6px">Admin Token</label>
                  <input type="password" id="backup-token" class="form-input" placeholder="ghp_..." style="width:100%" />
                </div>
                <button class="btn btn-gold" id="btn-cloud-backup" style="white-space:nowrap" onclick="Views.dashboard.doBackup()">☁️ Backup</button>
                <button class="btn btn-outline" id="btn-cloud-restore" style="white-space:nowrap" onclick="Views.dashboard.doRestore()">📥 Restore</button>
              </div>
              <div id="backup-status" style="margin-top:12px;font-size:13px;display:none"></div>
            </div>
          </div>

          <div class="section-title" style="margin-top:24px;margin-bottom:12px">Shop Info</div>
          <div class="card" style="padding:16px">
            <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:var(--gold-600);margin-bottom:8px">Riwaaz by Eshmira</div>
            <div style="font-size:13px;color:var(--text-muted);line-height:1.7">
              📍 ${CONFIG.address}<br/>
              📞 ${CONFIG.phone1}<br/>
              📞 ${CONFIG.phone2}
            </div>
          </div>
        </div>
      </div>`;
  }
};

// ═══════════════════════════════ VIEW: NEW BILL ══════
const Billing = {
  state: {
    items: [],
    discount: 0,
    paymentMode: 'Cash',
    amountPaid: 0,
  },

  buildBillPreviewHtml: (bill) => {
    const items = bill.items.map((it, idx) => {
      const unitLine = it.qty > 1 ? `<div class="bill-item-unit-price">Unit Price: ${H.fmt(it.price)} × ${it.qty}</div>` : '';
      const detailLine = it.details ? `<div class="bill-item-details">${H.escHtml(it.details)}</div>` : '';
      return `
      <div class="bill-item">
        <div class="bill-item-left">
          <div class="bill-item-cat">${H.escHtml(it.category)}</div>
          <div class="bill-item-name">${H.escHtml(it.description || 'Item')}</div>
          ${detailLine}
          <div class="bill-item-qty">Qty: ${it.qty}${it.qty > 1 ? ` &nbsp;·&nbsp; ${H.fmt(it.price)} each` : ''}</div>
        </div>
        <div class="bill-item-price">${H.fmt(it.total)}</div>
      </div>`;
    }).join('');

    const pStatus = bill.payment.status;
    const pClass = pStatus === 'paid' ? '' : pStatus === 'partial' ? 'partial' : 'pending';
    const pLabel = pStatus === 'paid' ? '✅ Payment Received' : pStatus === 'partial' ? '🔶 Partial Payment' : '⏳ Payment Pending';
    const amtPaidLine = (pStatus === 'partial' && bill.payment.amountPaid)
      ? `<div class="bill-due-row"><span>Amount Paid</span><span>${H.fmt(bill.payment.amountPaid)}</span></div>
         <div class="bill-due-row due"><span>Balance Due</span><span>${H.fmt(bill.payment.due)}</span></div>`
      : '';

    const itemCount = bill.items.reduce((s, it) => s + it.qty, 0);

    return `
      <div class="digital-bill">
        <!-- ── Header ── -->
        <div class="bill-preview-header">
          <div class="bph-deco">✦ &nbsp; ✦ &nbsp; ✦</div>
          <div class="bill-preview-logo">Riwaaz</div>
          <div class="bill-preview-tagline">✿ &nbsp; BY ESHMIRA &nbsp; ✿</div>
          <div class="bill-preview-divider"></div>
          <div class="bill-preview-address">${CONFIG.address}<br/>${CONFIG.phone1} &nbsp;|&nbsp; ${CONFIG.phone2}</div>
        </div>

        <!-- ── Bill Meta ── -->
        <div class="bill-preview-meta">
          <div>
            <div class="bill-num">${bill.billNumber}</div>
            <div class="bill-date">${H.formatDate(bill.date)}</div>
          </div>
          <div style="text-align:right">
            <div class="bill-customer-name">${H.escHtml(bill.customer.name || 'Walk-in Customer')}</div>
            ${bill.customer.phone ? `<div class="bill-customer-phone">${bill.customer.phone}</div>` : ''}
          </div>
        </div>

        ${bill.isOnline ? `
        <!-- ── Shipping Details ── -->
        <div style="margin:0 32px 24px;padding:16px;background:#F0F7FF;border:1px solid #DBEAFE;border-radius:8px">
          <div style="font-size:11px;font-weight:700;color:#1D4ED8;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px">📦 Shipping Details</div>
          <div style="font-size:14px;color:#1E3A8A;line-height:1.5">
            <strong>Address:</strong> ${H.escHtml(bill.customer.address)}<br/>
            <strong>Pincode:</strong> ${H.escHtml(bill.customer.pincode)}<br/>
            <strong>Alt Phone:</strong> ${H.escHtml(bill.customer.altPhone || '—')}
          </div>
        </div>
        ` : ''}

        <!-- ── Items ── -->
        <div class="bill-preview-body">
          <div class="bill-items-header">
            <span>ITEMS PURCHASED</span>
            <span class="bill-item-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="bill-items-list">${items}</div>

          <!-- ── Totals ── -->
          <div class="bill-totals">
            <div class="bill-total-row"><span>Subtotal</span><span>${H.fmt(bill.subtotal)}</span></div>
            ${bill.discount > 0 ? `<div class="bill-total-row discount-row"><span>Discount</span><span class="discount-val">− ${H.fmt(bill.discount)}</span></div>` : ''}
            <div class="bill-total-divider"></div>
            <div class="bill-total-row grand">
              <span>Total</span>
              <span>${H.fmt(bill.total)}</span>
            </div>
            ${amtPaidLine}
          </div>

          <!-- ── Payment Status ── -->
          <div class="bill-payment-status ${pClass}">${pLabel} &nbsp;·&nbsp; ${bill.payment.mode}</div>

          <!-- ── Notes ── -->
          ${bill.notes ? `<div class="bill-notes-box">📝 ${H.escHtml(bill.notes)}</div>` : ''}

          <!-- ── Return Policy ── -->
          <div class="bill-policy-box">
            <div class="bill-policy-title">RETURN &amp; EXCHANGE POLICY</div>
            <div class="bill-policy-text">Returns &amp; exchanges accepted within 7 days with original bill. Customised orders are non-returnable.</div>
          </div>
        </div>

        <!-- ── Footer ── -->
        <div class="bill-preview-footer">
          <div class="thanks">Thank you for shopping! 🙏</div>
          <div class="bill-footer-sub">Visit us again at Riwaaz by Eshmira</div>
          <div class="bill-footer-contact">${CONFIG.phone1} &nbsp;|&nbsp; ${CONFIG.phone2}</div>
        </div>
      </div>`;
  },

  getItems: () => {
    const rows = document.querySelectorAll('.item-row');
    return Array.from(rows).map(row => {
      const qty   = parseInt(row.querySelector('.item-qty').value)   || 1;
      const price = parseFloat(row.querySelector('.item-price').value) || 0;
      return {
        category:    row.querySelector('.item-cat').value,
        description: row.querySelector('.item-desc').value,
        details:     row.querySelector('.item-details')?.value || '',
        qty,
        price,
        total: qty * price
      };
    });
  },

  calcTotals: () => {
    const items = Billing.getItems();
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const discountEl = document.getElementById('bill-discount');
    const discount = parseFloat(discountEl ? discountEl.value : 0) || 0;
    const total = Math.max(0, subtotal - discount);
    const el = (id) => document.getElementById(id);
    if (el('bill-subtotal')) el('bill-subtotal').textContent = H.fmt(subtotal);
    if (el('bill-total'))    el('bill-total').textContent    = H.fmt(total);
    // Update each row total
    document.querySelectorAll('.item-row').forEach((row, i) => {
      const t = row.querySelector('.item-row-total');
      if (t && items[i]) t.textContent = H.fmt(items[i].total);
    });
    return { subtotal, discount, total };
  },

  addItemRow: (cat = '', desc = '', details = '', qty = 1, price = '') => {
    const list = document.getElementById('items-container');
    const div  = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
      <select class="form-select item-cat">
        ${CONFIG.categories.map(c => `<option ${c===cat?'selected':''}>${c}</option>`).join('')}
      </select>
      <input class="form-input item-desc" placeholder="Item name (e.g. Black Georgette Suit)" value="${H.escHtml(desc)}">
      <input class="form-input item-details" placeholder="Colour / Fabric / Design details" value="${H.escHtml(details)}">
      <input class="form-input item-qty"   type="number" min="1" value="${qty}" style="width:100%">
      <input class="form-input item-price" type="number" min="0" placeholder="Price ₹" value="${price}" style="width:100%">
      <div class="item-row-total">${H.fmt((qty||1)*(parseFloat(price)||0))}</div>
      <button class="remove-item-btn" onclick="this.closest('.item-row').remove();Billing.calcTotals()">×</button>`;
    div.querySelectorAll('input, select').forEach(el => el.addEventListener('input', Billing.calcTotals));
    list.appendChild(div);
    Billing.calcTotals();
  },

  buildBill: () => {
    const name  = document.getElementById('cust-name')?.value.trim() || '';
    const phone = document.getElementById('cust-phone')?.value.trim() || '';
    const notes = document.getElementById('bill-notes')?.value.trim() || '';
    const { subtotal, discount, total } = Billing.calcTotals();
    const items = Billing.getItems();
    if (!items.length || items.every(it => !it.price)) { Toast.show('⚠️ Please add at least one item with a price.', 'error'); return null; }

    const activeMode = document.querySelector('.payment-mode-btn.active')?.dataset.mode || 'Cash';
    const amountPaid = parseFloat(document.getElementById('amount-paid')?.value) || (activeMode === 'Pending' ? 0 : total);
    const due = Math.max(0, total - amountPaid);
    const pStatus = activeMode === 'Pending' ? 'pending' : (due > 0 ? 'partial' : 'paid');

    const isOnline = document.getElementById('is-online-order')?.checked || false;
    const address = document.getElementById('cust-address')?.value.trim() || '';
    const pincode = document.getElementById('cust-pincode')?.value.trim() || '';
    const altPhone = document.getElementById('cust-alt-phone')?.value.trim() || '';

    return {
      id:          H.id('BILL'),
      billNumber:  Store.nextBillNumber(),
      date:        H.today(),
      customer:    { name, phone, address, pincode, altPhone },
      isOnline,
      items,
      subtotal,
      discount,
      total,
      payment:     { mode: activeMode, amountPaid, due, status: pStatus },
      notes,
      status:      'active'
    };
  }
};

// make buildBillPreviewHtml accessible as top-level too
const buildBillPreviewHtml = Billing.buildBillPreviewHtml;

Views['new-bill'] = {
  render: () => {
    const v = document.getElementById('app-view');
    v.innerHTML = `
      <div class="view-header view-header-row">
        <div>
          <h1>✦ New Bill</h1>
          <p>Create a digital bill and share instantly on WhatsApp</p>
        </div>
        <button class="btn btn-ghost" onclick="Router.go('bills')">View All Bills</button>
      </div>

      <div class="bill-form-container">
        <!-- Customer Details -->
        <div class="bill-section">
          <div class="bill-section-header">
            <h3>👤 Customer Details <span style="font-size:12px;font-weight:400;color:var(--text-muted)">(optional)</span></h3>
          </div>
          <div class="bill-section-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Customer Name</label>
                <input id="cust-name" class="form-input" placeholder="e.g. Priya Sharma" list="cust-suggestions">
                <datalist id="cust-suggestions">
                  ${Store.getCustomers().map(c => `<option value="${H.escHtml(c.name)}">`).join('')}
                </datalist>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input id="cust-phone" class="form-input" placeholder="10-digit mobile number" type="tel" maxlength="10">
              </div>
            </div>
            
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--cream-100)">
              <label style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--dark-800);cursor:pointer">
                <input type="checkbox" id="is-online-order" style="width:16px;height:16px;accent-color:var(--gold-600)" onchange="document.getElementById('shipping-details').style.display = this.checked ? 'block' : 'none'">
                📦 This is an Online Order (Requires Shipping)
              </label>
            </div>
            
            <div id="shipping-details" style="display:none;margin-top:16px;background:var(--cream-50);padding:16px;border-radius:8px">
              <div class="form-group" style="margin-bottom:12px">
                <label class="form-label">Shipping Address</label>
                <textarea id="cust-address" class="form-input" rows="2" placeholder="Full street address, landmark, city, state"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Pincode</label>
                  <input id="cust-pincode" class="form-input" placeholder="6-digit pincode" type="text" maxlength="6">
                </div>
                <div class="form-group">
                  <label class="form-label">Alternative Phone</label>
                  <input id="cust-alt-phone" class="form-input" placeholder="Alternative mobile" type="tel" maxlength="10">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="bill-section">
          <div class="bill-section-header">
            <h3>🛍️ Items Purchased</h3>
            <button class="btn btn-sm btn-gold" id="add-item-btn" onclick="Billing.addItemRow()">+ Add Item</button>
          </div>
          <div class="bill-section-body">
            <div class="items-header">
              <span>Category</span><span>Item Name</span><span>Colour / Details</span><span>Qty</span><span>Price</span><span>Total</span><span></span>
            </div>
            <div id="items-container" class="items-list"></div>
            <div id="no-items-msg" style="text-align:center;padding:24px;color:var(--text-muted);font-size:14px">
              Click <strong>"+ Add Item"</strong> to start adding products
            </div>
          </div>
        </div>

        <!-- Totals & Payment -->
        <div class="bill-section">
          <div class="bill-section-header">
            <h3>💰 Totals & Payment</h3>
          </div>
          <div class="bill-section-body">
            <div class="totals-box">
              <div class="totals-row">
                <span class="totals-label">Subtotal</span>
                <span class="totals-value" id="bill-subtotal">${H.fmt(0)}</span>
              </div>
              <div class="totals-row">
                <span class="totals-label">Discount</span>
                <div class="discount-input-wrap">
                  <span style="color:rgba(255,255,255,0.5)">−</span>
                  <input id="bill-discount" type="number" min="0" value="0" placeholder="0" oninput="Billing.calcTotals()">
                </div>
              </div>
              <div class="totals-row total-line">
                <span>Total</span>
                <span class="totals-value big" id="bill-total">${H.fmt(0)}</span>
              </div>
            </div>

            <div class="form-group" style="margin-top:16px">
              <label class="form-label">Payment Mode</label>
              <div class="payment-modes">
                ${CONFIG.paymentModes.map(m => `
                  <button class="payment-mode-btn ${m==='Cash'?'active':''}" data-mode="${m}" onclick="Views['new-bill'].selectPayment('${m}')">
                    ${m==='Cash'?'💵':m==='UPI'?'📲':m==='Card'?'💳':'⏳'} ${m}
                  </button>`).join('')}
              </div>
            </div>

            <div class="form-group" id="amount-paid-group">
              <label class="form-label">Amount Paid (leave blank if fully paid)</label>
              <input id="amount-paid" class="form-input" type="number" min="0" placeholder="Enter amount received">
            </div>

            <div class="form-group">
              <label class="form-label">Notes (optional)</label>
              <textarea id="bill-notes" class="form-textarea" placeholder="Any special notes for this bill..."></textarea>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="bill-actions">
          <button class="btn btn-whatsapp bill-action-primary" id="gen-digital-bill">
            📱 Generate Digital Bill & Share on WhatsApp
          </button>
          <button class="btn btn-outline" onclick="Views['new-bill'].saveBill()">
            💾 Save Bill Only
          </button>
          <button class="btn btn-ghost" onclick="Views['new-bill'].reset()">
            🔄 Clear Form
          </button>
        </div>
        <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:8px">
          Bill is automatically saved when you generate or share it.
        </p>
      </div>`;

    // Wire up
    Billing.addItemRow(); // Start with one empty row
    document.getElementById('gen-digital-bill').addEventListener('click', () => Views['new-bill'].generateAndShare());
    document.getElementById('items-container').addEventListener('input', () => {
      const hasItems = document.querySelectorAll('.item-row').length > 0;
      document.getElementById('no-items-msg').classList.toggle('hidden', hasItems);
    });
    document.getElementById('no-items-msg').classList.add('hidden'); // hide since we added one row
  },

  selectPayment: (mode) => {
    document.querySelectorAll('.payment-mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.payment-mode-btn[data-mode="${mode}"]`)?.classList.add('active');
    const apg = document.getElementById('amount-paid-group');
    if (mode === 'Pending') {
      apg.classList.add('hidden');
      document.getElementById('amount-paid').value = '0';
    } else {
      apg.classList.remove('hidden');
    }
  },

  generateAndShare: () => {
    const bill = Billing.buildBill();
    if (!bill) return;
    Store.addBill(bill);
    Views['new-bill'].reset(false);
    Share.openShareModal(bill);
    Toast.show('✓ Bill saved! Share it below.', 'success');
  },

  saveBill: () => {
    const bill = Billing.buildBill();
    if (!bill) return;
    Store.addBill(bill);
    Views['new-bill'].reset(false);
    Toast.show('✓ Bill saved successfully!', 'success', 2500);
  },

  reset: (addRow = true) => {
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('bill-discount').value = '0';
    document.getElementById('amount-paid').value = '';
    document.getElementById('bill-notes').value = '';
    document.getElementById('items-container').innerHTML = '';
    document.getElementById('no-items-msg').classList.remove('hidden');
    document.querySelectorAll('.payment-mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.payment-mode-btn[data-mode="Cash"]')?.classList.add('active');
    Billing.calcTotals();
    if (addRow) Billing.addItemRow();
  }
};

// ═══════════════════════════════ VIEW: ALL BILLS ══════
Views['bills'] = {
  render: () => {
    const v = document.getElementById('app-view');
    const bills = Store.getBills();

    const rows = bills.map(b => `
      <tr>
        <td><span style="font-weight:700;color:var(--gold-600)">${b.billNumber}</span></td>
        <td>
          <div style="font-weight:600">${H.escHtml(b.customer.name || 'Walk-in Customer')}</div>
          ${b.customer.phone ? `<div style="font-size:11px;color:var(--text-muted)">${b.customer.phone}</div>` : ''}
        </td>
        <td>${H.formatDate(b.date)}</td>
        <td>${b.items.length} item${b.items.length!==1?'s':''}</td>
        <td style="font-weight:700">${H.fmt(b.total)}</td>
        <td>${b.payment.mode}</td>
        <td><span class="badge badge-${b.payment.status}">${b.payment.status}</span></td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-sm btn-whatsapp" onclick="Share.openShareModal(Store.getBill('${b.id}'))">📱 Share</button>
            <button class="btn btn-sm btn-ghost" onclick="Print.bill(Store.getBill('${b.id}'))" title="Print Bill">🖨️</button>
            ${b.isOnline ? `<button class="btn btn-sm btn-ghost" onclick="Print.shippingLabel(Store.getBill('${b.id}'))" style="background:#F0FDF4;color:#166534" title="Print Shipping Label">📦 Label</button>` : ''}
            ${b.payment.due > 0 ? `<button class="btn btn-sm" style="background:#DBEAFE;color:#1D4ED8" onclick="Views.bills.clearDue('${b.id}')">💰 Clear Due</button>` : ''}
            <button class="btn btn-sm btn-danger" onclick="Views.bills.deleteBill('${b.id}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🧾</div><h3>No bills yet</h3><p>Create your first bill to get started!</p><button class="btn btn-gold" onclick="Router.go('new-bill')">New Bill</button></div></td></tr>`;

    v.innerHTML = `
      <div class="view-header view-header-row">
        <div>
          <h1>All Bills</h1>
          <p>${bills.length} total bill${bills.length!==1?'s':''}</p>
        </div>
        <button class="btn btn-gold" onclick="Router.go('new-bill')">✦ New Bill</button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="flex:1;max-width:360px">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
            <input id="bill-search" placeholder="Search by customer name or bill #..." oninput="Views.bills.search(this.value)">
          </div>
          <div style="display:flex;gap:8px">
            <select class="form-select" style="width:auto;padding:8px 12px;font-size:13px" onchange="Views.bills.filterStatus(this.value)">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div class="table-wrap" id="bills-table-wrap">
          <table id="bills-table">
            <thead><tr><th>Bill #</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="bills-tbody">${rows}</tbody>
          </table>
        </div>
      </div>`;
  },

  _filtered: null,

  search: (query) => {
    const bills = Store.getBills();
    const q = query.toLowerCase();
    Views.bills._filtered = q ? bills.filter(b =>
      (b.customer.name || '').toLowerCase().includes(q) ||
      b.billNumber.toLowerCase().includes(q) ||
      (b.customer.phone || '').includes(q)
    ) : null;
    Views.bills._renderRows(Views.bills._filtered || bills);
  },

  filterStatus: (status) => {
    const bills = Store.getBills();
    Views.bills._filtered = status ? bills.filter(b => b.payment.status === status) : null;
    Views.bills._renderRows(Views.bills._filtered || bills);
  },

  _renderRows: (bills) => {
    const tbody = document.getElementById('bills-tbody');
    if (!tbody) return;
    tbody.innerHTML = bills.map(b => `
      <tr>
        <td><span style="font-weight:700;color:var(--gold-600)">${b.billNumber}</span></td>
        <td>
          <div style="font-weight:600">${H.escHtml(b.customer.name || 'Walk-in Customer')}</div>
          ${b.customer.phone ? `<div style="font-size:11px;color:var(--text-muted)">${b.customer.phone}</div>` : ''}
        </td>
        <td>${H.formatDate(b.date)}</td>
        <td>${b.items.length} item${b.items.length!==1?'s':''}</td>
        <td style="font-weight:700">${H.fmt(b.total)}</td>
        <td>${b.payment.mode}</td>
        <td><span class="badge badge-${b.payment.status}">${b.payment.status}</span></td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-sm btn-whatsapp" onclick="Share.openShareModal(Store.getBill('${b.id}'))">📱 Share</button>
            <button class="btn btn-sm btn-ghost" onclick="Print.bill(Store.getBill('${b.id}'))" title="Print Bill">🖨️</button>
            ${b.isOnline ? `<button class="btn btn-sm btn-ghost" onclick="Print.shippingLabel(Store.getBill('${b.id}'))" style="background:#F0FDF4;color:#166534" title="Print Shipping Label">📦 Label</button>` : ''}
            ${b.payment.due > 0 ? `<button class="btn btn-sm" style="background:#DBEAFE;color:#1D4ED8" onclick="Views.bills.clearDue('${b.id}')">💰 Clear Due</button>` : ''}
            <button class="btn btn-sm btn-danger" onclick="Views.bills.deleteBill('${b.id}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="8" class="text-center text-muted" style="padding:24px">No bills found.</td></tr>`;
  },

  deleteBill: (id) => {
    if (!confirm('Delete this bill? This cannot be undone.')) return;
    Store.deleteBill(id);
    Toast.show('Bill deleted.', '');
    Views.bills.render();
  },

  clearDue: (id) => {
    const bill = Store.getBill(id);
    if (!bill) return;
    
    const dueAmt = bill.payment.due;
    const paymentMode = prompt(`Customer "${bill.customer.name || 'Walk-in'}" is clearing ₹${H.fmtNum(dueAmt)}.\n\nEnter payment mode (Cash / UPI / Card):`, 'Cash');
    if (!paymentMode) return;
    
    // Update the bill payment
    const updatedPayment = {
      ...bill.payment,
      amountPaid: bill.total,
      due: 0,
      status: 'paid',
      mode: bill.payment.mode + ' + ' + paymentMode.trim(),
      dueClearedOn: H.today()
    };
    
    // Save the updated bill
    Store.updateBill(id, { payment: updatedPayment });
    Toast.show(`✅ ₹${H.fmtNum(dueAmt)} due cleared! Sending updated receipt to customer...`, 'success');
    Views.bills.render();
    
    // Auto-send updated PAID receipt to customer via WhatsApp
    const updatedBill = Store.getBill(id);
    if (updatedBill) {
      setTimeout(() => Share.openShareModal(updatedBill), 500);
    }
  }
};

// ══════════════════════════════ VIEW: INVENTORY ══════
Views['inventory'] = {
  activeCategory: 'All',

  render: () => {
    const v = document.getElementById('app-view');
    const products = Store.getProducts();
    const catCounts = {};
    CONFIG.categories.forEach(c => catCounts[c] = products.filter(p => p.category === c).length);

    v.innerHTML = `
      <div class="view-header view-header-row">
        <div>
          <h1>Inventory</h1>
          <p>${products.length} product${products.length!==1?'s':''} · ${Store.lowStockCount()} low stock</p>
        </div>
        <button class="btn btn-gold" onclick="Views.inventory.openAddModal()">+ Add Product</button>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
        <div class="search-bar" style="max-width:300px;flex:1">
          <svg viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
          <input placeholder="Search products..." oninput="Views.inventory.search(this.value)">
        </div>
      </div>

      <div class="category-tabs">
        <button class="cat-tab active" onclick="Views.inventory.filterCat('All',this)">All (${products.length})</button>
        ${CONFIG.categories.map(c => `<button class="cat-tab" onclick="Views.inventory.filterCat('${c}',this)">${c} (${catCounts[c]||0})</button>`).join('')}
      </div>

      <div class="products-grid" id="products-grid">
        ${Views.inventory.renderCards(products)}
      </div>`;
  },

  renderCards: (products) => {
    if (!products.length) return `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📦</div>
        <h3>No products yet</h3>
        <p>Add your first product to track inventory</p>
        <button class="btn btn-gold" onclick="Views.inventory.openAddModal()">+ Add Product</button>
      </div>`;
    return products.map(p => {
      const lowStock = p.stock !== null && p.stock <= CONFIG.lowStockThreshold;
      const outStock  = p.stock !== null && p.stock === 0;
      const dotClass  = outStock ? 'out' : lowStock ? 'low' : '';
      const stockLabel = p.stock === null ? 'Flexible stock' : `${p.stock} in stock`;
      return `
        <div class="product-card">
          ${lowStock && !outStock ? '<div class="product-low-badge">Low Stock</div>' : ''}
          ${outStock ? '<div class="product-low-badge" style="background:var(--red-light);color:var(--red)">Out of Stock</div>' : ''}
          <div class="product-cat-chip">${p.category}</div>
          <div class="product-name">${H.escHtml(p.name)}</div>
          <div class="product-desc">${H.escHtml(p.description || '')}</div>
          <div class="product-price">${p.price ? H.fmt(p.price) : 'Variable'}</div>
          <div class="product-stock">
            <span class="stock-dot ${dotClass}"></span>
            ${stockLabel}
          </div>
          <div class="product-actions">
            <button class="btn btn-sm btn-outline" onclick="Views.inventory.openEditModal('${p.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="Views.inventory.deleteProduct('${p.id}')">Delete</button>
          </div>
        </div>`; }).join('');
  },

  filterCat: (cat, btn) => {
    Views.inventory.activeCategory = cat;
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const products = cat === 'All' ? Store.getProducts() : Store.getProducts().filter(p => p.category === cat);
    document.getElementById('products-grid').innerHTML = Views.inventory.renderCards(products);
  },

  search: (q) => {
    const products = Store.getProducts().filter(p =>
      (p.name || '').toLowerCase().includes(q.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(q.toLowerCase())
    );
    document.getElementById('products-grid').innerHTML = Views.inventory.renderCards(products);
  },

  openAddModal: () => {
    Router.go('inventory');
    setTimeout(() => {
      Modal.open('Add New Product', Views.inventory.formHtml(null),
        `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
         <button class="btn btn-gold" onclick="Views.inventory.saveProduct(null)">Save Product</button>`);
    }, 100);
  },

  openEditModal: (id) => {
    const p = Store.getProduct(id);
    if (!p) return;
    Modal.open('Edit Product', Views.inventory.formHtml(p),
      `<button class="btn btn-ghost" onclick="Modal.close()">Cancel</button>
       <button class="btn btn-gold" onclick="Views.inventory.saveProduct('${id}')">Save Changes</button>`);
  },

  formHtml: (p) => `
    <div class="form-group">
      <label class="form-label">Product Name *</label>
      <input id="prod-name" class="form-input" placeholder="e.g. Georgette Anarkali Set" value="${H.escHtml(p?.name||'')}">
    </div>
    <div class="form-group">
      <label class="form-label">Category *</label>
      <select id="prod-cat" class="form-select">
        ${CONFIG.categories.map(c => `<option ${p?.category===c?'selected':''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="prod-desc" class="form-textarea" placeholder="Color, fabric, size details...">${H.escHtml(p?.description||'')}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Price (₹) <span style="font-weight:400;color:var(--text-light)">(0 = variable)</span></label>
        <input id="prod-price" class="form-input" type="number" min="0" placeholder="0" value="${p?.price||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Stock Quantity <span style="font-weight:400;color:var(--text-light)">(-1 = not tracked)</span></label>
        <input id="prod-stock" class="form-input" type="number" min="-1" placeholder="e.g. 10" value="${p?.stock !== undefined ? p.stock : ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">SKU / Code</label>
      <input id="prod-sku" class="form-input" placeholder="e.g. US-001" value="${H.escHtml(p?.sku||'')}">
    </div>`,

  saveProduct: (editId) => {
    const name  = document.getElementById('prod-name')?.value.trim();
    const cat   = document.getElementById('prod-cat')?.value;
    const desc  = document.getElementById('prod-desc')?.value.trim();
    const price = parseFloat(document.getElementById('prod-price')?.value) || 0;
    const stock = parseInt(document.getElementById('prod-stock')?.value);
    const sku   = document.getElementById('prod-sku')?.value.trim();
    if (!name) { Toast.show('⚠️ Product name is required', 'error'); return; }
    const p = {
      name, category: cat, description: desc, price,
      stock: isNaN(stock) ? null : stock < 0 ? null : stock,
      sku
    };
    if (editId) { Store.updateProduct(editId, p); Toast.show('✓ Product updated!', 'success'); }
    else { Store.addProduct({ ...p, id: H.id('PROD') }); Toast.show('✓ Product added!', 'success'); }
    Modal.close();
    Views.inventory.render();
  },

  deleteProduct: (id) => {
    if (!confirm('Delete this product?')) return;
    Store.deleteProduct(id);
    Toast.show('Product deleted.', '');
    Views.inventory.render();
  }
};

// ═══════════════════════════════ VIEW: CUSTOMERS ══════
Views['customers'] = {
  render: () => {
    const v = document.getElementById('app-view');
    const customers = Store.getCustomers();

    const rows = customers.map(c => `
      <tr>
        <td>
          <div class="customer-info">
            <div class="customer-initials">${H.initials(c.name)}</div>
            <div>
              <div class="customer-name">${H.escHtml(c.name)}</div>
              <div class="customer-phone">${c.phone || '—'}</div>
            </div>
          </div>
        </td>
        <td>${c.bills?.length || 0} bill${(c.bills?.length||0)!==1?'s':''}</td>
        <td style="font-weight:700">${H.fmt(c.totalSpent)}</td>
        <td>${c.lastVisit ? H.formatDate(c.lastVisit) : '—'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-outline" onclick="Views.customers.viewHistory('${c.id}')">History</button>
            ${c.phone ? `<button class="btn btn-sm btn-whatsapp" onclick="window.open('https://wa.me/91${c.phone}','_blank')">Chat</button>` : ''}
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">👥</div><h3>No customers yet</h3><p>Customers are automatically added when you create bills.</p></div></td></tr>`;

    v.innerHTML = `
      <div class="view-header view-header-row">
        <div>
          <h1>Customers</h1>
          <p>${customers.length} customer${customers.length!==1?'s':''} registered</p>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="flex:1;max-width:360px">
            <svg viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/></svg>
            <input placeholder="Search by name or phone..." oninput="Views.customers.search(this.value)">
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Total Bills</th><th>Total Spent</th><th>Last Visit</th><th>Actions</th></tr></thead>
            <tbody id="customers-tbody">${rows}</tbody>
          </table>
        </div>
      </div>`;
  },

  search: (q) => {
    const customers = Store.getCustomers().filter(c =>
      (c.name||'').toLowerCase().includes(q.toLowerCase()) ||
      (c.phone||'').includes(q)
    );
    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;
    tbody.innerHTML = customers.map(c => `
      <tr>
        <td>
          <div class="customer-info">
            <div class="customer-initials">${H.initials(c.name)}</div>
            <div>
              <div class="customer-name">${H.escHtml(c.name)}</div>
              <div class="customer-phone">${c.phone || '—'}</div>
            </div>
          </div>
        </td>
        <td>${c.bills?.length || 0} bills</td>
        <td style="font-weight:700">${H.fmt(c.totalSpent)}</td>
        <td>${c.lastVisit ? H.formatDate(c.lastVisit) : '—'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-outline" onclick="Views.customers.viewHistory('${c.id}')">History</button>
            ${c.phone ? `<button class="btn btn-sm btn-whatsapp" onclick="window.open('https://wa.me/91${c.phone}','_blank')">Chat</button>` : ''}
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="5" class="text-center text-muted" style="padding:20px">No customers found.</td></tr>`;
  },

  viewHistory: (id) => {
    const c = Store.getCustomers().find(cu => cu.id === id);
    if (!c) return;
    const bills = (c.bills || []).map(bid => Store.getBill(bid)).filter(Boolean);
    const rows = bills.map(b => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--cream-100)">
        <div>
          <div style="font-weight:700;color:var(--gold-600)">${b.billNumber}</div>
          <div style="font-size:12px;color:var(--text-muted)">${H.formatDate(b.date)} · ${b.items.length} item${b.items.length!==1?'s':''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${H.fmt(b.total)}</div>
          <button class="btn btn-sm btn-whatsapp" onclick="Share.openShareModal(Store.getBill('${b.id}'))">Re-share</button>
        </div>
      </div>`).join('') || '<p style="color:var(--text-muted);text-align:center;padding:16px">No bill history.</p>';

    Modal.open(`${H.initials(c.name)} ${H.escHtml(c.name)}'s History`,
      `<div style="margin-bottom:16px">
        <div style="font-size:13px;color:var(--text-muted)">Phone: ${c.phone || '—'} · Total Spent: <strong>${H.fmt(c.totalSpent)}</strong></div>
      </div>
      <div>${rows}</div>`);
  }
};

// ════════════════════════════════ VIEW: REPORTS ══════
Views['reports'] = {
  period: 30,

  render: () => {
    const v = document.getElementById('app-view');
    v.innerHTML = `
      <div class="view-header view-header-row">
        <div><h1>Sales Reports</h1><p>Analytics & insights for Riwaaz by Eshmira</p></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-outline" onclick="Views.reports.exportCSV()">📥 Export CSV</button>
          <button class="btn btn-outline" style="border-color:#DC2626;color:#DC2626" onclick="Views.reports.exportPDF()">📄 Download PDF</button>
        </div>
      </div>

      <div class="report-filter-row">
        <span style="font-size:13px;color:var(--text-muted);font-weight:600">Period:</span>
        <button class="period-btn" onclick="Views.reports.setPeriod(7,this)">7 Days</button>
        <button class="period-btn active" onclick="Views.reports.setPeriod(30,this)">30 Days</button>
        <button class="period-btn" onclick="Views.reports.setPeriod(90,this)">3 Months</button>
        <button class="period-btn" onclick="Views.reports.setPeriod(365,this)">1 Year</button>
      </div>

      <div class="stats-grid" id="report-stats"></div>

      <div class="reports-grid">
        <div class="card">
          <div class="card-header"><h3>Sales Trend</h3></div>
          <div class="chart-wrap"><canvas id="sales-chart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Category Breakdown</h3></div>
          <div class="chart-wrap"><canvas id="cat-chart"></canvas></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div class="card">
          <div class="card-header"><h3>Payment Modes</h3></div>
          <div class="chart-wrap"><canvas id="pay-chart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Top Customers</h3></div>
          <div class="card-body" id="top-customers-list"></div>
        </div>
      </div>`;

    Views.reports.loadData(Views.reports.period);
  },

  setPeriod: (days, btn) => {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Views.reports.period = days;
    Views.reports.loadData(days);
  },

  loadData: (days) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const bills = Store.getBills().filter(b => b.status !== 'return' && new Date(b.date) >= cutoff);
    const total = bills.reduce((s,b) => s+b.total, 0);
    const avg   = bills.length ? total / bills.length : 0;

    // Stats
    document.getElementById('report-stats').innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">${H.fmt(total)}</div><div class="stat-sub">Last ${days} days</div></div>
      <div class="stat-card maroon"><div class="stat-label">Total Bills</div><div class="stat-value">${bills.length}</div><div class="stat-sub">Last ${days} days</div></div>
      <div class="stat-card green"><div class="stat-label">Avg Bill Value</div><div class="stat-value">${H.fmt(Math.round(avg))}</div><div class="stat-sub">Per transaction</div></div>
      <div class="stat-card warning"><div class="stat-label">Total Discount</div><div class="stat-value">${H.fmt(bills.reduce((s,b)=>s+b.discount,0))}</div><div class="stat-sub">Given to customers</div></div>`;

    // Daily sales data (last N days)
    const days_arr = Array.from({length: Math.min(days, 30)}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (Math.min(days,30)-1-i));
      return d.toISOString().split('T')[0];
    });
    const dailyTotals = days_arr.map(d => ({ date: d, total: bills.filter(b => b.date === d).reduce((s,b)=>s+b.total,0) }));

    // Category data
    const catData = {};
    CONFIG.categories.forEach(c => catData[c] = 0);
    bills.forEach(b => b.items.forEach(it => { catData[it.category] = (catData[it.category]||0) + it.total; }));

    // Payment mode data
    const payData = {};
    bills.forEach(b => { payData[b.payment.mode] = (payData[b.payment.mode]||0) + b.total; });

    // Top customers
    const custMap = {};
    bills.forEach(b => {
      const k = b.customer.name || 'Walk-in';
      if (!custMap[k]) custMap[k] = { name: k, total: 0, count: 0 };
      custMap[k].total += b.total; custMap[k].count++;
    });
    const topCusts = Object.values(custMap).sort((a,b) => b.total - a.total).slice(0,5);
    document.getElementById('top-customers-list').innerHTML = topCusts.map((c,i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--cream-100)">
        <div style="width:24px;height:24px;border-radius:50%;background:var(--gold-${i===0?'400':'200'});color:${i===0?'var(--dark-800)':'var(--gold-600)'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${i+1}</div>
        <div style="flex:1"><div style="font-weight:600;font-size:13px">${H.escHtml(c.name)}</div><div style="font-size:11px;color:var(--text-muted)">${c.count} bill${c.count!==1?'s':''}</div></div>
        <div style="font-weight:700;color:var(--gold-600)">${H.fmt(c.total)}</div>
      </div>`).join('') || '<p style="color:var(--text-muted);text-align:center;padding:16px">No data for this period.</p>';

    if (!window.Chart) {
      document.querySelector('.reports-grid').innerHTML = '<div style="padding:24px;color:var(--text-muted);text-align:center"><p>📊 Charts require internet connection (Chart.js CDN).<br>Other data above is available offline.</p></div>';
      return;
    }

    // Destroy existing charts
    ['sales-chart','cat-chart','pay-chart'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el._chart) { el._chart.destroy(); delete el._chart; }
    });

    const goldPalette = ['#C9A458','#B8860B','#E8CB7A','#9A7030','#F5E8C0','#7A5520'];

    // Sales chart
    const salesCtx = document.getElementById('sales-chart');
    if (salesCtx) {
      salesCtx._chart = new Chart(salesCtx, {
        type: 'bar',
        data: {
          labels: dailyTotals.map(d => H.formatDateShort(d.date)),
          datasets: [{ label: 'Sales (₹)', data: dailyTotals.map(d => d.total), backgroundColor: 'rgba(201,164,88,0.7)', borderColor: '#C9A458', borderWidth: 2, borderRadius: 6 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₹'+H.fmtNum(v) } } } }
      });
    }

    // Category chart
    const catCtx = document.getElementById('cat-chart');
    const catLabels = Object.keys(catData).filter(k => catData[k] > 0);
    if (catCtx && catLabels.length) {
      catCtx._chart = new Chart(catCtx, {
        type: 'doughnut',
        data: { labels: catLabels, datasets: [{ data: catLabels.map(k => catData[k]), backgroundColor: goldPalette, borderWidth: 2 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
    }

    // Payment chart
    const payCtx = document.getElementById('pay-chart');
    const payLabels = Object.keys(payData);
    if (payCtx && payLabels.length) {
      payCtx._chart = new Chart(payCtx, {
        type: 'pie',
        data: { labels: payLabels, datasets: [{ data: payLabels.map(k => payData[k]), backgroundColor: goldPalette, borderWidth: 2 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });
    }
  },

  exportCSV: () => {
    const bills = Store.getBills();
    const rows = [['Bill #','Date','Customer','Phone','Items','Subtotal','Discount','Total','Payment Mode','Status']];
    bills.forEach(b => rows.push([b.billNumber, b.date, b.customer.name||'', b.customer.phone||'', b.items.length, b.subtotal, b.discount, b.total, b.payment.mode, b.payment.status]));
    const csv = rows.map(r => r.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'riwaaz_bills.csv'; a.click();
    URL.revokeObjectURL(url);
    Toast.show('✓ CSV downloaded!', 'success');
  },

  exportPDF: () => {
    const days = Views.reports.period;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const bills = Store.getBills().filter(b => b.status !== 'return' && new Date(b.date) >= cutoff);
    const total = bills.reduce((s,b) => s+b.total, 0);
    
    // Group by date
    const dailyMap = {};
    bills.forEach(b => {
      dailyMap[b.date] = (dailyMap[b.date] || 0) + b.total;
    });
    
    const dates = Object.keys(dailyMap).sort((a,b) => b.localeCompare(a));
    const dailyRows = dates.map(d => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee;font-family:monospace">${H.formatDateShort(d)}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${H.fmt(dailyMap[d])}</td>
      </tr>
    `).join('');

    const html = `
      <html><head><title>Sales Report - Riwaaz by Eshmira</title></head>
      <body style="font-family:Arial,sans-serif;color:#333;padding:40px;max-width:800px;margin:0 auto">
        <div style="text-align:center;border-bottom:2px solid #C9A458;padding-bottom:20px;margin-bottom:30px">
          <h1 style="margin:0;font-family:Georgia,serif;color:#2C1810">Riwaaz by Eshmira</h1>
          <p style="margin:5px 0 0;color:#666">Sales Report — Last ${days} Days</p>
          <p style="margin:5px 0 0;font-size:12px;color:#999">Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="display:flex;justify-content:space-between;background:#f9f9f9;padding:20px;border-radius:8px;margin-bottom:30px">
          <div>
            <div style="font-size:12px;text-transform:uppercase;color:#888;font-weight:bold">Overall Total Sales</div>
            <div style="font-size:28px;font-weight:bold;color:#2C1810;margin-top:5px">${H.fmt(total)}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;text-transform:uppercase;color:#888;font-weight:bold">Total Bills</div>
            <div style="font-size:28px;font-weight:bold;color:#2C1810;margin-top:5px">${bills.length}</div>
          </div>
        </div>
        
        <h3 style="color:#2C1810;border-bottom:1px solid #ddd;padding-bottom:10px;margin-bottom:20px">Daily Sales Breakdown</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f1f1f1">
              <th style="padding:12px;text-align:left;font-size:13px;color:#555">Date</th>
              <th style="padding:12px;text-align:right;font-size:13px;color:#555">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${dailyRows || '<tr><td colspan="2" style="padding:20px;text-align:center;color:#999">No sales data for this period.</td></tr>'}
          </tbody>
        </table>
      </body></html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }
};

// ═══════════════════════════════ VIEW: RETURNS ════════
Views['returns'] = {
  returnType: 'return',

  render: () => {
    const v = document.getElementById('app-view');
    const returns = Store.getReturns();

    const rows = returns.map(r => `
      <tr>
        <td><span style="font-weight:700;color:var(--gold-600)">${r.returnNumber || r.id.slice(-6)}</span></td>
        <td>${r.originalBillId}</td>
        <td>${H.escHtml(r.customerName || '—')}</td>
        <td>${H.formatDate(r.date)}</td>
        <td><span class="badge badge-${r.type}">${r.type}</span></td>
        <td>${H.fmt(r.refundAmount || 0)}</td>
        <td style="max-width:180px;font-size:12px;color:var(--text-muted)">${H.escHtml(r.reason || '—')}</td>
      </tr>`).join('') || '';

    v.innerHTML = `
      <div class="view-header">
        <h1>Returns & Exchanges</h1>
        <p>Log and track product returns and exchanges</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:20px;align-items:start">
        <!-- Log new return -->
        <div class="card">
          <div class="card-header"><h3>↩️ Log Return / Exchange</h3></div>
          <div class="card-body">
            <div class="return-type-btns" style="margin-bottom:16px">
              <button class="type-btn active" id="type-return" onclick="Views.returns.setType('return')">↩️ Return</button>
              <button class="type-btn" id="type-exchange" onclick="Views.returns.setType('exchange')">🔄 Exchange</button>
            </div>

            <div class="form-group">
              <label class="form-label">Original Bill Number *</label>
              <input id="ret-bill-no" class="form-input" placeholder="e.g. RBE-2026-0001">
            </div>
            <div class="form-group">
              <label class="form-label">Customer Name</label>
              <input id="ret-cust" class="form-input" placeholder="Customer name">
            </div>
            <div class="form-group">
              <label class="form-label">Item(s) Being Returned</label>
              <textarea id="ret-items" class="form-textarea" placeholder="Describe the item(s) returned..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Reason</label>
              <textarea id="ret-reason" class="form-textarea" placeholder="Reason for return/exchange..."></textarea>
            </div>
            <div class="form-group" id="refund-group">
              <label class="form-label">Refund Amount (₹)</label>
              <input id="ret-refund" class="form-input" type="number" min="0" placeholder="0">
            </div>
            <button class="btn btn-gold btn-full" onclick="Views.returns.saveReturn()">Save Return/Exchange</button>
          </div>
        </div>

        <!-- Returns history -->
        <div class="card">
          <div class="card-header"><h3>Return History <span style="font-size:14px;color:var(--text-muted);font-weight:400">(${returns.length})</span></h3></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Return #</th><th>Bill #</th><th>Customer</th><th>Date</th><th>Type</th><th>Refund</th><th>Reason</th></tr></thead>
              <tbody>${rows || `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">↩️</div><h3>No returns yet</h3><p>Log a return or exchange here.</p></div></td></tr>`}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  setType: (type) => {
    Views.returns.returnType = type;
    document.getElementById('type-return')?.classList.toggle('active', type === 'return');
    document.getElementById('type-exchange')?.classList.toggle('active', type === 'exchange');
    const refundGroup = document.getElementById('refund-group');
    if (refundGroup) refundGroup.style.display = type === 'exchange' ? 'none' : '';
  },

  saveReturn: () => {
    const billNo  = document.getElementById('ret-bill-no')?.value.trim();
    const cust    = document.getElementById('ret-cust')?.value.trim();
    const items   = document.getElementById('ret-items')?.value.trim();
    const reason  = document.getElementById('ret-reason')?.value.trim();
    const refund  = parseFloat(document.getElementById('ret-refund')?.value) || 0;
    if (!billNo) { Toast.show('⚠️ Please enter the original bill number.', 'error'); return; }
    const ret = {
      id:             H.id('RET'),
      returnNumber:   'RET-' + Date.now().toString().slice(-6),
      originalBillId: billNo,
      customerName:   cust,
      itemsReturned:  items,
      reason,
      refundAmount:   refund,
      type:           Views.returns.returnType,
      date:           H.today()
    };
    Store.addReturn(ret);
    Toast.show('✓ Return logged successfully!', 'success');
    Views.returns.render();
  }
};

// ═══════════════════════════ EVENT LISTENERS & INIT ══
document.addEventListener('DOMContentLoaded', () => {

  // Sidebar nav
  document.getElementById('sidebar-nav').addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (item && item.dataset.view) {
      e.preventDefault();
      Router.go(item.dataset.view);
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.add('hidden');
    }
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', Modal.close);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) Modal.close();
  });

  // Share modal close
  document.getElementById('share-modal-close').addEventListener('click', ShareModal.close);
  document.getElementById('share-modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('share-modal-overlay')) ShareModal.close();
  });

  // Mobile hamburger
  document.getElementById('hamburger-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
  });

  // Mobile new bill button
  document.getElementById('mobile-new-bill').addEventListener('click', () => {
    Router.go('new-bill');
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.add('hidden');
  });

  // Seed sample data if first run
  if (!localStorage.getItem('rbe_seeded')) {
    const sampleProducts = [
      { id: H.id('PROD'), name: 'Georgette Anarkali Set', category: 'Unstitched Suit', description: 'Heavy georgette with zari border', price: 2800, stock: 12, sku: 'US-001' },
      { id: H.id('PROD'), name: 'Cotton Salwar Kameez', category: 'Unstitched Suit', description: 'Premium cotton, summer collection', price: 1200, stock: 20, sku: 'US-002' },
      { id: H.id('PROD'), name: 'Bridal Lehenga Set', category: 'Stitched Suit', description: 'Ready to wear, heavy embroidery', price: 8500, stock: 4, sku: 'SS-001' },
      { id: H.id('PROD'), name: 'Embroidered Kurti', category: 'Kurtis', description: 'Short kurti with mirror work', price: 850, stock: 15, sku: 'KU-001' },
      { id: H.id('PROD'), name: 'Rayon Kurti Set', category: 'Kurtis', description: 'With palazzo, block print', price: 1100, stock: 8, sku: 'KU-002' },
      { id: H.id('PROD'), name: 'Rumalla Saheb Cloth', category: 'Rumalla Saheb', description: 'Sacred rumalla, silk fabric', price: 500, stock: null, sku: 'RS-001' },
      { id: H.id('PROD'), name: 'Customised Suit Order', category: 'Customised', description: 'Custom stitched per measurements', price: 0, stock: null, sku: 'CU-001' },
    ];
    sampleProducts.forEach(p => Store.addProduct(p));
    localStorage.setItem('rbe_seeded', '1');
  }

  // Initial view
  Router.go('dashboard');
});
