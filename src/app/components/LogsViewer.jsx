import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  TablePagination
} from '@mui/material';
import {
  Close,
  Search,
  Print,
  FilterList,
  ExpandMore,
  Visibility,
  Info,
  Warning,
  Error,
  Person,
  School,
  Assignment,
  Message,
  AttachFile,
  Schedule,
  Assessment,
  Security,
  Download
} from '@mui/icons-material';
import { query, orderByChild, limitToLast, startAt, endAt } from '../../firebase';
import { logAction } from '../../services/auditService';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const LogsViewer = ({ open, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stats, setStats] = useState({});
  
  // Estados dos filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    entity: '',
    userId: '',
    userEmail: '',
    level: ''
  });
  
  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Constantes para filtros
  const LOG_ACTIONS = {
    // Usuários
    USER_CREATE: 'user_create',
    USER_UPDATE: 'user_update', 
    USER_DELETE: 'user_delete',
    USER_APPROVE: 'user_approve',
    USER_REJECT: 'user_reject',
    USER_ROLE_CHANGE: 'user_role_change',
    USER_STUDENT_LINK: 'user_student_link',
    USER_STUDENT_UNLINK: 'user_student_unlink',
    USER_ACTIVATE: 'user_activate',
    USER_DEACTIVATE: 'user_deactivate',
    
    // Alunos
    STUDENT_CREATE: 'student_create',
    STUDENT_UPDATE: 'student_update',
    STUDENT_DELETE: 'student_delete',
    STUDENT_ACTIVATE: 'student_activate',
    STUDENT_DEACTIVATE: 'student_deactivate',
    STUDENT_FILE_UPLOAD: 'student_file_upload',
    STUDENT_FILE_DELETE: 'student_file_delete',
    STUDENT_VIEWED: 'student_viewed',
    
    // Escola
    CLASS_CREATE: 'class_create',
    CLASS_UPDATE: 'class_update',
    CLASS_DELETE: 'class_delete',
    PERIOD_CREATE: 'period_create',
    PERIOD_UPDATE: 'period_update',
    PERIOD_DELETE: 'period_delete',
    PERIOD_ACTIVATE: 'period_activate',
    SUBJECT_CREATE: 'subject_create',
    SUBJECT_UPDATE: 'subject_update',
    SUBJECT_DELETE: 'subject_delete',
    NOTICE_CREATE: 'notice_create',
    NOTICE_UPDATE: 'notice_update',
    NOTICE_DELETE: 'notice_delete',
    
    // Grade e Notas
    SCHEDULE_CREATE: 'schedule_create',
    SCHEDULE_UPDATE: 'schedule_update',
    SCHEDULE_DELETE: 'schedule_delete',
    GRADE_CREATE: 'grade_create',
    GRADE_UPDATE: 'grade_update',
    GRADE_DELETE: 'grade_delete',
    ATTENDANCE_CREATE: 'attendance_create',
    ATTENDANCE_UPDATE: 'attendance_update',
    ATTENDANCE_DELETE: 'attendance_delete',
    
    // Mensagens e Diário
    MESSAGE_SENT: 'message_sent',
    MESSAGE_READ: 'message_read',
    MESSAGE_VIEWED: 'message_viewed',
    MESSAGE_SEND_ERROR: 'message_send_error',
    MESSAGE_COMPOSE_STARTED: 'message_compose_started',
    MESSAGE_COMPOSE_CANCELLED: 'message_compose_cancelled',
    MESSAGE_FILTER_CHANGED: 'message_filter_changed',
    
    DIARY_ENTRY_CREATED: 'diary_entry_created',
    DIARY_ENTRY_VIEWED: 'diary_entry_viewed',
    DIARY_ENTRY_ERROR: 'diary_entry_error',
    DIARY_FILTER_CHANGED: 'diary_filter_changed',
    DIARY_COMPOSE_STARTED: 'diary_compose_started',
    DIARY_COMPOSE_CANCELLED: 'diary_compose_cancelled',
    
    // Anexos
    ATTACHMENT_UPLOADED: 'attachment_uploaded',
    ATTACHMENT_DOWNLOADED: 'attachment_downloaded',
    ATTACHMENT_VIEWED: 'attachment_viewed',
    ATTACHMENT_REMOVED: 'attachment_removed',
    ATTACHMENT_UPLOAD_ERROR: 'attachment_upload_error'
  };

  const LOG_LEVELS = {
    INFO: 'info',
    WARNING: 'warning', 
    ERROR: 'error',
    CRITICAL: 'critical'
  };

  const ENTITIES = {
    USER: 'user',
    STUDENT: 'student',
    CLASS: 'class',
    PERIOD: 'period',
    SUBJECT: 'subject',
    NOTICE: 'notice',
    SCHEDULE: 'schedule',
    GRADE: 'grade',
    ATTENDANCE: 'attendance',
    MESSAGE: 'message',
    DIARY: 'diary',
    ATTACHMENT: 'attachment'
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open]);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      console.log('🔍 Iniciando busca por logs...');
      
      const logsRef = ref(db, 'audit_logs');
      
      // Primeiro, tentar buscar todos os logs sem filtro
      console.log('🔍 Tentando buscar todos os logs...');
      const snapshot = await get(logsRef);
      
      console.log('🔍 Debug logs - snapshot exists:', snapshot.exists());
      
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        console.log('🔍 Debug logs - raw data keys:', Object.keys(rawData));
        console.log('🔍 Debug logs - sample data:', Object.entries(rawData).slice(0, 3));
        
        const logsData = Object.entries(rawData).map(([id, log]) => ({
          id,
          ...log,
          changes: log.changes ? (typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes) : null,
          metadata: log.metadata ? (typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata) : {}
        }));
        
        console.log('🔍 Debug logs - processed data length:', logsData.length);
        console.log('🔍 Debug logs - sample processed:', logsData.slice(0, 2));
        
        // Ordenar por timestamp (mais recentes primeiro)
        const sortedLogs = logsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        console.log('✅ Logs carregados com sucesso:', sortedLogs.length);
        setLogs(sortedLogs);
        calculateStats(sortedLogs);
      } else {
        console.log('📋 Nenhum log encontrado no Firebase - collection vazia');
        setLogs([]);
        setStats({});
      }
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
      console.error('❌ Stack trace:', error.stack);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logsData) => {
    const stats = {
      total: logsData.length,
      byLevel: {},
      byAction: {},
      byEntity: {},
      byUser: {},
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    };

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    logsData.forEach(log => {
      // Por nível
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Por ação
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // Por entidade
      stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
      
      // Por usuário
      const userKey = log.userEmail || log.userId;
      stats.byUser[userKey] = (stats.byUser[userKey] || 0) + 1;
      
      // Por período
      const logDate = log.timestamp.split('T')[0];
      if (logDate === today) stats.today++;
      if (logDate >= weekAgo) stats.thisWeek++;
      if (logDate >= monthAgo) stats.thisMonth++;
    });

    setStats(stats);
  };

  const applyFilters = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

    let filtered = logs;

    // Filtro por data
    if (filters.startDate) {
      filtered = filtered.filter(log => log.timestamp.split('T')[0] >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(log => log.timestamp.split('T')[0] <= filters.endDate);
    }

    // Filtro por ação
    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // Filtro por entidade
    if (filters.entity) {
      filtered = filtered.filter(log => log.entity === filters.entity);
    }

    // Filtro por usuário (ID)
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId?.includes(filters.userId));
    }

    // Filtro por email
    if (filters.userEmail) {
      filtered = filtered.filter(log => 
        log.userEmail?.toLowerCase().includes(filters.userEmail.toLowerCase())
      );
    }

    // Filtro por nível
    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    setFilteredLogs(filtered);
    setPage(0); // Reset página ao filtrar
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      action: '',
      entity: '',
      userId: '',
      userEmail: '',
      level: ''
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getActionDescription = (action) => {
    const descriptions = {
      user_create: 'Criou usuário',
      user_update: 'Atualizou usuário',
      user_delete: 'Excluiu usuário',
      user_approve: 'Aprovou usuário',
      user_reject: 'Rejeitou usuário',
      user_role_change: 'Alterou perfil',
      user_student_link: 'Vinculou aluno',
      user_student_unlink: 'Desvinculou aluno',
      user_activate: 'Ativou usuário',
      user_deactivate: 'Desativou usuário',
      
      student_create: 'Cadastrou aluno',
      student_update: 'Atualizou aluno',
      student_delete: 'Excluiu aluno',
      student_activate: 'Ativou aluno',
      student_deactivate: 'Desativou aluno',
      student_file_upload: 'Upload de arquivo',
      student_file_delete: 'Excluiu arquivo',
      student_viewed: 'Visualizou aluno',
      
      class_create: 'Criou turma',
      class_update: 'Atualizou turma',
      class_delete: 'Excluiu turma',
      period_create: 'Criou período',
      period_update: 'Atualizou período',
      period_delete: 'Excluiu período',
      period_activate: 'Ativou período',
      subject_create: 'Criou disciplina',
      subject_update: 'Atualizou disciplina',
      subject_delete: 'Excluiu disciplina',
      notice_create: 'Criou aviso',
      notice_update: 'Atualizou aviso',
      notice_delete: 'Excluiu aviso',
      
      schedule_create: 'Criou horário',
      schedule_update: 'Atualizou horário',
      schedule_delete: 'Excluiu horário',
      grade_create: 'Lançou nota',
      grade_update: 'Atualizou nota',
      grade_delete: 'Excluiu nota',
      attendance_create: 'Registrou falta',
      attendance_update: 'Atualizou falta',
      attendance_delete: 'Excluiu falta',
      
      message_sent: 'Enviou mensagem',
      message_read: 'Leu mensagem',
      message_viewed: 'Visualizou mensagem',
      message_send_error: 'Erro ao enviar',
      message_compose_started: 'Iniciou composição',
      message_compose_cancelled: 'Cancelou composição',
      message_filter_changed: 'Alterou filtro',
      
      diary_entry_created: 'Criou entrada diário',
      diary_entry_viewed: 'Visualizou diário',
      diary_entry_error: 'Erro no diário',
      diary_filter_changed: 'Alterou filtro diário',
      diary_compose_started: 'Iniciou diário',
      diary_compose_cancelled: 'Cancelou diário',
      
      attachment_uploaded: 'Upload anexo',
      attachment_downloaded: 'Download anexo',
      attachment_viewed: 'Visualizou anexo',
      attachment_removed: 'Removeu anexo',
      attachment_upload_error: 'Erro upload'
    };

    return descriptions[action] || action;
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'info': return <Info sx={{ color: '#2196F3', fontSize: 16 }} />;
      case 'warning': return <Warning sx={{ color: '#FF9800', fontSize: 16 }} />;
      case 'error': return <Error sx={{ color: '#F44336', fontSize: 16 }} />;
      case 'critical': return <Error sx={{ color: '#D32F2F', fontSize: 16 }} />;
      default: return <Info sx={{ color: '#9E9E9E', fontSize: 16 }} />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'info': return '#E3F2FD';
      case 'warning': return '#FFF3E0';
      case 'error': return '#FFEBEE';
      case 'critical': return '#FFCDD2';
      default: return '#F5F5F5';
    }
  };

  const getEntityIcon = (entity) => {
    switch (entity) {
      case 'user': return <Person sx={{ fontSize: 16 }} />;
      case 'student': return <School sx={{ fontSize: 16 }} />;
      case 'class': case 'period': case 'subject': case 'notice': return <Assignment sx={{ fontSize: 16 }} />;
      case 'message': return <Message sx={{ fontSize: 16 }} />;
      case 'attachment': return <AttachFile sx={{ fontSize: 16 }} />;
      case 'schedule': return <Schedule sx={{ fontSize: 16 }} />;
      case 'grade': case 'attendance': return <Assessment sx={{ fontSize: 16 }} />;
      case 'diary': return <Assignment sx={{ fontSize: 16 }} />;
      default: return <Security sx={{ fontSize: 16 }} />;
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Relatório de Logs - Sistema ELO</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1976d2; text-align: center; }
            h2 { color: #424242; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .stats { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; min-width: 150px; }
            .filters { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .level-info { color: #2196F3; }
            .level-warning { color: #FF9800; }
            .level-error { color: #F44336; }
            .level-critical { color: #D32F2F; font-weight: bold; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>📋 Relatório de Logs de Auditoria</h1>
          <p><strong>Data do Relatório:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Total de Registros:</strong> ${filteredLogs.length}</p>
          
          ${Object.keys(filters).some(key => filters[key]) ? `
          <div class="filters">
            <h2>🔍 Filtros Aplicados</h2>
            ${filters.startDate ? `<p><strong>Data Inicial:</strong> ${new Date(filters.startDate).toLocaleDateString('pt-BR')}</p>` : ''}
            ${filters.endDate ? `<p><strong>Data Final:</strong> ${new Date(filters.endDate).toLocaleDateString('pt-BR')}</p>` : ''}
            ${filters.action ? `<p><strong>Ação:</strong> ${getActionDescription(filters.action)}</p>` : ''}
            ${filters.entity ? `<p><strong>Entidade:</strong> ${filters.entity}</p>` : ''}
            ${filters.userEmail ? `<p><strong>Email do Usuário:</strong> ${filters.userEmail}</p>` : ''}
            ${filters.userId ? `<p><strong>ID do Usuário:</strong> ${filters.userId}</p>` : ''}
            ${filters.level ? `<p><strong>Nível:</strong> ${filters.level}</p>` : ''}
          </div>
          ` : ''}
          
          <div class="stats">
            <div class="stat-card">
              <h3>📊 Por Nível</h3>
              ${Object.entries(stats.byLevel || {}).map(([level, count]) => 
                `<p class="level-${level}">${level.toUpperCase()}: ${count}</p>`
              ).join('')}
            </div>
            <div class="stat-card">
              <h3>👥 Por Entidade</h3>
              ${Object.entries(stats.byEntity || {}).slice(0, 5).map(([entity, count]) => 
                `<p>${entity}: ${count}</p>`
              ).join('')}
            </div>
            <div class="stat-card">
              <h3>📈 Período</h3>
              <p>Hoje: ${stats.today || 0}</p>
              <p>Esta Semana: ${stats.thisWeek || 0}</p>
              <p>Este Mês: ${stats.thisMonth || 0}</p>
            </div>
          </div>
          
          <h2>📝 Registros de Log</h2>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Nível</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(log => `
                <tr>
                  <td>${formatDate(log.timestamp)}</td>
                  <td>${log.userEmail || log.userName || log.userId}</td>
                  <td>${getActionDescription(log.action)}</td>
                  <td>${log.entity}</td>
                  <td class="level-${log.level}">${(log.level || 'info').toUpperCase()}</td>
                  <td>${log.details || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <footer style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
            <p>Sistema ELO - Escola de Educação Infantil</p>
            <p>Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}</p>
          </footer>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

    // Função de teste para validar o sistema de logs
  const testLogSystem = async () => {
    try {
      console.log('🧪 Testando sistema de logs...');
      
      // Obter dados do usuário do localStorage
      let userData = null;
      try {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          userData = JSON.parse(storedData);
          console.log('👤 Dados do usuário:', userData);
        }
      } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
      }

      if (!userData) {
        alert('❌ Usuário não logado! Faça login primeiro.');
        return;
      }

      // Testar formato novo
      await logAction('test_new_format', userData.id || userData.uid, {
        entityId: 'test-entity-123',
        description: 'Teste do sistema de logs - formato novo',
        changes: { teste: 'valor teste novo' }
      });
      
      // Testar formato antigo (compatibilidade)
      await logAction({
        action: 'test_old_format',
        entity: 'test',
        entityId: 'test-entity-456',
        details: 'Teste do sistema de logs - formato antigo',
        changes: { teste: 'valor teste antigo' },
        userData: userData
      });

      console.log('✅ Logs de teste criados com sucesso!');
      
      // Recarregar os logs
      setTimeout(() => {
        fetchLogs();
      }, 1000);
      
      alert('🧪 Logs de teste criados! A tela será atualizada em 1 segundo.');
      
    } catch (error) {
      console.error('❌ Erro ao testar logs:', error);
      alert('❌ Erro ao criar logs de teste: ' + error.message);
    }
  };

  const exportToCsv = () => {
    const headers = ['Data/Hora', 'Usuário', 'Email', 'Ação', 'Entidade', 'Nível', 'Detalhes', 'Mudanças'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${formatDate(log.timestamp)}"`,
        `"${log.userName || ''}"`,
        `"${log.userEmail || ''}"`,
        `"${getActionDescription(log.action)}"`,
        `"${log.entity}"`,
        `"${(log.level || 'info').toUpperCase()}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        `"${log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">📋 Logs de Auditoria do Sistema</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="🧪 Testar Sistema de Logs">
            <Button 
              variant="outlined" 
              size="small" 
              onClick={testLogSystem}
              sx={{ mr: 1 }}
            >
              🧪 Teste
            </Button>
          </Tooltip>
          <Tooltip title="🔄 Recarregar Logs">
            <IconButton onClick={fetchLogs} color="primary">
              <Search />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exportar CSV">
            <IconButton onClick={exportToCsv} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Imprimir">
            <IconButton onClick={handlePrint} color="primary">
              <Print />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Estatísticas */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>📊 Estatísticas</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">{stats.total || 0}</Typography>
                  <Typography variant="body2">Total de Logs</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">{stats.today || 0}</Typography>
                  <Typography variant="body2">Hoje</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">{stats.thisWeek || 0}</Typography>
                  <Typography variant="body2">Esta Semana</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">{stats.thisMonth || 0}</Typography>
                  <Typography variant="body2">Este Mês</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Gráfico de níveis */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Por Nível de Severidade:</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {Object.entries(stats.byLevel || {}).map(([level, count]) => (
                  <Chip 
                    key={level}
                    icon={getLevelIcon(level)}
                    label={`${level.toUpperCase()}: ${count}`}
                    sx={{ bgcolor: getLevelColor(level) }}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">🔍 Filtros</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3} sx={{ width: '100%' }}>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data Inicial"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: '250px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data Final"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: '250px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Ação</InputLabel>
                  <Select
                    value={filters.action}
                    onChange={(e) => setFilters({...filters, action: e.target.value})}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {Object.entries(LOG_ACTIONS).map(([key, value]) => (
                      <MenuItem key={value} value={value}>
                        {getActionDescription(value)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Entidade</InputLabel>
                  <Select
                    value={filters.entity}
                    onChange={(e) => setFilters({...filters, entity: e.target.value})}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {Object.values(ENTITIES).map(entity => (
                      <MenuItem key={entity} value={entity}>{entity}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="Email do Usuário"
                  value={filters.userEmail}
                  onChange={(e) => setFilters({...filters, userEmail: e.target.value})}
                  placeholder="Digite o email..."
                  sx={{ minWidth: '250px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <TextField
                  fullWidth
                  label="ID do Usuário"
                  value={filters.userId}
                  onChange={(e) => setFilters({...filters, userId: e.target.value})}
                  placeholder="Digite o ID..."
                  sx={{ minWidth: '250px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px' }}>
                <FormControl fullWidth sx={{ minWidth: '250px' }}>
                  <InputLabel>Nível</InputLabel>
                  <Select
                    value={filters.level}
                    onChange={(e) => setFilters({...filters, level: e.target.value})}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {Object.values(LOG_LEVELS).map(level => (
                      <MenuItem key={level} value={level}>{level.toUpperCase()}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ minWidth: '300px', display: 'flex', alignItems: 'center' }}>
                <Button 
                  variant="outlined" 
                  onClick={clearFilters} 
                  startIcon={<FilterList />}
                  fullWidth
                  sx={{ minWidth: '250px' }}
                >
                  Limpar Filtros
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Tabela de Logs */}
        <Paper>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredLogs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhum log encontrado com os filtros aplicados.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Hora</TableCell>
                      <TableCell>Usuário</TableCell>
                      <TableCell>Ação</TableCell>
                      <TableCell>Entidade</TableCell>
                      <TableCell>Nível</TableCell>
                      <TableCell>Detalhes</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>{formatDate(log.timestamp)}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {log.userEmail || log.userName || log.userId}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {log.userRole || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getEntityIcon(log.entity)}
                              {getActionDescription(log.action)}
                            </Box>
                          </TableCell>
                          <TableCell>{log.entity}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getLevelIcon(log.level)}
                              {(log.level || 'info').toUpperCase()}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {log.details || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedLog(log);
                                setDetailsOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredLogs.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[25, 50, 100, 200]}
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                }
                labelRowsPerPage="Linhas por página:"
              />
            </>
          )}
        </Paper>
      </DialogContent>

      {/* Dialog de Detalhes */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>📋 Detalhes do Log</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Data/Hora:</Typography>
                  <Typography variant="body2" gutterBottom>{formatDate(selectedLog.timestamp)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">ID do Log:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedLog.id}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Usuário:</Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedLog.userEmail || selectedLog.userName || selectedLog.userId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Perfil:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedLog.userRole || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Ação:</Typography>
                  <Typography variant="body2" gutterBottom>{getActionDescription(selectedLog.action)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Entidade:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedLog.entity}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">ID da Entidade:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedLog.entityId || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary">Nível:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getLevelIcon(selectedLog.level)}
                    <Typography variant="body2">{(selectedLog.level || 'info').toUpperCase()}</Typography>
                  </Box>
                </Grid>
                {selectedLog.details && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary">Detalhes:</Typography>
                    <Typography variant="body2" gutterBottom>{selectedLog.details}</Typography>
                  </Grid>
                )}
                {selectedLog.changes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary">Mudanças:</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                        {JSON.stringify(selectedLog.changes, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary">Metadados:</Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="primary">User Agent:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                    {selectedLog.userAgent || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default LogsViewer;