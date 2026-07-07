'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('riwaaz_cart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse cart data:', e);
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage when changed
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('riwaaz_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  const addToCart = (product, selectedSize = '', selectedColor = '') => {
    setCartItems((prevItems) => {
      // Find if item already exists with the same ID, selected size, and selected color
      const existingIdx = prevItems.findIndex(
        (item) => item.id === product.id && item.selectedSize === selectedSize && item.selectedColor === selectedColor
      );

      if (existingIdx > -1) {
        return prevItems; // Already in cart, do nothing
      }

      // Format image URL fallback
      const img = product.images && product.images.length > 0 
        ? product.images[0] 
        : (product.image || '');

      return [
        ...prevItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          fabric: product.fabric,
          image: img,
          selectedSize: selectedSize || product.size || '',
          selectedColor: selectedColor || '',
          quantity: 1,
        },
      ];
    });
    
    // Automatically open cart drawer on add
    setIsCartOpen(true);
  };

  const removeFromCart = (productId, selectedSize = '', selectedColor = '') => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.id === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor)
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        addToCart,
        removeFromCart,
        clearCart,
        openCart,
        closeCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
