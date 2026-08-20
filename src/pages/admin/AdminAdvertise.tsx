export default function AdminAdvertise() {
  const plans = [
    {
      title: 'Homepage Banner',
      position: 'homepage',
      desc: 'Rotates in the hero and featured area of the homepage — the most visited screen on the site.',
      price: 'From GH₵150 / week',
    },
    {
      title: 'Sidebar Banner',
      position: 'sidebar',
      desc: 'Stays visible as customers browse product lists and categories.',
      price: 'From GH₵80 / week',
    },
    {
      title: 'Product Page Banner',
      position: 'product',
      desc: 'Shown while customers read product details — high attention, near purchase decisions.',
      price: 'From GH₵60 / week',
    },
  ]

  return (
    <div className="advertise-content">
      <div className="view-header-row">
        <div>
          <h3 className="section-title">Advertise on Tamale Daa</h3>
          <p className="section-subtitle">Manage where promotional banners appear, and share these placements with partners who want to advertise on the platform.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        {plans.map(p => (
          <div key={p.position} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <h4 style={{ marginBottom: 6 }}>{p.title}</h4>
            <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: 10 }}>{p.desc}</p>
            <div style={{ fontWeight: 600, color: '#1e3a8a' }}>{p.price}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#f8fafc' }}>
        <h4 style={{ marginBottom: 8 }}>How advertising works</h4>
        <ol style={{ fontSize: '0.9rem', color: '#374151', paddingLeft: 20, lineHeight: 1.7 }}>
          <li>Partners contact you with their artwork (image) and the page it should link to.</li>
          <li>You agree a placement and duration, then receive payment (bank transfer or mobile money).</li>
          <li>Create the banner under Ads & Banners: upload the image, set the position and click-through link.</li>
          <li>Activate it when the paid period starts and deactivate when it ends.</li>
        </ol>
      </div>
    </div>
  )
}
