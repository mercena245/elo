# Sistema de Pendências da Coordenação

## 📋 Resumo da Implementação

Sistema criado para centralizar e gerenciar todas as pendências da coordenadora em uma única tela, facilitando o acompanhamento e tomada de decisões.

## 🎯 Funcionalidades Implementadas

### 1. **Card de Ações Rápidas no Dashboard**
- ✅ Card "Pendências" adicionado em **primeira posição** nas ações rápidas
- ✅ **Visível apenas para Coordenadora**
- ✅ Badge de notificação mostrando **quantidade de pendências**
- ✅ Badge aparece **somente quando há pendências** (valor > 0)
- ✅ Cor vermelha (#EF4444) para destacar urgência
- ✅ Ao clicar, redireciona para `/pendencias`
- ✅ Atualização automática ao carregar dashboard

### 2. **Página Central de Pendências** (`/pendencias`)

#### Características:
- ✅ Acesso restrito à coordenadora (redirecionamento automático para outras roles)
- ✅ Interface limpa e organizada
- ✅ Botão "Voltar ao Dashboard"

#### Resumo Visual (Cards Superiores):
1. **Total de Planos Pendentes** (Amarelo)
   - Contador de todos os planos aguardando aprovação
   - Ícone: Assignment

2. **Turmas com Pendências** (Azul)
   - Quantidade de turmas que têm planos pendentes
   - Ícone: School

3. **Outras Pendências** (Verde)
   - Preparado para futuras expansões
   - Ícone: CheckCircle

#### Lista de Pendências:
- ✅ **Agrupamento por Turma** com Accordions expansíveis
- ✅ **Badge** mostrando quantidade de pendências por turma
- ✅ **Ordenação** por data (mais antiga primeiro)

#### Informações de Cada Plano:
- Título do plano
- Status (Pendente ou Rejeitado) com chip colorido
- Disciplina
- Data e horário da aula
- Nome do professor
- Motivo da rejeição (se aplicável)

#### Interação:
- ✅ **Clique no plano** → Redireciona para `/sala-professor?plano=${planoId}`
  - Leva direto para a tela de aprovação do plano específico
- ✅ Hover com destaque visual
- ✅ Ícone de seta indicando que é clicável

## 🎨 Design e UX

### Paleta de Cores:
- **Amarelo** (#F59E0B): Pendências e alertas
- **Vermelho** (#EF4444): Rejeitados e urgente
- **Azul** (#3B82F6): Informações gerais
- **Verde** (#10B981): Sucesso e conclusões

### Componentes Visuais:
- Cards com gradiente sutil
- Bordas coloridas à esquerda
- Ícones grandes e descritivos
- Badges para contadores
- Avatares coloridos por status
- Accordions para organização hierárquica

### Responsividade:
- Grid adaptativo (12 colunas → 4 em desktop)
- Cards empilhados em mobile
- Texto e ícones escaláveis

## 🔄 Fluxo de Uso

1. **Coordenadora** acessa o dashboard
2. Sistema **conta automaticamente** os planos pendentes
3. Se houver pendências, vê card "Pendências" com badge mostrando a **quantidade**
4. Se não houver pendências, card aparece **sem badge**
5. Clica no card
6. Visualiza resumo geral (cards superiores)
7. Expande accordion da turma desejada
8. Clica no plano específico
9. É redirecionada para aprovação na sala dos professores

## 📊 Dados Exibidos

### Fonte de Dados:
- **Planos de Aula**: `planos-aula`
  - Filtra por: `statusAprovacao === 'pendente'` ou `'rejeitado'`
- **Turmas**: `turmas`
- **Disciplinas**: `disciplinas`

### Estrutura de Dados do Plano:
```javascript
{
  id: string,
  titulo: string,
  turmaId: string,
  disciplinaId: string,
  data: string (ISO),
  horaInicio: string,
  horaFim: string,
  professorNome: string,
  statusAprovacao: 'pendente' | 'rejeitado' | 'aprovado',
  observacoesAprovacao: string
}
```

## 🚀 Próximas Expansões (Sugeridas)

### Outras Pendências que podem ser adicionadas:
1. **Financeiro**
   - Mensalidades atrasadas
   - Títulos vencidos

2. **Alunos**
   - Matrículas incompletas
   - Documentação pendente

3. **Colaboradores**
   - Contratos a vencer
   - Documentação em falta

4. **Avisos**
   - Avisos não publicados
   - Avisos aguardando revisão

5. **Galeria**
   - Fotos aguardando aprovação

### Melhorias Futuras:
- [ ] Filtros por data, turma, professor
- [ ] Ordenação customizável
- [ ] Exportação de relatórios
- [ ] Notificações push
- [ ] Gráficos de evolução
- [ ] Histórico de pendências resolvidas

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
1. `src/app/pendencias/page.jsx` (370 linhas)
   - Componente principal da tela de pendências

2. `SISTEMA-PENDENCIAS-COORDENACAO.md` (este arquivo)
   - Documentação completa do sistema

### Arquivos Modificados:
1. `src/app/dashboard/page.jsx`
   - Adicionado card "Pendências" nas ações rápidas
   - Adicionado badge de notificação
   - Card posicionado em primeiro lugar

2. `src/app/sala-professor/components/PlanejamentoAulas.jsx`
   - (Já preparado para receber query param `?plano=` para navegação direta)

## 🎓 Boas Práticas Utilizadas

- ✅ Componente funcional com hooks
- ✅ useEffect para carregamento de dados
- ✅ useRouter para navegação
- ✅ Validação de role (segurança)
- ✅ Loading state
- ✅ Error handling
- ✅ Código comentado
- ✅ Nomes descritivos
- ✅ Estrutura modular
- ✅ Responsividade mobile-first
- ✅ Acessibilidade (contraste, hover states)

## 📝 Notas Técnicas

### Hooks Utilizados:
- `useState`: Gerenciamento de estados locais
- `useEffect`: Efeitos colaterais (carregamento de dados)
- `useRouter`: Navegação programática
- `useAuthUser`: Autenticação e role do usuário
- `useSchoolDatabase`: Acesso ao banco de dados da escola

### Componentes Material-UI:
- Box, Card, Grid, Typography
- Accordion, AccordionSummary, AccordionDetails
- List, ListItem, Avatar
- Chip, Badge, Alert
- IconButton, Button
- CircularProgress

### Ícones:
- Assignment, Warning, CheckCircle
- School, Person, Calendar
- Schedule, ChevronRight, ExpandMore
- ArrowBack

## ✅ Status

**Implementação Completa e Funcional**
- [x] Card no dashboard
- [x] Página de pendências
- [x] Integração com banco de dados
- [x] Navegação entre telas
- [x] Design responsivo
- [x] Documentação

**Pronto para testes e deploy!**
