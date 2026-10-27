import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NTNU Digi-FrailCare | Machine Learning & Decision Support',
  description: 'Postdoctoral Research Interface for Frailty Prediction using HUNT Study Cohorts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}