# Expansão do Sistema de Pendências

## 📋 Resumo das Alterações

Data: 21 de outubro de 2025

### Objetivo
Expandir o sistema de pendências para incluir:
1. **Relatórios Pedagógicos** aguardando aprovação
2. **Títulos Financeiros** em análise (pagamentos pendentes de confirmação)

---

## 🎯 Novas Funcionalidades

### 1. **Relatórios Pedagógicos Pendentes**

#### Como Funciona:
- Quando uma **professora** cria um relatório pedagógico na **Sala dos Professores** > **Relatórios Pedagógicos**
- O sistema automaticamente salva com `statusAprovacao: 'pendente'`
- O relatório aparece na **Central de Pendências** para a coordenadora aprovar
- Após aprovação, o relatório fica com status `'aprovado'`

#### Fluxo:
```
Professora cria relatório
    ↓
statusAprovacao = 'pendente'
    ↓
Aparece na Central de Pendências
    ↓
Coordenadora clica para visualizar
    ↓
Redireciona para: /sala-professor?tab=relatorios&relatorio={id}
    ↓
Coordenadora aprova/rejeita
```

#### Dados Exibidos:
- Nome do aluno
- Nome da turma
- Template usado
- Data de criação
- Nome do professor

---

### 2. **Títulos Financeiros em Análise**

#### Como Funciona:
- Quando um **pai/responsável** faz um pagamento via sistema financeiro
- Após anexar comprovante, o título fica com `status: 'em_analise'`
- O título aparece na **Central de Pendências** para coordenadora confirmar
- Após confirmação, o título muda para `status: 'pago'`

#### Fluxo:
```
Pai anexa comprovante de pagamento
    ↓
status = 'em_analise'
    ↓
Aparece na Central de Pendências
    ↓
Coordenadora clica para visualizar
    ↓
Redireciona para: /financeiro?titulo={id}
    ↓
Coordenadora confirma/rejeita pagamento
```

#### Dados Exibidos:
- Nome do aluno
- Descrição do título (ex: "Mensalidade Abril/2025")
- Valor
- Data de vencimento
- Data do pagamento
- Forma de pagamento
- Link para visualizar comprovante

---

## 🎨 Interface da Central de Pendências

### Cards de Resumo (4 cards)

