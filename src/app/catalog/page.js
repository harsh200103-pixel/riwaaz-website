'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import styles from './catalog.module.css';

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'Stitched Suit', label: 'Stitched Suits' },
  { id: 'Unstitched Suit', label: 'Unstitched Suits' },
  { id: 'Co-ord Set', label: 'Co-ord Set' },
  { id: '3 Piece Suit', label: '3 Piece Suit' },
  { id: '2 Piece Suit', label: '2 Piece Suit' },
  { id: 'Anarkali', label: 'Anarkali' },
  { id: 'One Piece', label: 'One Piece' },
  { id: 'Rumalla Saheb', label: 'Rumalla Saheb' },
  { id: 'Kurtis', label: 'Kurtis' },
  { id: 'Customised', label: 'Customised' }
];

export default function CatalogPage() {
  const [activeCat, setActiveCat] = useState('all');
  const [suits, setSuits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuits = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const products = querySnapshot.docs.map(doc => doc.data());
        // Filter out shop exclusive items
        setSuits(products.filter(p => !p.isShopOnly));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuits();
  }, []);

  const filteredSuits = activeCat === 'all' 
    ? suits 
    : suits.filter(s => s.category === activeCat);

  return (
    <main className="container">
      <div className={styles.catalogHeader}>
        <h1 className="section-title" style={{ marginBottom: '16px' }}>Our Collections</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 40px' }}>
          Explore our premium range of luxury ethnic wear, meticulously crafted for elegance.
        </p>

        {/* Filter Bar */}
        <div className={styles.filters}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`${styles.filterBtn} ${activeCat === cat.id ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading collection...
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className={styles.grid}>
            {filteredSuits.map(suit => {
              const catLabel = CATEGORIES.find(c => c.id === suit.category)?.label || suit.category;
              return (
                <Link href={`/catalog/${suit.id}`} key={suit.id} className={styles.productCard} style={{ position: 'relative' }}>
                  <div className={styles.imageWrapper} style={{ position: 'relative' }}>
                    <img src={suit.images && suit.images.length > 0 ? suit.images[0] : suit.image} alt={suit.name} className={styles.productImage} style={suit.soldOut ? { filter: 'grayscale(60%)', opacity: 0.7 } : {}} />
                    {suit.soldOut ? (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#DC2626', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Sold Out
                      </div>
                    ) : (
                      suit.stock === 1 && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#B8860B', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          ✨ Unique Piece
                        </div>
                      )
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <div className={styles.productCat}>{catLabel}</div>
                    <h3 className={styles.productName}>{suit.name}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className={styles.productPrice}>₹{suit.price.toLocaleString('en-IN')}</div>
                      {suit.size && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{suit.size}</div>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {filteredSuits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No suits found in this category.
            </div>
          )}
        </>
      )}
    </main>
  );
}
