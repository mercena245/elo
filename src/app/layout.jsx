'use client';
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../context/AuthContext'
import { LoadingProvider, useLoading } from '../context/LoadingContext'
import { useState, useEffect } from 'react'
import SplashScreen from '../components/SplashScreen'

const inter = Inter({ subsets: ['latin'] })

function AppWithLoading({ children }) {
  const [showSplash, setShowSplash] = useState(true);

  const handleLoadingComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onLoadingComplete={handleLoadingComplete} />}
      <AuthProvider>
        {children}
      </AuthProvider>
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>ELO - Sistema Educacional</title>
        <meta name="description" content="Sistema completo de gestão escolar" />
      </head>
      <body className={inter.className}>
        <LoadingProvider>
          <AppWithLoading>
            {children}
          </AppWithLoading>
        </LoadingProvider>
      </body>
    </html>
  )
}