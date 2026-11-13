import "./globals.css";
export const metadata = { title: "Romeo Hub", description: "Find Shopify stores, collect contact emails, run outreach." };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
