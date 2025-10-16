'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  IconButton, 
  Chip,
  Paper,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Settings,
  School,
  Palette,
  PhotoCamera,
  Lightbulb
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSchoolDatabase } from '../hooks/useSchoolDatabase';
import SchoolSelector from './SchoolSelector';

/**
 * Header Personalizável da Escola
 * Permite que a coordenadora customize cores, logo, imagem de fundo, etc
 */
const SchoolHeader = ({ userName, userRole, onOpenSettings }) => {
  console.log('🎨 [SchoolHeader] Componente renderizando...');
  console.log('🎨 [SchoolHeader] userName:', userName);
  console.log('🎨 [SchoolHeader] userRole:', userRole);
  console.log('🎨 [SchoolHeader] onOpenSettings:', typeof onOpenSettings);

  const { currentSchool } = useAuth();
  const { getData, isReady } = useSchoolDatabase();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  console.log('🎨 [SchoolHeader] currentSchool:', currentSchool?.nome);
  console.log('🎨 [SchoolHeader] isReady:', isReady);

  const [headerConfig, setHeaderConfig] = useState({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    backgroundImage: null,
    backgroundOverlay: 0.3,
    logoUrl: null,
    schoolName: '',
    motto: '',
    showLogo: true,
    showSchoolName: true,
    showMotto: true,
    textColor: '#ffffff',
    style: 'gradient' // 'gradient', 'image', 'solid'
  });

  const [loading, setLoading] = useState(true);

  // Carregar configurações do header do banco
  useEffect(() => {
    const loadHeaderConfig = async () => {
      if (!isReady) {
        console.log('🔄 [SchoolHeader] Aguardando banco estar pronto...');
        return;
      }

      console.log('📋 [SchoolHeader] Carregando configurações...');
      console.log('👤 [SchoolHeader] userRole:', userRole);
      console.log('🏫 [SchoolHeader] currentSchool:', currentSchool?.nome);

      try {
        const config = await getData('configuracoes/header');
        console.log('⚙️ [SchoolHeader] Config carregada:', config);
        if (config) {
          setHeaderConfig(prev => ({ ...prev, ...config }));
        }
        
        // Carregar nome da escola
        const schoolInfo = await getData('configuracoes/escola');
        console.log('🏫 [SchoolHeader] School info:', schoolInfo);
        if (schoolInfo?.nome) {
          setHeaderConfig(prev => ({ 
            ...prev, 
            schoolName: schoolInfo.nome,
            motto: schoolInfo.motto || ''
          }));
        } else if (currentSchool?.nome) {
          // Fallback para o nome da escola do contexto
          setHeaderConfig(prev => ({ 
            ...prev, 
            schoolName: currentSchool.nome
          }));
        }
      } catch (error) {
        console.error('❌ [SchoolHeader] Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHeaderConfig();
  }, [isReady, getData, currentSchool]);

  // Função para obter saudação baseada na hora
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return '🌅 Bom dia';
    if (hora < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  // Função para obter label da role
  const roleLabels = {
    'coordenadora': 'Coordenadora',
    'professora': 'Professora',
    'pai': 'Responsável',
    'secretaria': 'Secretaria',
    'admin': 'Administrador'
  };

  // Estilos baseados na configuração
  const getHeaderStyle = () => {
    const baseStyle = {
      p: { xs: 3, sm: 3.5, md: 4 },
      mb: { xs: 2, sm: 2.5, md: 3 },
      borderRadius: { xs: 2, md: 3 },
      position: 'relative',
      overflow: 'hidden',
      color: headerConfig.textColor,
      minHeight: { xs: '280px', sm: '320px', md: '360px' }
    };

    switch (headerConfig.style) {
      case 'gradient':
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${headerConfig.primaryColor} 0%, ${headerConfig.secondaryColor} 100%)`
        };
      
      case 'image':
        return {
          ...baseStyle,
          backgroundImage: headerConfig.backgroundImage 
            ? `linear-gradient(rgba(0,0,0,${headerConfig.backgroundOverlay}), rgba(0,0,0,${headerConfig.backgroundOverlay})), url(${headerConfig.backgroundImage})`
            : `linear-gradient(135deg, ${headerConfig.primaryColor} 0%, ${headerConfig.secondaryColor} 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      
      case 'solid':
        return {
          ...baseStyle,
          background: headerConfig.primaryColor
        };
      
      default:
        return baseStyle;
    }
  };

  if (loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 2, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: '180px',
          borderRadius: 3
        }}
      >
        <Typography>Carregando...</Typography>
      </Paper>
    );
  }

  return (
    <Fade in timeout={800}>
      <Paper 
        elevation={0} 
        sx={{
          ...getHeaderStyle(),
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Padrão de fundo decorativo */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
            display: { xs: 'none', md: 'block' }
          }}
        />

        {/* Botão de Configurações (apenas coordenadora/coordenador) */}
        {(userRole === 'coordenadora' || userRole === 'coordenador') && onOpenSettings && (
          <Box sx={{ position: 'absolute', top: { xs: 12, md: 20 }, right: { xs: 12, md: 20 }, zIndex: 10 }}>
            <IconButton
              onClick={() => {
                console.log('⚙️ [SchoolHeader] Abrindo configurações...');
                console.log('👤 [SchoolHeader] userRole atual:', userRole);
                onOpenSettings();
              }}
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                color: headerConfig.textColor,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.35)',
                  transform: 'scale(1.08) rotate(90deg)',
                  transition: 'all 0.3s ease'
                }
              }}
              title="Personalizar Header"
            >
              <Settings />
            </IconButton>
          </Box>
        )}

        {/* Container Principal */}
        <Box sx={{ 
          position: 'relative',
          zIndex: 1
        }}>
          {/* Seção Superior - Logo e Nome da Escola (Centralizado) */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            mb: 3
          }}>
            {headerConfig.showLogo && (
              <Avatar
                src={headerConfig.logoUrl}
                sx={{
                  width: { xs: 80, sm: 100, md: 120 },
                  height: { xs: 80, sm: 100, md: 120 },
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '4px solid rgba(255,255,255,0.3)',
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 700,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  mb: 2
                }}
              >
                {!headerConfig.logoUrl && (headerConfig.schoolName?.[0] || '🏫')}
              </Avatar>
            )}

            {headerConfig.showSchoolName && (
              <Typography 
                variant="h2" 
                fontWeight={800} 
                sx={{ 
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                  textShadow: '0 3px 15px rgba(0,0,0,0.3)',
                  mb: 0.5,
                  letterSpacing: '-0.02em'
                }}
              >
                {headerConfig.schoolName || currentSchool?.nome || 'Sistema ELO'}
              </Typography>
            )}
            
            {headerConfig.showMotto && headerConfig.motto && (
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.92, 
                  fontWeight: 400,
                  fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                  fontStyle: 'italic',
                  textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  maxWidth: '600px'
                }}
              >
                "{headerConfig.motto}"
              </Typography>
            )}
          </Box>

          {/* Divider Decorativo */}
          <Box sx={{ 
            width: { xs: '80%', sm: '60%', md: '400px' },
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${headerConfig.textColor}40, transparent)`,
            margin: '0 auto',
            mb: 3
          }} />

          {/* Seção Inferior - Informações do Usuário e Controles */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', md: 'flex-end' },
            gap: { xs: 2, md: 3 }
          }}>
            {/* Saudação e Role */}
            <Box sx={{ 
              textAlign: { xs: 'center', md: 'left' },
              flex: 1
            }}>
              <Typography 
                variant="h5" 
                fontWeight={700}
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  mb: 0.5
                }}
              >
                {getSaudacao()}, {userName}! 👋
              </Typography>
              
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  opacity: 0.92, 
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  textShadow: '0 1px 5px rgba(0,0,0,0.15)',
                  fontWeight: 500
                }}
              >
                {roleLabels[userRole] || 'Usuário'}
              </Typography>
            </Box>

            {/* Chips e Controles */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', md: 'flex-end' }
            }}>
              <Chip 
                icon={<Lightbulb sx={{ fontSize: '1.1rem' }} />}
                label="Dashboard Inteligente" 
                size="medium"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.25)', 
                  backdropFilter: 'blur(10px)',
                  color: headerConfig.textColor,
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  height: { xs: '28px', sm: '32px' },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '& .MuiChip-icon': { 
                    color: headerConfig.textColor,
                    fontSize: '1.1rem'
                  }
                }}
              />
              
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2, 
                  p: 0.75,
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <SchoolSelector />
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

export default SchoolHeader;
