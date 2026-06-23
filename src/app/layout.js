import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Riwaaz by Eshmira',
  description: 'Premium boutique in Indore',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ background: 'var(--cream-50)', borderBottom: '1px solid var(--cream-200)', padding: '20px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '28px', fontWeight: 700, color: 'var(--gold-500)', letterSpacing: '0.05em' }}>
              Riwaaz
            </Link>
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: 500, color: 'var(--dark-800)' }}>
              <Link href="/">Home</Link>
              <Link href="/catalog">Catalog</Link>
              <a href="https://wa.me/919827788773" target="_blank" rel="noopener noreferrer">Contact</a>
            </div>
          </div>
        </nav>
        {children}
        <footer style={{ background: 'var(--dark-900)', color: 'rgba(255,255,255,0.6)', padding: '60px 24px', textAlign: 'center', fontSize: '14px' }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '32px', color: 'var(--gold-400)', marginBottom: '12px' }}>Riwaaz</div>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold-300)', marginBottom: '24px' }}>by Eshmira</div>
          <p>50/2, Shivam Apartment, Bholaram Ustad Marg, Indore</p>
          <p style={{ marginTop: '8px' }}>📞 +91 9827788773 &nbsp;|&nbsp; +91 9770496796</p>
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            © {new Date().getFullYear()} Riwaaz by Eshmira. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
