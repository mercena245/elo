'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tooltip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Chip
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Code as CodeIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Image as ImageIcon
} from '@mui/icons-material';

/**
 * Componente para exibir preview de recursos (arquivos) de forma consistente
 * Suporta: imagens, PDFs, documentos Word, Excel, etc.
 */
export default function RecursosPreview({ recursos, variant = 'grid', showDownload = true, maxItems = null }) {
  // Debug
  console.log('🔍 RecursosPreview recebeu:', { 
    recursos, 
    isArray: Array.isArray(recursos), 
    length: recursos?.length,
    variant 
  });

  if (!recursos || !Array.isArray(recursos) || recursos.length === 0) {
    console.log('⚠️ RecursosPreview: recursos vazio ou inválido');
    return null;
  }

  // Se for string (formato antigo), converte para array
  if (typeof recursos === 'string' && recursos.trim()) {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          📎 {recursos}
        </Typography>
      </Paper>
    );
  }

  const getFileIcon = (tipo, nome) => {
    if (!tipo && nome) {
      const ext = nome.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return <ImageIcon sx={{ fontSize: 48, color: 'info.main' }} />;
      }
      if (ext === 'pdf') {
        return <PdfIcon sx={{ fontSize: 48, color: 'error.main' }} />;
      }
      if (['doc', 'docx'].includes(ext)) {
        return <DocIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
      }
      if (['xls', 'xlsx'].includes(ext)) {
        return <ExcelIcon sx={{ fontSize: 48, color: 'success.main' }} />;
      }
    }

    if (tipo?.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: 48, color: 'info.main' }} />;
    }
    if (tipo?.includes('pdf')) {
      return <PdfIcon sx={{ fontSize: 48, color: 'error.main' }} />;
    }
    if (tipo?.includes('word') || tipo?.includes('document')) {
      return <DocIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
    }
    if (tipo?.includes('sheet') || tipo?.includes('excel')) {
      return <ExcelIcon sx={{ fontSize: 48, color: 'success.main' }} />;
    }
    if (tipo?.includes('text')) {
      return <CodeIcon sx={{ fontSize: 48, color: 'secondary.main' }} />;
    }
    return <FileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const recursosToShow = maxItems ? recursos.slice(0, maxItems) : recursos;
  const hasMore = maxItems && recursos.length > maxItems;

  // Variante compacta para lista
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {recursosToShow.map((recurso, index) => (
          <Tooltip key={index} title={recurso.nome} arrow>
            <Chip
              size="small"
              icon={recurso.tipo?.startsWith('image/') ? <ImageIcon /> : <FileIcon />}
              label={recurso.nome?.length > 15 ? recurso.nome.substring(0, 15) + '...' : recurso.nome}
              onClick={() => window.open(recurso.url, '_blank')}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        ))}
        {hasMore && (
          <Chip size="small" label={`+${recursos.length - maxItems} mais`} variant="outlined" />
        )}
      </Box>
    );
  }

  // Variante miniaturas para lista de cards
  if (variant === 'thumbnails') {
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        flexWrap: 'wrap',
        mt: 1
      }}>
        {recursosToShow.map((recurso, index) => (
          <Tooltip key={index} title={`${recurso.nome} (${formatFileSize(recurso.tamanho)})`} arrow>
            <Box
              onClick={() => window.open(recurso.url, '_blank')}
              sx={{
                width: 60,
                height: 60,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.paper',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 2,
                  borderColor: 'primary.main'
                },
                '@media print': {
                  pageBreakInside: 'avoid'
                }
              }}
            >
              {recurso.tipo?.startsWith('image/') ? (
                <Box
                  component="img"
                  src={recurso.url}
                  alt={recurso.nome}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%"><svg style="color:#999;width:32px;height:32px" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg></div>';
                  }}
                />
              ) : (
                getFileIcon(recurso.tipo, recurso.nome)
              )}
            </Box>
          </Tooltip>
        ))}
        {hasMore && (
          <Box sx={{
            width: 60,
            height: 60,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="caption" color="text.secondary">
              +{recursos.length - maxItems}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Variante grid (padrão) - para visualização detalhada
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
        lg: 'repeat(4, 1fr)'
      },
      gap: 2,
      '@media print': {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1
      }
    }}>
      {recursos.map((recurso, index) => (
        <Card 
          key={index}
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            '@media print': {
              pageBreakInside: 'avoid',
              boxShadow: 'none',
              border: '1px solid #ddd'
            }
          }}
        >
          {/* Preview da imagem ou ícone do arquivo */}
          {recurso.tipo?.startsWith('image/') ? (
            <CardMedia
              component="img"
              height="160"
              image={recurso.url}
              alt={recurso.nome}
              sx={{ 
                objectFit: 'cover',
                bgcolor: 'grey.100',
                '@media print': {
                  maxHeight: 120
                }
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Box sx={{ 
              height: 160, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'grey.50',
              '@media print': {
                height: 120
              }
            }}>
              {getFileIcon(recurso.tipo, recurso.nome)}
            </Box>
          )}

          {/* Informações do arquivo */}
          <CardContent sx={{ flexGrow: 1, pb: 1 }}>
            <Tooltip title={recurso.nome} arrow>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5
                }}
              >
                {recurso.nome}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(recurso.tamanho)}
            </Typography>
          </CardContent>

          {/* Ações */}
          {showDownload && (
            <CardActions 
              sx={{ 
                pt: 0,
                '@media print': {
                  display: 'none'
                }
              }}
            >
              <Button
                size="small"
                href={recurso.url}
                download={recurso.nome}
                startIcon={<DownloadIcon />}
                sx={{ fontSize: '0.75rem' }}
              >
                Baixar
              </Button>
              <Button
                size="small"
                href={recurso.url}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<OpenInNewIcon />}
                sx={{ fontSize: '0.75rem' }}
              >
                Abrir
              </Button>
            </CardActions>
          )}

          {/* URL para impressão */}
          <Box sx={{ 
            display: 'none',
            '@media print': {
              display: 'block',
              p: 1,
              fontSize: '8px',
              wordBreak: 'break-all',
              bgcolor: 'grey.100',
              borderTop: '1px solid #ddd'
            }
          }}>
            <Typography variant="caption" sx={{ fontSize: '8px' }}>
              URL: {recurso.url}
            </Typography>
          </Box>
        </Card>
      ))}
    </Box>
  );
}
