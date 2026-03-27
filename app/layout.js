'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import './globals.css';

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>GEPL - Material Tracking System</title>
        <meta
          name="description"
          content="GEPL - Loading and Dispatched V1 - Internal material tracking and reconciliation app for manufacturing units"
        />
      </head>
      <body className="bg-secondary-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="lg:ml-64 pt-16 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
