"use client";
import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { FaSchool } from 'react-icons/fa';

const SplashScreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Animar o aparecimento do logo
    const logoTimer = setTimeout(() => setShowLogo(true), 300);

    // Simular carregamento com progresso
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          // Delay pequeno antes de completar para suavizar a transição
          setTimeout(() => onLoadingComplete(), 800);
          return 100;
        }
        return newProgress;
      });
    }, 150);

    return () => {
      clearTimeout(logoTimer);
      clearInterval(interval);
    };
  }, [onLoadingComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: progress === 100 ? 0 : 1,
        transition: 'opacity 0.8s ease-out'
      }}
    >
      {/* Logo Container */}
      <Box
        sx={{
          transform: showLogo ? 'scale(1) translateY(0)' : 'scale(0.3) translateY(20px)',
          opacity: showLogo ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Ícone da escola com efeito de brilho */}
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, rgba(255,255,255,0.3), transparent, rgba(255,255,255,0.3))',
              animation: 'rotate 3s linear infinite'
            }
          }}
        >
          <FaSchool size={48} color="white" />
        </Box>

        {/* Nome do app */}
        <Typography
          variant="h2"
          sx={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: '3.5rem',
            letterSpacing: '0.1em',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            mb: 1
          }}
        >
          ELO
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 300,
            fontSize: '1.1rem',
            letterSpacing: '0.05em'
          }}
        >
          Sistema Educacional
        </Typography>
      </Box>

      {/* Barra de progresso customizada */}
      <Box
        sx={{
          width: 280,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          mb: 2
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.8))',
            borderRadius: 2,
            transition: 'width 0.3s ease-out',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        />
      </Box>

      {/* Texto de carregamento */}
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9rem',
          mt: 1
        }}
      >
        Carregando... {progress}%
      </Typography>

      {/* Keyframes para animação */}
      <style jsx global>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
};

export default SplashScreen;