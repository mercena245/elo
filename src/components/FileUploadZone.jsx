"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Card,
  LinearProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Description as FileIcon,
  ContentPaste as PasteIcon
} from '@mui/icons-material';

/**
 * Componente de Upload de Arquivos com suporte a:
 * - Seleção de arquivos (clique)
 * - Drag and Drop
 * - Ctrl+V para colar imagens da área de transferência
 * 
 * @param {Function} onFilesSelected - Callback quando arquivos são selecionados
 * @param {Array} files - Array de arquivos já carregados
 * @param {Function} onRemoveFile - Callback para remover arquivo
 * @param {Boolean} uploading - Estado de upload em progresso
 * @param {Number} progress - Progresso do upload (0-100)
 * @param {Boolean} disabled - Desabilitar o componente
 * @param {String} accept - Tipos de arquivo aceitos
 * @param {Boolean} multiple - Permitir múltiplos arquivos
 * @param {Number} maxSize - Tamanho máximo em bytes (padrão: 10MB)
 */
const FileUploadZone = ({
  onFilesSelected,
  files = [],
  onRemoveFile,
  uploading = false,
  progress = 0,
  disabled = false,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  showPreview = true
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [pasteActive, setPasteActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Validar arquivo
  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }
    
    // Validar tipo de arquivo se accept foi especificado
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      const mimeType = file.type;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        if (type.includes('/*')) {
          return mimeType.startsWith(type.split('/')[0]);
        }
        return mimeType === type;
      });
      
      if (!isAccepted) {
        return 'Tipo de arquivo não permitido';
      }
    }
    
    return null;
  };

  // Processar arquivos selecionados
  const processFiles = (fileList) => {
    const filesArray = Array.from(fileList);
    const errors = [];
    const validFiles = [];

    filesArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      setTimeout(() => setError(''), 5000);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  // Handler para seleção de arquivo via input
  const handleFileInput = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // Limpar input
    }
  };

  // Handlers para Drag and Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || uploading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Handler para Ctrl+V (colar imagem)
  const handlePaste = React.useCallback((e) => {
    console.log('🔍 Paste event detectado!', e);
    
    if (disabled || uploading) {
      console.log('⚠️ Paste bloqueado (disabled ou uploading)');
      return;
    }

    const items = e.clipboardData?.items;
    console.log('📋 Items na área de transferência:', items?.length);
    
    if (!items) {
      console.log('❌ Nenhum item na área de transferência');
      return;
    }

    const files = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`📄 Item ${i}:`, item.kind, item.type);
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          console.log('✅ Arquivo obtido:', file.name, file.type, file.size);
          
          // Criar nome para arquivo colado
          const timestamp = Date.now();
          const extension = file.type.split('/')[1] || 'png';
          const newFile = new File([file], `colado_${timestamp}.${extension}`, {
            type: file.type
          });
          files.push(newFile);
        }
      }
    }

    if (files.length > 0) {
      console.log('✨ Processando', files.length, 'arquivo(s) colado(s)');
      
      // Feedback visual
      setPasteActive(true);
      setTimeout(() => setPasteActive(false), 500);
      
      processFiles(files);
      e.preventDefault();
    } else {
      console.log('⚠️ Nenhum arquivo válido para colar');
    }
  }, [disabled, uploading, processFiles]);

  // Adicionar listener de paste quando componente está montado
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) {
      console.log('❌ dropZoneRef não disponível');
      return;
    }

    console.log('✅ Adicionando listener de paste ao elemento');
    
    // Adicionar listener ao elemento específico
    dropZone.addEventListener('paste', handlePaste);
    
    // Tornar o elemento focável para receber eventos de teclado
    dropZone.setAttribute('tabindex', '0');
    
    // NÃO focar automaticamente - deixar o usuário decidir quando focar
    // dropZone.focus(); // REMOVIDO - estava roubando foco dos outros campos
    
    return () => {
      console.log('🧹 Removendo listener de paste');
      dropZone.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Obter ícone do arquivo
  const getFileIcon = (file) => {
    if (file.tipo?.startsWith('image/') || file.type?.startsWith('image/')) {
      return <ImageIcon />;
    }
    return <FileIcon />;
  };

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      {/* Zona de Upload */}
      <Box
        ref={dropZoneRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onFocus={(e) => {
          e.stopPropagation();
          console.log('🎯 Elemento focado - Ctrl+V disponível!');
          setIsFocused(true);
        }}
        onBlur={(e) => {
          e.stopPropagation();
          console.log('👋 Elemento perdeu foco');
          setIsFocused(false);
        }}
        onClick={(e) => e.stopPropagation()}
        sx={{
          border: dragActive 
            ? '3px dashed #1976d2' 
            : pasteActive 
            ? '3px solid #4caf50'
            : isFocused
            ? '2px solid #1976d2'
            : '2px dashed #bdbdbd',
          borderRadius: 2,
          padding: 3,
          textAlign: 'center',
          backgroundColor: dragActive 
            ? 'rgba(25, 118, 210, 0.05)' 
            : pasteActive
            ? 'rgba(76, 175, 80, 0.05)'
            : isFocused
            ? 'rgba(25, 118, 210, 0.03)'
            : 'transparent',
          transition: 'all 0.3s ease',
          position: 'relative',
          outline: 'none',
          '&:focus': {
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.02)'
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={multiple}
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled || uploading}
        />

        <UploadIcon 
          sx={{ 
            fontSize: 48, 
            color: dragActive ? 'primary.main' : isFocused ? 'primary.main' : 'text.secondary',
            mb: 1,
            transition: 'all 0.2s ease'
          }} 
        />
        
        <Typography variant="h6" gutterBottom>
          {dragActive ? 'Solte os arquivos aqui' : 'Adicionar Arquivos'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isFocused 
            ? '✅ Pronto! Use Ctrl+V para colar imagens' 
            : 'Arraste arquivos, clique no botão ou use Ctrl+V'}
        </Typography>

        {/* Botão para selecionar arquivos */}
        {!disabled && !uploading && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
              // Não focar automaticamente - apenas abrir o seletor
            }}
            sx={{ mb: 2 }}
          >
            Selecionar Arquivos
          </Button>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <Chip 
            icon={<PasteIcon />} 
            label={isFocused ? "Ctrl+V ATIVO" : "Clique aqui e use Ctrl+V"} 
            size="small" 
            variant={isFocused ? "filled" : "outlined"}
            color={pasteActive ? "success" : isFocused ? "primary" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              dropZoneRef.current?.focus();
            }}
            sx={{ cursor: 'pointer' }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          Tipos aceitos: Imagens, PDF, Word, Excel, PowerPoint
          <br />
          Tamanho máximo: {(maxSize / 1024 / 1024).toFixed(0)}MB por arquivo
        </Typography>        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Enviando... {Math.round(progress)}%
            </Typography>
          </Box>
        )}
      </Box>

      {/* Mensagem de Erro */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Preview dos Arquivos */}
      {showPreview && files && files.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Arquivos Anexados ({files.length})
          </Typography>
          {files.map((arquivo, fileIndex) => (
            <Card 
              key={fileIndex} 
              variant="outlined" 
              sx={{ p: 2 }}
              onClick={(e) => e.stopPropagation()} // Prevenir propagação do clique
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  {/* Preview da imagem ou ícone do arquivo */}
                  {(arquivo.tipo?.startsWith('image/') || arquivo.type?.startsWith('image/')) && arquivo.url ? (
                    <Box
                      component="img"
                      src={arquivo.url}
                      alt={arquivo.nome || arquivo.name}
                      onClick={(e) => e.stopPropagation()} // Prevenir propagação
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid #e0e0e0'
                      }}
                    />
                  ) : (
                    <Box
                      onClick={(e) => e.stopPropagation()} // Prevenir propagação
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'primary.light',
                        borderRadius: 1,
                        color: 'white',
                        fontSize: '1.5rem'
                      }}
                    >
                      {getFileIcon(arquivo)}
                    </Box>
                  )}
                  
                  {/* Informações do arquivo */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {arquivo.nome || arquivo.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(arquivo.tamanho || arquivo.size || 0)}
                    </Typography>
                  </Box>
                </Box>

                {/* Botão para remover */}
                {!disabled && onRemoveFile && (
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onRemoveFile(fileIndex)}
                    disabled={uploading}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUploadZone;
