import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Winner Sport - Sistem Operasional Konveksi",
  description: "Enterprise Operations Management System (Inventory, Produksi, Penjualan & Accounting)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-red-600 selection:text-white bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
