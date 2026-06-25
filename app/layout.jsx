import "./globals.css";
export const metadata = { title: "DMTV Culture Engine", description: "Culture radar for nightlife, music, streetwear & the creative scene." };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
