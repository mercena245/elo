"use client";

import React, { useState } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import FileUploadZone from '../../../components/FileUploadZone';

/**
 * Página de demonstração do componente FileUploadZone
 * Para testar, acesse: http://localhost:3000/teste-upload
 */
export default function TesteUploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simular upload
  const handleFilesSelected = (selectedFiles) => {
    console.log('📁 Arquivos selecionados:', selectedFiles);
    
    // Simular upload com progresso
    setUploading(true);
    setProgress(0);

    // Simular progresso
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          
          // Adicionar arquivos à lista
          const newFiles = selectedFiles.map((file, index) => ({
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            url: URL.createObjectURL(file), // Para preview local
            id: Date.now() + index
          }));
          
          setFiles((prev) => [...prev, ...newFiles]);
          return 0;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRemoveFile = (index) => {
    console.log('🗑️ Removendo arquivo no índice:', index);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
          🎨 Teste: Upload com Ctrl+V
        </Typography>

        <Typography variant="body1" paragraph>
          Este é um exemplo de uso do componente <code>FileUploadZone</code>.
        </Typography>

        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            📌 Como testar o Ctrl+V:
          </Typography>
          <Typography variant="body2" component="div">
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>PASSO 1:</strong> Clique na zona de upload abaixo (ela ficará com borda azul)
              </li>
              <li>
                <strong>PASSO 2:</strong> Copie uma imagem:
                <ul style={{ marginTop: 5 }}>
                  <li>Aperte <code>PrtScn</code> (captura tela inteira)</li>
                  <li>Ou <code>Win + Shift + S</code> (captura área selecionada)</li>
                  <li>Ou clique direito em imagem → "Copiar Imagem"</li>
                </ul>
              </li>
              <li>
                <strong>PASSO 3:</strong> Com a zona de upload focada (borda azul), aperte <code>Ctrl + V</code>
              </li>
              <li>
                <strong>Dica:</strong> O texto mudará para "Ctrl+V ATIVO" quando estiver pronto!
              </li>
            </ol>
          </Typography>
        </Box>

        <FileUploadZone
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={handleRemoveFile}
          uploading={uploading}
          progress={progress}
          accept="image/*,.pdf,.doc,.docx"
          multiple={true}
          maxSize={10 * 1024 * 1024}
          showPreview={true}
        />

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            📊 Console de Debug
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Total de arquivos:</strong> {files.length}
            <br />
            <strong>Status:</strong> {uploading ? `Enviando ${progress}%` : 'Aguardando'}
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            ✅ Recursos Implementados
          </Typography>
          <Typography variant="body2" component="ul" sx={{ margin: 0, paddingLeft: 20 }}>
            <li>✅ Colar com Ctrl+V (imagens da área de transferência)</li>
            <li>✅ Arrastar e soltar (Drag & Drop)</li>
            <li>✅ Seleção tradicional de arquivos</li>
            <li>✅ Validação de tipo e tamanho</li>
            <li>✅ Preview de imagens</li>
            <li>✅ Barra de progresso</li>
            <li>✅ Feedback visual em cada ação</li>
            <li>✅ Suporte a múltiplos arquivos</li>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