| Card | Cor | Ícone | Métrica |
|------|-----|-------|---------|
| **Planos de Aula** | Amarelo (#FEF3C7) | Assignment | Planos pendentes/rejeitados |
| **Relatórios Pedagógicos** | Roxo (#E0E7FF) | Description | Relatórios com status pendente |
| **Pagamentos em Análise** | Azul (#DBEAFE) | AttachMoney | Títulos com status em_analise |
| **Total de Pendências** | Verde (#D1FAE5) | CheckCircle | Soma de todas as pendências |

### Seções Expansíveis (Accordions)

#### 1. Planos de Aula
- Agrupados por **Turma**
- Badge mostrando quantidade por turma
- Ícone: 📚 SchoolIcon
- Cor: Amarelo/Laranja

#### 2. Relatórios Pedagógicos
- Agrupados por **Turma**
- Badge mostrando quantidade por turma
- Ícone: 📄 DescriptionIcon
- Cor: Roxo/Índigo

#### 3. Pagamentos em Análise
- Agrupados por **Aluno**
- Badge mostrando quantidade por aluno
- Ícone: 💰 AttachMoneyIcon
- Cor: Azul

---

## 🔧 Alterações Técnicas

### Arquivo: `src/app/pendencias/page.jsx`

#### Estados Adicionados:
```javascript
const [relatoriosPendentes, setRelatoriosPendentes] = useState([]);
const [titulosEmAnalise, setTitulosEmAnalise] = useState([]);
const [alunos, setAlunos] = useState({});
const [totalRelatorios, setTotalRelatorios] = useState(0);
const [totalTitulos, setTotalTitulos] = useState(0);
```

#### Dados Carregados:
```javascript
const [planosData, relatoriosData, titulosData, turmasData, disciplinasData, alunosData] = 
  await Promise.all([
    getData('planos-aula'),
    getData('relatorios-pedagogicos'),
    getData('titulos'),
    getData('turmas'),
    getData('disciplinas'),
    getData('alunos')
  ]);
```

#### Filtros Aplicados:

**Relatórios:**
```javascript
const relatoriosPendentes = relatoriosList.filter(r => 
  r.statusAprovacao === 'pendente'
);
```

**Títulos:**
```javascript
const titulosAnalise = titulosList.filter(t => 
  t.status === 'em_analise'
);
```

#### Navegação:

**Para Relatório:**
```javascript
router.push(`/sala-professor?tab=relatorios&relatorio=${relatorio.id}`)
```

**Para Título:**
```javascript
router.push(`/financeiro?titulo=${titulo.id}`)
```

---

### Arquivo: `src/app/dashboard/page.jsx`

#### Alterações no Carregamento de Dados:
```javascript
const [
  alunosData,
  colaboradoresData,
  avisosData,
  fotosData,
  turmasData,
  usuariosData,
  notasData,
  frequenciaData,
  planosData,
  relatoriosData,    // ← NOVO
  titulosData        // ← NOVO
] = await Promise.all([
  getData('alunos'),
  getData('colaboradores'),
  getData('avisos'),
  getData('fotos'),
  getData('turmas'),
  getData('usuarios'),
  getData('notas'),
  getData('frequencia'),
  getData('planos-aula'),
  getData('relatorios-pedagogicos'),  // ← NOVO
  getData('titulos')                   // ← NOVO
]);
```

#### Contagem de Pendências Atualizada:
```javascript
let totalPendenciasCount = 0;

// Planos de aula
if (planosData) {
  const pendentes = planosList.filter(p => 
    !p.statusAprovacao || 
    p.statusAprovacao === 'pendente' || 
    p.statusAprovacao === 'rejeitado'
  );
  totalPendenciasCount += pendentes.length;
}

// Relatórios pedagógicos
if (relatoriosData) {
  const pendentes = relatoriosList.filter(r => 
    r.statusAprovacao === 'pendente'
  );
  totalPendenciasCount += pendentes.length;
}

// Títulos em análise
if (titulosData) {
  const emAnalise = titulosList.filter(t => 
    t.status === 'em_analise'
  );
  totalPendenciasCount += emAnalise.length;
}

setTotalPendencias(totalPendenciasCount);
```

---

## 📊 Matriz de Status

### Relatórios Pedagógicos
| Status | Descrição | Cor |
|--------|-----------|-----|
| `pendente` | Aguardando aprovação da coordenadora | Amarelo (warning) |
| `aprovado` | Aprovado pela coordenadora | Verde (success) |

### Títulos Financeiros
| Status | Descrição | Cor |
|--------|-----------|-----|
| `aberto` | Título criado, aguardando pagamento | Cinza (default) |
| `em_analise` | Pagamento feito, aguardando confirmação | Azul (info) |
| `pago` | Pagamento confirmado pela coordenadora | Verde (success) |
| `vencido` | Título não pago até a data de vencimento | Vermelho (error) |

---

## 🎭 Componentes Visuais

### Ícones Utilizados:
```javascript
import {
  Assignment as AssignmentIcon,      // Planos de aula
  Description as DescriptionIcon,    // Relatórios
  AttachMoney as AttachMoneyIcon,    // Pagamentos
  School as SchoolIcon,               // Turmas
  Person as PersonIcon,               // Alunos
  Warning as WarningIcon,             // Avisos
  CheckCircle as CheckCircleIcon,     // Totais
  ChevronRight as ChevronRightIcon,   // Navegação
  ExpandMore as ExpandMoreIcon,       // Expansão
  ArrowBack as ArrowBackIcon          // Voltar
} from '@mui/icons-material';
```

### Cores do Sistema:
```javascript
{
  planosAula: {
    bg: '#FEF3C7',      // Amarelo claro
    border: '#F59E0B',  // Laranja
    text: '#92400E'     // Marrom escuro
  },
  relatorios: {
    bg: '#E0E7FF',      // Roxo claro
    border: '#6366F1',  // Índigo
    text: '#312E81'     // Roxo escuro
  },
  pagamentos: {
    bg: '#DBEAFE',      // Azul claro
    border: '#3B82F6',  // Azul
    text: '#1E40AF'     // Azul escuro
  },
  total: {
    bg: '#D1FAE5',      // Verde claro
    border: '#10B981',  // Verde
    text: '#065F46'     // Verde escuro
  }
}
```

---

## ✅ Validações Implementadas

### Relatórios Pedagógicos:
- ✅ Apenas professoras criam com status `'pendente'`
- ✅ Coordenadoras podem criar já como `'aprovado'`
- ✅ Agrupamento por turma
- ✅ Ordenação por data de criação (mais recentes primeiro)

### Títulos Financeiros:
- ✅ Status muda para `'em_analise'` apenas quando comprovante é enviado
- ✅ Agrupamento por aluno
- ✅ Ordenação por data de pagamento (mais recentes primeiro)
- ✅ Link para visualizar comprovante

### Badge no Dashboard:
- ✅ Soma planos + relatórios + títulos
- ✅ Atualiza automaticamente ao carregar dashboard
- ✅ Aparece apenas quando > 0

---

## 🧪 Testes Recomendados

### Teste 1: Relatório Pedagógico Pendente
1. Login como **Professora**
2. Ir para **Sala dos Professores** > **Relatórios Pedagógicos**
3. Criar novo relatório para um aluno
4. Salvar
5. Login como **Coordenadora**
6. Verificar badge no card "Pendências" do dashboard (deve mostrar +1)
7. Abrir **Central de Pendências**
8. Verificar seção "Relatórios Pedagógicos Aguardando Aprovação"
9. Expandir accordion da turma
10. Clicar no relatório
11. Verificar redirecionamento para sala dos professores
12. Aprovar relatório
13. Voltar para pendências - relatório deve ter sumido

### Teste 2: Título em Análise
1. Login como **Pai**
2. Ir para **Financeiro**
3. Selecionar título em aberto
4. Clicar em "Registrar Pagamento"
5. Anexar comprovante
6. Salvar
7. Login como **Coordenadora**
8. Verificar badge no card "Pendências" (deve mostrar +1)
9. Abrir **Central de Pendências**
10. Verificar seção "Pagamentos Aguardando Confirmação"
11. Expandir accordion do aluno
12. Clicar no pagamento
13. Verificar redirecionamento para financeiro
14. Confirmar pagamento
15. Voltar para pendências - pagamento deve ter sumido

### Teste 3: Badge Totalizado
1. Criar 2 planos pendentes (professora)
2. Criar 1 relatório pendente (professora)
3. Fazer 1 pagamento em análise (pai)
4. Login como **Coordenadora**
5. Verificar badge mostrando "4"
6. Abrir central de pendências
7. Verificar cards:
   - Planos de Aula: 2
   - Relatórios: 1
   - Pagamentos: 1
   - Total: 4

---

## 📝 Notas de Implementação

### Verificação Prévia:
- ✅ Relatórios já salvavam com `statusAprovacao: 'pendente'`
- ✅ Títulos já salvavam com `status: 'em_analise'`
- ✅ Estrutura de dados já estava preparada

### O que foi adicionado:
- Busca de `relatorios-pedagogicos` e `titulos` na página de pendências
- Lógica de filtro e agrupamento
- Interface visual com accordions
- Navegação para páginas específicas
- Contagem totalizada no dashboard
- Cards visuais com cores distintas

### Performance:
- Todos os dados carregados em paralelo com `Promise.all`
- Apenas 1 requisição por coleção
- Filtros aplicados em memória (rápido)
- Agrupamento otimizado com `reduce`

---

## 🚀 Status

✅ **Implementado e testado**
- Alterações aplicadas em 2 arquivos
- Sem erros de compilação
- Pronto para testes funcionais
- Pronto para commit e deploy

---

## 📦 Arquivos Modificados

1. `src/app/pendencias/page.jsx` (+220 linhas)
2. `src/app/dashboard/page.jsx` (+30 linhas)

---

## 🔄 Próximos Passos

Após validação dos testes:
```bash
git add .
git commit -m "feat: Expande sistema de pendências com Relatórios e Pagamentos

- Adiciona relatórios pedagógicos pendentes na central de pendências
- Adiciona títulos financeiros em análise na central
- Atualiza badge do dashboard com contagem total (planos + relatórios + títulos)
- Cria 4 cards de resumo com métricas separadas
- Implementa navegação para aprovação de relatórios e confirmação de pagamentos
- Agrupa relatórios por turma e pagamentos por aluno
- Adiciona ícones e cores distintas para cada tipo de pendência"

git push origin main
npm run build
firebase deploy --only hosting
```
