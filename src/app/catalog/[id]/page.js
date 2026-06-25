import Link from 'next/link';
import styles from '../catalog.module.css';
import GalleryViewer from './GalleryViewer';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AddToCartButton from './AddToCartButton';

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

export async function generateMetadata({ params }) {
  const { id } = await params;
  let suit = null;
  try {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      suit = docSnap.data();
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  if (!suit) {
    return {
      title: 'Suit Not Found',
    };
  }

  const imageUrl = suit.images && suit.images.length > 0 ? suit.images[0] : (suit.image || '');

  return {
    title: `${suit.name} - Riwaaz by Eshmira`,
    description: suit.description || `Buy ${suit.name} online from Riwaaz by Eshmira.`,
    openGraph: {
      title: suit.name,
      description: suit.description,
      images: imageUrl ? [{ url: imageUrl }] : [],
    },
  };
}

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
  const productUrl = `https://riwaaz-website.vercel.app/catalog/${suit.id}`;
  const waMsg = `Hi! I want to buy the "${suit.name}" (ID: ${suit.id}) listed on your website: ${productUrl}`;
  const waLink = `https://wa.me/919770496796?text=${encodeURIComponent(waMsg)}`;

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
              <a href="https://wa.me/919770496796?text=Hi!%20I%20saw%20a%20sold%20out%20piece%20on%20your%20website.%20Do%20you%20have%20something%20similar?" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ width: '100%' }}>
                💬 Ask for Similar Pieces
              </a>
            </>
          ) : (
            <>
              <div className={styles.actionTitle}>Love this piece?</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Add it to your cart to purchase multiple items, or inquire directly on WhatsApp.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AddToCartButton product={suit} />
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ width: '100%', border: '1px solid var(--gold-300)' }}>
                  💬 Buy Directly on WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
