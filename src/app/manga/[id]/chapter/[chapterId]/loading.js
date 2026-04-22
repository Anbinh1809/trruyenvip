import Header from '@/components/layout/Header';

export default function Loading() {
  return (
    <main className="main-wrapper titan-bg reader-industrial-layout">
      <Header />
      <div className="reader-hud-titan" style={{ opacity: 1, transform: 'translateY(0)' }}>
         <div className="container reader-nav-wrapper">
            <div className="skeleton" style={{ width: '150px', height: '30px', borderRadius: '8px' }}></div>
            <div className="skeleton" style={{ width: '120px', height: '35px', borderRadius: '20px' }}></div>
            <div className="skeleton" style={{ width: '100px', height: '30px', borderRadius: '8px' }}></div>
         </div>
      </div>

      <div className="reader-content-industrial" style={{ padding: '40px 0' }}>
         <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {[1, 2, 3].map(i => (
               <div key={i} className="skeleton" style={{ width: '100%', maxWidth: '800px', aspectRatio: '4/6', borderRadius: '4px' }}></div>
            ))}
         </div>
      </div>
    </main>
  );
}
