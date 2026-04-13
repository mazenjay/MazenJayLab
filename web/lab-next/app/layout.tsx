import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-lab-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-lab-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MazenJay Lab",
  description:
    "Exploring new ideas, designing intelligent interfaces, and documenting the experiments along the way.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("font-sans", geist.variable)}>
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
        {/* 刷新后先对齐到顶部，再交 hydration，避免 Lenis / ScrollTrigger 首帧错位 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var nav=performance.getEntriesByType('navigation')[0];var isReload=nav&&nav.type==='reload';if(!isReload&&typeof performance!=='undefined'&&performance.navigation)isReload=performance.navigation.type===1;if(!isReload)return;history.scrollRestoration='manual';window.scrollTo(0,0);document.documentElement.scrollTop=0;if(document.body)document.body.scrollTop=0}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans bg-lab-bg text-lab-text min-h-screen overflow-x-clip selection:bg-lab-accent selection:text-white pb-32 antialiased`}
      >
        {/* <SiteNavbar /> */}
        {children}
      </body>
    </html>
  );
}
