import "./globals.css";
export const metadata = { title: "Romeo Hub", description: "Find Shopify stores, collect contact emails, run outreach.", ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}) };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
