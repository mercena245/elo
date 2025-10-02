# PRF - Plano de Requisição de Funcionalidade

## Título
Refatoração, Segurança e Finalização de Funcionalidades do Sistema Escolar

---

## Objetivo
Consolidar e finalizar as principais funcionalidades do sistema escolar, garantindo segurança, modularidade, facilidade de manutenção e experiência do usuário, com foco em:

- Segurança de credenciais e regras do banco
- Finalização do fluxo de exclusão de usuários (Auth + DB)
- Refatoração de componentes grandes para subcomponentes reutilizáveis
- Regras de negócio para períodos escolares
- Melhoria de UX e feedbacks
- Estruturação para testes e auditoria

---

## Escopo

### 1. Segurança
- Remover arquivo de service account do repositório e adicionar ao `.gitignore`
- Revisar e reforçar regras do Realtime Database
- Orientar uso seguro de credenciais em produção

### 2. Cloud Functions
- Recriar pasta `functions/` em TypeScript
- Adicionar função `deleteUser` (exclusão Auth + DB)
- Ajustar scripts de lint/predeploy para deploy sem erros

### 3. Gestão Escolar
- Refatorar `escola/page.jsx` em subcomponentes: TurmaList, PeriodoManager, AvisosBoard, etc.
- Garantir unicidade de período ativo por ano (se aplicável)
- Impedir exclusão de período vinculado a turma
- Exibir status de uso de períodos

### 4. Experiência do Usuário
- Substituir `alert` por toasts/snackbars
- Adicionar feedback visual em botões (loading, sucesso, erro)
- Confirmação ao editar/excluir dados sensíveis

### 5. Auditoria e Testes
- Adicionar campos `createdAt`, `updatedAt`, `createdBy` em entidades principais
- Estruturar diretório `services/` para lógica de acesso ao banco
- Iniciar testes unitários de helpers e serviços

---

## Critérios de Aceite
- Nenhum arquivo de credencial sensível no repositório
- Exclusão de usuário remove do Auth e do DB via função backend
- Não é possível excluir período vinculado a turma
- Refatoração modular de pelo menos 2 grandes componentes
- Feedback visual em todas as ações críticas
- Regras do banco impedem escrita/leitura não autorizada
- Teste unitário básico rodando para pelo menos um helper

---

## Prioridade
1. Segurança e Cloud Functions
2. Refatoração modular e regras de negócio
3. UX e feedbacks
4. Auditoria e testes

---

## Observações
- O projeto já possui boa base de autenticação, navegação e CRUDs.
- A modularização e segurança são essenciais para escalar e manter o sistema.
- O roadmap pode ser ajustado conforme surgirem novas demandas.

---

# Análise de Funcionalidades e Melhorias para o Sistema Escolar

## Funcionalidades já implementadas

- **Gestão de Alunos**
  - Cadastro, edição e exclusão de alunos
  - Formulário multi-etapas (dados pessoais, financeiros, anexos)
  - Upload e gerenciamento de anexos/documentos dos alunos
  - Visualização e marcação para exclusão de anexos
  - Filtros por turma, nome e matrícula

- **Gestão de Turmas**
  - Cadastro e vinculação de alunos a turmas
  - Visualização de turmas

- **Gestão Financeira**
  - Controle de status financeiro do aluno (ativo/inadimplente)
  - Campos para valor de mensalidade, desconto, vencimento

- **Gestão de Usuários do Sistema**
  - Cadastro, edição e exclusão de usuários (coordenadora, professora, pai, inativo)
  - Aprovação de novos usuários
  - Filtro por tipo e por nome

- **Controle de Acesso**
  - Diferenciação de permissões por perfil (coordenadora, professora, pai)
  - Tela de acesso restrito

- **Alertas e Feedback Visual**
  - Mensagens de erro e alerta bem destacadas
  - Feedback visual para ações importantes

---

## O que falta ou pode ser melhorado para uso real em escola

1. **Gestão de Professores e Funcionários**
   - Cadastro e gerenciamento de professores e outros funcionários
   - Vinculação de professores a turmas e disciplinas

