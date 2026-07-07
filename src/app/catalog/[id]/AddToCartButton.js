'use client';
import { useState } from 'react';
import { useCart } from '../../../lib/CartContext';

export default function AddToCartButton({ product }) {
  const { addToCart, cartItems, openCart } = useCart();
  
  // Set default color if colors exist
  const hasColors = product.colors && product.colors.length > 0;
  const [selectedColor, setSelectedColor] = useState(hasColors ? product.colors[0] : '');

  // Check if item is already in the cart with the same selected color
  const isInCart = cartItems.some(
    (item) => item.id === product.id && (!hasColors || item.selectedColor === selectedColor)
  );

  const handleAdd = () => {
    if (isInCart) {
      openCart();
    } else {
      addToCart(product, '', selectedColor);
    }
  };

  const productUrl = `https://riwaaz-website.vercel.app/catalog/${product.id}`;
  const waMsg = selectedColor 
    ? `Hi! I want to inquire about the "${product.name}" in *${selectedColor}* color (ID: ${product.id}) listed on your website: ${productUrl}`
    : `Hi! I want to inquire about the "${product.name}" (ID: ${product.id}) listed on your website: ${productUrl}`;
  const waLink = `https://wa.me/919770496796?text=${encodeURIComponent(waMsg)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {hasColors && (
        <div style={{ margin: '10px 0 5px 0' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🎨 Select Color: <span style={{ color: 'var(--gold-500)', fontWeight: 700 }}>{selectedColor}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {product.colors.map((color) => {
              const isActive = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: isActive ? '2px solid var(--gold-500)' : '1px solid var(--cream-200)',
                    background: isActive ? 'var(--gold-100)' : '#fff',
                    color: isActive ? 'var(--gold-700)' : 'var(--text-body)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <button
          onClick={handleAdd}
          className={isInCart ? "btn-gold" : "btn-gold"}
          style={{ 
            width: '100%', 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '48px',
            background: isInCart ? 'transparent' : 'var(--gold-500)',
            color: isInCart ? 'var(--gold-600)' : '#fff',
            border: isInCart ? '1px solid var(--gold-400)' : 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {isInCart ? <span>Added to Cart ✓</span> : <span>🛒 Add to Cart</span>}
        </button>
        
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ width: '100%', border: '1px solid var(--gold-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '48px', color: 'var(--dark-800)', fontWeight: 600 }}>
          💬 Buy Directly on WhatsApp
        </a>
      </div>
    </div>
  );
}
