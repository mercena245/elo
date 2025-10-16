'use client';
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { LoadingProvider, useLoading } from '../context/LoadingContext'
import { useState, useEffect } from 'react'
import SplashScreen from '../components/SplashScreen'
import AccessTypeSelector from '../components/AccessTypeSelector'
// ⚠️ 2FA TEMPORARIAMENTE DESABILITADO
// import TwoFactorSetup from '../components/TwoFactorSetup'
// import TwoFactorVerification from '../components/TwoFactorVerification'

const inter = Inter({ subsets: ['latin'] })

function AppContent({ children }) {
  const [mounted, setMounted] = useState(false);
  
  const { 
    user, 
    loading, 
    showAccessSelector, 
    // ⚠️ 2FA TEMPORARIAMENTE DESABILITADO
    // showTwoFactorSetup,
    // showTwoFactorVerification,
    // twoFactorRequired,
    // twoFactorAuthenticated,
    handleSchoolSelect, 
    handleManagementSelect,
    // handleTwoFactorSetupComplete,
    // handleTwoFactorVerificationSuccess,
    // handleTwoFactorCancel
  } = useAuth();

  // Evitar erro de hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante hidratação inicial, sempre renderiza children
  if (!mounted) {
    return children;
  }

  // Verificar se está em uma rota pública (login, register, etc)
  const isPublicRoute = typeof window !== 'undefined' && 
    (window.location.pathname === '/login' || 
     window.location.pathname === '/register' ||
     window.location.pathname === '/school-selection' ||
     window.location.pathname === '/aguardando-aprovacao' ||
     window.location.pathname === '/');

  // Se está em rota pública, renderiza imediatamente sem esperar autenticação
  if (isPublicRoute && loading) {
    return children;
  }

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

  // ⚠️ 2FA TEMPORARIAMENTE DESABILITADO
  /*
  // Se usuário logado e precisa configurar 2FA
  if (user && showTwoFactorSetup) {
    return (
      <TwoFactorSetup
        user={user}
        onSetupComplete={handleTwoFactorSetupComplete}
        onCancel={handleTwoFactorCancel}
      />
    );
  }

  // Se usuário logado e precisa verificar 2FA
  if (user && showTwoFactorVerification) {
    return (
      <TwoFactorVerification
        user={user}
        onVerificationSuccess={handleTwoFactorVerificationSuccess}
        onCancel={handleTwoFactorCancel}
        onBackupCodeUsed={() => {
          // Pode mostrar aviso sobre regenerar códigos
          console.log('Código de backup usado');
        }}
      />
    );
  }

  // Se usuário logado, requer 2FA mas não foi autenticado ainda
  if (user && twoFactorRequired && !twoFactorAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  */

  // Se usuário logado e precisa selecionar tipo de acesso
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