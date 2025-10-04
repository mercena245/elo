
"use client";

import React, { useEffect, useState, useRef } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import { 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Box, 
  CircularProgress, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Alert,
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { db, ref, get, set, auth, onAuthStateChanged } from '../../firebase';
import { storage } from '../../firebase-storage';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auditService, LOG_ACTIONS } from '../../services/auditService';
import { financeiroService } from '../../services/financeiroService';

const Alunos = () => {
  // Marcar/desmarcar anexo para exclusão (por nome)
  const handleMarcarParaExcluir = (nome) => {
    setAnexosParaExcluir(prev =>
      prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome]
    );
  };
  // Estado para anexos marcados para exclusão
  const [anexosParaExcluir, setAnexosParaExcluir] = useState([]);
  // Estado para dialog de anexos enviados
  const [dialogAnexosOpen, setDialogAnexosOpen] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState({});
  const [loading, setLoading] = useState(true);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editAluno, setEditAluno] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [formError, setFormError] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroMatricula, setFiltroMatricula] = useState('');
  const [formStep, setFormStep] = useState(1); // 1 = dados pessoais, 2 = dados financeiros
  const [financeiroError, setFinanceiroError] = useState('');
  const [gerandoTitulos, setGerandoTitulos] = useState(false);
  const [resultadoTitulos, setResultadoTitulos] = useState(null);
  const [statusMatricula, setStatusMatricula] = useState(null);
  const [inativarDialogOpen, setInativarDialogOpen] = useState(false);
  const [inativarMotivo, setInativarMotivo] = useState('');
  // Estados para inadimplência
  const [inadimplenciaDialogOpen, setInadimplenciaDialogOpen] = useState(false);
  const [titulosEmAberto, setTitulosEmAberto] = useState([]);
  const [carregandoTitulos, setCarregandoTitulos] = useState(false);
  const [debugModalState, setDebugModalState] = useState('fechado');
  // Estado para controlar expansão dos cards
  const [cardsExpandidos, setCardsExpandidos] = useState({});
  // Estado para anexos temporários
  const [anexosSelecionados, setAnexosSelecionados] = useState([]);
  const inputFileRef = useRef(null);

  // Remover anexo do Storage e do registro do aluno
  const handleRemoverAnexo = async (anexo, idx) => {
    if (!editForm.anexos || !editForm.anexos.length) return;
    try {
      // Remove do Storage
      const alunoId = isNew
        ? `id_aluno_${editForm.nome.replace(/\s/g, '').toLowerCase()}_${editForm.matricula}`
        : editAluno.id;
  const matricula = editForm.matricula || (editAluno && editAluno.matricula) || '';
  const fileRef = storageRef(storage, `anexos_alunos/${alunoId}_${matricula}/${anexo.name}`);
      await deleteObject(fileRef);
      // Remove do registro do aluno
      const novosAnexos = editForm.anexos.filter((_, i) => i !== idx);
      const dadosAtualizados = { ...editForm, anexos: novosAnexos };
      if (isNew) {
        const novoId = alunoId;
        await set(ref(db, `alunos/${novoId}`), dadosAtualizados);
        // Log da remoção de anexo
        await auditService.logAction(
          LOG_ACTIONS.STUDENT_FILE_DELETE,
          userId,
          {
            entityId: novoId,
            description: `Anexo removido: ${anexo.name}`,
            changes: { anexoRemovido: anexo.name }
          }
        );
      } else if (editAluno && editAluno.id) {
        await set(ref(db, `alunos/${editAluno.id}`), dadosAtualizados);
        // Log da remoção de anexo
        await auditService.logAction(
          LOG_ACTIONS.STUDENT_FILE_DELETE,
          userId,
          {
            entityId: editAluno.id,
            description: `Anexo removido: ${anexo.name}`,
            changes: { anexoRemovido: anexo.name }
          }
        );
      }
      setEditForm(dadosAtualizados);
    } catch (err) {
      setFormError('Erro ao remover anexo.');
    }
  };
  
  // Função para alternar a expansão dos cards
  const toggleCardExpansao = (alunoId, event) => {
    event.stopPropagation(); // Impede que o clique no dropdown abra o modal de edição
    setCardsExpandidos(prev => ({
      ...prev,
      [alunoId]: !prev[alunoId]
    }));
  };
  
  // Função para verificar e atualizar status de inadimplência automaticamente
  const verificarEAtualizarInadimplencia = async (alunos) => {
    try {
      console.log('🔄 Verificando inadimplência de todos os alunos...');
      const hoje = new Date().toISOString().split('T')[0];
      let alunosAtualizados = 0;
      
      for (const aluno of alunos) {
        try {
          // Buscar títulos pendentes do aluno
          const resultado = await financeiroService.buscarTitulosAluno(aluno.id, { status: 'pendente' });
          
          if (resultado.success && resultado.titulos) {
            // Verificar se há títulos vencidos
            const titulosVencidos = resultado.titulos.filter(titulo => titulo.vencimento < hoje);
            
            const statusAtual = aluno.financeiro?.status || 'ativo';
            const novoStatus = titulosVencidos.length > 0 ? 'inadimplente' : 'ativo';
            
            // Atualizar apenas se houve mudança
            if (statusAtual !== novoStatus) {
              console.log(`💰 Atualizando status de ${aluno.nome}: ${statusAtual} → ${novoStatus}`);
              
              const alunoAtualizado = {
                ...aluno,
                financeiro: {
                  ...aluno.financeiro,
                  status: novoStatus,
                  ultimaVerificacao: new Date().toISOString(),
                  titulosVencidos: titulosVencidos.length
                }
              };
              
              await set(ref(db, `alunos/${aluno.id}`), alunoAtualizado);
              alunosAtualizados++;
              
              // Log da atualização de status
              if (auditService && LOG_ACTIONS) {
                await auditService.logAction(
                  LOG_ACTIONS.STUDENT_UPDATE,
                  userId,
                  {
                    entityId: aluno.id,
                    description: `Status financeiro atualizado automaticamente: ${aluno.nome} - ${statusAtual} → ${novoStatus}`,
                    changes: {
                      statusFinanceiroAnterior: statusAtual,
                      statusFinanceiroNovo: novoStatus,
                      titulosVencidos: titulosVencidos.length,
                      verificacaoAutomatica: true
                    }
                  }
                );
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao verificar inadimplência do aluno ${aluno.nome}:`, error);
        }
      }
      
      console.log(`✅ Verificação concluída. ${alunosAtualizados} alunos atualizados.`);
      return alunosAtualizados;
    } catch (error) {
      console.error('Erro na verificação automática de inadimplência:', error);
      return 0;
    }
  };
  
  // Função para buscar títulos vencidos de um aluno específico
  // Função para buscar títulos vencidos de um aluno específico
  const buscarTitulosVencidos = async (alunoId) => {
    try {
      console.log('🔍 Buscando títulos VENCIDOS para aluno:', alunoId);
      
      if (!financeiroService || !financeiroService.buscarTitulosAluno) {
        console.error('❌ FinanceiroService não está disponível');
        return [];
      }
      
      const resultado = await financeiroService.buscarTitulosAluno(alunoId, { status: 'pendente' });
      console.log('📊 Resultado da busca de títulos:', resultado);
      
      if (resultado.success && resultado.titulos) {
        const hoje = new Date().toISOString().split('T')[0];
        console.log('📅 Data de hoje:', hoje);
        
        const titulosVencidos = resultado.titulos.filter(titulo => {
          const isVencido = titulo.vencimento < hoje;
          console.log(`📋 ${titulo.descricao} - Vencimento: ${titulo.vencimento} - VENCIDO: ${isVencido}`);
          return isVencido;
        });
        
        console.log('✅ Títulos VENCIDOS encontrados:', titulosVencidos.length);
        return titulosVencidos;
      }
      
      console.log('❌ Nenhum título encontrado');
      return [];
    } catch (error) {
      console.error('💥 Erro ao buscar títulos vencidos:', error);
      return [];
    }
  };

  // Função para buscar títulos em aberto (mantida para compatibilidade)
  const buscarTitulosEmAberto = async (alunoId) => {
    try {
      console.log('🔍 === BUSCA DE TÍTULOS INICIADA ===');
      console.log('🆔 ID do aluno:', alunoId);
      console.log('🛠️ FinanceiroService disponível:', !!financeiroService);
      console.log('🛠️ Método buscarTitulosAluno disponível:', !!financeiroService?.buscarTitulosAluno);
      
      if (!financeiroService || !financeiroService.buscarTitulosAluno) {
        console.error('❌ FinanceiroService não está disponível');
        return [];
      }
      
      // Fazer a busca
      console.log('📡 Fazendo requisição ao Firebase...');
      const resultado = await financeiroService.buscarTitulosAluno(alunoId, { status: 'pendente' });
      console.log('📊 Resultado COMPLETO da busca:', JSON.stringify(resultado, null, 2));
      
      if (resultado.success) {
        console.log('✅ Busca bem-sucedida!');
        console.log('📋 Total de títulos pendentes encontrados:', resultado.titulos?.length || 0);
        
        if (resultado.titulos && resultado.titulos.length > 0) {
          console.log('📝 Lista de todos os títulos:', resultado.titulos);
          
          // Filtrar títulos vencidos e próximos ao vencimento
          const hoje = new Date().toISOString().split('T')[0];
          console.log('📅 Data de hoje para comparação:', hoje);
          
          const titulosRelevantes = resultado.titulos.filter(titulo => {
            const vencimento = titulo.vencimento;
            const isVencido = vencimento <= hoje;
            const dataVencimento = new Date(vencimento);
            const dataLimite = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const isProximo = dataVencimento <= dataLimite;
            
            console.log(`📋 Analisando título:`);
            console.log(`   - Descrição: ${titulo.descricao}`);
            console.log(`   - Valor: R$ ${titulo.valor}`);
            console.log(`   - Vencimento: ${vencimento}`);
            console.log(`   - É vencido? ${isVencido}`);
            console.log(`   - É próximo (30 dias)? ${isProximo}`);
            console.log(`   - Será incluído? ${isVencido || isProximo}`);
            
            return isVencido || isProximo;
          });
          
          console.log('✅ Títulos relevantes filtrados:', titulosRelevantes.length);
          console.log('📝 Lista de títulos relevantes:', titulosRelevantes);
          return titulosRelevantes;
        } else {
          console.log('ℹ️ Nenhum título pendente encontrado para este aluno');
          return [];
        }
      } else {
        console.log('❌ Busca falhou:', resultado.error || 'Erro desconhecido');
        return [];
      }
    } catch (error) {
      console.error('💥 ERRO CRÍTICO na busca de títulos:', error);
      console.error('Stack trace:', error.stack);
      return [];
    }
  };
  
  // Função para verificar se aluno pode ser reativado
  const verificarSePodeReativar = async (alunoId) => {
    try {
      console.log('🔍 Verificando se aluno pode ser reativado...');
      
      if (!editForm.inativacaoPorInadimplencia) {
        console.log('✅ Aluno não foi inativado por inadimplência, pode reativar');
        return { podeReativar: true };
      }
      
      // Se foi inativado por inadimplência, verificar se ainda há títulos vencidos
      const titulosVencidos = await buscarTitulosVencidos(alunoId);
      
      if (titulosVencidos.length > 0) {
        console.log(`❌ Ainda há ${titulosVencidos.length} títulos vencidos`);
        return { 
          podeReativar: false, 
          motivo: 'Ainda há títulos vencidos que precisam ser quitados',
          titulosVencidos 
        };
      }
      
      console.log('✅ Todos os títulos foram quitados, pode reativar');
      return { podeReativar: true };
    } catch (error) {
      console.error('Erro ao verificar reativação:', error);
      return { 
        podeReativar: false, 
        motivo: 'Erro ao verificar status financeiro' 
      };
    }
  };
  
  // Função para tentar inativar aluno
  const handleInativarAluno = async () => {
    console.log('🔄 Iniciando processo de inativação do aluno');
    console.log('👤 Dados do aluno:', editForm.nome, editForm.matricula);
    
    // Verificar se está vinculado a turma
    if (editForm.turmaId && editForm.turmaId !== '') {
      const motivoTurma = `O aluno está vinculado à turma: "${getTurmaNome(editForm.turmaId)}".`;
      console.log('🏫 Aluno está vinculado a turma, mostrando modal de impedimento');
      setInativarMotivo(motivoTurma);
      setInativarDialogOpen(true);
      return;
    }
    
    // Verificar se há títulos vencidos
    console.log('🔍 Verificando títulos vencidos...');
    setCarregandoTitulos(true);
    const titulosVencidos = await buscarTitulosVencidos(editAluno.id);
    setTitulosEmAberto(titulosVencidos); // Usar o mesmo estado para compatibilidade
    setCarregandoTitulos(false);
    
    console.log('📋 Títulos vencidos encontrados:', titulosVencidos.length);
    
    // Se há títulos vencidos, mostrar modal de confirmação
    if (titulosVencidos.length > 0) {
      console.log('⚠️ Aluno possui títulos vencidos, abrindo modal de confirmação');
      setDebugModalState('inadimplente_com_titulos_vencidos');
      setInadimplenciaDialogOpen(true);
      return;
    }
    
    // Se não há títulos vencidos, pode inativar normalmente
    console.log('✅ Nenhum título vencido encontrado, prosseguindo com inativação normal');
    await confirmarInativacao();
  };
  
  // Função para confirmar inativação (com ou sem inadimplência)
  const confirmarInativacao = async (motivoInadimplencia = null) => {
    try {
      setSaving(true);
      const dataInativacao = new Date().toISOString();
      
      const dadosInativacao = {
        ...editForm, 
        status: 'inativo',
        dataInativacao
      };
      
      // Se foi inativado por inadimplência, adicionar informações específicas
      if (motivoInadimplencia) {
        dadosInativacao.inativacaoPorInadimplencia = {
          data: dataInativacao,
          titulosEmAberto: titulosEmAberto.map(titulo => ({
            id: titulo.id,
            tipo: titulo.tipo,
            descricao: titulo.descricao,
            valor: titulo.valor,
            vencimento: titulo.vencimento,
            diasAtraso: Math.floor((new Date() - new Date(titulo.vencimento)) / (1000 * 60 * 60 * 24))
          })),
          valorTotalEmAberto: titulosEmAberto.reduce((total, titulo) => total + (titulo.valor || 0), 0),
          quantidadeTitulos: titulosEmAberto.length,
          motivo: motivoInadimplencia
        };
      }
      
      if (editAluno && editAluno.id) {
        await set(ref(db, `alunos/${editAluno.id}`), dadosInativacao);
        
        // Log da inativação do aluno
        await auditService.logAction(
          LOG_ACTIONS.STUDENT_DEACTIVATE,
          userId,
          {
            entityId: editAluno.id,
            description: motivoInadimplencia 
              ? `Aluno inativado por inadimplência: ${editForm.nome} (${editForm.matricula}) - ${titulosEmAberto.length} títulos em aberto`
              : `Aluno inativado: ${editForm.nome} (${editForm.matricula})`,
            changes: { 
              statusAnterior: editForm.status,
              statusNovo: 'inativo',
              inativacaoPorInadimplencia: !!motivoInadimplencia,
              titulosEmAberto: motivoInadimplencia ? titulosEmAberto.length : 0,
              valorTotalEmAberto: motivoInadimplencia ? titulosEmAberto.reduce((total, titulo) => total + (titulo.valor || 0), 0) : 0
            }
          }
        );
      }
      
      setEditOpen(false);
      setInadimplenciaDialogOpen(false);
      await fetchData();
    } catch (err) {
      setFormError('Erro ao inativar aluno.');
    }
    setSaving(false);
  };

  // Verificar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Redirecionar para login se necessário
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const alunosSnap = await get(ref(db, 'alunos'));
      const turmasSnap = await get(ref(db, 'turmas'));
      let alunosArr = [];
      let turmasObj = {};
      
      if (alunosSnap.exists()) {
        const alunosData = alunosSnap.val();
        alunosArr = Object.entries(alunosData).map(([id, aluno]) => ({ ...aluno, id }));
      }
      if (turmasSnap.exists()) {
        turmasObj = turmasSnap.val();
      }
      
      // Primeiro definir os dados básicos
      setAlunos(alunosArr);
      setTurmas(turmasObj);
      
      // Em seguida, verificar e atualizar inadimplência automaticamente (apenas se há alunos)
      if (alunosArr.length > 0 && financeiroService) {
        console.log('🔄 Iniciando verificação automática de inadimplência...');
        
        // Executar verificação em background para não travar a UI
        setTimeout(async () => {
          const atualizados = await verificarEAtualizarInadimplencia(alunosArr);
          
          if (atualizados > 0) {
            console.log(`✅ ${atualizados} alunos tiveram status atualizado. Recarregando dados...`);
            // Recarregar dados apenas se houve atualizações
            const alunosSnapNovo = await get(ref(db, 'alunos'));
            if (alunosSnapNovo.exists()) {
              const alunosDataNovo = alunosSnapNovo.val();
              const alunosArrNovo = Object.entries(alunosDataNovo).map(([id, aluno]) => ({ ...aluno, id }));
              setAlunos(alunosArrNovo);
            }
          }
        }, 1000); // Aguardar 1 segundo para não interferir com o carregamento inicial
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setAlunos([]);
      setTurmas({});
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    async function fetchRole() {
      if (!userId) {
        setUserRole(null);
        setRoleChecked(true);
        return;
      }
      const userRef = ref(db, `usuarios/${userId}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const userData = snap.val();
        setUserRole((userData.role || '').trim().toLowerCase());
      } else {
        setUserRole(null);
      }
      setRoleChecked(true);
    }
    fetchRole();
  }, [userId]);

  const getTurmaNome = turmaId => turmas[turmaId]?.nome || '---';

  // Filtragem ajustada para turma, nome e matrícula
  const alunosFiltrados = turmaSelecionada === 'todos'
    ? alunos.filter(aluno =>
        (!filtroNome || aluno.nome.toLowerCase().includes(filtroNome.toLowerCase())) &&
        (!filtroMatricula || aluno.matricula.toLowerCase().includes(filtroMatricula.toLowerCase()))
      )
    : turmaSelecionada
      ? alunos.filter(aluno =>
          aluno.turmaId === turmaSelecionada &&
          (!filtroNome || aluno.nome.toLowerCase().includes(filtroNome.toLowerCase())) &&
          (!filtroMatricula || aluno.matricula.toLowerCase().includes(filtroMatricula.toLowerCase()))
        )
      : [];

  const handleEditAluno = async aluno => {
    setEditAluno(aluno);
    
    // Garante estrutura financeira ao editar, mesmo que não exista ainda
    setEditForm({ 
      ...aluno,
      financeiro: {
        mensalidadeValor: aluno.financeiro?.mensalidadeValor || '',
        descontoPercentual: aluno.financeiro?.descontoPercentual || '',
        diaVencimento: aluno.financeiro?.diaVencimento || '10',
        status: aluno.financeiro?.status || 'ativo',
        valorMatricula: aluno.financeiro?.valorMatricula || '',
        valorMateriais: aluno.financeiro?.valorMateriais || '',
        observacoes: aluno.financeiro?.observacoes || ''
      }
    });
    
    setIsNew(false);
    setEditOpen(true);
    setFormError('');
    setFormStep(1);
    setResultadoTitulos(null);
    
    // Verificar status da matrícula se o aluno estiver em pré-matrícula
    if (aluno.status === 'pre_matricula') {
      const statusMatricula = await financeiroService.verificarStatusMatricula(aluno.id);
      setStatusMatricula(statusMatricula);
    } else {
      setStatusMatricula(null);
    }
  };

  // Ativar aluno após pagamento da matrícula
  const handleAtivarAluno = async () => {
    if (!editAluno || !editAluno.id) return;
    
    // Se é uma reativação (não uma primeira ativação), verificar se pode reativar
    if (editForm.status === 'inativo') {
      const verificacao = await verificarSePodeReativar(editAluno.id);
      
      if (!verificacao.podeReativar) {
        setFormError(`⚠️ Não é possível reativar este aluno: ${verificacao.motivo}`);
        return;
      }
    }
    
    setSaving(true);
    try {
      const alunoAtualizado = {
        ...editForm,
        status: 'ativo',
        dataAtivacao: new Date().toISOString(),
        // Resetar campos de inadimplência se estava inativo por inadimplência
        ...(editForm.inativacaoPorInadimplencia && {
          inadimplente: false,
          inativacaoPorInadimplencia: false,
          ultimaVerificacaoFinanceira: Date.now()
        })
      };
      
      await set(ref(db, `alunos/${editAluno.id}`), alunoAtualizado);
      
      // Log da ativação
      await auditService.logAction(
        'student_activated',
        userId,
        {
          entityId: editAluno.id,
          description: `Aluno ativado: ${editForm.nome} (${editForm.matricula})`,
          changes: {
            statusAnterior: editForm.status,
            novoStatus: 'ativo',
            dataAtivacao: alunoAtualizado.dataAtivacao,
            reativacaoAposInadimplencia: editForm.inativacaoPorInadimplencia || false
          }
        }
      );
      
      console.log('✅ Aluno ativado com sucesso');
      setEditOpen(false);
      setStatusMatricula(null);
      fetchAlunos(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao ativar aluno:', error);
      setFormError('Erro ao ativar aluno. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAluno = () => {
    let lastMatricula = 0;
    alunos.forEach(a => {
      const num = parseInt(a.matricula?.replace(/\D/g, ''));
      if (!isNaN(num) && num > lastMatricula) lastMatricula = num;
    });
    const novaMatricula = `S${String(lastMatricula + 1).padStart(3, '0')}`;
    setEditAluno(null);
    setEditForm({ 
      nome: '', 
      matricula: novaMatricula, 
      turmaId: '', 
      dataNascimento: '', 
      nomePai: '', 
      nomeMae: '', 
      contatoEmergencia: { nome: '', telefone: '' },
      financeiro: {
        mensalidadeValor: '',
        descontoPercentual: '',
        diaVencimento: '',
        valorMatricula: '',
        valorMateriais: '',
        status: 'ativo',
        observacoes: ''
      },
      status: 'pre_matricula',
      dataMatricula: new Date().toISOString(),
      dataAtivacao: null
    });
    setIsNew(true);
    setEditOpen(true);
    setFormError('');
    setFormStep(1);
    setResultadoTitulos(null);
    setStatusMatricula(null);
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    if (name === 'contatoEmergenciaNome') {
      setEditForm(prev => ({
        ...prev,
        contatoEmergencia: { ...prev.contatoEmergencia, nome: value }
      }));
    } else if (name === 'contatoEmergenciaTelefone') {
      setEditForm(prev => ({
        ...prev,
        contatoEmergencia: { ...prev.contatoEmergencia, telefone: value }
      }));
    } else if (name.startsWith('financeiro.')) {
      const key = name.split('.')[1];
      let val = value;
      if (key === 'diaVencimento') {
        // Mantém apenas dígitos
        val = val.replace(/\D/g, '');
        if (val) {
          let num = parseInt(val, 10);
          if (num < 1) num = 1;
          if (num > 31) num = 31;
          val = String(num);
        }
      }
      setEditForm(prev => ({
        ...prev,
        financeiro: { ...prev.financeiro, [key]: val }
      }));
      if (key === 'diaVencimento') {
        if (!val) {
          setFinanceiroError('Informe o dia de vencimento (1 a 31).');
        } else if (parseInt(val,10) < 1 || parseInt(val,10) > 31) {
          setFinanceiroError('Dia de vencimento deve ser entre 1 e 31.');
        } else {
          setFinanceiroError('');
        }
      }
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };


  // Validação por passo
  const isStep1Valid = () => (
    editForm.nome?.trim() &&
    editForm.matricula?.trim() &&
    editForm.turmaId?.trim() &&
    editForm.dataNascimento?.trim() &&
    editForm.nomePai?.trim() &&
    editForm.nomeMae?.trim() &&
    editForm.contatoEmergencia?.nome?.trim() &&
    editForm.contatoEmergencia?.telefone?.trim()
  );

  const isStep2Valid = () => (
    // Campos financeiros básicos; pode expandir futuramente
    editForm.financeiro?.mensalidadeValor?.toString().trim() &&
    editForm.financeiro?.diaVencimento?.toString().trim() &&
    editForm.financeiro?.status?.trim() &&
    !financeiroError
  );

  const isFinalFormValid = () => isStep1Valid() && isStep2Valid();

  const valorMensalidadeNumber = parseFloat(editForm.financeiro?.mensalidadeValor || '0') || 0;
  const descontoPercent = parseFloat(editForm.financeiro?.descontoPercentual || '0') || 0;
  const valorComDesconto = Math.max(0, valorMensalidadeNumber - (valorMensalidadeNumber * (descontoPercent / 100)));

  const handleSaveEdit = async () => {
    if (!isFinalFormValid()) {
      setFormError("Preencha todos os campos obrigatórios dos dois passos!");
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      let anexosUrls = editForm.anexos ? [...editForm.anexos] : [];
      const alunoId = isNew
        ? `id_aluno_${editForm.nome.replace(/\s/g, '').toLowerCase()}_${editForm.matricula}`
        : editAluno.id;
      // Excluir anexos marcados (por nome, tratamento extra)
      if (anexosParaExcluir.length > 0 && editForm.anexos) {
        let erroExclusao = false;
        for (const anexo of editForm.anexos) {
          // Normaliza nome para comparação
          const nomeAnexo = anexo.name.trim().toLowerCase();
          if (anexosParaExcluir.map(n => n.trim().toLowerCase()).includes(nomeAnexo)) {
            const matricula = editForm.matricula || (editAluno && editAluno.matricula) || '';
            const fileRef = storageRef(storage, `anexos_alunos/${alunoId}_${matricula}/${anexo.name}`);
            try {
              await deleteObject(fileRef);
            } catch (err) {
              erroExclusao = true;
              console.error('Erro ao excluir anexo do Storage:', anexo.name, err);
            }
          }
        }
        anexosUrls = anexosUrls.filter(anexo => !anexosParaExcluir.map(n => n.trim().toLowerCase()).includes(anexo.name.trim().toLowerCase()));
        if (erroExclusao) {
          setFormError('Um ou mais anexos não puderam ser excluídos do Storage. Tente novamente ou contate o suporte.');
        }
      }
      // Upload de novos anexos
      if (anexosSelecionados.length > 0) {
        for (const file of anexosSelecionados) {
          const matricula = editForm.matricula || (editAluno && editAluno.matricula) || '';
          const fileRef = storageRef(storage, `anexos_alunos/${alunoId}_${matricula}/${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          anexosUrls.push({ name: file.name, url });
        }
      }
      const dadosParaSalvar = {
        ...editForm,
        anexos: anexosUrls
      };
      
      if (isNew) {
        const novoId = alunoId;
        
        // Definir status inicial baseado na existência de valor de matrícula ou materiais
        const statusInicial = (dadosParaSalvar.financeiro?.valorMatricula > 0 || dadosParaSalvar.financeiro?.valorMateriais > 0) ? 'pre_matricula' : 'ativo';
        const dadosComStatus = {
          ...dadosParaSalvar,
          status: statusInicial
        };
        
        await set(ref(db, `alunos/${novoId}`), dadosComStatus);
        
        // Gerar títulos financeiros automaticamente
        if (dadosParaSalvar.financeiro?.mensalidadeValor > 0) {
          setGerandoTitulos(true);
          
          const resultadoFinanceiro = await financeiroService.gerarTitulosNovoAluno(novoId, dadosComStatus);
          
          if (resultadoFinanceiro.success) {
            setResultadoTitulos(resultadoFinanceiro);
            
            // Log da geração de títulos
            await auditService.logAction(
              'financial_titles_generated',
              userId,
              {
                entityId: novoId,
                description: `Títulos financeiros gerados automaticamente para ${dadosComStatus.nome}`,
                changes: {
                  titulosGerados: resultadoFinanceiro.titulosGerados,
                  matricula: resultadoFinanceiro.matricula,
                  materiais: resultadoFinanceiro.materiais,
                  mensalidades: resultadoFinanceiro.mensalidades,
                  valorTotal: resultadoFinanceiro.valorTotal
                }
              }
            );
          } else {
            console.error('Erro ao gerar títulos:', resultadoFinanceiro.error);
          }
          
          setGerandoTitulos(false);
        }
        
        // Log da criação do aluno
        await auditService.logAction(
          LOG_ACTIONS.STUDENT_CREATE,
          userId,
          {
            entityId: novoId,
            description: `Novo aluno cadastrado: ${dadosComStatus.nome} (${dadosComStatus.matricula})`,
            changes: {
              nome: dadosComStatus.nome,
              matricula: dadosComStatus.matricula,
              turma: getTurmaNome(dadosComStatus.turmaId),
              dataNascimento: dadosComStatus.dataNascimento,
              statusFinanceiro: dadosComStatus.financeiro?.status,
              statusAluno: statusInicial,
              anexosCount: anexosUrls.length
            }
          }
        );
        
        // Log de upload de anexos se houver
        if (anexosSelecionados.length > 0) {
          await auditService.logAction(
            LOG_ACTIONS.STUDENT_FILE_UPLOAD,
            userId,
            {
              entityId: novoId,
              description: `${anexosSelecionados.length} anexo(s) enviado(s) para ${dadosParaSalvar.nome}`,
              changes: {
                anexosEnviados: anexosSelecionados.map(f => f.name)
              }
            }
          );
        }
        
      } else if (editAluno && editAluno.id) {
        // Identificar mudanças para o log
        const mudancas = {};
        
        if (editAluno.nome !== dadosParaSalvar.nome) mudancas.nome = { de: editAluno.nome, para: dadosParaSalvar.nome };
        if (editAluno.turmaId !== dadosParaSalvar.turmaId) mudancas.turma = { de: getTurmaNome(editAluno.turmaId), para: getTurmaNome(dadosParaSalvar.turmaId) };
        if (editAluno.dataNascimento !== dadosParaSalvar.dataNascimento) mudancas.dataNascimento = { de: editAluno.dataNascimento, para: dadosParaSalvar.dataNascimento };
        if (editAluno.nomePai !== dadosParaSalvar.nomePai) mudancas.nomePai = { de: editAluno.nomePai, para: dadosParaSalvar.nomePai };
        if (editAluno.nomeMae !== dadosParaSalvar.nomeMae) mudancas.nomeMae = { de: editAluno.nomeMae, para: dadosParaSalvar.nomeMae };
        if (editAluno.contatoEmergencia?.nome !== dadosParaSalvar.contatoEmergencia?.nome) mudancas.contatoEmergenciaNome = { de: editAluno.contatoEmergencia?.nome, para: dadosParaSalvar.contatoEmergencia?.nome };
        if (editAluno.contatoEmergencia?.telefone !== dadosParaSalvar.contatoEmergencia?.telefone) mudancas.contatoEmergenciaTelefone = { de: editAluno.contatoEmergencia?.telefone, para: dadosParaSalvar.contatoEmergencia?.telefone };
        
        // Verificar mudanças financeiras
        if (editAluno.financeiro?.mensalidadeValor !== dadosParaSalvar.financeiro?.mensalidadeValor) mudancas.mensalidade = { de: editAluno.financeiro?.mensalidadeValor, para: dadosParaSalvar.financeiro?.mensalidadeValor };
        if (editAluno.financeiro?.status !== dadosParaSalvar.financeiro?.status) mudancas.statusFinanceiro = { de: editAluno.financeiro?.status, para: dadosParaSalvar.financeiro?.status };
        if (editAluno.financeiro?.diaVencimento !== dadosParaSalvar.financeiro?.diaVencimento) mudancas.diaVencimento = { de: editAluno.financeiro?.diaVencimento, para: dadosParaSalvar.financeiro?.diaVencimento };
        
        await set(ref(db, `alunos/${editAluno.id}`), dadosParaSalvar);
        
        // Log da atualização do aluno
        if (Object.keys(mudancas).length > 0) {
          await auditService.logAction(
            LOG_ACTIONS.STUDENT_UPDATE,
            userId,
            {
              entityId: editAluno.id,
              description: `Dados atualizados para ${dadosParaSalvar.nome} (${dadosParaSalvar.matricula})`,
              changes: mudancas
            }
          );
        }
        
        // Log de exclusão de anexos se houver
        if (anexosParaExcluir.length > 0) {
          await auditService.logAction(
            LOG_ACTIONS.STUDENT_FILE_DELETE,
            userId,
            {
              entityId: editAluno.id,
              description: `${anexosParaExcluir.length} anexo(s) excluído(s) de ${dadosParaSalvar.nome}`,
              changes: {
                anexosExcluidos: anexosParaExcluir
              }
            }
          );
        }
        
        // Log de upload de novos anexos se houver
        if (anexosSelecionados.length > 0) {
          await auditService.logAction(
            LOG_ACTIONS.STUDENT_FILE_UPLOAD,
            userId,
            {
              entityId: editAluno.id,
              description: `${anexosSelecionados.length} anexo(s) enviado(s) para ${dadosParaSalvar.nome}`,
              changes: {
                anexosEnviados: anexosSelecionados.map(f => f.name)
              }
            }
          );
        }
      }
      
      setEditOpen(false);
      await fetchData();
      setAnexosSelecionados([]);
      setAnexosParaExcluir([]);
    } catch (err) {
      setFormError("Erro ao salvar. Tente novamente.");
    }
    setSaving(false);
  };

  if (!roleChecked || userId === null) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (userRole !== 'coordenadora' && userRole !== 'professora') {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Acesso negado
        </Typography>
        <Typography variant="body1">
          Esta página é restrita para coordenadoras e professoras.
        </Typography>
      </Box>
    );
  }

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom={false}>👥 Gestão de Alunos</Typography>
            <Button 
              variant="contained" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 2,
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,0.25)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }} 
              onClick={handleAddAluno}
            >
              + Nova Matrícula
            </Button>
          </Box>
          
          {/* Debug do Modal de Inadimplência */}
          {debugModalState !== 'fechado' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                🔧 DEBUG: Estado do modal = {debugModalState} | Modal aberto = {inadimplenciaDialogOpen ? 'SIM' : 'NÃO'} | Títulos = {titulosEmAberto.length}
              </Typography>
            </Alert>
          )}
          
          {/* Botão de Teste Temporário */}
          <Box sx={{ mb: 2, p: 2, border: '2px dashed #orange', borderRadius: 2, bgcolor: '#fff3cd' }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#856404' }}>
              🧪 TESTES - Nova Lógica de Inadimplência
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                color="warning" 
                size="small"
                onClick={() => {
                  console.log('🧪 Teste: Simulando títulos vencidos');
                  setTitulosEmAberto([
                    {
                      id: 'teste_vencido_1',
                      descricao: 'Mensalidade Dezembro 2024 - VENCIDA',
                      valor: 350.00,
                      vencimento: '2024-12-10', // Data no passado
                      tipo: 'mensalidade'
                    },
                    {
                      id: 'teste_vencido_2', 
                      descricao: 'Taxa de Matrícula - VENCIDA',
                      valor: 200.00,
                      vencimento: '2024-11-20', // Data no passado
                      tipo: 'matricula'
                    }
                  ]);
                  setDebugModalState('teste_titulos_vencidos');
                  setInadimplenciaDialogOpen(true);
                }}
              >
                🧪 Simular Títulos Vencidos
              </Button>
              
              <Button 
                variant="outlined" 
                color="success" 
                size="small"
                onClick={async () => {
                  console.log('🔄 Forçando verificação de inadimplência...');
                  if (alunos.length > 0) {
                    const atualizados = await verificarEAtualizarInadimplencia(alunos);
                    alert(`Verificação concluída! ${atualizados} alunos tiveram status atualizado.`);
                    if (atualizados > 0) {
                      fetchData(); // Recarregar dados
                    }
                  }
                }}
              >
                🔄 Verificar Inadimplência Agora
              </Button>
              
              <Button 
                variant="outlined" 
                color="info" 
                size="small"
                onClick={async () => {
                  console.log('🔍 Teste: Buscando todos os títulos do Firebase');
                  try {
                    const titulosRef = ref(db, 'titulos_financeiros');
                    const snapshot = await get(titulosRef);
                    
                    if (snapshot.exists()) {
                      const todosOsTitulos = Object.entries(snapshot.val()).map(([id, titulo]) => ({ id, ...titulo }));
                      console.log('📊 TODOS os títulos no Firebase:', todosOsTitulos);
                      console.log('📊 Total de títulos:', todosOsTitulos.length);
                      
                      const titulosPendentes = todosOsTitulos.filter(t => t.status === 'pendente');
                      const hoje = new Date().toISOString().split('T')[0];
                      const titulosVencidos = titulosPendentes.filter(t => t.vencimento < hoje);
                      
                      console.log('📊 Títulos pendentes:', titulosPendentes.length);
                      console.log('📊 Títulos vencidos:', titulosVencidos.length);
                      alert(`Total: ${todosOsTitulos.length} | Pendentes: ${titulosPendentes.length} | Vencidos: ${titulosVencidos.length}`);
                    } else {
                      console.log('❌ Nenhum título encontrado no Firebase');
                      alert('Nenhum título encontrado no Firebase');
                    }
                  } catch (error) {
                    console.error('💥 Erro ao buscar títulos:', error);
                  }
                }}
              >
                🔍 Estatísticas dos Títulos
              </Button>
            </Box>
          </Box>
          
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mb: 3, 
                    p: 2, 
                    borderRadius: 3, 
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}>
                    <FormControl sx={{ 
                      minWidth: 160,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover': {
                          '& > fieldset': {
                            borderColor: '#6366f1'
                          }
                        }
                      }
                    }}>
                      <InputLabel id="turma-select-label">Turma</InputLabel>
                      <Select
                        labelId="turma-select-label"
                        value={turmaSelecionada}
                        label="Selecione a turma"
                        onChange={e => setTurmaSelecionada(e.target.value)}
                        required
                      >
                        <MenuItem value="">Selecione</MenuItem>
                        <MenuItem value="todos">Todos</MenuItem>
                        {Object.entries(turmas).map(([id, turma]) => (
                          <MenuItem key={id} value={id}>{turma.nome}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Nome"
                      value={filtroNome}
                      onChange={e => setFiltroNome(e.target.value)}
                      placeholder="Digite o nome"
                      variant="outlined"
                      fullWidth
                      disabled={turmaSelecionada === ""}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover': {
                            '& > fieldset': {
                              borderColor: '#6366f1'
                            }
                          }
                        }
                      }}
                    />
                    <TextField
                      label="Matrícula"
                      value={filtroMatricula}
                      onChange={e => setFiltroMatricula(e.target.value)}
                      placeholder="Digite a matrícula"
                      variant="outlined"
                      fullWidth
                      disabled={turmaSelecionada === ""}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover': {
                            '& > fieldset': {
                              borderColor: '#6366f1'
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                  {turmaSelecionada === '' ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                      Selecione uma turma para ver os alunos.
                    </Typography>
                  ) : alunosFiltrados.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                      Nenhum aluno encontrado para esta turma.
                    </Typography>
                  ) : (
                    <List>
                      {alunosFiltrados.map((aluno, idx) => {
                        // Determinar se é aluno inativo e inadimplente
                        const isInativo = aluno.status === 'inativo';
                        const isInadimplente = aluno.financeiro?.status === 'inadimplente';
                        const isInativoInadimplente = isInativo && aluno.inativacaoPorInadimplencia;
                        
                        // Definir cores baseadas no status
                        const getBackgroundColor = () => {
                          if (isInativoInadimplente) return '#fef2f2'; // Vermelho muito claro para inativo por inadimplência
                          if (isInadimplente) return '#fef7f0'; // Laranja muito claro para inadimplente ativo
                          if (isInativo) return '#f8fafc'; // Cinza claro para inativo normal
                          return 'white'; // Branco para ativos normais
                        };
                        
                        const getBorderColor = () => {
                          if (isInativoInadimplente) return '#fecaca'; // Vermelho claro
                          if (isInadimplente) return '#fed7aa'; // Laranja claro
                          if (isInativo) return '#e2e8f0'; // Cinza
                          return '#f1f5f9'; // Padrão
                        };
                        
                        return (
                        <Box key={idx} sx={{ mb: 1 }}>
                          <ListItem 
                            divider 
                            alignItems="flex-start" 
                            sx={{
                              borderRadius: 2,
                              bgcolor: getBackgroundColor(),
                              border: `1px solid ${getBorderColor()}`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: isInativoInadimplente ? '#fee2e2' : isInadimplente ? '#fed7aa' : '#f8fafc',
                                boxShadow: isInativoInadimplente 
                                  ? '0 4px 12px rgba(239, 68, 68, 0.2)' 
                                  : isInadimplente 
                                    ? '0 4px 12px rgba(251, 146, 60, 0.2)'
                                    : '0 4px 12px rgba(99, 102, 241, 0.1)',
                                borderColor: isInativoInadimplente ? '#f87171' : isInadimplente ? '#fb923c' : '#e0e7ff'
                              }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                      {aluno.nome}
                                    </Typography>
                                    {isInativoInadimplente && (
                                      <Chip 
                                        label="⚠️ INATIVO (INADIMPLENTE)" 
                                        size="small"
                                        sx={{ 
                                          bgcolor: '#dc2626', 
                                          color: 'white', 
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold'
                                        }}
                                      />
                                    )}
                                    {isInadimplente && !isInativo && (
                                      <Chip 
                                        label="⚠️ INADIMPLENTE" 
                                        size="small"
                                        sx={{ 
                                          bgcolor: '#d97706', 
                                          color: 'white', 
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold'
                                        }}
                                      />
                                    )}
                                    {isInativo && !isInativoInadimplente && (
                                      <Chip 
                                        label="INATIVO" 
                                        size="small"
                                        sx={{ 
                                          bgcolor: '#6b7280', 
                                          color: 'white', 
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold'
                                        }}
                                      />
                                    )}
                                    {/* Status da Matrícula */}
                                    <Chip 
                                      label={aluno.status === 'ativo' ? "✅ ATIVO" : aluno.status === 'inativo' ? "❌ INATIVO" : aluno.status === 'pre_matricula' ? "⏳ PRÉ-MATRÍCULA" : "❓ INDEFINIDO"} 
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        borderColor: aluno.status === 'ativo' ? '#059669' : aluno.status === 'inativo' ? '#dc2626' : '#d97706',
                                        color: aluno.status === 'ativo' ? '#059669' : aluno.status === 'inativo' ? '#dc2626' : '#d97706',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleEditAluno(aluno)}
                                      sx={{
                                        minWidth: 'auto',
                                        px: 2,
                                        borderColor: '#6366f1',
                                        color: '#6366f1',
                                        '&:hover': {
                                          bgcolor: '#f0f4ff',
                                          borderColor: '#4f46e5'
                                        }
                                      }}
                                    >
                                      ✏️ Editar
                                    </Button>
                                    <IconButton
                                      onClick={(e) => toggleCardExpansao(aluno.id || `${aluno.matricula}_${idx}`, e)}
                                      sx={{
                                        color: '#6366f1',
                                        '&:hover': {
                                          bgcolor: '#f0f4ff'
                                        }
                                      }}
                                    >
                                      {cardsExpandidos[aluno.id || `${aluno.matricula}_${idx}`] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                  </Box>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>  
                                  <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 500, mb: 0.5 }}>
                                    📋 Matrícula: {aluno.matricula || '--'}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#059669', mb: 0.5 }}>
                                    🏫 Turma: {getTurmaNome(aluno.turmaId)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          
                          {/* Seção expansível com dados detalhados */}
                          <Collapse in={cardsExpandidos[aluno.id || `${aluno.matricula}_${idx}`]} timeout="auto" unmountOnExit>
                            <Box sx={{ 
                              mt: 1, 
                              p: 2, 
                              bgcolor: '#fafbff', 
                              borderRadius: 2, 
                              border: '1px solid #e0e7ff',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}>
                              <Typography variant="subtitle2" sx={{ color: '#4f46e5', fontWeight: 'bold', mb: 2 }}>
                                📊 Informações Detalhadas
                              </Typography>
                              
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                {/* Dados Pessoais */}
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                                    👤 Dados Pessoais
                                  </Typography>
                                  {aluno.dataNascimento && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                      🎂 Nascimento: {aluno.dataNascimento}
                                    </Typography>
                                  )}
                                  {aluno.cpf && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                      🆔 CPF: {aluno.cpf}
                                    </Typography>
                                  )}
                                  {aluno.endereco && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                      🏠 Endereço: {aluno.endereco}
                                    </Typography>
                                  )}
                                  {aluno.telefone && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                      📞 Telefone: {aluno.telefone}
                                    </Typography>
                                  )}
                                </Box>
                                
                                {/* Dados Familiares */}
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                                    👨‍👩‍👧‍👦 Família
                                  </Typography>
                                  {aluno.nomePai && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                      👨 Pai: {aluno.nomePai}
                                    </Typography>
                                  )}
                                  {aluno.nomeMae && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                      👩 Mãe: {aluno.nomeMae}
                                    </Typography>
                                  )}
                                  {aluno.responsavelUsuario && (
                                    <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 500, mb: 0.5 }}>
                                      👤 Responsável: {aluno.responsavelUsuario.nome} ({aluno.responsavelUsuario.email})
                                    </Typography>
                                  )}
                                  {aluno.contatoEmergencia && (
                                    <Typography variant="body2" sx={{ color: '#dc2626', mb: 0.5 }}>
                                      🚨 Emergência: {aluno.contatoEmergencia.nome} ({aluno.contatoEmergencia.telefone})
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              
                              {/* Status Financeiro */}
                              {aluno.financeiro && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
                                    💰 Informações Financeiras
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: aluno.financeiro.status === 'ativo' ? '#059669' : aluno.financeiro.status === 'inadimplente' ? '#d97706' : '#dc2626',
                                    fontWeight: 500,
                                    mb: 0.5
                                  }}>
                                    Status: {aluno.financeiro.status?.toUpperCase() || 'INDEFINIDO'}
                                  </Typography>
                                  {aluno.financeiro.mensalidadeValor && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                      💵 Mensalidade: R$ {parseFloat(aluno.financeiro.mensalidadeValor).toFixed(2)}
                                    </Typography>
                                  )}
                                  {aluno.financeiro.descontoPercentual && (
                                    <Typography variant="body2" sx={{ color: '#059669', mb: 0.5 }}>
                                      💸 Desconto: {aluno.financeiro.descontoPercentual}%
                                    </Typography>
                                  )}
                                  {aluno.financeiro.diaVencimento && (
                                    <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                      📅 Vencimento: Dia {aluno.financeiro.diaVencimento}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </Box>
                        );
                      })}
                    </List>
                  )}
                  <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      pr: 1,
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      borderRadius: '4px 4px 0 0'
                    }}>
                      <span>{isNew ? "Nova Matrícula" : "Editar Aluno"} {formStep === 2 && ' - Dados Financeiros'}</span>
                      <IconButton aria-label="fechar" onClick={() => setEditOpen(false)} size="small" sx={{ ml: 2 }}>
                        <span style={{ fontSize: 22, fontWeight: 'bold' }}>&times;</span>
                      </IconButton>
                    </DialogTitle>
                    <DialogContent>
                      {formError && <Box sx={{ mb: 2 }}><Alert severity="error">{formError}</Alert></Box>}
                      {formStep === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Nome"
                            name="nome"
                            value={editForm.nome || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                },
                                '&.Mui-focused': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                }
                              }
                            }}
                          />
                          <TextField
                            label="Matrícula"
                            name="matricula"
                            value={editForm.matricula || ''}
                            fullWidth
                            InputProps={{ readOnly: true }}
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                bgcolor: '#f8fafc'
                              }
                            }}
                          />
                          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
                            <DatePicker
                              label="Data de Nascimento"
                              format="DD/MM/YYYY"
                              value={editForm.dataNascimento ? dayjs(editForm.dataNascimento, 'DD/MM/YYYY') : null}
                              onChange={newValue => setEditForm(prev => ({ ...prev, dataNascimento: newValue ? newValue.format('DD/MM/YYYY') : '' }))}
                              slotProps={{ textField: { fullWidth: true, required: true } }}
                            />
                          </LocalizationProvider>
                          <TextField
                            label="Nome do Pai"
                            name="nomePai"
                            value={editForm.nomePai || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                },
                                '&.Mui-focused': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                }
                              }
                            }}
                          />
                          <TextField
                            label="Nome da Mãe"
                            name="nomeMae"
                            value={editForm.nomeMae || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                },
                                '&.Mui-focused': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                }
                              }
                            }}
                          />
                          <FormControl fullWidth required>
                            <InputLabel id="turma-modal-select-label">Turma</InputLabel>
                            <Select
                              labelId="turma-modal-select-label"
                              name="turmaId"
                              value={editForm.turmaId || ''}
                              label="Turma"
                              onChange={handleFormChange}
                              required
                            >
                              {Object.entries(turmas).map(([id, turma]) => (
                                <MenuItem key={id} value={id}>{turma.nome}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            label="Contato Emergência (Nome)"
                            name="contatoEmergenciaNome"
                            value={editForm.contatoEmergencia?.nome || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                },
                                '&.Mui-focused': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                }
                              }
                            }}
                          />
                          <TextField
                            label="Contato Emergência (Telefone)"
                            name="contatoEmergenciaTelefone"
                            value={editForm.contatoEmergencia?.telefone || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                },
                                '&.Mui-focused': {
                                  '& > fieldset': {
                                    borderColor: '#6366f1'
                                  }
                                }
                              }
                            }}
                          />
                        </Box>
                      )}
                      {formStep === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            💰 <strong>Sistema Financeiro Automático:</strong><br />
                            - Se informar valor de matrícula ou materiais, o aluno ficará em "pré-matrícula" até o pagamento<br />
                            - Mensalidades serão geradas automaticamente do mês atual até dezembro<br />
                            - Status financeiro será atualizado automaticamente conforme pagamentos
                          </Alert>
                          
                          <TextField
                            label="Valor da Matrícula (R$)"
                            name="financeiro.valorMatricula"
                            type="number"
                            value={editForm.financeiro?.valorMatricula || ''}
                            onChange={handleFormChange}
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                            helperText="Deixe em branco se não há taxa de matrícula"
                          />
                          
                          <TextField
                            label="Valor dos Materiais (R$)"
                            name="financeiro.valorMateriais"
                            type="number"
                            value={editForm.financeiro?.valorMateriais || ''}
                            onChange={handleFormChange}
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                            helperText="Deixe em branco se não há taxa de materiais"
                          />
                          
                          <TextField
                            label="Mensalidade (R$)"
                            name="financeiro.mensalidadeValor"
                            type="number"
                            value={editForm.financeiro?.mensalidadeValor || ''}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                          
                          <TextField
                            label="Desconto (%)"
                            name="financeiro.descontoPercentual"
                            type="number"
                            value={editForm.financeiro?.descontoPercentual || ''}
                            onChange={handleFormChange}
                            fullWidth
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                          />
                          
                          <Box sx={{ fontSize: 14, color: 'text.secondary', mt: -1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            📊 <strong>Resumo Financeiro:</strong><br />
                            Mensalidade original: R$ {(parseFloat(editForm.financeiro?.mensalidadeValor || '0')).toFixed(2)}<br />
                            Desconto: {(parseFloat(editForm.financeiro?.descontoPercentual || '0')).toFixed(1)}%<br />
                            <strong>Valor final: R$ {valorComDesconto.toFixed(2)}</strong>
                          </Box>
                          
                          <TextField
                            label="Dia de Vencimento"
                            name="financeiro.diaVencimento"
                            type="number"
                            value={editForm.financeiro?.diaVencimento || '10'}
                            onChange={handleFormChange}
                            fullWidth
                            required
                            inputProps={{ min:1, max:31 }}
                            error={!!financeiroError}
                            helperText={financeiroError || 'Entre 1 e 31 (dia do mês para vencimento das mensalidades)'}
                          />
                          
                          <FormControl fullWidth required>
                            <InputLabel id="status-financeiro-label">Status Financeiro Inicial</InputLabel>
                            <Select
                              labelId="status-financeiro-label"
                              name="financeiro.status"
                              value={editForm.financeiro?.status || 'ativo'}
                              label="Status Financeiro Inicial"
                              onChange={handleFormChange}
                              required
                            >
                              <MenuItem value="ativo">Ativo</MenuItem>
                              <MenuItem value="inadimplente">Inadimplente</MenuItem>
                              <MenuItem value="suspenso">Suspenso</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                              label="Observações"
                              name="financeiro.observacoes"
                              value={editForm.financeiro?.observacoes}
                              onChange={handleFormChange}
                              fullWidth
                              multiline
                              minRows={3}
                          />
                          {/* Campo de anexos estilizado */}
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2">Anexos do Aluno</Typography>
                            <input
                              type="file"
                              multiple
                              accept="image/*,application/pdf"
                              style={{ display: 'none' }}
                              ref={inputFileRef}
                              onChange={e => {
                                const novos = Array.from(e.target.files);
                                setAnexosSelecionados(prev => [...prev, ...novos]);
                                e.target.value = '';
                              }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                              <Button
                                variant="outlined"
                                onClick={() => inputFileRef.current && inputFileRef.current.click()}
                              >
                                Selecionar arquivos
                              </Button>
                              <Button
                                variant="outlined"
                                color="info"
                                onClick={() => setDialogAnexosOpen(true)}
                                disabled={!editForm.anexos || editForm.anexos.length === 0}
                              >
                                Visualizar anexos
                              </Button>
                            </Box>
                            {anexosSelecionados.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2">Arquivos selecionados:</Typography>
                                <ul>
                                  {anexosSelecionados.map((file, idx) => (
                                    <li key={idx}>{file.name}</li>
                                  ))}
                                </ul>
                              </Box>
                            )}
                            {/* Dialog para visualizar anexos já enviados */}
                            <Dialog open={dialogAnexosOpen || false} onClose={() => setDialogAnexosOpen(false)}>
                              <DialogTitle>Anexos enviados</DialogTitle>
                              <DialogContent>
                                {editForm.anexos && editForm.anexos.length > 0 ? (
                                  <ul>
                                    {editForm.anexos.map((anexo, idx) => (
                                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ textDecoration: anexosParaExcluir.includes(anexo.name) ? 'line-through' : 'none', color: anexosParaExcluir.includes(anexo.name) ? '#888' : 'inherit' }}>
                                          <a href={anexo.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', pointerEvents: anexosParaExcluir.includes(anexo.name) ? 'none' : 'auto' }}>{anexo.name}</a>
                                        </span>
                                        <IconButton aria-label="remover" size="small" color={anexosParaExcluir.includes(anexo.name) ? 'default' : 'error'} onClick={() => handleMarcarParaExcluir(anexo.name)}>
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <Typography>Nenhum anexo enviado.</Typography>
                                )}
                              </DialogContent>
                              <DialogActions>
                                <Button onClick={() => setDialogAnexosOpen(false)} color="primary">Fechar</Button>
                              </DialogActions>
                            </Dialog>
                          </Box>
                        </Box>
                      )}
                    </DialogContent>
                    <DialogActions>
                      {formStep === 2 && (
                        <IconButton onClick={() => setFormStep(1)} color="inherit" size="small" sx={{ mr: 1 }} aria-label="voltar">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </IconButton>
                      )}
                      {formStep === 1 && (
                        <Button 
                          onClick={() => { if (isStep1Valid()) { setFormError(''); setFormStep(2); } else { setFormError('Preencha os campos obrigatórios do passo 1.'); } }} 
                          sx={{
                            bgcolor: '#6366f1',
                            color: 'white',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: '#5b59f0',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Avançar →
                        </Button>
                      )}
                      {formStep === 2 && !isNew && editForm.turmaId && editForm.turmaId !== '' && (
                        <Button
                          onClick={async () => {
                            const turmaAnterior = getTurmaNome(editForm.turmaId);
                            setEditForm(prev => ({ ...prev, turmaId: '' }));
                            
                            // Log da desvinculação de turma
                            if (editAluno && editAluno.id) {
                              await auditService.logAction(
                                LOG_ACTIONS.CLASS_REMOVE_STUDENT,
                                userId,
                                {
                                  entityId: editAluno.id,
                                  description: `Aluno ${editForm.nome} desvinculado da turma ${turmaAnterior}`,
                                  changes: {
                                    turmaAnterior: turmaAnterior,
                                    turmaNova: 'Sem turma'
                                  }
                                }
                              );
                            }
                          }}
                          color="info"
                          variant="outlined"
                          size="small"
                          disabled={saving}
                          sx={{ fontSize: '0.80rem', textTransform: 'none', py: 0.5, px: 1.2 }}
                        >
                          Desvincular Turma
                        </Button>
                      )}
                      {formStep === 2 && !isNew && editForm.status === 'inativo' && (
                        <Button 
                          onClick={handleAtivarAluno}
                          sx={{
                            borderColor: '#059669',
                            color: '#059669',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: '#f0fdf4',
                              borderColor: '#047857',
                              color: '#047857'
                            }
                          }}
                          variant="outlined" 
                          disabled={saving}
                        >
                          ✓ Ativar
                        </Button>
                      )}
                      {formStep === 2 && !isNew && editForm.status !== 'inativo' && (
                        <Button 
                          onClick={handleInativarAluno} 
                          sx={{
                            borderColor: '#d97706',
                            color: '#d97706',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: '#fffbeb',
                              borderColor: '#b45309',
                              color: '#b45309'
                            }
                          }}
                          variant="outlined" 
                          disabled={saving}
                        >
                          ⚠ Inativar
                        </Button>
                      )}
                      {gerandoTitulos && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                          <CircularProgress size={16} />
                          <Typography variant="body2">Gerando títulos financeiros...</Typography>
                        </Box>
                      )}
                      
                      {resultadoTitulos && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>🎉 Títulos gerados com sucesso!</strong><br />
                            {resultadoTitulos.matricula > 0 && `• Taxa de matrícula: R$ ${(parseFloat(resultadoTitulos.detalhes.find(t => t.tipo === 'matricula')?.valor) || 0).toFixed(2)}`}<br />
                            {resultadoTitulos.materiais > 0 && `• Taxa de materiais: R$ ${(parseFloat(resultadoTitulos.detalhes.find(t => t.tipo === 'materiais')?.valor) || 0).toFixed(2)}`}<br />
                            • Mensalidades: {resultadoTitulos.mensalidades} títulos<br />
                            • <strong>Total: R$ {(parseFloat(resultadoTitulos.valorTotal) || 0).toFixed(2)}</strong>
                          </Typography>
                        </Alert>
                      )}
                      
                      {formStep === 2 && (
                        <Button 
                          onClick={handleSaveEdit} 
                          sx={{
                            bgcolor: '#059669',
                            color: 'white',
                            borderRadius: 2,
                            minWidth: 100,
                            '&:hover': {
                              bgcolor: '#047857',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                            },
                            '&:disabled': {
                              bgcolor: '#94a3b8',
                              color: 'white'
                            },
                            transition: 'all 0.3s ease'
                          }}
                          disabled={saving || !isFinalFormValid() || gerandoTitulos}
                        >
                          {saving ? '💾 Salvando...' : gerandoTitulos ? '🔄 Gerando títulos...' : isNew ? '✓ Criar Matrícula' : '✓ Salvar'}
                        </Button>
                      )}
                    </DialogActions>
                  {/* Modal de impedimento para inativação */}
                  <Dialog open={inativarDialogOpen} onClose={() => setInativarDialogOpen(false)}>
                    <DialogTitle>Não é possível inativar o aluno</DialogTitle>
                    <DialogContent>
                      <Alert severity="warning" sx={{ whiteSpace: 'pre-line', fontSize: '1rem', mb: 1 }}>
                        {inativarMotivo.split('\n').map((linha, idx) => (
                          <span key={idx}>{linha}{idx < inativarMotivo.split('\n').length - 1 ? <br /> : null}</span>
                        ))}
                      </Alert>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setInativarDialogOpen(false)} color="primary">OK</Button>
                    </DialogActions>
                  </Dialog>

                  {/* Modal de confirmação para inadimplência */}
                  <Dialog 
                    open={inadimplenciaDialogOpen} 
                    onClose={() => setInadimplenciaDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                  >
                    <DialogTitle sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: 'white'
                    }}>
                      ⚠️ Aluno com Títulos Vencidos - Confirmar Inativação
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          🚨 O aluno <strong>{editForm?.nome || 'Nome não disponível'}</strong> possui títulos vencidos
                        </Typography>
                        <Typography variant="body2">
                          Confirme se deseja inativar o aluno mesmo com títulos vencidos. 
                          Essas informações serão armazenadas para consultas futuras.
                        </Typography>
                      </Alert>

                      {carregandoTitulos ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                          <Typography sx={{ ml: 2 }}>Carregando títulos em aberto...</Typography>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            bgcolor: '#fef2f2', 
                            border: '1px solid #fed7d7',
                            mb: 3
                          }}>
                            <Typography variant="h6" sx={{ color: '#dc2626', mb: 2 }}>
                              📊 Títulos Vencidos
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <Typography variant="body2">
                                <strong>Títulos vencidos:</strong> {titulosEmAberto.length}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Valor total:</strong> R$ {titulosEmAberto.reduce((total, titulo) => total + (titulo.valor || 0), 0).toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>

                          {titulosEmAberto.length > 0 && (
                            <Box>
                              <Typography variant="h6" gutterBottom sx={{ color: '#dc2626' }}>
                                📄 Títulos Vencidos
                              </Typography>
                              <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                                {titulosEmAberto.map((titulo, idx) => {
                                  const vencimento = new Date(titulo.vencimento);
                                  const hoje = new Date();
                                  const diasAtraso = Math.floor((hoje - vencimento) / (1000 * 60 * 60 * 24));
                                  const isVencido = diasAtraso > 0;
                                  
                                  return (
                                    <ListItem key={idx} divider={idx < titulosEmAberto.length - 1}>
                                      <ListItemText
                                        primary={
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                              {titulo.descricao}
                                            </Typography>
                                            <Typography variant="body2" sx={{ 
                                              color: isVencido ? '#dc2626' : '#d97706',
                                              fontWeight: 'bold'
                                            }}>
                                              R$ {(titulo.valor || 0).toFixed(2)}
                                            </Typography>
                                          </Box>
                                        }
                                        secondary={
                                          <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" sx={{ 
                                              color: isVencido ? '#dc2626' : '#64748b',
                                              fontWeight: isVencido ? 'bold' : 'normal'
                                            }}>
                                              Vencimento: {vencimento.toLocaleDateString('pt-BR')}
                                              {isVencido && ` (${diasAtraso} dias em atraso)`}
                                              {!isVencido && diasAtraso < 0 && ` (vence em ${Math.abs(diasAtraso)} dias)`}
                                            </Typography>
                                            <Typography variant="caption" sx={{ display: 'block', color: '#6366f1' }}>
                                              Tipo: {titulo.tipo}
                                            </Typography>
                                          </Box>
                                        }
                                      />
                                    </ListItem>
                                  );
                                })}
                              </List>
                            </Box>
                          )}
                        </>
                      )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                      <Button 
                        onClick={() => setInadimplenciaDialogOpen(false)} 
                        color="inherit"
                        variant="outlined"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={() => confirmarInativacao('Inativado por inadimplência - possui títulos vencidos')} 
                        sx={{
                          bgcolor: '#dc2626',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#b91c1c'
                          }
                        }}
                        variant="contained"
                        disabled={saving || carregandoTitulos}
                      >
                        {saving ? '⏳ Inativando...' : '✓ Inativar com Títulos Vencidos'}
                      </Button>
                    </DialogActions>
                  </Dialog>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </main>
    </div>
  );
};

export default Alunos;