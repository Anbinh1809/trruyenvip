import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Loading() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      <div className="container detail-content-wrapper">
        <div className="breadcrumb-traditional skeleton" style={{ width: '200px', height: '20px', borderRadius: '4px' }}></div>
        
        <div className="detail-top-section">
          <div className="detail-left-cover">
            <div className="detail-cover-box skeleton" style={{ aspectRatio: '300/450', borderRadius: '16px' }}></div>
          </div>
          
          <div className="detail-right-info">
            <div className="traditional-title skeleton" style={{ width: '70%', height: '50px', marginBottom: '30px', borderRadius: '8px' }}></div>
            
            <div className="info-table-titan" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="info-row" style={{ marginBottom: '15px' }}>
                  <div className="skeleton" style={{ width: '100px', height: '18px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '150px', height: '18px', borderRadius: '4px' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="detail-description-traditional" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
           <div className="skeleton" style={{ width: '200px', height: '30px', marginBottom: '20px', borderRadius: '4px' }}></div>
           <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: '8px' }}></div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