2. **Gestão de Disciplinas e Horários**
   - Cadastro de disciplinas/matérias
   - Montagem de horários de aulas por turma e professor

3. **Lançamento e Consulta de Notas/Frequência**
   - Lançamento de notas e faltas por disciplina
   - Consulta de boletim pelo responsável/aluno

4. **Comunicação Escola-Família**
   - Envio de avisos, comunicados e mensagens para responsáveis
   - Histórico de comunicados

5. **Gestão de Matrículas e Rematrículas**
   - Processo de matrícula e rematrícula online
   - Controle de vagas por turma

6. **Relatórios e Exportações**
   - Relatórios de alunos por turma, inadimplentes, frequência, notas etc.
   - Exportação para PDF/Excel

7. **Aprimoramento da Experiência do Usuário**
   - Melhorias de usabilidade e acessibilidade
   - Layout responsivo para uso em celular/tablet
   - Ajuda/contexto para usuários leigos

8. **Segurança e Auditoria**
   - Logs de ações importantes (quem fez o quê e quando)
   - Permissões mais granulares (ex: só coordenadora pode excluir aluno)

9. **Integração com Pagamentos**
   - Integração com sistemas de cobrança/boleto/pagamento online

10. **Backup e Recuperação**
   - Rotina de backup automático dos dados

---

Essas melhorias são recomendadas para tornar o sistema mais completo, seguro e prático para o dia a dia escolar.

---

# 💰 Análise Completa do Sistema Financeiro

## 📊 Situação Atual

### ✅ Funcionalidades Já Implementadas
- **Dados Financeiros Básicos do Aluno**:
  - `mensalidadeValor`: Valor da mensalidade
  - `descontoPercentual`: Percentual de desconto aplicado
  - `diaVencimento`: Dia do mês para vencimento (1-31)
  - `status`: Estado financeiro (`ativo`, `inadimplente`, `suspenso`)
  - `observacoes`: Campo livre para anotações
  - Cálculo automático do valor final com desconto

- **Validações Existentes**:
  - Dia de vencimento entre 1 e 31
  - Valor da mensalidade obrigatório
  - Status obrigatório
  - Não permite inativar aluno inadimplente

### ❌ Limitações Atuais
- Não há geração de títulos/boletos
- Não há controle de pagamentos realizados
- Não há histórico financeiro
- Não há processo de matrícula estruturado
- Não há controle de pré-matrícula
- Não há relatórios financeiros
- Não há integração com sistemas de pagamento

---

## 🎯 Sistema Financeiro Completo - Especificação

### 1. 📋 **Gestão de Matrículas e Estados do Aluno**

#### 1.1 Estados do Aluno
```
PRE_MATRICULA -> MATRICULADO -> ATIVO/INADIMPLENTE/SUSPENSO -> INATIVO
```

- **PRÉ-MATRÍCULA**: Aluno cadastrado mas não matriculado efetivamente
- **MATRICULADO**: Matrícula paga, aguardando início das aulas
- **ATIVO**: Frequentando e em dia com pagamentos
- **INADIMPLENTE**: Com pendências financeiras
- **SUSPENSO**: Suspenso por inadimplência ou disciplina
- **INATIVO**: Ex-aluno ou transferido

#### 1.2 Processo de Matrícula
```
1. Cadastro inicial (PRÉ-MATRÍCULA)
2. Geração de boleto de matrícula
3. Confirmação de pagamento → MATRICULADO
4. Início das aulas → ATIVO
```

### 2. 💳 **Sistema de Títulos e Cobrança**

