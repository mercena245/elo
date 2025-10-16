'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Slider,
  IconButton,
  Avatar,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  Close,
  Palette,
  Image as ImageIcon,
  PhotoCamera,
  Refresh,
  Save,
  Check
} from '@mui/icons-material';
import { useSchoolDatabase } from '../hooks/useSchoolDatabase';
import { useSchoolStorage } from '../hooks/useSchoolStorage';

/**
 * Modal de Personalização do Header da Escola
 * Permite que coordenadora customize aparência do dashboard
 */
const HeaderSettingsDialog = ({ open, onClose, currentConfig }) => {
  const { getData, setData, isReady } = useSchoolDatabase();
  const { uploadFile } = useSchoolStorage();

  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const [config, setConfig] = useState({
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
    style: 'gradient'
  });

  useEffect(() => {
    if (currentConfig) {
      setConfig(prev => ({ ...prev, ...currentConfig }));
    }
  }, [currentConfig, open]);

  // Paleta de cores predefinidas
  const colorPresets = [
    { name: 'Roxo Vibrante', primary: '#667eea', secondary: '#764ba2' },
    { name: 'Azul Oceano', primary: '#2193b0', secondary: '#6dd5ed' },
    { name: 'Verde Natureza', primary: '#56ab2f', secondary: '#a8e063' },
    { name: 'Laranja Sunset', primary: '#f12711', secondary: '#f5af19' },
    { name: 'Rosa Romântico', primary: '#ec008c', secondary: '#fc6767' },
    { name: 'Azul Profissional', primary: '#1e3c72', secondary: '#2a5298' },
    { name: 'Verde Esmeralda', primary: '#11998e', secondary: '#38ef7d' },
    { name: 'Vermelho Intenso', primary: '#c31432', secondary: '#240b36' },
    { name: 'Amarelo Solar', primary: '#f2994a', secondary: '#f2c94c' },
    { name: 'Roxo Galáctico', primary: '#4a00e0', secondary: '#8e2de2' }
  ];

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccess(false);

      console.log('💾 [HeaderSettings] Iniciando salvamento...');
      console.log('💾 [HeaderSettings] Configuração a salvar:', config);
      console.log('💾 [HeaderSettings] isReady:', isReady);

      if (!isReady) {
        alert('⚠️ Banco de dados não está pronto. Aguarde e tente novamente.');
        return;
      }

      // Salvar configurações no banco da escola atual
      console.log('💾 [HeaderSettings] Salvando em: configuracoes/header');
      await setData('configuracoes/header', config);
      console.log('✅ [HeaderSettings] Header config salvo!');

      // Salvar nome e motto também nas configurações gerais da escola
      console.log('💾 [HeaderSettings] Salvando em: configuracoes/escola');
      await setData('configuracoes/escola', {
        nome: config.schoolName,
        motto: config.motto
      });
      console.log('✅ [HeaderSettings] School info salvo!');

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reload da página para atualizar o header
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('❌ [HeaderSettings] Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Tente novamente.\n\n' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log('⚠️ [HeaderSettings] Nenhum arquivo selecionado');
      return;
    }

    console.log('📤 [HeaderSettings] Arquivo selecionado:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      console.error('❌ [HeaderSettings] Tipo inválido:', file.type);
      alert('Por favor, selecione uma imagem válida (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ [HeaderSettings] Arquivo muito grande:', file.size);
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    if (!isReady) {
      console.error('❌ [HeaderSettings] Banco não está pronto!');
      alert('Aguarde a conexão com o banco de dados antes de fazer upload.');
      return;
    }

    try {
      setUploadingLogo(true);

      console.log('📤 [HeaderSettings] Iniciando upload do logo...');
      console.log('📤 [HeaderSettings] isReady:', isReady);
      console.log('📤 [HeaderSettings] uploadFile type:', typeof uploadFile);
      
      // Upload para Storage da escola atual
      const path = `configuracoes/logo_${Date.now()}.${file.name.split('.').pop()}`;
      console.log('📤 [HeaderSettings] Path:', path);
      
      const logoUrl = await uploadFile(file, path);
      
      console.log('✅ [HeaderSettings] Logo uploaded! URL:', logoUrl);
      
      if (!logoUrl) {
        throw new Error('URL do logo não foi retornada');
      }
      
      setConfig(prev => ({ ...prev, logoUrl }));
      alert('✅ Logo enviado com sucesso!');
    } catch (error) {
      console.error('❌ [HeaderSettings] Erro detalhado:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`Erro ao fazer upload do logo:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBackgroundUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log('⚠️ [HeaderSettings] Nenhum arquivo de background selecionado');
      return;
    }

    console.log('📤 [HeaderSettings] Background selecionado:', {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    });

    if (!file.type.startsWith('image/')) {
      console.error('❌ [HeaderSettings] Tipo inválido:', file.type);
      alert('Por favor, selecione uma imagem válida (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ [HeaderSettings] Arquivo muito grande:', file.size);
      alert('A imagem deve ter no máximo 10MB.');
      return;
    }

    if (!isReady) {
      console.error('❌ [HeaderSettings] Banco não está pronto!');
      alert('Aguarde a conexão com o banco de dados antes de fazer upload.');
      return;
    }

    try {
      setUploadingBackground(true);

      console.log('📤 [HeaderSettings] Iniciando upload do background...');
      
      const path = `configuracoes/background_${Date.now()}.${file.name.split('.').pop()}`;
      console.log('📤 [HeaderSettings] Path:', path);
      
      const backgroundUrl = await uploadFile(file, path);
      
      console.log('✅ [HeaderSettings] Background uploaded! URL:', backgroundUrl);
      
      if (!backgroundUrl) {
        throw new Error('URL do background não foi retornada');
      }
      
      setConfig(prev => ({ 
        ...prev, 
        backgroundImage: backgroundUrl,
        style: 'image'
      }));
      
      alert('✅ Imagem de fundo enviada com sucesso!');
    } catch (error) {
      console.error('❌ [HeaderSettings] Erro detalhado:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`Erro ao fazer upload da imagem de fundo:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
    } finally {
      setUploadingBackground(false);
    }
  };

  const renderColorsTab = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        🎨 Escolha o Estilo do Header
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          variant={config.style === 'gradient' ? 'contained' : 'outlined'}
          onClick={() => setConfig(prev => ({ ...prev, style: 'gradient' }))}
          startIcon={<Palette />}
        >
          Gradiente
        </Button>
        <Button
          variant={config.style === 'solid' ? 'contained' : 'outlined'}
          onClick={() => setConfig(prev => ({ ...prev, style: 'solid' }))}
          startIcon={<Palette />}
        >
          Cor Sólida
        </Button>
        <Button
          variant={config.style === 'image' ? 'contained' : 'outlined'}
          onClick={() => setConfig(prev => ({ ...prev, style: 'image' }))}
          startIcon={<ImageIcon />}
        >
          Com Imagem
        </Button>
      </Box>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
        Paletas Predefinidas:
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {colorPresets.map((preset, index) => (
          <Box
            key={index}
            onClick={() => setConfig(prev => ({
              ...prev,
              primaryColor: preset.primary,
              secondaryColor: preset.secondary
            }))}
            sx={{
              width: 100,
              height: 80,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
              cursor: 'pointer',
              border: config.primaryColor === preset.primary ? '3px solid #000' : '2px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 4,
                color: 'white',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                fontSize: '0.65rem',
                textAlign: 'center',
                px: 0.5
              }}
            >
              {preset.name}
            </Typography>
            {config.primaryColor === preset.primary && (
              <Check sx={{ color: 'white', fontSize: '2rem' }} />
            )}
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" gutterBottom>
        Ou escolha cores customizadas:
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" gutterBottom display="block">
            Cor Primária:
          </Typography>
          <TextField
            type="color"
            value={config.primaryColor}
            onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
            fullWidth
            sx={{ '& input': { height: 50, cursor: 'pointer' } }}
          />
        </Box>

        {config.style === 'gradient' && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" gutterBottom display="block">
              Cor Secundária:
            </Typography>
            <TextField
              type="color"
              value={config.secondaryColor}
              onChange={(e) => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
              fullWidth
              sx={{ '& input': { height: 50, cursor: 'pointer' } }}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" gutterBottom display="block">
          Cor do Texto:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={config.textColor === '#ffffff' ? 'contained' : 'outlined'}
            onClick={() => setConfig(prev => ({ ...prev, textColor: '#ffffff' }))}
          >
            Branco
          </Button>
          <Button
            variant={config.textColor === '#000000' ? 'contained' : 'outlined'}
            onClick={() => setConfig(prev => ({ ...prev, textColor: '#000000' }))}
          >
            Preto
          </Button>
        </Box>
      </Box>

      {/* Preview */}
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 4 }}>
        Prévia:
      </Typography>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          background: config.style === 'gradient'
            ? `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 100%)`
            : config.primaryColor,
          color: config.textColor,
          minHeight: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          {config.schoolName || 'Nome da Escola'}
        </Typography>
      </Paper>
    </Box>
  );

  const renderImagesTab = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        🖼️ Logo da Escola
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Avatar
          src={config.logoUrl}
          sx={{
            width: 100,
            height: 100,
            border: '3px solid #ddd',
            fontSize: '2rem'
          }}
        >
          {!config.logoUrl && '🏫'}
        </Avatar>

        <Box>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="logo-upload"
            type="file"
            onChange={handleLogoUpload}
          />
          <label htmlFor="logo-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={uploadingLogo ? <CircularProgress size={20} /> : <PhotoCamera />}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
            </Button>
          </label>
          
          {config.logoUrl && (
            <Button
              sx={{ ml: 1 }}
              startIcon={<Close />}
              onClick={() => setConfig(prev => ({ ...prev, logoUrl: null }))}
            >
              Remover
            </Button>
          )}
          
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Recomendado: 500x500px, máximo 5MB
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        🌄 Imagem de Fundo
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        {config.backgroundImage && (
          <Paper
            elevation={2}
            sx={{
              width: '100%',
              height: 150,
              backgroundImage: `url(${config.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              mb: 2,
              borderRadius: 2
            }}
          />
        )}

        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="background-upload"
          type="file"
          onChange={handleBackgroundUpload}
        />
        <label htmlFor="background-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={uploadingBackground ? <CircularProgress size={20} /> : <ImageIcon />}
            disabled={uploadingBackground}
          >
            {uploadingBackground ? 'Enviando...' : 'Enviar Imagem de Fundo'}
          </Button>
        </label>

        {config.backgroundImage && (
          <>
            <Button
              sx={{ ml: 1 }}
              startIcon={<Close />}
              onClick={() => setConfig(prev => ({ ...prev, backgroundImage: null, style: 'gradient' }))}
            >
              Remover
            </Button>

            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" gutterBottom display="block">
                Opacidade do Overlay: {Math.round(config.backgroundOverlay * 100)}%
              </Typography>
              <Slider
                value={config.backgroundOverlay}
                onChange={(e, newValue) => setConfig(prev => ({ ...prev, backgroundOverlay: newValue }))}
                min={0}
                max={0.9}
                step={0.1}
                marks
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              />
            </Box>
          </>
        )}

        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Recomendado: 1920x400px, máximo 10MB
        </Typography>
      </Box>
    </Box>
  );

  const renderTextTab = () => (
    <Box sx={{ py: 2 }}>
      <TextField
        label="Nome da Escola"
        fullWidth
        value={config.schoolName}
        onChange={(e) => setConfig(prev => ({ ...prev, schoolName: e.target.value }))}
        sx={{ mb: 3 }}
        helperText="Nome que aparecerá no header do dashboard"
      />

      <TextField
        label="Slogan / Lema"
        fullWidth
        multiline
        rows={2}
        value={config.motto}
        onChange={(e) => setConfig(prev => ({ ...prev, motto: e.target.value }))}
        sx={{ mb: 3 }}
        helperText="Frase motivacional ou lema da escola (opcional)"
      />

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
        Elementos Visíveis:
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={config.showLogo}
            onChange={(e) => setConfig(prev => ({ ...prev, showLogo: e.target.checked }))}
          />
        }
        label="Mostrar Logo"
      />

      <FormControlLabel
        control={
          <Switch
            checked={config.showSchoolName}
            onChange={(e) => setConfig(prev => ({ ...prev, showSchoolName: e.target.checked }))}
          />
        }
        label="Mostrar Nome da Escola"
      />

      <FormControlLabel
        control={
          <Switch
            checked={config.showMotto}
            onChange={(e) => setConfig(prev => ({ ...prev, showMotto: e.target.checked }))}
          />
        }
        label="Mostrar Lema/Slogan"
      />
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #eee'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Palette sx={{ color: '#667eea' }} />
          <Typography variant="h6" fontWeight={600}>
            Personalizar Header da Escola
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Debug Info */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Debug:</strong> isReady: {isReady ? '✅' : '❌'} | 
            Banco: {isReady ? 'Conectado' : 'Aguardando...'}
          </Typography>
        </Alert>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography fontWeight={600}>✅ Configurações salvas com sucesso!</Typography>
          </Alert>
        )}

        {!isReady && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography fontWeight={600}>⚠️ Aguarde o banco de dados conectar antes de salvar</Typography>
          </Alert>
        )}

        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="🎨 Cores" />
          <Tab label="🖼️ Imagens" />
          <Tab label="✏️ Textos" />
        </Tabs>

        {tabValue === 0 && renderColorsTab()}
        {tabValue === 1 && renderImagesTab()}
        {tabValue === 2 && renderTextTab()}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #eee' }}>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HeaderSettingsDialog;
