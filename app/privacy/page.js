import LegalShell from "@/components/LegalShell";

export const metadata = { title: "Privacy Policy | Romeo Hub" };

export default function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="November 14, 2026">
      <p>Romeo Hub (“we”, “us”) is a private prospecting tool operated by Ascendra Vantage. It helps approved users find Shopify stores, collect publicly listed business contact emails, and send outreach emails from their own Gmail account. This policy explains what we collect and how we use it. You can reach us at <a href="mailto:Ascendravantage@gmail.com">Ascendravantage@gmail.com</a>.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><b>Google account details.</b> When you sign in with Google we receive your name, email address and profile picture. We use them to identify you and to decide whether you have been approved.</li>
        <li><b>Access status.</b> We store whether your account is pending, approved or denied, and when you last signed in.</li>
        <li><b>Gmail connection (optional).</b> If you choose “Connect Gmail”, Google gives us permission to send email on your behalf. We store an encrypted access token and the connected Gmail address.</li>
        <li><b>Send log.</b> For each email you send through Romeo Hub we record the recipient address, subject, store domain and time. We use this to enforce daily limits and to avoid emailing the same person twice.</li>
        <li><b>Your leads and settings.</b> Store lists, scan results, drafts, templates and your do-not-contact list are saved in your own browser and are not stored on our servers.</li>
      </ul>

      <h2>Google user data</h2>
      <p>Romeo Hub requests only the Gmail permission to <b>send</b> email (gmail.send) plus your basic profile. We cannot read, search, list or delete anything in your mailbox. We send an email only when you approve and trigger it. We use Google user data only to provide these features. We do not sell it, share it for advertising, or use it to train AI models, and no person at Romeo Hub reads your messages except as you send them to us for support.</p>
      <p>Romeo Hub’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>

      <h2>What Google data we access, and why</h2>
      <ul>
        <li><b>Basic profile (name, email address, profile picture):</b> used to sign you in, show your name in the app and match your account to your approval status.</li>
        <li><b>Gmail “send” permission (https://www.googleapis.com/auth/gmail.send), only if you connect Gmail:</b> used solely to send the outreach emails you have written or approved, from your own address. This permission does not let us view your inbox or any existing message.</li>
      </ul>
      <p>We store this data only to run the service, we do not transfer it to third parties except the service providers listed below that are needed to operate the app, and we do not use it for advertising or to build profiles of you.</p>

      <h2>Business contact information we collect from the web</h2>
      <p>To help you find prospects, the app reads publicly available pages of online stores (such as contact and about pages) and collects business contact emails and descriptive details such as product names. This information is processed in your session and kept in your browser. If you are the owner of a store and want your details excluded, email us and we will help you opt out.</p>

      <h2>Service providers</h2>
      <p>We use trusted providers to run the service, and they only receive what they need:</p>
      <ul>
        <li>Vercel, which hosts the website.</li>
        <li>Supabase, which stores account status, encrypted Gmail tokens and the send log.</li>
        <li>Google, for sign-in and sending email through Gmail.</li>
        <li>Resend, which delivers approval notification emails to the site owner.</li>
        <li>Anthropic, which receives a store’s public details and your offer text to write a draft email.</li>
        <li>Serper or Brave Search, which receive the search terms you enter when finding stores.</li>
      </ul>

      <h2>How long we keep data</h2>
      <p>Account and send-log records are kept while your account is active. You can disconnect Gmail at any time in the Outreach tab, which deletes the stored token. To delete your account and records, email us and we will remove them. You can also revoke access at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.</p>

      <h2>Your choices</h2>
      <p>You can disconnect Gmail in the Outreach tab at any time, revoke Romeo Hub’s access from your Google account, clear the data saved in your browser, and ask us to delete your account and records by emailing <a href="mailto:Ascendravantage@gmail.com">Ascendravantage@gmail.com</a>. We respond to deletion requests within 30 days.</p>

      <h2>Security</h2>
      <p>Gmail tokens are encrypted before storage, access to the database is restricted to our server, and connections use HTTPS. No system is perfectly secure, but we take reasonable steps to protect your information.</p>

      <h2>Children</h2>
      <p>Romeo Hub is for business use and is not directed at anyone under 18.</p>

      <h2>Changes</h2>
      <p>We may update this policy and will change the date above when we do.</p>

      <h2>Contact</h2>
      <p>Questions or deletion requests: <a href="mailto:Ascendravantage@gmail.com">Ascendravantage@gmail.com</a>.</p>
    </LegalShell>
  );
}
