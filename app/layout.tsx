import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexSans.variable}>
      <body className="bg-brand-neutral text-brand-black font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
