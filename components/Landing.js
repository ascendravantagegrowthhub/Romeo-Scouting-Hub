export default function Landing() {
  return (
    <>
      <header className="top">
        <a className="brand" href="/"><img src="/logo.png" alt="" width="34" height="34" /><span>Romeo Hub</span></a>
        <div className="who"><a className="b g" href="/privacy">Privacy</a><a className="b" style={{ background: "var(--gold)", color: "var(--ink)" }} href="/login">Sign in</a></div>
      </header>
      <main className="wrap land">
        <section className="lhero">
          <img className="me big" src="/romeo.jpg" alt="Romeo" width="112" height="112" />
          <h1>Romeo Hub</h1>
          <p className="lead">A prospecting and outreach tool for freelancers and agencies that work with Shopify stores. Find stores, collect their public business contact emails, and send personalized messages from your own Gmail account, one approved email at a time.</p>
          <a className="b" href="/login">Sign in with Google</a>
          <p className="sub" style={{ marginTop: 8 }}>Access is by invitation. New accounts are reviewed and approved before they can use the tool.</p>
        </section>

        <section className="grid3">
          <div className="card"><h2>Find stores</h2><p>Search for existing or newly launched Shopify stores by niche and country, or import your own list of store links. Each site is checked to confirm it runs on Shopify.</p></div>
          <div className="card"><h2>Personalized drafts</h2><p>For each store with a public contact email, Romeo Hub reads the store’s public details, such as its products and headline text, and uses AI to draft a short message built around something specific to that store.</p></div>
          <div className="card"><h2>Send with approval</h2><p>You review and edit every draft. Only the messages you approve are sent, from your own Gmail account, with daily limits, no duplicates, and an opt-out line in every email.</p></div>
        </section>

        <section className="card">
          <h2>How Romeo Hub uses your Google account</h2>
          <ul>
            <li><b>Sign in:</b> we receive your name, email address and profile picture from Google to identify you and check that you have been approved.</li>
            <li><b>Send email (optional):</b> if you choose “Connect Gmail”, Romeo Hub asks for permission to <b>send</b> email on your behalf. It is used only to send messages you have reviewed and approved.</li>
            <li><b>What we never do:</b> Romeo Hub cannot read, search or delete your emails, and we do not sell your data or use it for advertising.</li>
          </ul>
          <p>You can disconnect Gmail at any time inside the app or at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>. Read the full <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a>.</p>
        </section>

        <footer className="lfoot">
          <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="mailto:Ascendravantage@gmail.com">Contact</a>
          <div>Romeo Hub is operated by Ascendra Vantage.</div>
        </footer>
      </main>
    </>
  );
}
