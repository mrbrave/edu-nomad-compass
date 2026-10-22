import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
export const metadata:Metadata={title:"Course Compass · EduNomad",description:"Evidence-led unit research for Australian RTO course designers.",robots:{index:false,follow:false}};
export default function RootLayout({children}:{readonly children:ReactNode}){
  return <html lang="en-AU"><body>{children}<Analytics /></body></html>;
}
