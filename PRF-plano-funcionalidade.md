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

> Para gerar o PDF: abra este arquivo no VS Code, clique com o botão direito e escolha "Export as PDF" ou use a opção de imprimir para PDF.
