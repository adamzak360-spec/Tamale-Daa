import { PageHeader, SectionCard } from '../../components/ui'

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
    <div className="page-content">
      <PageHeader
        title="Advertise on Tamale Daa"
        subtitle="Manage where promotional banners appear, and share these placements with partners who want to advertise on the platform."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        {plans.map(p => (
          <SectionCard title="">
            <h4 style={{ marginBottom: 6, color: 'var(--color-navy)' }}>{p.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 10 }}>{p.desc}</p>
            <div style={{ fontWeight: 600, color: 'var(--color-teal)' }}>{p.price}</div>
          </SectionCard>
        ))}
      </div>

      <SectionCard>
        <h4 style={{ marginBottom: 8, color: 'var(--color-navy)' }}>How advertising works</h4>
        <ol style={{ fontSize: '0.9rem', color: 'var(--color-text)', paddingLeft: 20, lineHeight: 1.7 }}>
          <li>Partners contact you with their artwork (image) and the page it should link to.</li>
          <li>You agree a placement and duration, then receive payment (bank transfer or mobile money).</li>
          <li>Create the banner under Ads & Banners: upload the image, set the position and click-through link.</li>
          <li>Activate it when the paid period starts and deactivate when it ends.</li>
        </ol>
      </SectionCard>
    </div>
  )
}
