export default function DashboardPage() {
  return (
    <section className="page-shell">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Cafe Operations</p>
          <h1>Daily overview</h1>
          <p className="page-copy">Live session status, top menu items, kitchen updates and recent orders are all visible here.</p>
        </div>
      </div>
      <div className="grid grid-3">
        <article className="metric-card card-glow">
          <h2>Total Orders</h2>
          <strong>78</strong>
          <p>Current session order volume</p>
        </article>
        <article className="metric-card card-glow">
          <h2>Revenue</h2>
          <strong>$6,420</strong>
          <p>Collected today so far</p>
        </article>
        <article className="metric-card card-glow">
          <h2>Kitchen pace</h2>
          <strong>3 mins</strong>
          <p>Average ticket preparation time</p>
        </article>
      </div>
    </section>
  );
}