#### 2.1 Estrutura de Título Financeiro
```javascript
titulo: {
  id: "string",                    // ID único
  alunoId: "string",              // Referência ao aluno
  tipo: "matricula|mensalidade|taxa", // Tipo do título
  descricao: "string",            // Descrição do título
  valorOriginal: "number",        // Valor sem desconto
  valorDesconto: "number",        // Valor do desconto
  valorFinal: "number",           // Valor final a pagar
  dataVencimento: "date",         // Data de vencimento
  dataGeracao: "date",            // Data de geração
  status: "pendente|pago|vencido|cancelado",
  formaPagamento: "boleto|pix|cartao|dinheiro",
  dataComprovante: "date",        // Data do comprovante
  observacoes: "string",
  
  // Controle de cobrança
  tentativasCobranca: "number",
  ultimaCobranca: "date",
  proximaCobranca: "date",
  
  // Auditoria
  criadoPor: "string",
  atualizadoPor: "string",
  createdAt: "date",
  updatedAt: "date"
}
```

#### 2.2 Geração Automática de Títulos
- **Matrícula**: Gerada no momento do cadastro (PRÉ-MATRÍCULA)
- **Mensalidades**: Geradas automaticamente no início de cada mês
- **Taxas extras**: Material, uniforme, eventos, etc.

#### 2.3 Regras de Geração
```javascript
// Configuração por período escolar
configuracaoFinanceira: {
  periodoId: "string",
  valorMatricula: "number",
  valorMensalidade: "number",
  diaVencimentoPadrao: "number",
  descontoMatriculaAntecipada: "number",
  jurosAtraso: "number",
  multaAtraso: "number",
  diasParaSuspensao: "number",     // Ex: 30 dias
  diasParaCancelamento: "number"   // Ex: 90 dias
}
```

### 3. 📊 **Dashboard Financeiro**

#### 3.1 Indicadores Principais
- **Receita Prevista vs Realizada** (mensal/anual)
- **Taxa de Inadimplência** (% alunos com atraso)
- **Previsão de Recebimentos** (próximos 30/60/90 dias)
- **Alunos por Status Financeiro**
- **Média de Atraso** (dias em atraso)

#### 3.2 Relatórios Financeiros
- **Relatório de Inadimplência**
- **Fluxo de Caixa Projetado**
- **Relatório de Matrículas** (período)
- **Análise de Descontos Concedidos**
- **Histórico de Pagamentos por Aluno**

### 4. 🔔 **Sistema de Notificações e Cobrança**

#### 4.1 Notificações Automáticas
- **5 dias antes**: Lembrete de vencimento
- **No vencimento**: Título vencendo hoje
- **3 dias após**: Primeira cobrança
- **15 dias após**: Segunda cobrança
- **30 dias após**: Aviso de suspensão
- **45 dias após**: Notificação de cancelamento

#### 4.2 Canais de Comunicação
- **WhatsApp Business API**
- **Email automático**
- **SMS** (opcional)
- **Notificação no app**

### 5. 🏦 **Integração com Sistemas de Pagamento**

#### 5.1 Métodos de Pagamento
- **PIX**: Geração automática de QR Code
- **Boleto Bancário**: Integração com bancos
- **Cartão de Crédito**: Gateway de pagamento
- **Transferência Bancária**
- **Dinheiro**: Registro manual

#### 5.2 Reconciliação Automática
- **Webhook de confirmação** de pagamentos
- **Baixa automática** de títulos pagos
- **Controle de divergências**
- **Estorno** e cancelamentos

### 6. 📱 **Interface do Sistema Financeiro**

#### 6.1 Tela Principal - Dashboard Financeiro
```
┌─ Dashboard Financeiro ────────────────────────────────┐
│ 💰 Receita do Mês    📊 Taxa Inadimplência           │
│ R$ 45.000,00        ⚠️  8,5%                        │
│                                                      │
│ 📈 Próximos Vencimentos   🔍 Busca Rápida           │
│ R$ 12.000,00 (15 títulos) [____________________]     │
└──────────────────────────────────────────────────────┘
```

