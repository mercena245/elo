"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarMenu from '../../components/SidebarMenu';
import ProtectedRoute from '../../components/ProtectedRoute';
import { 
  Card, 
  CardContent, 
  CardActionArea,
  Typography, 
  Grid, 
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import { AttachFile, CalendarToday, Close, Download } from '@mui/icons-material';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';

// Estilos CSS inline para animações
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Adicionar estilos ao head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const AvisosPage = () => {
  const [avisos, setAvisos] = useState([]);
  const [selectedAviso, setSelectedAviso] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const avisosRef = ref(db, 'avisos');
    
    const unsubscribe = onValue(avisosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const avisosArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        }));
        
        // Ordenar por data (mais recentes primeiro)
        const sortedAvisos = avisosArray.sort((a, b) => {
          // Priorizar dataPublicacao, depois data, depois timestamp da chave do Firebase
          const dateA = new Date(a.dataPublicacao || a.data || a.timestamp || 0);
          const dateB = new Date(b.dataPublicacao || b.data || b.timestamp || 0);
          
          // Se as datas forem diferentes, ordenar por data (mais recente primeiro)
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }
          
          // Se as datas forem iguais, ordenar pela chave do Firebase (mais recente primeiro)
          return b.id.localeCompare(a.id);
        });
        
        // Debug: mostrar ordenação dos avisos
        console.log('📅 Avisos ordenados por data (mais recentes primeiro):', 
          sortedAvisos.map(aviso => ({
            titulo: aviso.titulo,
            dataPublicacao: aviso.dataPublicacao,
            data: aviso.data,
            timestamp: aviso.timestamp,
            id: aviso.id
          }))
        );
        
        setAvisos(sortedAvisos);
      } else {
        setAvisos([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const truncateText = (text, maxLength = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const handleOpenModal = (aviso) => {
    setSelectedAviso(aviso);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedAviso(null);
  };

  const handleDownloadAnexo = (url, nome) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = nome || 'anexo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <SidebarMenu />
        <main style={{ 
          flexGrow: 1, 
          backgroundColor: '#f0f2f5',
          minHeight: '100vh'
        }}>
          {/* Header com gradiente roxo */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderBottom: '1px solid #5a67d8',
            py: 3,
            px: { xs: 2, md: 3 },
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
          }}>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                fontWeight: 700,
                color: 'white',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              📢 Feed de Avisos
            </Typography>
          </Box>

          {/* Feed Container */}
          <Box sx={{ 
            maxWidth: '680px',
            mx: 'auto',
            py: 3,
            px: { xs: 2, sm: 3 }
          }}>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  border: '4px solid #e4e6ea',
                  borderTop: '4px solid #1877f2',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  mx: 'auto',
                  mb: 2
                }} />
                <Typography variant="body1" sx={{ color: '#65676b' }}>
                  Carregando avisos...
                </Typography>
              </Box>
            ) : avisos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" sx={{ color: '#65676b', mb: 1 }}>
                  📭 Sem avisos no momento
                </Typography>
                <Typography variant="body2" sx={{ color: '#8a8d91' }}>
                  Quando houver novos avisos, eles aparecerão aqui
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {avisos.map((aviso, index) => (
                  <Card 
                    key={aviso.id}
                    elevation={1}
                    sx={{ 
                      backgroundColor: 'white',
                      borderRadius: 2,
                      border: '1px solid #e4e6ea',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                      }
                    }}
                    onClick={() => handleOpenModal(aviso)}
                  >
                    {/* Header do Post */}
                    <Box sx={{ p: 2, pb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* Avatar da escola */}
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1877f2, #42a5f5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1.2rem'
                        }}>
                          🏫
                        </Box>
                        
                        {/* Info do post */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1c1e21' }}>
                            Escola
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {aviso.dataPublicacao && (
                              <Typography variant="caption" sx={{ color: '#65676b' }}>
                                {formatDate(aviso.dataPublicacao)}
                              </Typography>
                            )}
                            {(aviso.anexo && aviso.anexo.trim() !== '') && (
                              <>
                                <Typography variant="caption" sx={{ color: '#65676b' }}>•</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <AttachFile sx={{ fontSize: 12, color: '#65676b' }} />
                                  <Typography variant="caption" sx={{ color: '#65676b' }}>
                                    Anexo
                                  </Typography>
                                </Box>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Conteúdo do Post */}
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: '#1c1e21',
                          mb: 1,
                          fontSize: '1.1rem'
                        }}
                      >
                        {aviso.titulo}
                      </Typography>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#1c1e21',
                          lineHeight: 1.4,
                          fontSize: '0.95rem'
                        }}
                      >
                        {truncateText(aviso.conteudo, 200)}
                      </Typography>
                      
                      {/* Botão Ver mais */}
                      {aviso.conteudo && aviso.conteudo.length > 200 && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#1877f2',
                            fontWeight: 500,
                            mt: 1,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Ver mais
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Linha divisória sutil */}
                    <Box sx={{ height: 1, bgcolor: '#f0f2f5', mx: 2 }} />
                    
                    {/* Ações do post */}
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#65676b', py: 1 }}>
                        Toque para ver detalhes
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </main>

        {/* Modal estilo Facebook */}
        <Dialog
          open={open}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: 3,
              maxHeight: '90vh',
              margin: { xs: 2, sm: 4 }
            }
          }}
        >
          {selectedAviso && (
            <>
              {/* Header do modal */}
              <Box sx={{ 
                p: 2,
                borderBottom: '1px solid #e4e6ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1877f2, #42a5f5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.2rem'
                  }}>
                    🏫
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#1c1e21' }}>
                      Escola
                    </Typography>
                    {selectedAviso.dataPublicacao && (
                      <Typography variant="caption" sx={{ color: '#65676b' }}>
                        {formatDate(selectedAviso.dataPublicacao)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Button
                  onClick={handleCloseModal}
                  sx={{ 
                    minWidth: 'auto',
                    p: 1,
                    color: '#65676b',
                    '&:hover': { 
                      bgcolor: '#f2f3f4',
                      borderRadius: '50%'
                    }
                  }}
                >
                  <Close />
                </Button>
              </Box>
              
              {/* Conteúdo do modal */}
              <DialogContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1c1e21',
                    mb: 2
                  }}
                >
                  {selectedAviso.titulo}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#1c1e21',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {selectedAviso.conteudo}
                </Typography>

                {/* Anexo discreto */}
                {selectedAviso.anexo && selectedAviso.anexo.trim() !== '' && (
                  <Box sx={{ 
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid #e4e6ea',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <AttachFile sx={{ color: '#1877f2', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: '#65676b', flexGrow: 1 }}>
                      Anexo disponível
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleDownloadAnexo(selectedAviso.anexo, `anexo_${selectedAviso.titulo}`)}
                      sx={{
                        textTransform: 'none',
                        color: '#1877f2',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'rgba(24, 119, 242, 0.05)'
                        }
                      }}
                    >
                      Visualizar anexo
                    </Button>
                  </Box>
                )}
              </DialogContent>
            </>
          )}
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default AvisosPage;