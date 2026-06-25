'use client';
import { useCart } from '../../../lib/CartContext';

export default function AddToCartButton({ product }) {
  const { addToCart, cartItems, openCart } = useCart();

  // Check if item is already in the cart
  const isInCart = cartItems.some((item) => item.id === product.id);

  const handleAdd = () => {
    if (isInCart) {
      openCart();
    } else {
      addToCart(product);
    }
  };

  return (
    <button
      onClick={handleAdd}
      className={isInCart ? "btn-outline" : "btn-gold"}
      style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
    >
      {isInCart ? (
        <>
          <span>Added to Cart ✓</span>
        </>
      ) : (
        <>
          <span>🛒 Add to Cart</span>
        </>
      )}
    </button>
  );
}
