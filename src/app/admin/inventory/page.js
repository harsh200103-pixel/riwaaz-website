'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InventoryAdmin() {
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'manage'
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Add Product State
  const [formData, setFormData] = useState({
    name: '', category: 'unstitched', price: '', fabric: '', description: '', size: '', token: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);

  // Manage Products State
  const [liveData, setLiveData] = useState(null);
  const [dataSha, setDataSha] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);

  const categories = [
    { id: 'unstitched', label: 'Unstitched Suits' },
    { id: 'stitched', label: 'Stitched Suits' },
    { id: 'kurtis', label: 'Kurtis' },
    { id: 'rumalla', label: 'Rumalla Saheb' },
    { id: 'custom', label: 'Customised' }
  ];

  const sizes = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unstitched (Fabric)'];

  const owner = 'harsh200103-pixel';
  const repo = 'riwaaz-website';
  const dataPath = 'src/app/data.json';

  // Fetch Live Data directly from GitHub when entering "manage" tab
  useEffect(() => {
    if (activeTab === 'manage') {
      fetchLiveDatabase();
    }
  }, [activeTab]);

  const fetchLiveDatabase = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dataPath}`);
      if (!res.ok) throw new Error("Failed to load live database from GitHub");
      const json = await res.json();
      
      const content = JSON.parse(decodeURIComponent(escape(atob(json.content))));
      setLiveData(content);
      setDataSha(json.sha);
    } catch (e) {
      console.error(e);
      setError("Could not load products. Please check internet connection.");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files) setImageFiles(Array.from(e.target.files));
  };
  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) setVideoFile(e.target.files[0]);
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });
  };

  // Helper to push updated DB to GitHub
  const pushDatabase = async (currentDB, sha, commitMsg) => {
    const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentDB, null, 2))));
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dataPath}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${formData.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: commitMsg, content: encodedContent, sha })
    });
    if (!res.ok) throw new Error('Failed to update database.');
    return res;
  };

  // Helper to fetch fresh DB from GitHub
  const fetchFreshDB = async () => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dataPath}`, {
      headers: { 'Authorization': `token ${formData.token}` }
    });
    if (!res.ok) throw new Error('Failed to read database. Check your token.');
    const json = await res.json();
    const db = JSON.parse(decodeURIComponent(escape(atob(json.content))));
    return { db, sha: json.sha };
  };

  const uploadProduct = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');

    if (imageFiles.length === 0) {
      setError('Please select at least one image.');
      setLoading(false); return;
    }

    try {
      const newId = 's_' + Date.now();
      const imagePaths = [];
      let videoPath = null;
      
      // 1. Upload Images
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split('.').pop();
        const path = `public/suits/${newId}_img${i}.${ext}`;
        const b64 = await readFileAsBase64(file);
        
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
          method: 'PUT',
          headers: { 'Authorization': `token ${formData.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Upload image ${i+1} for ${formData.name}`, content: b64 })
        });
        if (!res.ok) throw new Error('Failed to upload image. Please check your token.');
        
        imagePaths.push(`/suits/${newId}_img${i}.${ext}`);
      }
      
      // 2. Upload Video
      if (videoFile) {
        const ext = videoFile.name.split('.').pop();
        const path = `public/suits/${newId}_vid.${ext}`;
        const b64 = await readFileAsBase64(videoFile);
        
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
          method: 'PUT',
          headers: { 'Authorization': `token ${formData.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Upload video for ${formData.name}`, content: b64 })
        });
        if (!res.ok) throw new Error('Failed to upload video.');
        videoPath = `/suits/${newId}_vid.${ext}`;
      }

      // 3. Get current data.json
      const { db: currentDB, sha } = await fetchFreshDB();

      // 4. Modify Database
      const newSuit = {
        id: newId,
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        fabric: formData.fabric,
        size: formData.size,
        description: formData.description,
        soldOut: false,
        images: imagePaths
      };
      if (videoPath) newSuit.video = videoPath;

      currentDB.SUITS.unshift(newSuit);

      // 5. Update data.json on GitHub
      await pushDatabase(currentDB, sha, `Add product ${formData.name}`);

      setSuccess('Product successfully uploaded! Vercel is rebuilding your website. It will appear live in about 60 seconds.');
      setFormData({ ...formData, name: '', price: '', fabric: '', description: '', size: '' });
      setImageFiles([]);
      setVideoFile(null);
      e.target.reset();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during upload.');
      setLoading(false);
    }
  };

  const deleteProduct = async (suitId, suitName) => {
    if (!formData.token) {
      setError("Please enter your Secret Admin Token first.");
      return;
    }
    if (!confirm(`Are you sure you want to completely remove "${suitName}" from the website?`)) return;

    setLoading(true); setError(''); setSuccess('');
    
    try {
      const { db: currentDB, sha } = await fetchFreshDB();
      currentDB.SUITS = currentDB.SUITS.filter(s => s.id !== suitId);
      await pushDatabase(currentDB, sha, `Delete product ${suitName}`);

      setSuccess(`"${suitName}" successfully removed! Vercel is updating the live website.`);
      setLiveData(currentDB);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleSoldOut = async (suitId, suitName, currentStatus) => {
    if (!formData.token) {
      setError("Please enter your Secret Admin Token first.");
      return;
    }

    setLoading(true); setError(''); setSuccess('');
    
    try {
      const { db: currentDB, sha } = await fetchFreshDB();
      const suit = currentDB.SUITS.find(s => s.id === suitId);
      if (!suit) throw new Error('Product not found in database.');
      
      suit.soldOut = !currentStatus;
      await pushDatabase(currentDB, sha, `${suit.soldOut ? 'Mark' : 'Unmark'} ${suitName} as sold out`);

      setSuccess(`"${suitName}" marked as ${suit.soldOut ? 'SOLD OUT' : 'AVAILABLE'}! Website updating in ~60 seconds.`);
      setLiveData(currentDB);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '60px 20px', background: 'var(--cream-50)', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: '800px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '36px', color: 'var(--dark-900)' }}>Control Dashboard</h1>
          <Link href="/admin/index.html" style={{ fontSize: '14px', color: 'var(--gold-600)', textDecoration: 'none', fontWeight: 600 }}>← Back to Billing</Link>
        </div>

        {/* Global Token Field */}
        <div style={{ marginBottom: '30px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secret Admin Token (Required)</label>
          <input required type="password" value={formData.token} onChange={e => setFormData({...formData, token: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px' }} placeholder="ghp_..." />
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--cream-200)', marginBottom: '30px' }}>
          <button onClick={() => setActiveTab('add')} style={{ flex: 1, padding: '16px', fontSize: '15px', fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab === 'add' ? '3px solid var(--gold-600)' : '3px solid transparent', color: activeTab === 'add' ? 'var(--dark-900)' : 'var(--text-muted)', cursor: 'pointer' }}>
            ➕ Add Product
          </button>
          <button onClick={() => setActiveTab('manage')} style={{ flex: 1, padding: '16px', fontSize: '15px', fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab === 'manage' ? '3px solid var(--gold-600)' : '3px solid transparent', color: activeTab === 'manage' ? 'var(--dark-900)' : 'var(--text-muted)', cursor: 'pointer' }}>
            🗂️ Manage Products
          </button>
        </div>

        {error && <div style={{ padding: '16px', background: '#FEF2F2', color: '#991B1B', borderRadius: '8px', marginBottom: '24px', fontWeight: 500 }}>{error}</div>}
        {success && <div style={{ padding: '16px', background: '#F0FDF4', color: '#166534', borderRadius: '8px', marginBottom: '24px', fontWeight: 500 }}>{success}</div>}

        {/* TAB 1: ADD PRODUCT */}
        {activeTab === 'add' && (
          <form onSubmit={uploadProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Suit Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--cream-200)' }} placeholder="e.g. Midnight Blue Velvet Suit" />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Price (₹)</label>
                <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--cream-200)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--cream-200)', background: 'white' }}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Fabric</label>
                <input required type="text" value={formData.fabric} onChange={e => setFormData({...formData, fabric: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--cream-200)' }} placeholder="e.g. Pure Silk" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Size</label>
                <select required value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--cream-200)', background: 'white' }}>
                  <option value="">Select Size</option>
                  {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Description</label>
              <textarea required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--cream-200)', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1, padding: '20px', border: '2px dashed var(--cream-200)', borderRadius: '12px', textAlign: 'center', background: 'var(--cream-50)' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Upload Photos</label>
                <input required type="file" accept="image/*" multiple onChange={handleImageChange} style={{ maxWidth: '100%' }} />
              </div>

              <div style={{ flex: 1, padding: '20px', border: '2px dashed var(--cream-200)', borderRadius: '12px', textAlign: 'center', background: 'var(--cream-50)' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Upload Video (Optional)</label>
                <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoChange} style={{ maxWidth: '100%' }} />
              </div>
            </div>

            <button disabled={loading} type="submit" style={{ width: '100%', padding: '16px', background: 'var(--gold-600)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '10px' }}>
              {loading ? '⏳ Uploading & Rebuilding...' : '🚀 Publish Product'}
            </button>
          </form>
        )}

        {/* TAB 2: MANAGE PRODUCTS */}
        {activeTab === 'manage' && (
          <div>
            {fetchLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live database...</div>
            ) : liveData && liveData.SUITS ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {liveData.SUITS.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No products listed.</div>}
                {liveData.SUITS.map(suit => (
                  <div key={suit.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', border: '1px solid var(--cream-200)', borderRadius: '12px', gap: '16px', opacity: suit.soldOut ? 0.6 : 1 }}>
                    
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--cream-100)', position: 'relative' }}>
                      {suit.images && suit.images.length > 0 ? (
                        <img src={suit.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : suit.image ? (
                        <img src={suit.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : null}
                      {suit.soldOut && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>SOLD</span>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--dark-800)', fontSize: '15px' }}>
                        {suit.name}
                        {suit.soldOut && <span style={{ marginLeft: '8px', fontSize: '11px', background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>SOLD OUT</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ₹{suit.price.toLocaleString('en-IN')} • {suit.category}{suit.size ? ` • ${suit.size}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button 
                        onClick={() => toggleSoldOut(suit.id, suit.name, suit.soldOut)}
                        disabled={loading}
                        style={{ padding: '8px 14px', background: suit.soldOut ? '#DBEAFE' : '#FEF3C7', color: suit.soldOut ? '#1D4ED8' : '#92400E', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontSize: '13px' }}
                      >
                        {suit.soldOut ? '✅ Restock' : '🚫 Sold Out'}
                      </button>
                      <button 
                        onClick={() => deleteProduct(suit.id, suit.name)}
                        disabled={loading}
                        style={{ padding: '8px 14px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontSize: '13px' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Could not load products.</div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
