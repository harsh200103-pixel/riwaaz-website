'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function BillViewer() {
  const searchParams = useSearchParams();
  const [bill, setBill] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      fetch(`https://bytebin.lucko.me/${id}`)
        .then(res => res.json())
        .then(parsed => {
          // Merge the static config block back in
          const fullBill = {
            config: { currency: '₹', address: '50/2, Shivam Apartment, Bholaram Ustad Marg, Indore', phone1: '+91 9827788773', phone2: '+91 9770496796' },
            ...parsed
          };
          setBill(fullBill);
        })
        .catch(e => {
          console.error(e);
          setError(true);
        });
    } else {
      setError(true);
    }
  }, [searchParams]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <h2>Invalid or Missing Bill Data</h2>
        <p>We couldn't load the digital bill. Please check the link and try again.</p>
        <Link href="/" className="btn-outline" style={{ marginTop: '20px' }}>Go to Homepage</Link>
      </div>
    );
  }

  if (!bill) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--gold-500)' }}>Loading your bill...</div>;
  }

  const { currency, address, phone1, phone2 } = bill.config || { currency: '₹', address: '50/2, Shivam Apartment, Bholaram Ustad Marg, Indore', phone1: '9827788773', phone2: '9770496796' };
  
  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const fmt = (num) => Number(num).toLocaleString('en-IN');

  return (
    <main style={{ padding: '40px 20px', background: 'var(--cream-100)', minHeight: '80vh', display: 'flex', justifyContent: 'center' }}>
      <div id="bill-container" style={{
        background: '#fff',
        width: '100%',
        maxWidth: '440px',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        border: '1px solid var(--cream-200)',
        fontFamily: 'Inter, sans-serif',
        alignSelf: 'flex-start'
      }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--dark-900), var(--dark-800))', padding: '32px 24px 24px', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '12px', letterSpacing: '6px', color: 'var(--gold-400)', opacity: 0.6, marginBottom: '8px' }}>✦ &nbsp; ✦ &nbsp; ✦</div>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '42px', fontWeight: 700, color: 'var(--gold-400)', lineHeight: 1 }}>Riwaaz</div>
          <div style={{ fontSize: '11px', color: 'var(--gold-300)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: '6px' }}>✿ &nbsp; BY ESHMIRA &nbsp; ✿</div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold-400), transparent)', margin: '16px 0' }}></div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{address}<br/>{phone1} &nbsp;|&nbsp; {phone2}</div>
        </div>

        {/* Meta */}
        <div style={{ padding: '16px 24px', background: 'var(--cream-100)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--cream-200)' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--gold-600)', fontSize: '14px' }}>{bill.billNumber}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{formatDate(bill.date)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: 'var(--dark-800)', fontSize: '15px' }}>{bill.customer.name || 'Walk-in Customer'}</div>
            {bill.customer.phone && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{bill.customer.phone}</div>}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>
            <span>Items Purchased</span>
            <span style={{ background: 'var(--gold-100)', color: 'var(--gold-600)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{bill.items.length} ITEM{bill.items.length !== 1 ? 'S' : ''}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {bill.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid var(--cream-200)', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--gold-500)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{it.category}</div>
                  <div style={{ fontSize: '15px', color: 'var(--dark-800)', fontWeight: 600 }}>{it.description || 'Item'}</div>
                  {it.details && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>{it.details}</div>}
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Qty: {it.qty}</div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dark-800)', paddingTop: '2px' }}>
                  {currency}{fmt(it.total)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ background: 'var(--cream-50)', borderRadius: '8px', padding: '16px', marginTop: '20px', border: '1px solid var(--cream-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>Subtotal</span>
              <span>{currency}{fmt(bill.subtotal)}</span>
            </div>
            {bill.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>Discount</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>- {currency}{fmt(bill.discount)}</span>
              </div>
            )}
            <div style={{ height: '1px', background: 'var(--gold-400)', margin: '12px 0 10px', opacity: 0.6 }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700, fontFamily: '"Cormorant Garamond", serif', color: 'var(--dark-800)' }}>
              <span>Total</span>
              <span>{currency}{fmt(bill.total)}</span>
            </div>
            {bill.payment.due > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>
                <span>Balance Due</span>
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{currency}{fmt(bill.payment.due)}</span>
              </div>
            )}
          </div>

          {/* Status */}
          {bill.payment.status === 'paid' ? (
            <div style={{ position: 'relative', marginTop: '24px', padding: '16px', border: '2px solid #D5F4E8', background: '#F0FBF7', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-10deg)', fontSize: '48px', fontWeight: 900, color: '#D5F4E8', opacity: 0.4, letterSpacing: '0.2em', whiteSpace: 'nowrap', pointerEvents: 'none', textTransform: 'uppercase' }}>PAID</div>
              <div style={{ position: 'relative', fontSize: '15px', fontWeight: 700, color: 'var(--success)', letterSpacing: '0.05em' }}>✅ FULLY PAID VIA {bill.payment.mode.toUpperCase()}</div>
            </div>
          ) : bill.payment.status === 'partial' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '12px 16px', background: '#FDE8D8', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--warning)' }}>
              🔶 Partial Payment • {bill.payment.mode}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '12px 16px', background: '#FEF3CD', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#856404' }}>
              ⏳ Payment Pending
            </div>
          )}

          {/* Notes & Policy */}
          {bill.notes && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--gold-100)', borderLeft: '3px solid var(--gold-400)', borderRadius: '0 8px 8px 0', fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic' }}>
              {bill.notes}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '24px', textAlign: 'center', background: 'linear-gradient(135deg, var(--dark-900), var(--dark-800))', color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '24px', color: 'var(--gold-300)', marginBottom: '6px' }}>Thank you for shopping! 🙏</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>Visit us again at Riwaaz by Eshmira</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>{phone1} &nbsp;|&nbsp; {phone2}</div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; size: auto; }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          /* Hide the Next.js global navbar and footer during print */
          header, footer, nav { display: none !important; }
          
          main { 
            background: white !important; 
            padding: 20px !important; 
            min-height: 0 !important;
            display: block !important;
          }
          
          /* Ensure the bill container spans correctly without box shadows */
          #bill-container {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
          
          .no-print { display: none !important; }
        }
      `}} />
      
      <button 
        className="no-print"
        onClick={() => window.print()}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: 'var(--gold-600)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '16px 24px',
          fontSize: '16px',
          fontWeight: 600,
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        📥 Download as PDF
      </button>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>}>
      <BillViewer />
    </Suspense>
  );
}
