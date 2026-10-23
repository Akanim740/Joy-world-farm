/* =========================================================
   Joy World Farm — Shared client utilities
   Loaded by every page before page-specific scripts.
   Provides: cart storage, cart badge, WhatsApp links, helpers.
   ========================================================= */
(function () {
  'use strict';

  var CART_KEY = 'jwf_cart_v1';

  /* ---------- Cart ---------- */
  function safeArray(raw) {
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function getCart() {
    try {
      return safeArray(localStorage.getItem(CART_KEY));
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) { /* storage unavailable (private mode) */ }
    updateCartBadge();
    try {
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: cart } }));
    } catch (e) {}
  }

  function getCartCount() {
    return getCart().reduce(function (sum, item) {
      return sum + (parseInt(item.quantity, 10) || 0);
    }, 0);
  }

  function addToCart(productId, quantity) {
    var qty = Math.max(1, parseInt(quantity, 10) || 1);
    var cart = getCart();
    var existing = cart.find(function (i) { return String(i.productId) === String(productId); });
    if (existing) {
      existing.quantity = (parseInt(existing.quantity, 10) || 0) + qty;
    } else {
      cart.push({ productId: String(productId), quantity: qty });
    }
    saveCart(cart);
    return getCartCount();
  }

  function updateCart(productId, quantity) {
    var qty = parseInt(quantity, 10) || 0;
    var cart = getCart();
    if (qty <= 0) {
      cart = cart.filter(function (i) { return String(i.productId) !== String(productId); });
    } else {
      var item = cart.find(function (i) { return String(i.productId) === String(productId); });
      if (!item) return;
      item.quantity = qty;
    }
    saveCart(cart);
  }

  function removeFromCart(productId) {
    saveCart(getCart().filter(function (i) { return String(i.productId) !== String(productId); }));
  }

  function clearCart() {
    saveCart([]);
  }

  function updateCartBadge() {
    var count = getCartCount();
    var badges = document.querySelectorAll('#cartBadge, .cart-badge');
    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = count;
      badges[i].setAttribute('data-count', count);
    }
  }

  /* ---------- WhatsApp ---------- */
  function getWhatsappUrl(number, message) {
    var digits = String(number || '').replace(/[^0-9]/g, '');
    var text = message ? '?text=' + encodeURIComponent(message) : '';
    return 'https://wa.me/' + digits + text;
  }

  /* ---------- Formatting & safety ---------- */
  function formatNaira(amount) {
    var n = Number(amount) || 0;
    return '\u20A6' + n.toLocaleString('en-NG');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---------- Expose ---------- */
  window.getCart = getCart;
  window.saveCart = saveCart;
  window.getCartCount = getCartCount;
  window.addToCart = addToCart;
  window.updateCart = updateCart;
  window.removeFromCart = removeFromCart;
  window.clearCart = clearCart;
  window.updateCartBadge = updateCartBadge;
  window.getWhatsappUrl = getWhatsappUrl;
  window.formatNaira = formatNaira;
  window.escapeHtml = escapeHtml;

  /* ---------- Wire up ---------- */
  document.addEventListener('DOMContentLoaded', updateCartBadge);

  window.addEventListener('storage', function (e) {
    if (e.key === CART_KEY) updateCartBadge();
  });

  window.addEventListener('cart:updated', function () {
    if (!document.getElementById('toast')) return;
  });
})();
