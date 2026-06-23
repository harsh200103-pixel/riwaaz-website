import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Riwaaz by Eshmira | Premium Ethnic Wear',
  description: 'Premium boutique in Indore offering Unstitched Suits, Stitched Suits, Kurtis, and Customised ethnic wear.',
};

const CATEGORIES = [
  { id: 'unstitched', name: 'Unstitched Suits', desc: 'Premium fabrics and elegant designs ready to be tailored.' },
  { id: 'stitched', name: 'Stitched Suits', desc: 'Ready-to-wear luxury ethnic collections.' },
  { id: 'rumalla', name: 'Rumalla Saheb', desc: 'Exquisite traditional Rumalla Saheb.' },
  { id: 'kurtis', name: 'Designer Kurtis', desc: 'Everyday elegance and festive wear kurtis.' },
  { id: 'custom', name: 'Customised', desc: 'Made-to-measure outfits crafted specifically for you.' }
];

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroDeco}>✦ &nbsp; ✦ &nbsp; ✦</div>
        <h1 className={styles.heroTitle}>Riwaaz</h1>
        <div className={styles.heroSubtitle}>✿ &nbsp; BY ESHMIRA &nbsp; ✿</div>
        
        <p className={styles.heroDescription}>
          Discover our exclusive collection of ethnic wear. From elegant unstitched fabrics to beautifully crafted ready-to-wear suits and customised outfits.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/catalog" className="btn-gold">
            View Collection
          </Link>
          <a href="https://wa.me/919827788773" target="_blank" rel="noopener noreferrer" className="btn-outline">
            Contact Us
          </a>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.categoriesSection}>
        <div className="container">
          <h2 className="section-title">Our Collections</h2>
          
          <div className={styles.categoriesGrid}>
            {CATEGORIES.map(cat => (
              <Link href={`/catalog?category=${cat.id}`} key={cat.id} className={styles.categoryCard}>
                <h3 className={styles.categoryTitle}>{cat.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                  {cat.desc}
                </p>
                <span className={styles.categoryLink}>Explore</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
