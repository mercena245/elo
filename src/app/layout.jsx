'use client';
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { LoadingProvider, useLoading } from '../context/LoadingContext'
import { useState, useEffect } from 'react'
import SplashScreen from '../components/SplashScreen'
import AccessTypeSelector from '../components/AccessTypeSelector'

const inter = Inter({ subsets: ['latin'] })

function AppContent({ children }) {
  const { user, loading, showAccessSelector, handleSchoolSelect, handleManagementSelect } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user && showAccessSelector) {
    return (
      <AccessTypeSelector
        user={user}
        onSchoolSelect={handleSchoolSelect}
        onManagementSelect={handleManagementSelect}
      />
    );
  }

  return children;
}

function AppWithLoading({ children }) {
  const [showSplash, setShowSplash] = useState(true);

  const handleLoadingComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onLoadingComplete={handleLoadingComplete} />}
      <AuthProvider>
        <AppContent>
          {children}
        </AppContent>
      </AuthProvider>
    </>
  );
}

function BodyWrapper({ children, className }) {
  return (
    <body className={className} suppressHydrationWarning={true}>
      {children}
    </body>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>ELO - Sistema Educacional</title>
        <meta name="description" content="Sistema completo de gestão escolar conectando escola e família" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="32x32" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#667eea" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <BodyWrapper className={inter.className}>
        <LoadingProvider>
          <AppWithLoading>
            {children}
          </AppWithLoading>
        </LoadingProvider>
      </BodyWrapper>
    </html>
  )
}