#### 6.2 Gestão de Títulos
```
┌─ Títulos Financeiros ────────────────────────────────┐
│ Filtros: [Status▼] [Tipo▼] [Período▼] [🔍 Buscar]   │
│                                                      │
│ ┌─ João Silva - S001 ─────────────────────────────┐  │
│ │ 💳 Mensalidade Set/2025    📅 Venc: 10/09/2025 │  │
│ │ R$ 800,00 → R$ 720,00     ⚠️  VENCIDO (5 dias) │  │
│ │ [💰 Registrar Pagto] [📧 Cobrar] [👁️ Detalhes] │  │
│ └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

#### 6.3 Cadastro de Matrícula
```
┌─ Nova Matrícula ─────────────────────────────────────┐
│ 1️⃣ Dados do Aluno                                   │
│ 2️⃣ Configuração Financeira                         │
│ 3️⃣ Geração de Título de Matrícula                  │
│                                                      │
│ Status: PRÉ-MATRÍCULA → MATRICULADO                 │
└──────────────────────────────────────────────────────┘
```

### 7. 🔒 **Segurança e Auditoria Financeira**

#### 7.1 Controles de Acesso
- **Coordenadora**: Acesso total ao financeiro
- **Secretária Financeira**: Gestão de títulos e pagamentos
- **Professora**: Consulta limitada de status dos alunos
- **Pai/Responsável**: Apenas seus próprios títulos

#### 7.2 Auditoria Obrigatória
- **Log de todas as operações** financeiras
- **Histórico de alterações** em valores
- **Trilha de aprovações** para descontos
- **Backup de comprovantes** de pagamento

### 8. 📋 **Implementação - Fases**

#### Fase 1: Infraestrutura (2-3 semanas)
- [ ] Criar estrutura de dados para títulos
- [ ] Implementar estados do aluno
- [ ] Sistema básico de geração de títulos
- [ ] Interface de gestão de títulos

#### Fase 2: Automação (2-3 semanas)
- [ ] Geração automática de mensalidades
- [ ] Sistema de notificações
- [ ] Dashboard financeiro
- [ ] Relatórios básicos

#### Fase 3: Integração (3-4 semanas)
- [ ] Integração PIX/Boletos
- [ ] Reconciliação automática
- [ ] WhatsApp Business
- [ ] Relatórios avançados

#### Fase 4: Otimização (1-2 semanas)
- [ ] Interface mobile responsiva
- [ ] Performance e escalabilidade
- [ ] Testes de stress
- [ ] Documentação completa

### 9. 🎯 **Critérios de Aceite**

#### Funcionais
- ✅ Aluno não pode ser ativado sem pagar matrícula
- ✅ Mensalidades são geradas automaticamente
- ✅ Notificações são enviadas conforme cronograma
- ✅ Pagamentos são baixados automaticamente
- ✅ Relatórios são gerados em tempo real
- ✅ Histórico financeiro é preservado

#### Técnicos
- ✅ Transações são atômicas e consistentes
- ✅ Dados financeiros são criptografados
- ✅ Backup automático diário
- ✅ Logs de auditoria completos
- ✅ Performance < 2s para consultas
- ✅ Disponibilidade > 99,5%

#### Segurança
- ✅ Acesso por roles bem definidos
- ✅ Dados sensíveis mascarados
- ✅ Conformidade LGPD
- ✅ Certificado SSL válido
- ✅ Autenticação multifator (opcional)

---

## 💡 **Observações Importantes**

### Impacto na Arquitetura Atual
- **Nova collection**: `titulos_financeiros`
- **Evolução**: Estrutura atual do `aluno.financeiro`
- **Adição**: Estados do aluno mais robustos
- **Integração**: APIs externas de pagamento

### Dependências Externas
- **WhatsApp Business API** (R$ 0,05 por mensagem)
- **Gateway de Pagamento** (2-4% por transação)
- **Banco para Boletos** (R$ 0,30-0,80 por boleto)
- **Certificado SSL** (se não houver)

### ROI Estimado
- **Redução de inadimplência**: 15-25%
- **Tempo de cobrança manual**: -80%
- **Satisfação dos pais**: +30%
- **Tempo de reconciliação**: -90%

---

> **📌 Este sistema financeiro transformará a gestão escolar, automatizando processos manuais e melhorando significativamente o controle financeiro da instituição.**

---

> Para gerar o PDF: abra este arquivo no VS Code, clique com o botão direito e escolha "Export as PDF" ou use a opção de imprimir para PDF.
