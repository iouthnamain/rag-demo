import "@/styles/globals.css";

import { type Metadata } from "next";
import { Open_Sans } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "RAG Chatbot - Tư Vấn Nghề Nghiệp",
  description: "Hệ thống RAG chatbot tư vấn nghề nghiệp với NextJS + Pinecone + Gemini AI",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${openSans.variable}`}>
      <body className={`${openSans.className}`} suppressHydrationWarning={true}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
