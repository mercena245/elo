'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  Fab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
  CardActions,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Add,
  ShoppingCart,
  Store,
  Edit,
  Delete,
  PhotoCamera,
  Save,
  Cancel,
  Remove,
  Clear,
  ShoppingBag,
  AttachMoney,
  Inventory,
  LocalOffer,
  Assessment,
  Check
} from '@mui/icons-material';
import { auth, onAuthStateChanged } from '../../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import ProtectedRoute from '../../components/ProtectedRoute';
import SidebarMenu from '../../components/SidebarMenu';
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';

const LojaPage = () => {

  // Hook para acessar banco da escola
  const { getData, setData, pushData, removeData, updateData, isReady, error: dbError, currentSchool, storage: schoolStorage } = useSchoolDatabase();

  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [userId, setUserId] = useState(null);
  
  // Estados dos dados
  const [produtos, setProdutos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  
  // Estados dos dialogs
  const [produtoDialog, setProdutoDialog] = useState(false);
  const [carrinhoDialog, setCarrinhoDialog] = useState(false);
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [compraSuccessDialog, setCompraSuccessDialog] = useState(false);
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  
  // Estados do relatório de vendas
  const [vendas, setVendas] = useState([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  
  // Estado do produto em edição
  const [produtoEditando, setProdutoEditando] = useState({
    id: null,
    titulo: '',
    descricao: '',
    valor: '',
    foto: '',
    ativo: true
  });
  
  // Estado do checkout
  const [checkout, setCheckout] = useState({
    alunoSelecionado: null,
    observacoes: ''
  });
  
  const [imageUpload, setImageUpload] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Listener de autenticação - DEVE rodar imediatamente, sem depender de isReady
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ [Loja] Usuário autenticado:', user.uid);
        setUserId(user.uid);
      } else {
        console.log('❌ [Loja] Nenhum usuário autenticado');
        setUserId(null);
        setUserRole(null);
        // Evitar redirecionamento se já estamos na página de login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Helper functions
  const isCoordenador = () => {
    return userRole === 'coordenadora' || userRole === 'coordenador';
  };

  const isPai = () => {
    return userRole === 'pai' || userRole === 'mae';
  };

  // Verificar role do usuário
  useEffect(() => {
    async function fetchRole() {
      console.log('🔍 [Loja] Verificando role - userId:', userId, 'isReady:', isReady);
      
      if (!userId) {
        console.log('⚠️ [Loja] Sem userId - marcando roleChecked como true');
        setUserRole(null);
        setRoleChecked(true);
        return;
      }

      if (!isReady) {
        console.log('⏳ [Loja] Aguardando conexão com banco da escola...');
        return;
      }
      
      try {
        console.log('📡 [Loja] Buscando dados do usuário:', `usuarios/${userId}`);
        const userData = await getData(`usuarios/${userId}`);
        console.log('📦 [Loja] Dados recebidos:', userData);
        
        if (userData) {
          // ✅ Não converter para lowercase - manter o valor original
          setUserRole(userData.role || '');
          console.log('✅ [Loja] Role carregada:', userData.role);
        } else {
          console.log('⚠️ [Loja] Nenhum dado encontrado para o usuário');
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ [Loja] Erro ao buscar dados do usuário:', error);
        setUserRole(null);
      } finally {
        setRoleChecked(true);
        console.log('✔️ [Loja] roleChecked marcado como true');
      }
    }
    fetchRole();
  }, [userId, isReady, getData]);

  // Carregar dados
  useEffect(() => {
    if (userRole) {
      fetchData();
    }
  }, [userRole, userId]);

  // Carregar vendas quando acessar a aba de vendas
  useEffect(() => {
    if (tabValue === 1 && isCoordenador()) {
      fetchVendas(filtroDataInicio, filtroDataFim);
    }
  }, [tabValue, filtroDataInicio, filtroDataFim, userRole]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProdutos(),
        fetchAlunos()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProdutos = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    try {
      const produtosData = await getData('loja_produtos');
      if (produtosData) {
        const produtosArray = Object.entries(produtosData)
          .map(([id, produto]) => ({ id, ...produto }))
          .filter(produto => produto.ativo !== false);
        setProdutos(produtosArray);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const fetchAlunos = async () => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    try {
      if (isPai()) {
        // Pai/Mãe vê apenas seus alunos vinculados
        const userData = await getData(`usuarios/${userId}`);
        
        if (userData) {
          const alunosIds = userData.alunosVinculados || [];
          
          if (alunosIds.length > 0) {
            const todosAlunosData = await getData('alunos');
            
            if (todosAlunosData) {
              const todosAlunos = Object.entries(todosAlunosData)
                .map(([id, aluno]) => ({ id, ...aluno }));
              
              const alunosVinculados = todosAlunos.filter(aluno => alunosIds.includes(aluno.id));
              setAlunos(alunosVinculados);
            }
          }
        }
      } else {
        // Coordenador vê todos os alunos
        const alunosData = await getData('alunos');
        if (alunosData) {
          const alunosArray = Object.entries(alunosData).map(([id, aluno]) => ({
            id,
            ...aluno
          }));
          setAlunos(alunosArray);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  // Função para carregar vendas (títulos financeiros do tipo loja)
  const fetchVendas = async (dataInicio = null, dataFim = null) => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    try {
      setLoadingVendas(true);
      const titulosData = await getData('titulos_financeiros');
      
      if (titulosData) {
        const titulosArray = Object.entries(titulosData)
          .map(([id, titulo]) => ({ id, ...titulo }))
          .filter(titulo => titulo.tipo === 'loja'); // Apenas vendas da loja
        
        // Aplicar filtros de data se fornecidos
        let vendasFiltradas = titulosArray;
        if (dataInicio || dataFim) {
          vendasFiltradas = titulosArray.filter(venda => {
            const dataVenda = new Date(venda.dataCriacao);
            const inicio = dataInicio ? new Date(dataInicio) : null;
            const fim = dataFim ? new Date(dataFim + 'T23:59:59') : null;
            
            if (inicio && fim) {
              return dataVenda >= inicio && dataVenda <= fim;
            } else if (inicio) {
              return dataVenda >= inicio;
            } else if (fim) {
              return dataVenda <= fim;
            }
            return true;
          });
        }
        
        // Ordenar por data (mais recente primeiro)
        vendasFiltradas.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
        
        setVendas(vendasFiltradas);
      } else {
        setVendas([]);
      }
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      setVendas([]);
    } finally {
      setLoadingVendas(false);
    }
  };

  // Funções de formatação
  const formatCurrency = (value) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Funções para calcular métricas das vendas
  const calcularMetricasVendas = () => {
    const totalVendas = vendas.reduce((acc, venda) => acc + venda.valor, 0);
    const quantidadeVendas = vendas.length;
    const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;
    
    return {
      totalVendas,
      quantidadeVendas,
      ticketMedio
    };
  };

  const getAlunoNome = (alunoId) => {
    const aluno = alunos.find(a => a.id === alunoId);
    return aluno ? aluno.nome : 'Aluno não encontrado';
  };

  // Funções de produto
  const abrirDialogProduto = (produto = null) => {
    if (produto) {
      setProdutoEditando({
        id: produto.id,
        titulo: produto.titulo || '',
        descricao: produto.descricao || '',
        valor: produto.valor || '',
        foto: produto.foto || '',
        ativo: produto.ativo !== false
      });
      setImagePreview(produto.foto || '');
    } else {
      setProdutoEditando({
        id: null,
        titulo: '',
        descricao: '',
        valor: '',
        foto: '',
        ativo: true
      });
      setImagePreview('');
    }
    setImageUpload(null);
    setProdutoDialog(true);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageUpload(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarProduto = async () => {
    if (salvandoProduto) return; // Evita cliques duplos

    console.log('💾 [Loja] Iniciando salvamento de produto...');
    console.log('📊 [Loja] Estado:', { 
      isReady, 
      hasStorage: !!schoolStorage,
      hasStorageInstance: !!schoolStorage?._storage,
      hasImageUpload: !!imageUpload 
    });

    if (!isReady) {
      console.log('⏳ [Loja] Aguardando conexão com banco da escola...');
      alert('Aguarde a conexão com o banco de dados da escola...');
      return;
    }

    if (!schoolStorage || !schoolStorage._storage) {
      console.error('❌ [Loja] schoolStorage não está disponível!');
      console.error('schoolStorage:', schoolStorage);
      alert('Erro: Storage da escola não disponível. Tente recarregar a página.');
      return;
    }
    
    setSalvandoProduto(true);
    try {
      let fotoUrl = produtoEditando.foto;
      
      // Upload da imagem se houver
      if (imageUpload) {
        console.log('📤 [Loja] Fazendo upload da imagem...');
        const filePath = `loja/${Date.now()}_${imageUpload.name}`;
        console.log('📁 [Loja] Caminho do arquivo:', filePath);
        
        // Usar _storage (instância real do Firebase Storage)
        const imageRef = storageRef(schoolStorage._storage, filePath);
        await uploadBytes(imageRef, imageUpload);
        fotoUrl = await getDownloadURL(imageRef);
        
        console.log('✅ [Loja] Upload concluído. URL:', fotoUrl);
      }

      const produtoData = {
        ...produtoEditando,
        foto: fotoUrl,
        valor: parseFloat(produtoEditando.valor),
        dataAtualizacao: new Date().toISOString()
      };

      if (produtoEditando.id) {
        // Atualizar produto existente
        console.log('🔄 [Loja] Atualizando produto:', produtoEditando.id);
        await setData(`loja_produtos/${produtoEditando.id}`, produtoData);
      } else {
        // Criar novo produto
        console.log('➕ [Loja] Criando novo produto');
        produtoData.dataCriacao = new Date().toISOString();
        produtoData.ativo = true;
        await pushData('loja_produtos', produtoData);
      }

      console.log('✅ [Loja] Produto salvo com sucesso!');
      await fetchProdutos();
      setProdutoDialog(false);
      
    } catch (error) {
      console.error('❌ [Loja] Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSalvandoProduto(false);
    }
  };

  const excluirProduto = async (produtoId) => {
    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const produtoAtual = produtos.find(p => p.id === produtoId);
        await setData(`loja_produtos/${produtoId}`, { ...produtoAtual, ativo: false });
        await fetchProdutos();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto. Tente novamente.');
      }
    }
  };

  // Funções do carrinho
  const verificarProdutoNoCarrinho = (produtoId) => {
    return carrinho.some(item => item.produto.id === produtoId);
  };

  const adicionarAoCarrinho = (produto) => {
    setCarrinho(prev => {
      const existente = prev.find(item => item.produto.id === produto.id);
      if (existente) {
        return prev.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...prev, { produto, quantidade: 1 }];
      }
    });
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const alterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(produtoId);
    } else {
      setCarrinho(prev =>
        prev.map(item =>
          item.produto.id === produtoId
            ? { ...item, quantidade: novaQuantidade }
            : item
        )
      );
    }
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + (item.produto.valor * item.quantidade), 0);
  };

  const limparCarrinho = () => {
    setCarrinho([]);
  };

  // Função de checkout
  const finalizarCompra = async () => {
    if (!checkout.alunoSelecionado || carrinho.length === 0) {
      alert('Selecione um aluno e adicione produtos ao carrinho.');
      return;
    }

    if (!isReady) {
      console.log('⏳ Aguardando conexão com banco da escola...');
      return;
    }

    try {
      const total = calcularTotal();
      const itensDescricao = carrinho.map(item => 
        `${item.quantidade}x ${item.produto.titulo}`
      ).join(', ');

      // Criar título financeiro
      const tituloData = {
        alunoId: checkout.alunoSelecionado.id,
        tipo: 'loja',
        descricao: `Loja: ${itensDescricao}`,
        valor: total,
        status: 'pendente',
        dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
        dataCriacao: new Date().toISOString(),
        observacoes: checkout.observacoes || '',
        itensLoja: carrinho.map(item => ({
          produtoId: item.produto.id,
          titulo: item.produto.titulo,
          quantidade: item.quantidade,
          valorUnitario: item.produto.valor,
          valorTotal: item.produto.valor * item.quantidade
        }))
      };

      await pushData('titulos_financeiros', tituloData);

      // Limpar carrinho e fechar dialogs
      limparCarrinho();
      setCheckoutDialog(false);
      setCarrinhoDialog(false);
      setCheckout({ alunoSelecionado: null, observacoes: '' });

      // Mostrar modal de sucesso
      setCompraSuccessDialog(true);
      
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      alert('Erro ao finalizar compra. Tente novamente.');
    }
  };

  // Mostrar loading enquanto verifica a role
  if (!roleChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Verificar acesso após role ser carregada
  if (!userRole || !['coordenadora', 'coordenador', 'pai', 'mae'].includes(userRole)) {
    return (
      <Container>
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Acesso não autorizado.
        </Typography>
        <Typography variant="body2" align="center" sx={{ mt: 2, color: 'text.secondary' }}>
          Role detectada: "{userRole || 'não definida'}"
        </Typography>
      </Container>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['coordenadora', 'coordenador', 'pai', 'mae']}>
      <SidebarMenu />
      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 8 }}>
        <Container maxWidth="lg" sx={{ pt: 3 }}>
          {/* Header */}
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Store sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    🛍️ Loja ELO
                  </Typography>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    {isCoordenador() && 'Gerencie produtos e vendas'}
                    {isPai() && 'Produtos disponíveis para compra'}
                  </Typography>
                </Box>
              </Box>
              
              {isPai() && (
                <Badge badgeContent={carrinho.length} color="error">
                  <Fab
                    color="secondary"
                    onClick={() => setCarrinhoDialog(true)}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  >
                    <ShoppingCart />
                  </Fab>
                </Badge>
              )}
            </Box>
          </Paper>

          {/* Tabs (se for coordenador) */}
          {isCoordenador() && (
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={(e, newValue) => setTabValue(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="🛍️ Produtos" />
                <Tab label="📊 Vendas" />
              </Tabs>
            </Paper>
          )}

          {/* Conteúdo principal */}
          {(isCoordenador() && tabValue === 0) || isPai() ? (
            <>
              {/* Botão Adicionar Produto (só coordenador) */}
              {isCoordenador() && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => abrirDialogProduto()}
                    sx={{ 
                      background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                      boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
                    }}
                  >
                    Novo Produto
                  </Button>
                </Box>
              )}

              {/* Grade de Produtos */}
              <Grid container spacing={2}>
                {produtos.map((produto) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={produto.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        maxWidth: 280,
                        margin: 'auto',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      {produto.foto && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={produto.foto}
                          alt={produto.titulo}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography 
                          variant="subtitle2" 
                          component="h2" 
                          gutterBottom
                          sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            mb: 1
                          }}
                        >
                          {produto.titulo}
                        </Typography>
                        
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            flexGrow: 1,
                            mb: 1,
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                            fontSize: '0.75rem',
                            lineHeight: 1.3
                          }}
                        >
                          {produto.descricao}
                        </Typography>
                        
                        <Typography 
                          variant="subtitle1" 
                          color="primary" 
                          fontWeight="bold"
                          sx={{ 
                            fontSize: '1rem',
                            mb: 0
                          }}
                        >
                          {formatCurrency(produto.valor)}
                        </Typography>
                      </CardContent>

                      <CardActions sx={{ justifyContent: 'space-between', p: 1, pt: 0 }}>
                        {isPai() && (
                          <Button
                            variant={verificarProdutoNoCarrinho(produto.id) ? "outlined" : "contained"}
                            color={verificarProdutoNoCarrinho(produto.id) ? "success" : "primary"}
                            startIcon={verificarProdutoNoCarrinho(produto.id) ? <Check /> : <Add />}
                            onClick={() => adicionarAoCarrinho(produto)}
                            size="small"
                            fullWidth
                            sx={{ 
                              fontSize: '0.75rem', 
                              py: 0.5,
                              ...(verificarProdutoNoCarrinho(produto.id) && {
                                bgcolor: 'success.50',
                                borderColor: 'success.main',
                                color: 'success.main',
                                '&:hover': {
                                  bgcolor: 'success.100',
                                  borderColor: 'success.dark'
                                }
                              })
                            }}
                          >
                            {verificarProdutoNoCarrinho(produto.id) ? 'Adicionado' : 'Adicionar'}
                          </Button>
                        )}
                        
                        {isCoordenador() && (
                          <Box sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
                            <Button
                              variant="outlined"
                              startIcon={<Edit />}
                              onClick={() => abrirDialogProduto(produto)}
                              size="small"
                              sx={{ flex: 1, fontSize: '0.7rem', py: 0.25 }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => excluirProduto(produto.id)}
                              size="small"
                              sx={{ flex: 1, fontSize: '0.7rem', py: 0.25 }}
                            >
                              Excluir
                            </Button>
                          </Box>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {produtos.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                  <Inventory sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhum produto cadastrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isCoordenador() && 'Adicione produtos para começar a vender.'}
                    {isPai() && 'Aguarde novos produtos serem adicionados.'}
                  </Typography>
                </Paper>
              )}
            </>
          ) : (
            // Tab de Vendas (coordenador)
            <Box>
              {/* Filtros de Data */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment color="primary" />
                  Filtros do Relatório
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Data Início"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Data Fim"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setFiltroDataInicio('');
                        setFiltroDataFim('');
                      }}
                      sx={{ height: '56px' }}
                    >
                      Limpar Filtros
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Cards de Métricas */}
              {!loadingVendas && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {(() => {
                    const metricas = calcularMetricasVendas();
                    return (
                      <>
                        <Grid item xs={12} sm={4}>
                          <Card sx={{ textAlign: 'center', p: 2 }}>
                            <CardContent>
                              <AttachMoney sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                              <Typography variant="h4" color="success.main" gutterBottom>
                                {formatCurrency(metricas.totalVendas)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total em Vendas
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Card sx={{ textAlign: 'center', p: 2 }}>
                            <CardContent>
                              <ShoppingBag sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                              <Typography variant="h4" color="primary.main" gutterBottom>
                                {metricas.quantidadeVendas}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Quantidade de Vendas
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Card sx={{ textAlign: 'center', p: 2 }}>
                            <CardContent>
                              <Assessment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                              <Typography variant="h4" color="info.main" gutterBottom>
                                {formatCurrency(metricas.ticketMedio)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Ticket Médio
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </>
                    );
                  })()}
                </Grid>
              )}

              {/* Tabela de Vendas */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Store color="primary" />
                  Detalhes das Vendas
                </Typography>

                {loadingVendas ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : vendas.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Data</TableCell>
                          <TableCell>Aluno</TableCell>
                          <TableCell>Produtos</TableCell>
                          <TableCell align="center">Qtd Itens</TableCell>
                          <TableCell align="right">Valor</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vendas.map((venda) => (
                          <TableRow key={venda.id}>
                            <TableCell>{formatDate(venda.dataCriacao)}</TableCell>
                            <TableCell>{getAlunoNome(venda.alunoId)}</TableCell>
                            <TableCell>
                              {venda.itensLoja ? (
                                <Box>
                                  {venda.itensLoja.map((item, index) => (
                                    <Typography key={index} variant="body2">
                                      {item.quantidade}x {item.titulo}
                                    </Typography>
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="body2">
                                  {venda.descricao.replace('Loja: ', '')}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {venda.itensLoja ? 
                                venda.itensLoja.reduce((acc, item) => acc + item.quantidade, 0) :
                                '-'
                              }
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(venda.valor)}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={venda.status}
                                color={venda.status === 'pago' ? 'success' : venda.status === 'pendente' ? 'warning' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Assessment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Nenhuma venda encontrada
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {filtroDataInicio || filtroDataFim ? 
                        'Nenhuma venda encontrada no período selecionado.' :
                        'Ainda não há vendas registradas na loja.'
                      }
                    </Typography>
                  </Paper>
                )}
              </Paper>
            </Box>
          )}
        </Container>

        {/* Dialogs e outros componentes serão adicionados aqui */}

        {/* Dialog Produto */}
        <Dialog 
          open={produtoDialog} 
          onClose={() => setProdutoDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Store color="primary" />
            <Typography variant="h6" component="span">
              {produtoEditando.id ? 'Editar Produto' : 'Novo Produto'}
            </Typography>
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                {/* Upload de Imagem */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      📸 Foto do Produto
                    </Typography>
                    
                    {imagePreview && (
                      <Box sx={{ mb: 2 }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            maxWidth: 300,
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '2px solid #e0e0e0'
                          }}
                        />
                      </Box>
                    )}
                    
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="upload-button"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="upload-button">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCamera />}
                        fullWidth
                      >
                        {imagePreview ? 'Trocar Foto' : 'Selecionar Foto'}
                      </Button>
                    </label>
                  </Box>
                </Grid>

                {/* Dados do Produto */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Título do Produto"
                      value={produtoEditando.titulo}
                      onChange={(e) => setProdutoEditando(prev => ({ ...prev, titulo: e.target.value }))}
                      fullWidth
                      required
                    />
                    
                    <TextField
                      label="Descrição"
                      value={produtoEditando.descricao}
                      onChange={(e) => setProdutoEditando(prev => ({ ...prev, descricao: e.target.value }))}
                      fullWidth
                      multiline
                      rows={4}
                      required
                    />
                    
                    <TextField
                      label="Valor (R$)"
                      type="number"
                      value={produtoEditando.valor}
                      onChange={(e) => setProdutoEditando(prev => ({ ...prev, valor: e.target.value }))}
                      fullWidth
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button 
              onClick={() => setProdutoDialog(false)}
              startIcon={<Cancel />}
            >
              Cancelar
            </Button>
            <Button 
              onClick={salvarProduto}
              variant="contained"
              startIcon={salvandoProduto ? null : <Save />}
              disabled={!produtoEditando.titulo || !produtoEditando.valor || salvandoProduto}
            >
              {salvandoProduto ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Carrinho */}
        <Dialog 
          open={carrinhoDialog} 
          onClose={() => setCarrinhoDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart color="primary" />
            <Typography variant="h6" component="span">
              Carrinho de Compras
            </Typography>
            <Badge badgeContent={carrinho.length} color="error" sx={{ ml: 1 }} />
          </DialogTitle>
          
          <DialogContent>
            {carrinho.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShoppingBag sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Carrinho vazio
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adicione produtos para continuar
                </Typography>
              </Box>
            ) : (
              <>
                <List>
                  {carrinho.map((item) => (
                    <ListItem key={item.produto.id} divider>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                        {item.produto.foto && (
                          <Avatar 
                            src={item.produto.foto} 
                            sx={{ width: 60, height: 60 }}
                            variant="rounded"
                          />
                        )}
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {item.produto.titulo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(item.produto.valor)} cada
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            Total: {formatCurrency(item.produto.valor * item.quantidade)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                          >
                            <Remove />
                          </IconButton>
                          
                          <Chip 
                            label={item.quantidade} 
                            size="small" 
                            color="primary"
                            sx={{ minWidth: 40 }}
                          />
                          
                          <IconButton 
                            size="small" 
                            onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                          >
                            <Add />
                          </IconButton>
                          
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => removerDoCarrinho(item.produto.id)}
                          >
                            <Clear />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total:
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {formatCurrency(calcularTotal())}
                  </Typography>
                </Box>
              </>
            )}
          </DialogContent>
          
          <DialogActions>
            {carrinho.length > 0 && (
              <Button 
                onClick={limparCarrinho}
                color="error"
                startIcon={<Clear />}
              >
                Limpar
              </Button>
            )}
            
            <Button onClick={() => setCarrinhoDialog(false)}>
              Continuar Comprando
            </Button>
            
            {carrinho.length > 0 && (
              <Button 
                onClick={() => setCheckoutDialog(true)}
                variant="contained"
                startIcon={<AttachMoney />}
              >
                Finalizar Compra
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Dialog Checkout */}
        <Dialog 
          open={checkoutDialog} 
          onClose={() => setCheckoutDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" />
            <Typography variant="h6" component="span">
              Finalizar Compra
            </Typography>
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Seleção do Aluno */}
              <Autocomplete
                options={alunos}
                getOptionLabel={(aluno) => `${aluno.nome} - ${aluno.matricula}`}
                value={checkout.alunoSelecionado}
                onChange={(event, newValue) => {
                  setCheckout(prev => ({ ...prev, alunoSelecionado: newValue }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecionar Aluno"
                    required
                    helperText="Selecione o aluno para quem será gerado o título"
                  />
                )}
              />
              
              {/* Observações */}
              <TextField
                label="Observações (opcional)"
                value={checkout.observacoes}
                onChange={(e) => setCheckout(prev => ({ ...prev, observacoes: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                placeholder="Informações adicionais sobre a compra..."
              />
              
              {/* Resumo da Compra */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  📋 Resumo da Compra
                </Typography>
                
                {carrinho.map((item) => (
                  <Box key={item.produto.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {item.quantidade}x {item.produto.titulo}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(item.produto.valor * item.quantidade)}
                    </Typography>
                  </Box>
                ))}
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Total:
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(calcularTotal())}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setCheckoutDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={finalizarCompra}
              variant="contained"
              color="success"
              startIcon={<AttachMoney />}
              disabled={!checkout.alunoSelecionado || carrinho.length === 0}
            >
              Confirmar Compra
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Sucesso da Compra */}
        <Dialog 
          open={compraSuccessDialog} 
          onClose={() => setCompraSuccessDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                <Check sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                Compra Realizada!
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Sua compra foi processada com sucesso! Um título financeiro foi gerado para pagamento.
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Para realizar o pagamento, acesse:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <AttachMoney color="primary" />
                <Typography variant="subtitle1" color="primary" fontWeight="medium">
                  Menu Financeiro
                </Typography>
              </Box>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button 
              onClick={() => setCompraSuccessDialog(false)}
              variant="outlined"
              sx={{ minWidth: 120 }}
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                setCompraSuccessDialog(false);
                router.push('/financeiro');
              }}
              variant="contained"
              startIcon={<AttachMoney />}
              sx={{ minWidth: 120 }}
            >
              Ir ao Financeiro
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ProtectedRoute>
  );
};

export default LojaPage;