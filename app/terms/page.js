import LegalShell from "@/components/LegalShell";

export const metadata = { title: "Terms of Service | Romeo Hub" };

export default function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="November 14, 2026">
      <p>These terms govern your use of Romeo Hub, operated by Ascendra Vantage (“we”, “us”). By signing in you agree to them. If you do not agree, do not use the service.</p>

      <h2>Access</h2>
      <p>Romeo Hub is invitation-based. New accounts must be approved by us before they can use the tool, and we may approve, deny, suspend or remove any account at any time.</p>

      <h2>What the service does</h2>
      <p>Romeo Hub helps you find Shopify stores, collect publicly listed business contact emails, draft outreach messages with AI assistance, and send them from your own Gmail account after you approve each message.</p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>You are responsible for every email sent from your account, including its content, and for reviewing each AI-written draft before approving it.</li>
        <li>You must follow all laws that apply to commercial email, including CAN-SPAM, GDPR, PECR and local equivalents. This includes honest subject lines, a clear way to opt out, a valid sender identity and postal address where required, and promptly honoring opt-out requests.</li>
        <li>You must not send spam, deceptive, abusive, unlawful or harassing messages, impersonate others, or make false claims about a recipient’s business.</li>
        <li>You must not use the service to attack, overload or scrape websites in a way that violates their rules or the law, or to collect personal data of individuals rather than business contacts.</li>
        <li>You must respect Google’s and Gmail’s terms and policies, and keep sending volumes reasonable. Romeo Hub enforces a daily limit to help protect your account.</li>
      </ul>

      <h2>Gmail connection</h2>
      <p>Connecting Gmail is optional. It lets Romeo Hub send messages you approve. You can disconnect at any time in the Outreach tab or from your Google account permissions page.</p>

      <h2>Third-party services</h2>
      <p>The service relies on providers such as Google, Vercel, Supabase, Resend, Anthropic and search APIs. We are not responsible for their outages, changes or policies.</p>

      <h2>No guarantees</h2>
      <p>Scan results, email addresses and AI drafts may be incomplete, outdated or inaccurate. The service is provided “as is” without warranties of any kind, and we do not guarantee delivery, replies or results.</p>

      <h2>Limitation of liability</h2>
      <p>To the maximum extent permitted by law, we are not liable for indirect, incidental or consequential damages, lost profits, or account restrictions imposed by Google or others, arising from your use of the service.</p>

      <h2>Suspension and termination</h2>
      <p>We may suspend or end your access if you break these terms or misuse the service. You may stop using it at any time and may request deletion of your data as described in the Privacy Policy.</p>

      <h2>Changes</h2>
      <p>We may update these terms and will change the date above when we do. Continued use after a change means you accept it.</p>

      <h2>Contact</h2>
      <p>Questions: <a href="mailto:Ascendravantage@gmail.com">Ascendravantage@gmail.com</a>.</p>
    </LegalShell>
  );
}
