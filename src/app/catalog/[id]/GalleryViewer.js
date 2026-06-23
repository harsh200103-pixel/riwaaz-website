'use client';
import { useState } from 'react';
import styles from '../catalog.module.css';

export default function GalleryViewer({ suit }) {
  // Legacy support for single image vs new multi-image support
  const images = suit.images && suit.images.length > 0 ? suit.images : [suit.image];
  const hasVideo = !!suit.video;
  
  // State to track the currently active media index. 
  // If hasVideo is true, index 0 is video, index 1+ are images.
  // If hasVideo is false, index 0+ are images.
  const [activeIndex, setActiveIndex] = useState(0);

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
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Main Viewer */}
      <div className={styles.detailsImageWrapper} style={{ height: '500px', backgroundColor: 'var(--cream-100)', position: 'relative' }}>
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
    </div>
  );
}
