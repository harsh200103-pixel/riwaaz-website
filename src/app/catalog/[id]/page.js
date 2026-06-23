import Link from 'next/link';
import styles from '../catalog.module.css';
import GalleryViewer from './GalleryViewer';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const CATEGORIES = [
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

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  
  let suit = null;
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      suit = docSnap.data();
    }
  } catch (error) {
    console.error("Error fetching suit details:", error);
  }

  if (!suit || suit.isShopOnly) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2>Suit not found</h2>
        <Link href="/catalog" className="btn-outline" style={{ marginTop: '24px' }}>Back to Catalog</Link>
      </div>
    );
  }

  const catLabel = CATEGORIES.find(c => c.id === suit.category)?.label || suit.category;

  // WhatsApp Message Generation
  const waMsg = `Hi! I want to buy the "${suit.name}" (ID: ${suit.id}) listed on your website. Is it available?`;
  const waLink = `https://wa.me/917999629985?text=${encodeURIComponent(waMsg)}`;

  return (
    <main className={`container ${styles.detailsContainer}`}>
      <div style={{ flex: 1 }}>
        <GalleryViewer suit={suit} />
      </div>

      <div>
        <div className={styles.detailsCat}>{catLabel}</div>
        <h1 className={styles.detailsTitle}>{suit.name}</h1>
        <div className={styles.detailsPrice}>₹{suit.price.toLocaleString('en-IN')}</div>
        
        <div className={styles.detailsFabric}>Fabric: {suit.fabric}</div>
        {suit.size && <div className={styles.detailsFabric}>Size: {suit.size}</div>}
        
        <p className={styles.detailsDesc}>{suit.description}</p>

        <div className={styles.actionBox}>
          {suit.soldOut ? (
            <>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>🚫 This piece is Sold Out</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>This was a one-of-a-kind piece. Follow us for new arrivals!</p>
              </div>
              <a href="https://wa.me/917999629985?text=Hi!%20I%20saw%20a%20sold%20out%20piece%20on%20your%20website.%20Do%20you%20have%20something%20similar?" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ width: '100%' }}>
                💬 Ask for Similar Pieces
              </a>
            </>
          ) : (
            <>
              <div className={styles.actionTitle}>Love this piece?</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                We provide personal consultations for all our outfits to ensure the perfect fit and quality.
              </p>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ width: '100%' }}>
                💬 Buy on WhatsApp
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
