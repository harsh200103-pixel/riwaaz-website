'use client';
import { useState } from 'react';
import styles from '../catalog.module.css';

export default function GalleryViewer({ suit }) {
  // Legacy support for single image vs new multi-image support
  const images = suit.images && suit.images.length > 0 ? suit.images : [suit.image];
  const hasVideo = !!suit.video;
  
  // State to track the currently active media index. 
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const totalMedia = hasVideo ? images.length + 1 : images.length;
  
  const renderMainViewer = () => {
    if (hasVideo && activeIndex === 0) {
      return (
        <video 
          src={suit.video} 
          controls 
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} 
        />
      );
    }
    
    // Calculate the actual image array index
    const imgIndex = hasVideo ? activeIndex - 1 : activeIndex;
    return (
      <img 
        src={images[imgIndex]} 
        alt={suit.name} 
        onClick={() => {
          setZoomed(false);
          setLightboxOpen(true);
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
      />
    );
  };

  const imgIndex = hasVideo ? activeIndex - 1 : activeIndex;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Main Viewer */}
      <div className={styles.detailsImageWrapper} style={{ height: '500px', backgroundColor: 'var(--cream-100)', position: 'relative', overflow: 'hidden' }}>
        {renderMainViewer()}
      </div>
      
      {/* Thumbnails Gallery */}
      {totalMedia > 1 && (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          
          {hasVideo && (
            <div 
              onClick={() => setActiveIndex(0)}
              style={{ 
                width: '80px', height: '80px', flexShrink: 0, 
                border: activeIndex === 0 ? '2px solid var(--gold-600)' : '2px solid transparent',
                cursor: 'pointer', borderRadius: '8px', overflow: 'hidden',
                background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center'
              }}
            >
              <div style={{ width: '0', height: '0', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '16px solid white', marginLeft: '4px' }}></div>
            </div>
          )}
          
          {images.map((img, idx) => {
            const mappedIndex = hasVideo ? idx + 1 : idx;
            return (
              <div 
                key={idx}
                onClick={() => setActiveIndex(mappedIndex)}
                style={{ 
                  width: '80px', height: '80px', flexShrink: 0, 
                  border: activeIndex === mappedIndex ? '2px solid var(--gold-600)' : '2px solid transparent',
                  cursor: 'pointer', borderRadius: '8px', overflow: 'hidden',
                  opacity: activeIndex === mappedIndex ? 1 : 0.7,
                  transition: '0.2s ease'
                }}
              >
                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Zoomable Lightbox */}
      {lightboxOpen && !hasVideo && (
        <div 
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'zoom-out', overflow: 'hidden'
          }}
        >
          {/* Close button */}
          <button 
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: '24px', right: '24px',
              background: 'rgba(255, 255, 255, 0.25)', border: 'none',
              borderRadius: '50%', width: '44px', height: '44px',
              color: '#fff', fontSize: '22px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10000, transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.4)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.25)'}
          >
            ✕
          </button>
          
          <img 
            src={images[imgIndex]} 
            alt={suit.name} 
            onClick={(e) => {
              e.stopPropagation();
              setZoomed(!zoomed);
            }}
            style={{
              maxWidth: '95vw', maxHeight: '90vh',
              transform: zoomed ? 'scale(1.8)' : 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              cursor: zoomed ? 'zoom-out' : 'zoom-in',
              objectFit: 'contain', 
              borderRadius: '4px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
}
