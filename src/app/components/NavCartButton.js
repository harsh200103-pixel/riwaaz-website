'use client';
import { useCart } from '../../lib/CartContext';

export default function NavCartButton() {
  const { cartCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      className="nav-cart-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: '600',
        color: 'var(--gold-600)',
        fontSize: '14px',
        position: 'relative'
      }}
    >
      <span>🛒</span>
      <span>Cart</span>
      {cartCount > 0 && (
        <span
          className="cart-badge"
          style={{
            background: 'var(--gold-500)',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: '700',
            lineHeight: '1',
            display: 'inline-block'
          }}
        >
          {cartCount}
        </span>
      )}
    </button>
  );
}
