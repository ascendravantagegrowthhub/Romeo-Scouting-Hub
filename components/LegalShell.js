export default function LegalShell({ title, updated, children }) {
  return (
    <>
      <header className="top">
        <a className="brand" href="/"><img src="/logo.png" alt="" width="34" height="34" /><span>Romeo Hub</span></a>
        <div className="who"><a className="b g" href="/login">Sign in</a></div>
      </header>
      <div className="wrap legal">
        <h1>{title}</h1>
        <p className="sub">Last updated: {updated}</p>
        <div className="card">{children}</div>
        <p className="sub"><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="mailto:Ascendravantage@gmail.com">Contact</a></p>
      </div>
    </>
  );
}
