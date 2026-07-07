'use client';
import { useCart } from '../../lib/CartContext';
import Link from 'next/link';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    cartCount,
    cartTotal,
  } = useCart();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    let message = "Hi Riwaaz! I would like to purchase the following pieces from your website:\n\n";

    cartItems.forEach((item, idx) => {
      const productUrl = `https://riwaaz-website.vercel.app/catalog/${item.id}`;
      message += `${idx + 1}. *${item.name}* (ID: ${item.id})\n`;
      message += `   - Price: ₹${item.price.toLocaleString('en-IN')}\n`;
      if (item.selectedSize) {
        message += `   - Size: ${item.selectedSize}\n`;
      }
      if (item.selectedColor) {
        message += `   - Color: ${item.selectedColor}\n`;
      }
      message += `   - Link: ${productUrl}\n\n`;
    });

    message += `*Total Items:* ${cartCount}\n`;
    message += `*Grand Total:* ₹${cartTotal.toLocaleString('en-IN')}\n\n`;
    message += "Please let me know about availability and how to complete the purchase!";

    const waLink = `https://wa.me/919770496796?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  return (
    <div className="cart-overlay" onClick={closeCart}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2 className="cart-title">Your Cart ({cartCount})</h2>
          <button className="cart-close-btn" onClick={closeCart}>✕</button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
              <h3>Your cart is empty</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
                Browse our collections and add items you love.
              </p>
              <button className="btn-gold" style={{ marginTop: '24px' }} onClick={closeCart}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor || ''}`} className="cart-item">
                  <div className="cart-item-img-wrapper">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="cart-item-img" />
                    ) : (
                      <div className="cart-item-placeholder">👗</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <div className="cart-item-meta">
                      {item.category && <span>{item.category}</span>}
                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                    </div>
                    <div className="cart-item-price">
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                    <div className="cart-item-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary">
              <span style={{ fontWeight: 500 }}>Subtotal</span>
              <span className="cart-total-price">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px', lineHeight: '1.4' }}>
              We will confirm product sizes, fittings, and availability directly with you on WhatsApp.
            </p>
            <button className="btn-gold" style={{ width: '100%' }} onClick={handleCheckout}>
              💬 Order on WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
