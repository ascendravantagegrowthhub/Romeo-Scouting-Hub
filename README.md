# Romeo Hub

Find Shopify stores, collect contact emails and run outreach, behind an approval-gated Google login.

- **Find stores:** searches Google (Serper) or Brave for existing or new Shopify stores, verifies each one, then scans for emails.
- **Import links:** paste or upload your own list.
- **Personalized drafts:** for every store with an email, the app reads its products, headings and description, then Claude writes a short email built around something true and specific about that store. You edit, approve, and it sends from your own Gmail.
- **Login:** Google only. New people see a "waiting for approval" page until you approve them. You get an email at Ascendravantage@gmail.com with Approve / Deny buttons, and `/admin` lists everyone.
- **Owners:** `ascendravantage@gmail.com` and `oziomapeter09@gmail.com` always get in with no approval.

## Setup (about 15 minutes)

### 1. Supabase (database)
Create a free project at supabase.com, open **SQL Editor**, paste `supabase.sql`, run it. Copy the project URL and the **service_role** key (Settings, API).

### 2. Google sign-in
Google Cloud Console, **APIs & Services, Credentials, Create OAuth client ID** (Web application). Add this redirect URI:
`https://YOUR-PROJECT.vercel.app/api/auth/callback/google`
(and `http://localhost:3000/api/auth/callback/google` for local testing). Copy the client ID and secret. If asked, configure the consent screen as External and publish it so anyone with a Gmail can sign in.

### 3. Resend (approval emails)
Create a free account at resend.com **using Ascendravantage@gmail.com**, then create an API key. The free test sender (`onboarding@resend.dev`) can only deliver to the account owner's own address, which is exactly what you need here.

### 4. Gmail sending
In the same Google Cloud project: **Library, enable "Gmail API"**. Add a second redirect URI to your OAuth client: `https://YOUR-PROJECT.vercel.app/api/auth/callback/google` stays, and add `https://YOUR-PROJECT.vercel.app/api/gmail/callback`. On the consent screen add the scope `.../auth/gmail.send`. While the app is in **Testing** mode, add every Gmail you will send from as a test user, and note Google expires those connections after 7 days. Click **Publish app** to make them last (Google shows an "unverified app" warning, which is fine for your own use).

### 5. AI drafts
Get an API key at console.anthropic.com and set `ANTHROPIC_API_KEY`. Each draft costs a fraction of a cent.

### 6. Push to GitHub
```bash
git init && git add . && git commit -m "Romeo Hub"
git branch -M main
git remote add origin https://github.com/YOUR-USER/romeo-hub.git
git push -u origin main
```

### 7. Deploy on Vercel
Import the repo at vercel.com/new and add every variable from `.env.example`. Set `NEXTAUTH_URL` to your final `https://....vercel.app` address, deploy, then make sure the same address is in the Google redirect URI.

## Sending safety
- Each person sends from their own connected Gmail, never a shared one. Tokens are stored encrypted.
- Capped at 40 emails per 24h by default and spaced 45 to 90 seconds apart. Start low with a new Gmail and raise it slowly.
- The same address is never emailed twice, and every send is logged.
- Emails include your signature and an opt-out line. Add a real postal address to the signature (CAN-SPAM requires one).

## Notes
- Approval is per person: once approved they stay in until you revoke them on `/admin`.
- Leads, templates and the do-not-contact list live in each person's own browser. There is no shared lead database.
- Email buttons open a confirmation page first, so link scanners cannot approve anyone by accident.
- Follow CAN-SPAM/GDPR in your outreach: honest subjects, a clear opt-out, and honor opt-outs.
