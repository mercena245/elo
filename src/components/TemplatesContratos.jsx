"use client";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Upload,
  Download,
  Delete,
  Edit,
  Visibility,
  Description,
  ExpandMore,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import contratoTemplateService from '../services/contratoTemplateService';

export default function TemplatesContratos({ getData, setData, pushData, removeData, updateData, storage }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [novoTemplate, setNovoTemplate] = useState({
    nome: '',
    tipoContrato: 'matricula',
    arquivo: null
  });
  const [uploading, setUploading] = useState(false);

  // Carregar templates do Firebase
  useEffect(() => {
    carregarTemplates();
  }, []);

  const carregarTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await getData('configuracoes/contratos/templates');
      
      if (templatesData) {
        const templatesArray = Object.entries(templatesData).map(([id, data]) => ({
          id,
          ...data
        }));
        setTemplates(templatesArray);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Upload de novo template
  const handleUploadTemplate = async () => {
    if (!novoTemplate.nome || !novoTemplate.arquivo) {
      alert('Preencha o nome e selecione um arquivo');
      return;
    }

    try {
      setUploading(true);

      // Ler o arquivo como base64 para salvar no banco
      const arquivoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // Remove "data:...;base64,"
        reader.onerror = reject;
        reader.readAsDataURL(novoTemplate.arquivo);
      });

      // Upload do arquivo para Firebase Storage (backup)
      const timestamp = Date.now();
      const fileName = `contratos/${timestamp}_${novoTemplate.arquivo.name}`;
      
      // Usar _storage para compatibilidade com outros componentes
      const storageInstance = storage._storage || storage;
      const fileRef = storageRef(storageInstance, fileName);
      
      // Upload usando a API modular do Firebase v9+
      await uploadBytes(fileRef, novoTemplate.arquivo);
      const downloadURL = await getDownloadURL(fileRef);

      // Salvar metadados no Realtime Database (incluindo base64)
      const templateData = {
        nome: novoTemplate.nome,
        tipoContrato: novoTemplate.tipoContrato,
        arquivoUrl: downloadURL,
        arquivoPath: fileName,
        arquivoNome: novoTemplate.arquivo.name,
        arquivoBase64: arquivoBase64, // Salvar conteúdo em base64
        arquivoSize: novoTemplate.arquivo.size,
        ativo: true,
        criadoEm: new Date().toISOString(),
        modificadoEm: new Date().toISOString()
      };

      await pushData('configuracoes/contratos/templates', templateData);

      // Recarregar lista
      await carregarTemplates();

      // Limpar form
      setNovoTemplate({
        nome: '',
        tipoContrato: 'matricula',
        arquivo: null
      });
      setUploadDialogOpen(false);

      alert('Template cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload do template:', error);
      alert('Erro ao fazer upload do template. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  // Alternar status ativo/inativo
  const handleToggleAtivo = async (templateId, ativoAtual) => {
    try {
      await updateData(`configuracoes/contratos/templates/${templateId}`, {
        ativo: !ativoAtual,
        modificadoEm: new Date().toISOString()
      });
      await carregarTemplates();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do template');
    }
  };

  // Excluir template
  const handleExcluirTemplate = async (templateId, arquivoUrl, arquivoPath) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
      return;
    }

    try {
      // Excluir arquivo do Storage usando a API modular
      const storageInstance = storage._storage || storage;
      
      // Usar arquivoPath se disponível, senão extrair da URL
      let pathToDelete = arquivoPath;
      if (!pathToDelete && arquivoUrl) {
        // Extrair path da URL como fallback
        const url = new URL(arquivoUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+)/);
        if (pathMatch) {
          pathToDelete = decodeURIComponent(pathMatch[1].split('?')[0]);
        }
      }
      
      if (pathToDelete) {
        const fileRef = storageRef(storageInstance, pathToDelete);
        await deleteObject(fileRef);
        console.log('✅ Arquivo excluído do Storage:', pathToDelete);
      }

      // Excluir do Realtime Database
      await removeData(`configuracoes/contratos/templates/${templateId}`);

      await carregarTemplates();
      alert('Template excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      alert('Erro ao excluir template: ' + error.message);
    }
  };

  // Download do template base de exemplo
  const handleDownloadTemplateBase = () => {
    // Redirecionar para o arquivo de exemplo na pasta public
    window.open('/data/template_contrato_base.docx', '_blank');
  };

  // Placeholders disponíveis
  const placeholders = contratoTemplateService.getPlaceholdersDisponiveis();

  return (
    <Box>
      {/* Cabeçalho */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description /> Templates de Contratos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Gerencie os templates de contratos que serão preenchidos automaticamente com os dados dos alunos
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Adicionar Template
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadTemplateBase}
            >
              Baixar Template Base
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tutorial */}
      <Accordion sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Info color="primary" />
            <Typography variant="h6">Como Configurar um Template</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ p: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>O que são Templates de Contratos?</strong>
              <br />
              Templates são documentos Word (.docx) com marcadores especiais que serão substituídos automaticamente pelos dados do aluno, responsáveis e escola.
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              📝 Passo a Passo:
            </Typography>

            <Box component="ol" sx={{ pl: 2 }}>
              <li>
                <Typography variant="body1" gutterBottom>
                  <strong>Baixe o Template Base:</strong> Clique no botão "Baixar Template Base" acima. Este é um modelo pronto que você pode editar.
                </Typography>
              </li>
              <li>
                <Typography variant="body1" gutterBottom>
                  <strong>Abra no Word:</strong> Abra o arquivo baixado no Microsoft Word ou LibreOffice.
                </Typography>
              </li>
              <li>
                <Typography variant="body1" gutterBottom>
                  <strong>Edite o Conteúdo:</strong> Altere o texto do contrato conforme necessário, mantendo os marcadores entre chaves.
                </Typography>
              </li>
              <li>
                <Typography variant="body1" gutterBottom>
                  <strong>Use os Marcadores:</strong> Os marcadores devem estar no formato <code>{'{'+'nomeAluno'+'}'}</code>. Veja a lista completa abaixo.
                </Typography>
              </li>
              <li>
                <Typography variant="body1" gutterBottom>
                  <strong>Salve como .docx:</strong> Salve o arquivo no formato Word (.docx).
                </Typography>
              </li>
              <li>
                <Typography variant="body1" gutterBottom>
                  <strong>Faça Upload:</strong> Clique em "Adicionar Template" acima e faça o upload do seu arquivo.
                </Typography>
              </li>
            </Box>

            <Alert severity="warning" sx={{ mt: 3 }}>
              <strong>⚠️ Importante:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Os marcadores devem estar EXATAMENTE como listados abaixo (respeitando maiúsculas e minúsculas)</li>
                <li>Sempre use chaves: <code>{'{'+'marcador'+'}'}</code></li>
                <li>Não adicione espaços dentro das chaves: <code>{'{'+' nomeAluno '+'}'}</code> ❌</li>
                <li>Mantenha a formatação (negrito, tamanho, cor) fora das chaves</li>
              </ul>
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              💡 Exemplo de Uso:
            </Typography>

            <Paper sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <code>
                CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS
                <br /><br />
                Pelo presente instrumento, a <strong>{'{'+'nomeEscola'+'}'}</strong>, CNPJ {'{'+'cnpjEscola'+'}'}, 
                localizada em {'{'+'enderecoEscola'+'}'}, e os responsáveis:
                <br /><br />
                <strong>MÃE:</strong> {'{'+'nomeMae'+'}'}, CPF {'{'+'cpfMae'+'}'}
                <br />
                <strong>PAI:</strong> {'{'+'nomePai'+'}'}, CPF {'{'+'cpfPai'+'}'}
                <br /><br />
                Para a matrícula do aluno <strong>{'{'+'nomeAluno'+'}'}</strong>, CPF {'{'+'cpfAluno'+'}'}, 
                nascido em {'{'+'dataNascimento'+'}'}, na turma {'{'+'turma'+'}'}, turno {'{'+'turno'+'}'}.
                <br /><br />
                Valor da mensalidade: <strong>{'{'+'valorFinal'+'}'}</strong>
                <br />
                Vencimento: dia {'{'+'diaVencimento'+'}'} de cada mês.
              </code>
            </Paper>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Lista de Marcadores Disponíveis */}
      <Accordion sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="h6">Lista Completa de Marcadores</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ p: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Copie e cole os marcadores abaixo no seu template Word. O sistema substituirá automaticamente pelos dados reais.
            </Alert>

            {Object.entries(placeholders).map(([categoria, items]) => (
              <Box key={categoria} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize', color: 'primary.main' }}>
                  {categoria === 'aluno' && '👨‍🎓 Dados do Aluno'}
                  {categoria === 'mae' && '👩 Dados da Mãe'}
                  {categoria === 'pai' && '👨 Dados do Pai'}
                  {categoria === 'responsavelFinanceiro' && '💳 Responsável Financeiro'}
                  {categoria === 'escola' && '🏫 Dados da Escola'}
                  {categoria === 'financeiro' && '💰 Dados Financeiros'}
                  {categoria === 'datas' && '📅 Datas'}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Marcador</strong></TableCell>
                        <TableCell><strong>Descrição</strong></TableCell>
                        <TableCell width={100}><strong>Copiar</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.tag}>
                          <TableCell>
                            <code style={{ padding: '2px 6px', background: '#f5f5f5', borderRadius: '4px' }}>
                              {'{'}{item.tag}{'}'}
                            </code>
                          </TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                navigator.clipboard.writeText(`{${item.tag}}`);
                                alert(`Marcador {${item.tag}} copiado!`);
                              }}
                            >
                              <Description fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Lista de Templates Cadastrados */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Templates Cadastrados
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : templates.length === 0 ? (
            <Alert severity="info">
              Nenhum template cadastrado. Clique em "Adicionar Template" para começar.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nome</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Arquivo</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Criado em</strong></TableCell>
                    <TableCell align="center"><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>{template.nome}</TableCell>
                      <TableCell>
                        <Chip 
                          label={template.tipoContrato} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{template.arquivoNome}</TableCell>
                      <TableCell>
                        <Switch
                          checked={template.ativo}
                          onChange={() => handleToggleAtivo(template.id, template.ativo)}
                          color="success"
                        />
                        <Chip 
                          label={template.ativo ? 'Ativo' : 'Inativo'} 
                          size="small" 
                          color={template.ativo ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(template.criadoEm).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          href={template.arquivoUrl}
                          target="_blank"
                          title="Baixar template"
                        >
                          <Download />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleExcluirTemplate(template.id, template.arquivoUrl, template.arquivoPath)}
                          title="Excluir template"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Upload */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Novo Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nome do Template"
              value={novoTemplate.nome}
              onChange={(e) => setNovoTemplate({ ...novoTemplate, nome: e.target.value })}
              fullWidth
              required
              helperText="Ex: Contrato de Matrícula 2025"
            />

            <TextField
              select
              label="Tipo de Contrato"
              value={novoTemplate.tipoContrato}
              onChange={(e) => setNovoTemplate({ ...novoTemplate, tipoContrato: e.target.value })}
              fullWidth
              SelectProps={{ native: true }}
            >
              <option value="matricula">Matrícula</option>
              <option value="rematricula">Rematrícula</option>
              <option value="transferencia">Transferência</option>
              <option value="outro">Outro</option>
            </TextField>

            <Box>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<Upload />}
              >
                {novoTemplate.arquivo ? novoTemplate.arquivo.name : 'Selecionar Arquivo .docx'}
                <input
                  type="file"
                  hidden
                  accept=".docx"
                  onChange={(e) => setNovoTemplate({ ...novoTemplate, arquivo: e.target.files[0] })}
                />
              </Button>
              {novoTemplate.arquivo && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  ✓ Arquivo selecionado: {novoTemplate.arquivo.name}
                </Typography>
              )}
            </Box>

            <Alert severity="info">
              Certifique-se de que o arquivo está no formato .docx e contém os marcadores corretos.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUploadTemplate} 
            variant="contained" 
            disabled={uploading || !novoTemplate.nome || !novoTemplate.arquivo}
          >
            {uploading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
