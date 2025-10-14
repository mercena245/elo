"use client";

import React, { useEffect, useState, useRef } from 'react';
import SidebarMenu from '../../components/SidebarMenu';
import { 
  Card, 
  CardContent, 
  Box, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import { auth, onAuthStateChanged } from '../../firebase';
import { schoolStorage } from '../../firebase-schoolStorage';
import { auditService, LOG_ACTIONS } from '../../services/auditService';
import { financeiroService } from '../../services/financeiroService';

// Importar os componentes criados
import {
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
  AlunosHeader,
  AlunosFiltros,
  AlunosList,
  AlunoFormDialog
} from './components';

// Componentes auxiliares que precisariam ser extraídos também
const PreMatriculaIndicator = ({ aluno }) => {
  // Implementação simplificada - a lógica completa estaria aqui
  return <span>⏳</span>;
};

const PreMatriculaDetalhes = ({ aluno }) => {
  // Implementação simplificada - a lógica completa estaria aqui
  return <div>Detalhes da pré-matrícula</div>;
};

const ConfirmDialog = ({ open, onClose, onConfirm, title, message }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{message}</DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancelar</Button>
      <Button onClick={onConfirm} color="error">Confirmar</Button>
    </DialogActions>
  </Dialog>
);

const Alunos = () => {
  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  // Estados principais
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState({});
  const [loading, setLoading] = useState(true);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroMatricula, setFiltroMatricula] = useState('');
  
  // Estados do formulário
  const [editOpen, setEditOpen] = useState(false);
  const [editAluno, setEditAluno] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [formStep, setFormStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados auxiliares
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [roleChecked, setRoleChecked] = useState(false);
  const [cardsExpandidos, setCardsExpandidos] = useState({});
  const [verificandoPagamentos, setVerificandoPagamentos] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [validacaoCpf, setValidacaoCpf] = useState({
    aluno: true,
    mae: true,
    pai: true
  });
  
  // Estados para anexos e upload
  const [anexosSelecionados, setAnexosSelecionados] = useState([]);
  const [anexosParaExcluir, setAnexosParaExcluir] = useState([]);
  const [fotoAluno, setFotoAluno] = useState(null);
  const inputFotoRef = useRef();

  // Funções principais (versões simplificadas - as implementações completas estariam aqui)
  const fetchData = async () => {
    try {
      setLoading(true);
      // Lógica de busca de dados
      // ... implementação completa ...
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAluno = () => {
    // Lógica para adicionar novo aluno
    setIsNew(true);
    setEditAluno(null);
    setEditForm({
      // Estrutura inicial do formulário
      nome: '',
      matricula: '',
      // ... outros campos ...
    });
    setFormStep(1);
    setEditOpen(true);
  };

  const handleEditAluno = async (aluno) => {
    // Lógica para editar aluno existente
    setIsNew(false);
    setEditAluno(aluno);
    setEditForm(aluno);
    setFormStep(1);
    setEditOpen(true);
  };

  const handleSaveAluno = async () => {
    try {
      setSaving(true);
      // Lógica de salvamento
      // ... implementação completa ...
      setEditOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setFormError('Erro ao salvar aluno');
    } finally {
      setSaving(false);
    }
  };

  const handleVerificarPagamentos = async () => {
    try {
      setVerificandoPagamentos(true);
      // Lógica de verificação de pagamentos
      // ... implementação completa ...
    } catch (error) {
      console.error('Erro ao verificar pagamentos:', error);
    } finally {
      setVerificandoPagamentos(false);
    }
  };

  const buscarEnderecoPorCep = async (cep, tipo) => {
    // Lógica de busca de CEP
    // ... implementação completa ...
  };

  const buscarDadosTurma = async (turmaId) => {
    // Lógica de busca de dados da turma
    // ... implementação completa ...
  };

  const toggleCardExpansao = (id, e) => {
    e.stopPropagation();
    setCardsExpandidos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getTurmaNome = turmaId => turmas[turmaId]?.nome || '---';

  // Filtrar alunos
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

  // useEffect para carregar dados iniciais
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchData();
      }
    });
    return () => unsubscribe();
  }, [isReady]);

  // Verificação de permissões
  if (!roleChecked) {
    return (
      <div className="dashboard-container">
        <SidebarMenu />
        <main className="dashboard-main">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <SidebarMenu />
      <main className="dashboard-main">
        <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4 }}>
          
          {/* Cabeçalho */}
          <AlunosHeader
            verificandoPagamentos={verificandoPagamentos}
            onVerificarPagamentos={handleVerificarPagamentos}
            onNovaMatricula={handleAddAluno}
          />
          
          <Card sx={{ 
            borderRadius: 4, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
            border: '1px solid #f1f5f9' 
          }}>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {/* Filtros */}
                  <AlunosFiltros
                    turmaSelecionada={turmaSelecionada}
                    setTurmaSelecionada={setTurmaSelecionada}
                    filtroNome={filtroNome}
                    setFiltroNome={setFiltroNome}
                    filtroMatricula={filtroMatricula}
                    setFiltroMatricula={setFiltroMatricula}
                    turmas={turmas}
                  />
                  
                  {/* Lista de Alunos */}
                  <AlunosList
                    alunosFiltrados={alunosFiltrados}
                    cardsExpandidos={cardsExpandidos}
                    toggleCardExpansao={toggleCardExpansao}
                    getTurmaNome={getTurmaNome}
                    onEditAluno={handleEditAluno}
                    PreMatriculaDetalhes={PreMatriculaDetalhes}
                  />
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Dialog do Formulário */}
          <AlunoFormDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            editForm={editForm}
            setEditForm={setEditForm}
            formStep={formStep}
            setFormStep={setFormStep}
            formError={formError}
            isNew={isNew}
            turmas={turmas}
            buscandoCep={buscandoCep}
            validacaoCpf={validacaoCpf}
            buscarDadosTurma={buscarDadosTurma}
            onSave={handleSaveAluno}
            anexosSelecionados={anexosSelecionados}
            setAnexosSelecionados={setAnexosSelecionados}
            anexosParaExcluir={anexosParaExcluir}
            setAnexosParaExcluir={setAnexosParaExcluir}
            fotoAluno={fotoAluno}
            setFotoAluno={setFotoAluno}
            inputFotoRef={inputFotoRef}
          />
        </Box>
      </main>
    </div>
  );
};

export default Alunos;