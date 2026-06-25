'use client';
import { CartProvider as Provider } from '../lib/CartContext';

export default function CartProvider({ children }) {
  return <Provider>{children}</Provider>;
}
