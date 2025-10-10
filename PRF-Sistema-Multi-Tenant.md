# PRF - SISTEMA ELO ESCOLAR MULTI-TENANT

**Versão:** 1.0  
**Data:** 09 de outubro de 2025  
**Responsável:** Equipe de Desenvolvimento ELO  
**Status:** Planejamento  

---

## 📋 RESUMO EXECUTIVO

### Objetivo
Transformar o sistema ELO Escolar atual (single-tenant) em uma plataforma multi-tenant que possa atender múltiplas escolas simultaneamente, mantendo isolamento de dados e gerenciamento de acessos por instituição.

### Justificativa
- **Escalabilidade:** Atender múltiplas escolas com uma única infraestrutura
- **Receita:** Modelo SaaS com receita recorrente
- **Eficiência:** Manutenção centralizada com dados isolados
- **Competitividade:** Posicionamento como plataforma educacional

### Escopo
- Reestruturação da arquitetura Firebase
- Implementação de sistema multi-tenant
- Dashboard administrativo para gestão de escolas
- Migração segura dos dados atuais
- Manutenção da base atual como escola de teste

---

## 🎯 OBJETIVOS ESPECÍFICOS

### Objetivos Primários
1. **Isolamento de Dados:** Garantir separação completa entre escolas
2. **Gestão de Acessos:** Sistema hierárquico de permissões
3. **Escalabilidade:** Suporte a crescimento ilimitado de escolas
4. **Compatibilidade:** Manter funcionalidades existentes

### Objetivos Secundários
1. **Performance:** Otimizar queries para estrutura hierárquica
2. **Usabilidade:** Interface intuitiva para gestão multi-tenant
3. **Segurança:** Implementar controles de acesso robustos
4. **Monitoramento:** Métricas e analytics por escola

---

## 🏗️ ANÁLISE DA ARQUITETURA ATUAL

### Estrutura Firebase Existente
```
Firebase Realtime Database (Atual):
├── usuarios/
├── turmas/
├── disciplinas/
├── alunos/
├── Escola/ (configurações únicas)
├── GradeHoraria/
├── planos-aula/
├── agenda-medica/
├── avisos/
└── financeiro/
```

### Problemas Identificados
1. **Dados Globais:** Todos os dados no nível raiz sem segregação
2. **Sem Isolamento:** Impossibilidade de separar dados entre escolas
3. **Autenticação Única:** Sistema pensado para uma única instituição
4. **Permissões Simples:** Roles não consideram multi-tenancy
5. **Escalabilidade Limitada:** Arquitetura não suporta múltiplas escolas

### Dependências Mapeadas
- **Componentes:** 358 arquivos JS/JSX mapeados
- **Services:** auditService, financeiroService, secretariaDigitalService
- **Hooks:** useAuthUser, useSecretariaAccess
- **Firebase:** Realtime Database, Authentication, Storage, Functions

---

## 🏢 NOVA ARQUITETURA MULTI-TENANT

### Estratégia de Bancos Separados
Ao invés de usar um único banco com namespaces, utilizaremos **bancos Firebase separados** para cada escola, proporcionando:

- **Isolamento total** de dados
- **Performance otimizada** (cada escola tem seu próprio banco)
- **Backup independente** por escola
- **Escalabilidade ilimitada**
- **Custos proporcionais** ao uso real
- **Facilidade de migração** de escolas

### Estrutura de Bancos Firebase Proposta
```
🏢 SISTEMA GLOBAL (Banco Master):
Project: elo-school-master
Database: elo-school-master-default-rtdb
├── escolas-cadastradas/
│   ├── escola-elo-teste/
│   │   ├── nome: "ELO - Escola Teste"
│   │   ├── status: "ativa"
│   │   ├── databaseURL: "https://elo-school-teste-default-rtdb.firebaseio.com/"
│   │   ├── projectId: "elo-school-teste"
│   │   ├── storageBucket: "elo-school-teste.firebasestorage.app"
│   │   ├── plano: "completo"
│   │   ├── recursos: ["todos"]
│   │   ├── dataCreacao: "2025-10-10"
│   │   └── coordenador: "uid-coordenador"
│   ├── escola-sao-jose/
│   │   ├── nome: "Escola São José"
│   │   ├── databaseURL: "https://elo-school-sao-jose-default-rtdb.firebaseio.com/"
│   │   ├── projectId: "elo-school-sao-jose"
│   │   ├── storageBucket: "elo-school-sao-jose.firebasestorage.app"
│   │   └── ...
│   └── escola-santa-maria/
│       └── ...
├── super-admins/
├── templates-escola/
├── recursos-globais/
├── usuarios-globais/              # Usuários cross-school
│   ├── {uid}/
│   │   ├── informacoes-pessoais/
│   │   ├── escolas-vinculadas/
│   │   │   ├── {escolaId}/
│   │   │   │   ├── role/
│   │   │   │   ├── ativo/
│   │   │   │   ├── dataVinculo/
│   │   │   │   └── permissoes/
│   │   ├── superAdmin/
│   │   └── configuracoes/
└── metricas-sistema/

🏫 BANCO POR ESCOLA (Exemplo 1):
Project: elo-school-teste
Database: elo-school-teste-default-rtdb
├── usuarios/
├── turmas/
├── disciplinas/
├── alunos/
├── Escola/
├── GradeHoraria/
├── planos-aula/
├── agenda-medica/
├── avisos/
└── financeiro/

🏫 BANCO POR ESCOLA (Exemplo 2):
Project: elo-school-sao-jose
Database: elo-school-sao-jose-default-rtdb
├── usuarios/
├── turmas/
├── disciplinas/
├── alunos/
├── Escola/
├── GradeHoraria/
├── planos-aula/
├── agenda-medica/
├── avisos/
└── financeiro/
```
```

### Estratégia de Isolamento
1. **Bancos Separados:** Cada escola tem seu próprio projeto Firebase
2. **Database URLs Dinâmicas:** Sistema identifica qual banco usar por escola
3. **Firebase Config Dinâmico:** Múltiplas configurações Firebase por aplicação
4. **Service Layer Inteligente:** Roteamento automático para o banco correto
5. **Isolamento Total:** Impossibilidade de vazamento entre escolas

### Vantagens da Abordagem de Bancos Separados

#### 🔒 **Segurança Máxima**
- **Isolamento físico** - dados de escolas diferentes em projetos separados
- **Impossibilidade de vazamento** - não há como acessar dados de outra escola
- **Backup independente** - cada escola tem seu próprio backup
- **Compliance facilitado** - LGPD por escola individual

#### ⚡ **Performance Otimizada**
- **Sem concorrência** entre escolas no mesmo banco
- **Queries mais rápidas** - menos dados por banco
- **Scaling independente** - cada escola escala conforme necessidade
- **Cache específico** por escola

#### 💰 **Custos Proporcionais**
- **Pay-per-use real** - cada escola paga pelo que usa
- **Transparência total** - custos claros por escola
- **Otimização individual** - escolas pequenas pagam menos
- **Crescimento sustentável** - custos crescem com uso real

#### 🛠️ **Operacional Simplificado**
- **Migração fácil** - mover escola é mover projeto completo
- **Manutenção isolada** - problemas em uma escola não afetam outras
- **Deploy independente** - atualizações por escola se necessário
- **Monitoramento granular** - métricas específicas por escola

### Estrutura Firebase Storage com Bancos Separados
```
🏢 STORAGE GLOBAL (Projeto Master):
Bucket: elo-school-master.firebasestorage.app
├── templates/
│   ├── documentos-padrao/
│   ├── formularios/
│   └── certificados/
├── recursos-sistema/
│   ├── icones/
│   ├── logos/
│   └── assets/
└── backups-globais/

🏫 STORAGE POR ESCOLA (Projeto Individual):
Bucket: elo-school-teste.firebasestorage.app
├── documentos/
│   ├── alunos/
│   │   ├── {alunoId}/
│   │   │   ├── matricula/
│   │   │   ├── historico/
│   │   │   ├── certificados/
│   │   │   └── fotos/
│   │   ├── professores/
│   │   │   ├── {professorId}/
│   │   │   │   ├── documentos-pessoais/
│   │   │   │   ├── curriculos/
│   │   │   │   └── certificacoes/
│   │   ├── funcionarios/
│   │   └── escola/
│   │       ├── licencas/
│   │       ├── certificados/
│   │       └── documentos-legais/
├── midias/
│   ├── galeria-fotos/
│   │   ├── eventos/
│   │   ├── atividades/
│   │   └── infraestrutura/
│   ├── videos/
│   └── audios/
├── materiais-didaticos/
│   ├── {disciplinaId}/
│   │   ├── apostilas/
│   │   ├── exercicios/
│   │   ├── provas/
│   │   └── recursos/
│   └── biblioteca-digital/
├── financeiro/
│   ├── comprovantes/
│   ├── notas-fiscais/
│   ├── contratos/
│   └── relatorios/
├── secretaria/
│   ├── atas/
│   ├── oficios/
│   ├── comunicados/
│   └── formularios/
└── backups/
    ├── dados/
    └── documentos/
```

### Database Security Rules (Por Banco)

#### Banco Global (Master)
```javascript
// database.rules.json (Banco Global)
{
  "rules": {
    // Dados globais - apenas super-admins
    "escolas-cadastradas": {
      ".read": "auth != null && root.child('super-admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('super-admins').child(auth.uid).exists()"
    },
    
    // Super-admins
    "super-admins": {
      ".read": "auth != null && root.child('super-admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('super-admins').child(auth.uid).exists()"
    },
    
    // Usuários globais - cada usuário acessa apenas seus dados
    "usuarios-globais": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('super-admins').child(auth.uid).exists())",
        ".write": "auth != null && (auth.uid === $uid || root.child('super-admins').child(auth.uid).exists())"
      }
    },
    
    // Templates e recursos
    "templates-escola": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('super-admins').child(auth.uid).exists()"
    },
    
    "recursos-globais": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('super-admins').child(auth.uid).exists()"
    }
  }
}
```

#### Banco por Escola
```javascript
// database.rules.json (Por Escola)
{
  "rules": {
    // Verificar se usuário tem acesso a esta escola específica
    ".read": "auth != null && isUserAuthorizedForThisSchool()",
    ".write": "auth != null && isUserAuthorizedForThisSchool()",
    
    // Regras específicas por coleção
    "usuarios": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || hasPermission('usuarios'))",
        ".write": "auth != null && hasPermission('usuarios')"
      }
    },
    
    "turmas": {
      ".read": "auth != null",
      ".write": "auth != null && hasPermission('turmas')"
    },
    
    "planos-aula": {
      ".read": "auth != null",
      "$planoId": {
        ".write": "auth != null && (data.child('professorUid').val() === auth.uid || hasPermission('aprovar-planos'))"
      }
    },
    
    "alunos": {
      "$alunoId": {
        ".read": "auth != null && (isResponsavelDoAluno($alunoId) || hasPermission('alunos'))",
        ".write": "auth != null && hasPermission('alunos')"
      }
    }
  }
}

// Funções auxiliares (definidas via Firebase Functions)
function isUserAuthorizedForThisSchool() {
  // Verificar no banco global se usuário tem acesso a esta escola
  return true; // Implementar via Cloud Function
}

function hasPermission(permission) {
  // Verificar permissões do usuário para esta escola
  return true; // Implementar via Cloud Function
}

function isResponsavelDoAluno(alunoId) {
  // Verificar se é responsável pelo aluno
  return true; // Implementar via Cloud Function
}
```

### Storage Security Rules (Por Bucket)

#### Storage Global
```javascript
// storage.rules (Bucket Global)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Templates - apenas super-admins podem editar
    match /templates/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isSuperAdmin();
    }
    
    // Recursos do sistema
    match /recursos-sistema/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isSuperAdmin();
    }
    
    // Backups globais
    match /backups-globais/{allPaths=**} {
      allow read, write: if isAuthenticated() && isSuperAdmin();
    }
  }
}
```

#### Storage por Escola
```javascript
// storage.rules (Bucket por Escola)
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Todos os arquivos - verificar autorização para esta escola
    match /{allPaths=**} {
      allow read, write: if isAuthenticated() && isAuthorizedForThisSchool();
    }
    
    // Arquivos pessoais de alunos (acesso do responsável)
    match /documentos/alunos/{alunoId}/{allPaths=**} {
      allow read: if isAuthenticated() && 
        (isResponsavelDoAluno(alunoId) || hasSchoolPermission('alunos'));
    }
    
    // Arquivos pessoais de professores
    match /documentos/professores/{professorId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && 
        (request.auth.uid == professorId || hasSchoolPermission('usuarios'));
    }
  }
}
```

---

## 🔐 SISTEMA DE GESTÃO DE ACESSOS

### Hierarquia de Permissões

#### 🏢 SUPER-ADMIN (Nível Plataforma)
**Responsabilidades:**
- Gerenciar escolas (criar, editar, remover, suspender)
- Configurar recursos globais e templates
- Monitorar performance e uso da plataforma
- Suporte técnico e resolução de problemas
- Gestão de super-admins

**Permissões:**
- Acesso total ao namespace `global/`
- Leitura/escrita em qualquer escola
- Configuração de Firebase Rules
- Gestão de usuários globais

#### 🏫 COORDENADOR/COORDENADORA (Nível Instituição)
**Responsabilidades:**
- Gerenciar usuários da sua escola
- Configurações específicas da instituição
- Relatórios e métricas da escola
- Aprovações e workflows internos
- Gestão de recursos habilitados

**Permissões:**
- Acesso total ao namespace `escolas/{suaEscola}/`
- Gestão de usuários da escola
- Configuração de recursos locais
- Relatórios e exports

#### 👥 USUÁRIOS POR ESCOLA (Nível Operacional)
**Roles Existentes:**
- **Coordenador:** Gestão pedagógica e usuários
- **Professor:** Planos de aula, notas, frequência
- **Secretária:** Matrículas, documentos, comunicação
- **Responsável:** Acesso a dados do filho
- **Aluno:** Acesso limitado a suas informações

**Permissões:**
- Acesso restrito ao namespace da sua escola
- Operações específicas por role
- Dados filtrados por contexto

### Modelo de Dados de Usuário

#### Usuário Global
```javascript
// usuarios-globais/{uid}
{
  // Informações pessoais
  email: "usuario@email.com",
  nome: "Nome Completo",
  telefone: "+55 11 99999-9999",
  foto: "url-da-foto",
  
  // Configurações de conta
  tipo: "multi-escola" | "escola-unica",
  ativo: true,
  dataRegistro: "2025-10-09T10:30:00Z",
  ultimoLogin: "2025-10-09T14:22:00Z",
  
  // Vinculação com escolas
  escolas: {
    "escola-elo-teste": {
      role: "coordenador",
      ativo: true,
      dataVinculo: "2025-01-01T00:00:00Z",
      permissoes: ["usuarios", "turmas", "disciplinas"],
      aprovadoPor: "coordenador-uid"
    },
    "escola-nova-1": {
      role: "professor",
      ativo: true,
      dataVinculo: "2025-02-01T00:00:00Z",
      permissoes: ["planos-aula", "notas"],
      aprovadoPor: "coordenador-uid"
    }
  },
  
  // Permissões especiais
  superAdmin: false,
  suporte: false,
  
  // Configurações pessoais
  configuracoes: {
    tema: "claro",
    notificacoes: true,
    idioma: "pt-BR"
  }
}
```

#### Usuário Local (por escola)
```javascript
// escolas/{escolaId}/usuarios/{uid}
{
  // Dados específicos da escola
  role: "professor",
  ativo: true,
  dataVinculo: "2025-01-01T00:00:00Z",
  aprovadoPor: "coordenador-uid",
  
  // Vinculações específicas da escola
  turmas: ["turma1-id", "turma2-id"],
  disciplinas: ["disciplina1-id", "disciplina2-id"],
  
  // Configurações locais
  configuracoes: {
    notificacoesDaEscola: true,
    relatorioPadrao: "mensal"
  },
  
  // Metadados
  criadoEm: "2025-01-01T00:00:00Z",
  atualizadoEm: "2025-10-09T10:30:00Z"
}
```

---

## 🎛️ INTERFACE ADMINISTRATIVA

### Dashboard Super-Admin

#### 📊 Painel Principal
**Métricas Globais:**
- Total de escolas ativas/inativas
- Usuários por escola (gráfico)
- Performance do sistema (uptime, latência)
- Uso de recursos (storage, database, functions)
- Crescimento mensal de escolas
- Faturamento por plano

**Widgets:**
- Escolas criadas recentemente
- Problemas reportados
- Tarefas de suporte pendentes
- Alertas de sistema

#### 🏫 Gestão de Escolas
**Funcionalidades:**
- **[+ Nova Escola]** - Wizard de criação
- **Lista de Escolas** - Grid com filtros e busca
- **Detalhes da Escola** - Configurações e métricas
- **Status e Saúde** - Monitoramento em tempo real

**Wizard de Nova Escola:**
1. **Informações Básicas**
   - Nome da escola
   - CNPJ/CPF
   - Endereço completo
   - Contato principal
   
2. **Configurações Iniciais**
   - Tipo de escola (fundamental, médio, técnico)
   - Número estimado de alunos
   - Módulos desejados
   - Período letivo padrão
   
3. **Coordenador Inicial**
   - Dados do coordenador
   - Email e senha inicial
   - Permissões específicas
   
4. **Recursos e Plano**
   - Plano contratado
   - Recursos habilitados
   - Limites de uso
   
5. **Confirmação e Criação**
   - Revisão dos dados
   - Aplicação de template
   - Envio de credenciais

#### 👥 Gestão de Usuários
**Super-Admins:**
- Lista de super-administradores
- Criar/editar/remover super-admins
- Log de ações administrativas
- Permissões granulares

**Coordenadores por Escola:**
- Visualizar coordenadores de cada escola
- Suporte e reset de senhas
- Delegação de permissões temporárias

**Usuários Cross-School:**
- Professores que atuam em múltiplas escolas
- Gestão de vínculos
- Relatórios de atividade

**Auditoria de Acessos:**
- Log de todos os acessos
- Detecção de anomalias
- Relatórios de segurança

#### ⚙️ Configurações Globais
**Templates Padrão:**
- Template de escola básica
- Disciplinas padrão por nível
- Períodos letivos típicos
- Configurações recomendadas

**Recursos Disponíveis:**
- Catálogo de funcionalidades
- Habilitação por plano
- Configuração de limites
- Versionamento de recursos

**Políticas de Uso:**
- Termos de serviço
- Política de privacidade
- Limites de uso por plano
- Regras de faturamento

**Backup e Segurança:**
- Configuração de backups
- Políticas de retenção
- Monitoramento de segurança
- Logs de auditoria

### Dashboard Coordenador/Coordenadora

#### 📊 Painel da Escola
**Métricas da Escola:**
- Total de usuários ativos
- Alunos matriculados
- Professores ativos
- Uso de recursos

**Widgets:**
- Atividades recentes
- Tarefas pendentes
- Próximos eventos
- Alertas da escola

#### 👥 Gestão de Usuários da Escola
**Funcionalidades:**
- Convidar novos usuários
- Gerenciar roles e permissões
- Aprovar/rejeitar solicitações
- Relatórios de atividade

#### 📁 Gestão de Arquivos da Escola
**Funcionalidades:**
- Upload e organização de documentos
- Galeria de fotos e mídias
- Materiais didáticos por disciplina
- Documentos financeiros e administrativos
- Controle de acesso por categoria
- Backup automático de arquivos importantes

**Categorias de Arquivos:**
- **Documentos de Alunos:** Matrículas, históricos, certificados
- **Documentos de Professores:** Currículos, certificações, documentos pessoais
- **Galeria de Fotos:** Eventos, atividades, infraestrutura
- **Materiais Didáticos:** Apostilas, exercícios, provas por disciplina
- **Documentos Financeiros:** Comprovantes, notas fiscais, contratos
- **Secretaria:** Atas, ofícios, comunicados, formulários

#### ⚙️ Configurações da Escola
**Informações Básicas:**
- Dados da escola
- Logo e cores
- Contatos e endereços

**Recursos Habilitados:**
- Módulos ativos
- Configurações específicas
- Integrações externas

---

## 📊 ESTRATÉGIA DE MIGRAÇÃO

### Fase de Preparação

#### 1. Backup Completo
```bash
# Backup dos dados atuais
firebase database:get / > backup-completo-$(date +%Y%m%d).json

# Backup por coleção
firebase database:get /usuarios > backup-usuarios.json
firebase database:get /turmas > backup-turmas.json
firebase database:get /disciplinas > backup-disciplinas.json
# ... demais coleções
```

#### 2. Criação da Nova Estrutura
```javascript
// Script de migração
const migrationScript = {
  // 1. Criar estrutura global
  createGlobalStructure: async () => {
    await set(ref(db, 'global/escolas-cadastradas/escola-elo-teste'), {
      nome: "ELO - Escola Teste",
      status: "ativa",
      dataCreacao: "2025-10-09T00:00:00Z",
      plano: "completo",
      recursos: ["todos"]
    });
  },
  
  // 2. Migrar dados para namespace da escola
  migrateSchoolData: async () => {
    const currentData = await get(ref(db, '/'));
    const schoolData = {};
    
    // Mover cada coleção para o namespace da escola
    Object.keys(currentData.val()).forEach(collection => {
      if (collection !== 'global' && collection !== 'usuarios-globais') {
        schoolData[collection] = currentData.val()[collection];
      }
    });
    
    await set(ref(db, 'escolas/escola-elo-teste'), schoolData);
  },
  
  // 3. Migrar usuários para estrutura global
  migrateUsers: async () => {
    const users = await get(ref(db, 'usuarios'));
    
    for (const [uid, userData] of Object.entries(users.val())) {
      // Criar usuário global
      await set(ref(db, `usuarios-globais/${uid}`), {
        ...userData,
        escolas: {
          "escola-elo-teste": {
            role: userData.role,
            ativo: true,
            dataVinculo: userData.criadoEm || "2025-01-01T00:00:00Z"
          }
        }
      });
      
      // Criar referência local na escola
      await set(ref(db, `escolas/escola-elo-teste/usuarios/${uid}`), {
        role: userData.role,
        ativo: true,
        dataVinculo: userData.criadoEm || "2025-01-01T00:00:00Z"
      });
    }
  },
  
  // 4. Migrar arquivos do Storage
  migrateStorageFiles: async () => {
    const storage = getStorage();
    
    // Mapear estrutura atual para nova estrutura
    const migrationMap = {
      'alunos/': 'escolas/escola-elo-teste/documentos/alunos/',
      'professores/': 'escolas/escola-elo-teste/documentos/professores/',
      'galeria/': 'escolas/escola-elo-teste/midias/galeria-fotos/',
      'documentos/': 'escolas/escola-elo-teste/secretaria/',
      'financeiro/': 'escolas/escola-elo-teste/financeiro/',
      'materiais/': 'escolas/escola-elo-teste/materiais-didaticos/'
    };
    
    for (const [oldPath, newPath] of Object.entries(migrationMap)) {
      try {
        // Listar todos os arquivos do caminho antigo
        const oldRef = storageRef(storage, oldPath);
        const fileList = await listAll(oldRef);
        
        console.log(`Migrando ${fileList.items.length} arquivos de ${oldPath} para ${newPath}`);
        
        // Migrar cada arquivo
        for (const fileRef of fileList.items) {
          const downloadURL = await getDownloadURL(fileRef);
          const response = await fetch(downloadURL);
          const blob = await response.blob();
          
          // Novo caminho do arquivo
          const fileName = fileRef.name;
          const newFileRef = storageRef(storage, `${newPath}${fileName}`);
          
          // Upload para novo local
          await uploadBytes(newFileRef, blob, {
            customMetadata: {
              migratedFrom: fileRef.fullPath,
              migratedAt: new Date().toISOString(),
              originalPath: oldPath
            }
          });
          
          console.log(`✅ Migrado: ${fileRef.fullPath} → ${newFileRef.fullPath}`);
        }
        
        console.log(`✅ Migração completa para ${oldPath}`);
      } catch (error) {
        console.error(`❌ Erro na migração de ${oldPath}:`, error);
      }
    }
  }
};
```

#### 3. Validação da Migração
```javascript
// Testes de validação
const validationTests = {
  // Verificar integridade dos dados
  validateDataIntegrity: async () => {
    const originalCount = await getOriginalRecordCount();
    const migratedCount = await getMigratedRecordCount();
    
    console.log('Validação de integridade:', {
      original: originalCount,
      migrado: migratedCount,
      sucesso: originalCount === migratedCount
    });
  },
  
  // Testar acesso aos dados
  testDataAccess: async () => {
    const schoolContext = "escola-elo-teste";
    const testData = await get(ref(db, `escolas/${schoolContext}/turmas`));
    
    console.log('Teste de acesso:', {
      encontrouDados: testData.exists(),
      quantidadeTurmas: Object.keys(testData.val() || {}).length
    });
  },
  
  // Verificar permissões
  testPermissions: async () => {
    // Simular acesso com diferentes roles
    // Verificar isolamento entre escolas
  },
  
  // Validar migração de arquivos
  validateStorageMigration: async () => {
    const storage = getStorage();
    const schoolPath = 'escolas/escola-elo-teste/';
    
    try {
      // Verificar se arquivos foram migrados corretamente
      const schoolRef = storageRef(storage, schoolPath);
      const result = await listAll(schoolRef);
      
      let totalFiles = 0;
      const checkFolder = async (folderRef) => {
        const folderResult = await listAll(folderRef);
        totalFiles += folderResult.items.length;
        
        // Recursivamente verificar subpastas
        for (const subfolder of folderResult.prefixes) {
          await checkFolder(subfolder);
        }
      };
      
      await checkFolder(schoolRef);
      
      console.log('Validação do Storage:', {
        arquivosMigrados: totalFiles,
        estruturaCorreta: result.prefixes.length > 0,
        caminhoBase: schoolPath
      });
      
      // Verificar acesso aos arquivos
      if (result.items.length > 0) {
        const sampleFile = result.items[0];
        const downloadURL = await getDownloadURL(sampleFile);
        console.log('Teste de acesso a arquivo:', {
          arquivo: sampleFile.name,
          acessivel: !!downloadURL
        });
      }
      
    } catch (error) {
      console.error('Erro na validação do Storage:', error);
    }
  }
};
```

### Implementação Gradual

#### Estratégia Blue-Green
1. **Blue (Atual):** Sistema funcionando normalmente
2. **Green (Novo):** Nova estrutura em paralelo
3. **Migração:** Dados copiados para nova estrutura
4. **Validação:** Testes completos na estrutura green
5. **Switch:** Redirecionamento gradual para nova estrutura
6. **Rollback:** Possibilidade de voltar ao blue se necessário

#### Fases de Rollout
1. **Fase 1:** Apenas super-admins na nova estrutura
2. **Fase 2:** Coordenador da escola-teste na nova estrutura
3. **Fase 3:** Usuários selecionados da escola-teste
4. **Fase 4:** Todos os usuários da escola-teste
5. **Fase 5:** Criação de novas escolas

---

## 🛠️ COMPONENTES TÉCNICOS

### 1. Configurador de Firebase Dinâmico
```javascript
// services/firebaseConfigService.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

class FirebaseConfigService {
  constructor() {
    this.masterConfig = {
      apiKey: "AIzaSyBoY8kGVTZjRnneyxPRfyLaq_ePjgFNNrY",
      authDomain: "elo-school-master.firebaseapp.com",
      databaseURL: "https://elo-school-master-default-rtdb.firebaseio.com/",
      projectId: "elo-school-master",
      storageBucket: "elo-school-master.firebasestorage.app",
      messagingSenderId: "403961922767",
      appId: "1:403961922767:web:89ffe1a7ebe6be3e9a23ba"
    };
    
    this.schoolConfigs = new Map();
    this.schoolApps = new Map();
    this.masterApp = null;
    
    this.initMasterApp();
  }

  // Inicializar app master
  initMasterApp() {
    const existingApp = getApps().find(app => app.name === 'master');
    if (existingApp) {
      this.masterApp = existingApp;
    } else {
      this.masterApp = initializeApp(this.masterConfig, 'master');
    }
  }

  // Obter configuração da escola do banco master
  async getSchoolConfig(schoolId) {
    if (this.schoolConfigs.has(schoolId)) {
      return this.schoolConfigs.get(schoolId);
    }

    try {
      const masterDb = getDatabase(this.masterApp);
      const schoolRef = ref(masterDb, `escolas-cadastradas/${schoolId}`);
      const snapshot = await get(schoolRef);
      
      if (snapshot.exists()) {
        const schoolData = snapshot.val();
        const config = {
          apiKey: this.masterConfig.apiKey, // Compartilhado
          authDomain: `${schoolData.projectId}.firebaseapp.com`,
          databaseURL: schoolData.databaseURL,
          projectId: schoolData.projectId,
          storageBucket: schoolData.storageBucket,
          messagingSenderId: this.masterConfig.messagingSenderId,
          appId: schoolData.appId || this.masterConfig.appId // Fallback
        };
        
        this.schoolConfigs.set(schoolId, config);
        return config;
      }
    } catch (error) {
      console.error(`Erro ao obter configuração da escola ${schoolId}:`, error);
    }
    
    return null;
  }

  // Inicializar app da escola
  async initSchoolApp(schoolId) {
    if (this.schoolApps.has(schoolId)) {
      return this.schoolApps.get(schoolId);
    }

    const config = await this.getSchoolConfig(schoolId);
    if (!config) {
      throw new Error(`Configuração não encontrada para escola: ${schoolId}`);
    }

    try {
      const appName = `school-${schoolId}`;
      const existingApp = getApps().find(app => app.name === appName);
      
      let schoolApp;
      if (existingApp) {
        schoolApp = existingApp;
      } else {
        schoolApp = initializeApp(config, appName);
      }
      
      this.schoolApps.set(schoolId, schoolApp);
      return schoolApp;
    } catch (error) {
      console.error(`Erro ao inicializar app da escola ${schoolId}:`, error);
      throw error;
    }
  }

  // Obter database da escola
  async getSchoolDatabase(schoolId) {
    const app = await this.initSchoolApp(schoolId);
    return getDatabase(app);
  }

  // Obter storage da escola
  async getSchoolStorage(schoolId) {
    const app = await this.initSchoolApp(schoolId);
    return getStorage(app);
  }

  // Obter database master
  getMasterDatabase() {
    return getDatabase(this.masterApp);
  }

  // Obter storage master
  getMasterStorage() {
    return getStorage(this.masterApp);
  }

  // Obter auth (compartilhado)
  getAuth() {
    return getAuth(this.masterApp);
  }

  // Limpar cache de configurações
  clearCache() {
    this.schoolConfigs.clear();
    // Note: não limpamos schoolApps para evitar reinicializações desnecessárias
  }

  // Listar escolas disponíveis
  async getAvailableSchools() {
    try {
      const masterDb = this.getMasterDatabase();
      const schoolsRef = ref(masterDb, 'escolas-cadastradas');
      const snapshot = await get(schoolsRef);
      
      if (snapshot.exists()) {
        return Object.keys(snapshot.val());
      }
      return [];
    } catch (error) {
      console.error('Erro ao listar escolas:', error);
      return [];
    }
  }
}

export const firebaseConfigService = new FirebaseConfigService();
```

### 2. Service de Dados Multi-Banco
```javascript
// services/multiDatabaseService.js
import { ref, get, set, push, update, remove } from 'firebase/database';
import { firebaseConfigService } from './firebaseConfigService';

class MultiDatabaseService {
  constructor() {
    this.currentSchool = null;
  }

  setCurrentSchool(schoolId) {
    this.currentSchool = schoolId;
  }

  // Referência para dados da escola atual
  async getSchoolRef(path) {
    if (!this.currentSchool) {
      throw new Error('Escola não definida');
    }
    
    const db = await firebaseConfigService.getSchoolDatabase(this.currentSchool);
    return ref(db, path);
  }

  // Referência para dados globais (master)
  getMasterRef(path) {
    const db = firebaseConfigService.getMasterDatabase();
    return ref(db, path);
  }

  // CRUD operations para escola atual
  async getSchoolData(path) {
    const dataRef = await this.getSchoolRef(path);
    const snapshot = await get(dataRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  async setSchoolData(path, data) {
    const dataRef = await this.getSchoolRef(path);
    return await set(dataRef, data);
  }

  async updateSchoolData(path, data) {
    const dataRef = await this.getSchoolRef(path);
    return await update(dataRef, data);
  }

  async pushSchoolData(path, data) {
    const dataRef = await this.getSchoolRef(path);
    return await push(dataRef, data);
  }

  async removeSchoolData(path) {
    const dataRef = await this.getSchoolRef(path);
    return await remove(dataRef);
  }

  // CRUD operations para dados globais (apenas super-admins)
  async getMasterData(path) {
    const dataRef = this.getMasterRef(path);
    const snapshot = await get(dataRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  async setMasterData(path, data) {
    const dataRef = this.getMasterRef(path);
    return await set(dataRef, data);
  }

  async updateMasterData(path, data) {
    const dataRef = this.getMasterRef(path);
    return await update(dataRef, data);
  }

  // Operações de usuário (master)
  async getUserData(uid) {
    return await this.getMasterData(`usuarios-globais/${uid}`);
  }

  async updateUserData(uid, data) {
    return await this.updateMasterData(`usuarios-globais/${uid}`, data);
  }

  // Verificar permissões do usuário na escola atual
  async checkUserPermission(uid, permission) {
    const userData = await this.getUserData(uid);
    if (!userData || !this.currentSchool) return false;

    const schoolData = userData.escolas?.[this.currentSchool];
    if (!schoolData || !schoolData.ativo) return false;

    return schoolData.permissoes?.includes(permission) || false;
  }

  // Listar escolas do usuário
  async getUserSchools(uid) {
    const userData = await this.getUserData(uid);
    if (!userData) return [];

    return Object.keys(userData.escolas || {}).filter(
      schoolId => userData.escolas[schoolId].ativo
    );
  }

  // Criar nova escola (apenas super-admins)
  async createSchool(schoolData) {
    try {
      // 1. Registrar escola no master
      const schoolId = schoolData.id || `escola-${Date.now()}`;
      await this.setMasterData(`escolas-cadastradas/${schoolId}`, {
        nome: schoolData.nome,
        status: 'ativa',
        databaseURL: schoolData.databaseURL,
        projectId: schoolData.projectId,
        storageBucket: schoolData.storageBucket,
        plano: schoolData.plano || 'basico',
        recursos: schoolData.recursos || [],
        dataCreacao: new Date().toISOString(),
        coordenador: schoolData.coordenadorUid
      });

      // 2. Aplicar template padrão na nova escola
      await this.applySchoolTemplate(schoolId);

      // 3. Criar coordenador inicial
      if (schoolData.coordenadorUid) {
        await this.addUserToSchool(schoolData.coordenadorUid, schoolId, 'coordenador');
      }

      return { success: true, schoolId };
    } catch (error) {
      console.error('Erro ao criar escola:', error);
      return { success: false, error: error.message };
    }
  }

  // Aplicar template padrão na escola
  async applySchoolTemplate(schoolId) {
    try {
      // Obter template do master
      const template = await this.getMasterData('templates-escola/padrao');
      if (!template) return;

      // Aplicar template na escola
      const oldSchool = this.currentSchool;
      this.setCurrentSchool(schoolId);

      // Criar estrutura básica
      await this.setSchoolData('Escola', template.configEscola || {});
      await this.setSchoolData('disciplinas', template.disciplinas || {});
      await this.setSchoolData('periodos-letivos', template.periodosLetivos || {});

      // Restaurar escola anterior
      this.setCurrentSchool(oldSchool);
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
    }
  }

  // Adicionar usuário a uma escola
  async addUserToSchool(uid, schoolId, role, permissions = []) {
    try {
      // Atualizar dados globais do usuário
      const userData = await this.getUserData(uid) || {};
      if (!userData.escolas) userData.escolas = {};
      
      userData.escolas[schoolId] = {
        role,
        ativo: true,
        dataVinculo: new Date().toISOString(),
        permissoes: permissions
      };

      await this.updateUserData(uid, userData);

      // Criar entrada local na escola
      const oldSchool = this.currentSchool;
      this.setCurrentSchool(schoolId);
      
      await this.setSchoolData(`usuarios/${uid}`, {
        role,
        ativo: true,
        dataVinculo: new Date().toISOString()
      });

      this.setCurrentSchool(oldSchool);
      return { success: true };
    } catch (error) {
      console.error('Erro ao adicionar usuário à escola:', error);
      return { success: false, error: error.message };
    }
  }
}

export const multiDatabaseService = new MultiDatabaseService();
```

### 3. Hook de Contexto de Escola
```javascript
// hooks/useSchoolContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { multiDatabaseService } from '../services/multiDatabaseService';
import { firebaseConfigService } from '../services/firebaseConfigService';
import { useAuthUser } from './useAuthUser';

const SchoolContext = createContext();

export function SchoolProvider({ children }) {
  const { user } = useAuthUser();
  const [currentSchool, setCurrentSchool] = useState(null);
  const [userSchools, setUserSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Carregar escolas do usuário
  useEffect(() => {
    if (user?.uid) {
      loadUserSchools();
    } else {
      setUserSchools([]);
      setCurrentSchool(null);
      setLoading(false);
    }
  }, [user]);

  // Carregar permissões quando escola muda
  useEffect(() => {
    if (currentSchool && user?.uid) {
      loadUserPermissions();
    } else {
      setPermissions([]);
    }
  }, [currentSchool, user]);

  const loadUserSchools = async () => {
    try {
      setLoading(true);
      const schools = await multiDatabaseService.getUserSchools(user.uid);
      
      // Buscar dados detalhados das escolas
      const schoolsData = await Promise.all(
        schools.map(async (schoolId) => {
          const schoolInfo = await multiDatabaseService.getMasterData(`escolas-cadastradas/${schoolId}`);
          return {
            id: schoolId,
            nome: schoolInfo?.nome || schoolId,
            ...schoolInfo
          };
        })
      );

      setUserSchools(schoolsData);
      
      // Se não há escola atual, selecionar a primeira
      if (!currentSchool && schoolsData.length > 0) {
        changeSchool(schoolsData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar escolas do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async () => {
    try {
      const userData = await multiDatabaseService.getUserData(user.uid);
      const schoolData = userData?.escolas?.[currentSchool];
      setPermissions(schoolData?.permissoes || []);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      setPermissions([]);
    }
  };

  const changeSchool = async (schoolId) => {
    try {
      setLoading(true);
      multiDatabaseService.setCurrentSchool(schoolId);
      setCurrentSchool(schoolId);
      
      // Salvar última escola selecionada
      localStorage.setItem('lastSelectedSchool', schoolId);
    } catch (error) {
      console.error('Erro ao trocar escola:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const isCoordenador = () => {
    return hasPermission('coordenador') || 
           userSchools.find(s => s.id === currentSchool)?.coordenador === user?.uid;
  };

  const getCurrentSchoolData = () => {
    return userSchools.find(s => s.id === currentSchool);
  };

  const value = {
    currentSchool,
    userSchools,
    loading,
    permissions,
    changeSchool,
    hasPermission,
    isCoordenador,
    getCurrentSchoolData,
    refreshSchools: loadUserSchools
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolContext() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchoolContext deve ser usado dentro de SchoolProvider');
  }
  return context;
}
```

### 4. Componente de Seleção de Escola
```javascript
// components/SchoolSelector.jsx
import { useState } from 'react';
import { useSchoolContext } from '../hooks/useSchoolContext';

export default function SchoolSelector({ onSchoolChange }) {
  const { 
    currentSchool, 
    userSchools, 
    loading, 
    changeSchool, 
    getCurrentSchoolData 
  } = useSchoolContext();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleSchoolSelect = async (schoolId) => {
    await changeSchool(schoolId);
    setIsOpen(false);
    onSchoolChange?.(schoolId);
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 w-48 rounded"></div>
    );
  }

  if (userSchools.length === 0) {
    return (
      <div className="text-red-600 bg-red-50 px-3 py-2 rounded text-sm">
        Nenhuma escola encontrada
      </div>
    );
  }

  const currentSchoolData = getCurrentSchoolData();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="font-medium text-gray-900">
            {currentSchoolData?.nome || 'Selecionar Escola'}
          </span>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="py-1">
            {userSchools.map((school) => (
              <button
                key={school.id}
                onClick={() => handleSchoolSelect(school.id)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                  school.id === currentSchool ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    school.status === 'ativa' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="font-medium">{school.nome}</div>
                    <div className="text-sm text-gray-500">
                      Plano: {school.plano || 'Básico'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 5. Service Adaptado para Finanças
```javascript
// services/financeiroServiceMultiTenant.js
import { multiDatabaseService } from './multiDatabaseService';

class FinanceiroServiceMultiTenant {
  // Obter mensalidades
  async getMensalidades() {
    return await multiDatabaseService.getSchoolData('financeiro/mensalidades');
  }

  // Criar mensalidade
  async createMensalidade(data) {
    return await multiDatabaseService.pushSchoolData('financeiro/mensalidades', {
      ...data,
      dataCreacao: new Date().toISOString(),
      escola: multiDatabaseService.currentSchool
    });
  }

  // Atualizar mensalidade
  async updateMensalidade(id, data) {
    return await multiDatabaseService.updateSchoolData(`financeiro/mensalidades/${id}`, data);
  }

  // Baixar título
  async baixarTitulo(id, dadosBaixa) {
    return await multiDatabaseService.updateSchoolData(`financeiro/mensalidades/${id}`, {
      status: 'pago',
      dataBaixa: new Date().toISOString(),
      valorPago: dadosBaixa.valorPago,
      formaPagamento: dadosBaixa.formaPagamento,
      observacoes: dadosBaixa.observacoes
    });
  }

  // Gerar relatório
  async gerarRelatorio(filtros) {
    const mensalidades = await this.getMensalidades();
    if (!mensalidades) return [];

    let dados = Object.entries(mensalidades).map(([id, data]) => ({
      id,
      ...data
    }));

    // Aplicar filtros
    if (filtros.periodo) {
      const [inicio, fim] = filtros.periodo;
      dados = dados.filter(item => {
        const dataVenc = new Date(item.dataVencimento);
        return dataVenc >= inicio && dataVenc <= fim;
      });
    }

    if (filtros.status) {
      dados = dados.filter(item => item.status === filtros.status);
    }

    return dados;
  }

  // Obter estatísticas
  async getEstatisticas() {
    const mensalidades = await this.getMensalidades();
    if (!mensalidades) {
      return {
        totalReceber: 0,
        totalRecebido: 0,
        totalVencidas: 0,
        totalMes: 0
      };
    }

    const dados = Object.values(mensalidades);
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    const totalReceber = dados
      .filter(item => item.status === 'pendente')
      .reduce((sum, item) => sum + (item.valor || 0), 0);

    const totalRecebido = dados
      .filter(item => item.status === 'pago')
      .reduce((sum, item) => sum + (item.valorPago || item.valor || 0), 0);

    const totalVencidas = dados
      .filter(item => {
        return item.status === 'pendente' && 
               new Date(item.dataVencimento) < agora;
      })
      .reduce((sum, item) => sum + (item.valor || 0), 0);

    const totalMes = dados
      .filter(item => {
        const dataVenc = new Date(item.dataVencimento);
        return dataVenc >= inicioMes && dataVenc <= fimMes;
      })
      .reduce((sum, item) => sum + (item.valor || 0), 0);

    return {
      totalReceber,
      totalRecebido,
      totalVencidas,
      totalMes
    };
  }
}

export const financeiroServiceMultiTenant = new FinanceiroServiceMultiTenant();
```

## 4. Estratégia de Migração

### 4.1 Plano de Migração em Fases

#### Fase 1: Preparação da Infraestrutura
1. **Criação do projeto master**
   - Configurar Firebase projeto master
   - Implementar estrutura de dados global
   - Configurar regras de segurança master

2. **Desenvolvimento dos serviços base**
   - Implementar `firebaseConfigService`
   - Implementar `multiDatabaseService`
   - Criar sistema de templates

#### Fase 2: Migração do Sistema Atual
1. **Backup completo dos dados atuais**
   ```bash
   # Exportar dados do Firebase atual
   firebase database:get / --project elo-school > backup-completo.json
   ```

2. **Criar primeira escola no novo sistema**
   ```javascript
   // Script de migração
   async function migrarEscolaAtual() {
     // 1. Criar projeto Firebase para escola atual
     const escolaId = 'escola-elo-original';
     
     // 2. Registrar no master
     await multiDatabaseService.setMasterData(`escolas-cadastradas/${escolaId}`, {
       nome: 'ELO School Original',
       status: 'ativa',
       databaseURL: 'https://elo-school-original-default-rtdb.firebaseio.com/',
       projectId: 'elo-school-original',
       storageBucket: 'elo-school-original.firebasestorage.app',
       plano: 'premium',
       dataCreacao: new Date().toISOString()
     });
     
     // 3. Migrar dados para nova estrutura
     await migrarDados(escolaId);
     
     // 4. Migrar usuários
     await migrarUsuarios(escolaId);
   }
   ```

#### Fase 3: Adaptação do Frontend
1. **Implementar contexto de escola**
   - Adicionar `SchoolProvider` ao app
   - Implementar `useSchoolContext`
   - Criar `SchoolSelector`

2. **Atualizar componentes existentes**
   - Adaptar serviços para multi-tenant
   - Atualizar formulários e telas
   - Implementar verificações de permissão

#### Fase 4: Testes e Validação
1. **Testes de funcionalidade**
   - Verificar isolamento entre escolas
   - Testar permissões e segurança
   - Validar migração de dados

2. **Testes de performance**
   - Monitorar latência de consultas
   - Otimizar consultas frequentes
   - Implementar cache onde necessário

### 4.2 Scripts de Migração

#### Script de Migração de Dados
```javascript
// scripts/migracaoDados.js
import { multiDatabaseService } from '../services/multiDatabaseService';

async function migrarDados(escolaId) {
  const backupData = require('./backup-completo.json');
  
  // Configurar escola de destino
  multiDatabaseService.setCurrentSchool(escolaId);
  
  try {
    // Migrar dados da escola
    if (backupData.Escola) {
      await multiDatabaseService.setSchoolData('Escola', backupData.Escola);
    }
    
    // Migrar alunos
    if (backupData.alunos) {
      await multiDatabaseService.setSchoolData('alunos', backupData.alunos);
    }
    
    // Migrar financeiro
    if (backupData.financeiro) {
      await multiDatabaseService.setSchoolData('financeiro', backupData.financeiro);
    }
    
    // Migrar notas e frequências
    if (backupData.notas) {
      await multiDatabaseService.setSchoolData('notas', backupData.notas);
    }
    
    if (backupData.frequencias) {
      await multiDatabaseService.setSchoolData('frequencias', backupData.frequencias);
    }
    
    console.log(`Dados migrados com sucesso para escola ${escolaId}`);
  } catch (error) {
    console.error('Erro na migração:', error);
    throw error;
  }
}

// Migrar usuários para estrutura global + local
async function migrarUsuarios(escolaId) {
  const backupData = require('./backup-completo.json');
  
  if (!backupData.usuarios) return;
  
  for (const [uid, userData] of Object.entries(backupData.usuarios)) {
    try {
      // Estrutura global do usuário
      const globalUserData = {
        email: userData.email,
        nome: userData.nome,
        telefone: userData.telefone,
        dataRegistro: userData.dataRegistro || new Date().toISOString(),
        escolas: {
          [escolaId]: {
            role: userData.role || 'professor',
            ativo: true,
            dataVinculo: userData.dataRegistro || new Date().toISOString(),
            permissoes: getPermissoesPorRole(userData.role)
          }
        }
      };
      
      // Salvar no master
      await multiDatabaseService.setMasterData(`usuarios-globais/${uid}`, globalUserData);
      
      // Estrutura local na escola
      const localUserData = {
        role: userData.role,
        ativo: true,
        dataVinculo: userData.dataRegistro || new Date().toISOString()
      };
      
      // Salvar na escola
      multiDatabaseService.setCurrentSchool(escolaId);
      await multiDatabaseService.setSchoolData(`usuarios/${uid}`, localUserData);
      
      console.log(`Usuário ${uid} migrado com sucesso`);
    } catch (error) {
      console.error(`Erro ao migrar usuário ${uid}:`, error);
    }
  }
}

function getPermissoesPorRole(role) {
  const permissoes = {
    'coordenador': ['*'], // Todas as permissões
    'secretaria': ['financeiro', 'alunos', 'secretaria-digital'],
    'professor': ['notas', 'frequencia', 'alunos-consulta'],
    'responsavel': ['financeiro-consulta', 'notas-consulta']
  };
  
  return permissoes[role] || [];
}

export { migrarDados, migrarUsuarios };
```

#### Script de Validação Pós-Migração
```javascript
// scripts/validacaoMigracao.js
import { multiDatabaseService } from '../services/multiDatabaseService';

async function validarMigracao(escolaId) {
  const relatorio = {
    escola: escolaId,
    timestamp: new Date().toISOString(),
    dadosMigrados: {},
    usuariosMigrados: 0,
    errosEncontrados: []
  };

  try {
    // Configurar escola
    multiDatabaseService.setCurrentSchool(escolaId);

    // Validar dados principais
    const estruturas = ['Escola', 'alunos', 'financeiro', 'notas', 'frequencias'];
    
    for (const estrutura of estruturas) {
      try {
        const dados = await multiDatabaseService.getSchoolData(estrutura);
        relatorio.dadosMigrados[estrutura] = {
          migrado: !!dados,
          registros: dados ? Object.keys(dados).length : 0
        };
      } catch (error) {
        relatorio.errosEncontrados.push({
          estrutura,
          erro: error.message
        });
      }
    }

    // Validar usuários
    const usuarios = await multiDatabaseService.getSchoolData('usuarios');
    relatorio.usuariosMigrados = usuarios ? Object.keys(usuarios).length : 0;

    // Validar integridade dos dados
    await validarIntegridadeDados(escolaId, relatorio);

  } catch (error) {
    relatorio.errosEncontrados.push({
      erro: error.message,
      fase: 'validacao-geral'
    });
  }

  return relatorio;
}

async function validarIntegridadeDados(escolaId, relatorio) {
  try {
    // Verificar se dados críticos existem
    const escola = await multiDatabaseService.getSchoolData('Escola');
    if (!escola || !escola.nome) {
      relatorio.errosEncontrados.push({
        erro: 'Dados básicos da escola não encontrados',
        criticidade: 'alta'
      });
    }

    // Verificar consistência de usuários
    const usuariosLocais = await multiDatabaseService.getSchoolData('usuarios');
    if (usuariosLocais) {
      for (const uid of Object.keys(usuariosLocais)) {
        const usuarioGlobal = await multiDatabaseService.getMasterData(`usuarios-globais/${uid}`);
        if (!usuarioGlobal || !usuarioGlobal.escolas[escolaId]) {
          relatorio.errosEncontrados.push({
            erro: `Usuário ${uid} existe localmente mas não globalmente`,
            criticidade: 'media'
          });
        }
      }
    }

  } catch (error) {
    relatorio.errosEncontrados.push({
      erro: error.message,
      fase: 'validacao-integridade'
    });
  }
}

export { validarMigracao };
```

### 4.3 Cronograma de Implementação

| Semana | Atividades | Responsável | Status |
|--------|------------|-------------|---------|
| 1 | Criação projeto master e estrutura base | Dev Lead | 🔄 |
| 2 | Implementação services multi-banco | Dev Team | ⏳ |
| 3 | Desenvolvimento componentes React | Frontend | ⏳ |
| 4 | Scripts de migração e testes | Dev Team | ⏳ |
| 5 | Migração escola atual + validação | Tech Lead | ⏳ |
| 6 | Testes integração e ajustes | QA Team | ⏳ |
| 7 | Deploy produção e monitoramento | DevOps | ⏳ |
| 8 | Documentação e treinamento | All Team | ⏳ |

### 4.4 Checklist de Pré-Migração

#### Infraestrutura
- [ ] Projeto Firebase master criado
- [ ] Regras de segurança implementadas
- [ ] Backup completo dos dados atuais
- [ ] Ambiente de teste configurado

#### Código
- [ ] Services multi-banco implementados
- [ ] Componentes React atualizados
- [ ] Scripts de migração testados
- [ ] Testes unitários criados

#### Validação
- [ ] Testes de isolamento entre escolas
- [ ] Verificação de permissões
- [ ] Performance testada
- [ ] Rollback plan definido

## 5. Benefícios Esperados

### 5.1 Isolamento Completo
- **Dados**: Cada escola em banco separado
- **Storage**: Buckets isolados por escola
- **Custos**: Transparência total por cliente
- **Performance**: Sem impacto entre escolas

### 5.2 Escalabilidade
- **Crescimento**: Adicionar escolas sem impacto
- **Performance**: Bancos dedicados
- **Manutenção**: Atualizações independentes
- **Backup**: Estratégias personalizadas

### 5.3 Flexibilidade
- **Customização**: Configurações por escola
- **Planos**: Recursos diferenciados
- **Integração**: APIs isoladas
- **Compliance**: Adequação por região

### 5.4 Operacional
- **Monitoramento**: Métricas isoladas
- **Suporte**: Diagnóstico facilitado
- **Billing**: Cobrança transparente
- **SLA**: Acordos individualizados

## 6. Considerações de Segurança

### 6.1 Autenticação Global
- Usuários autenticam uma vez
- Token válido para todas as escolas
- Refresh token compartilhado
- Logout global obrigatório

### 6.2 Autorização por Escola
- Permissões validadas por escola
- Roles específicos por contexto
- Auditoria de ações isolada
- Logs separados por escola

### 6.3 Proteção de Dados
- Criptografia em trânsito e repouso
- Backup automático por escola
- Retention policy configurável
- LGPD compliance por escola

## 7. Monitoramento e Observabilidade

### 7.1 Métricas por Escola
```javascript
// services/monitoringService.js
class MonitoringService {
  async trackSchoolMetrics(schoolId, event, data) {
    const metrics = {
      timestamp: new Date().toISOString(),
      schoolId,
      event,
      data,
      session: this.getSessionId()
    };
    
    // Enviar para analytics isolado
    await this.sendToAnalytics(schoolId, metrics);
  }
  
  async getSchoolAnalytics(schoolId, period) {
    // Buscar métricas específicas da escola
    return await this.queryAnalytics(schoolId, period);
  }
}
```

### 7.2 Alertas Personalizados
- Limite de uso por escola
- Performance degradada
- Falhas de autenticação
- Erros de integração

---

*Este PRF representa a evolução completa do sistema ELO para uma arquitetura multi-tenant robusta, escalável e segura, baseada em bancos de dados Firebase separados por escola.*
}
```
```javascript
// hooks/useSchoolContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthUser } from './useAuthUser';

const SchoolContext = createContext();

export function SchoolProvider({ children }) {
  const { user } = useAuthUser();
  const [currentSchool, setCurrentSchool] = useState(null);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadUserSchools();
    }
  }, [user]);

  const loadUserSchools = async () => {
    try {
      // Buscar escolas do usuário
      const userRef = ref(db, `usuarios-globais/${user.uid}`);
      const userData = await get(userRef);
      
      if (userData.exists()) {
        const schools = Object.keys(userData.val().escolas || {});
        setAvailableSchools(schools);
        
        // Definir escola padrão
        const defaultSchool = localStorage.getItem('currentSchool') || schools[0];
        setCurrentSchool(defaultSchool);
      }
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchSchool = (schoolId) => {
    setCurrentSchool(schoolId);
    localStorage.setItem('currentSchool', schoolId);
    // Trigger re-render de componentes dependentes
  };

  const getSchoolRef = (path) => {
    if (!currentSchool) return null;
    return ref(db, `escolas/${currentSchool}/${path}`);
  };

  const value = {
    currentSchool,
    availableSchools,
    switchSchool,
    getSchoolRef,
    loading
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolContext() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchoolContext deve ser usado dentro de SchoolProvider');
  }
  return context;
}
```

### 2. Service de Dados Multi-Tenant
```javascript
// services/multiTenantService.js
import { ref, get, set, push, update, remove } from 'firebase/database';
import { db } from '../firebase';

class MultiTenantService {
  constructor() {
    this.currentSchool = null;
  }

  setCurrentSchool(schoolId) {
    this.currentSchool = schoolId;
  }

  // Referência para dados da escola atual
  getSchoolRef(path) {
    if (!this.currentSchool) {
      throw new Error('Escola não definida');
    }
    return ref(db, `escolas/${this.currentSchool}/${path}`);
  }

  // Referência para dados globais
  getGlobalRef(path) {
    return ref(db, `global/${path}`);
  }

  // Referência para usuários globais
  getUserRef(uid, path = '') {
    return ref(db, `usuarios-globais/${uid}/${path}`);
  }

  // CRUD operations para escola atual
  async getSchoolData(path) {
    const snapshot = await get(this.getSchoolRef(path));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async setSchoolData(path, data) {
    return await set(this.getSchoolRef(path), data);
  }

  async updateSchoolData(path, data) {
    return await update(this.getSchoolRef(path), data);
  }

  async pushSchoolData(path, data) {
    return await push(this.getSchoolRef(path), data);
  }

  async removeSchoolData(path) {
    return await remove(this.getSchoolRef(path));
  }

  // CRUD operations para dados globais (apenas super-admins)
  async getGlobalData(path) {
    const snapshot = await get(this.getGlobalRef(path));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async setGlobalData(path, data) {
    return await set(this.getGlobalRef(path), data);
  }

  // Operações de usuário
  async getUserData(uid) {
    const snapshot = await get(this.getUserRef(uid));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async updateUserData(uid, data) {
    return await update(this.getUserRef(uid), data);
  }

  // Verificar permissões do usuário na escola atual
  async checkUserPermission(uid, permission) {
    const userData = await this.getUserData(uid);
    if (!userData || !this.currentSchool) return false;

    const schoolData = userData.escolas?.[this.currentSchool];
    if (!schoolData || !schoolData.ativo) return false;

    return schoolData.permissoes?.includes(permission) || false;
  }

  // Listar escolas do usuário
  async getUserSchools(uid) {
    const userData = await this.getUserData(uid);
    if (!userData) return [];

    return Object.keys(userData.escolas || {}).filter(
      schoolId => userData.escolas[schoolId].ativo
    );
  }
}

export const dataService = new MultiTenantService();
```

### 3. Service de Storage Multi-Tenant
```javascript
// services/multiTenantStorageService.js
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata 
} from 'firebase/storage';
import { storage } from '../firebase';

class MultiTenantStorageService {
  constructor() {
    this.currentSchool = null;
  }

  setCurrentSchool(schoolId) {
    this.currentSchool = schoolId;
  }

  // Referência para arquivos da escola atual
  getSchoolStorageRef(path) {
    if (!this.currentSchool) {
      throw new Error('Escola não definida');
    }
    return storageRef(storage, `escolas/${this.currentSchool}/${path}`);
  }

  // Referência para arquivos globais
  getGlobalStorageRef(path) {
    return storageRef(storage, `global/${path}`);
  }

  // Referência para arquivos temporários
  getTempStorageRef(userId, path) {
    return storageRef(storage, `temp/${userId}/${path}`);
  }

  // Upload de arquivo para escola atual
  async uploadSchoolFile(path, file, metadata = {}) {
    try {
      const fileRef = this.getSchoolStorageRef(path);
      const uploadMetadata = {
        ...metadata,
        customMetadata: {
          uploadedBy: 'current-user-uid', // TODO: pegar do contexto
          uploadedAt: new Date().toISOString(),
          schoolId: this.currentSchool,
          ...metadata.customMetadata
        }
      };
      
      const snapshot = await uploadBytes(fileRef, file, uploadMetadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        downloadURL,
        path: snapshot.ref.fullPath,
        size: snapshot.metadata.size
      };
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload de documento de aluno
  async uploadAlunoDocument(alunoId, categoria, file, metadata = {}) {
    const path = `documentos/alunos/${alunoId}/${categoria}/${file.name}`;
    return await this.uploadSchoolFile(path, file, metadata);
  }

  // Upload de documento de professor
  async uploadProfessorDocument(professorId, categoria, file, metadata = {}) {
    const path = `documentos/professores/${professorId}/${categoria}/${file.name}`;
    return await this.uploadSchoolFile(path, file, metadata);
  }

  // Upload de foto para galeria
  async uploadGaleriaFoto(categoria, file, metadata = {}) {
    const timestamp = Date.now();
    const path = `midias/galeria-fotos/${categoria}/${timestamp}_${file.name}`;
    return await this.uploadSchoolFile(path, file, metadata);
  }

  // Upload de material didático
  async uploadMaterialDidatico(disciplinaId, categoria, file, metadata = {}) {
    const path = `materiais-didaticos/${disciplinaId}/${categoria}/${file.name}`;
    return await this.uploadSchoolFile(path, file, metadata);
  }

  // Upload de documento financeiro
  async uploadDocumentoFinanceiro(categoria, file, metadata = {}) {
    const timestamp = Date.now();
    const path = `financeiro/${categoria}/${timestamp}_${file.name}`;
    return await this.uploadSchoolFile(path, file, metadata);
  }

  // Download de arquivo
  async getFileDownloadURL(path) {
    try {
      const fileRef = this.getSchoolStorageRef(path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Erro ao obter URL de download:', error);
      throw error;
    }
  }

  // Listar arquivos de uma pasta
  async listSchoolFiles(path) {
    try {
      const folderRef = this.getSchoolStorageRef(path);
      const result = await listAll(folderRef);
      
      const files = await Promise.all(
        result.items.map(async (itemRef) => {
          const metadata = await getMetadata(itemRef);
          const downloadURL = await getDownloadURL(itemRef);
          
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
            downloadURL,
            customMetadata: metadata.customMetadata || {}
          };
        })
      );
      
      return {
        files,
        folders: result.prefixes.map(ref => ({
          name: ref.name,
          fullPath: ref.fullPath
        }))
      };
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  // Listar documentos de aluno
  async listAlunoDocuments(alunoId, categoria = null) {
    const basePath = `documentos/alunos/${alunoId}`;
    const path = categoria ? `${basePath}/${categoria}` : basePath;
    return await this.listSchoolFiles(path);
  }

  // Listar fotos da galeria
  async listGaleriaFotos(categoria = null) {
    const basePath = 'midias/galeria-fotos';
    const path = categoria ? `${basePath}/${categoria}` : basePath;
    return await this.listSchoolFiles(path);
  }

  // Deletar arquivo
  async deleteSchoolFile(path) {
    try {
      const fileRef = this.getSchoolStorageRef(path);
      await deleteObject(fileRef);
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      return { success: false, error: error.message };
    }
  }

  // Mover arquivo (deletar e recriar)
  async moveSchoolFile(fromPath, toPath) {
    try {
      // Baixar arquivo original
      const fromRef = this.getSchoolStorageRef(fromPath);
      const downloadURL = await getDownloadURL(fromRef);
      
      // Fazer download do blob
      const response = await fetch(downloadURL);
      const blob = await response.blob();
      
      // Upload para novo local
      const toRef = this.getSchoolStorageRef(toPath);
      await uploadBytes(toRef, blob);
      
      // Deletar arquivo original
      await deleteObject(fromRef);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao mover arquivo:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter estatísticas de uso de storage
  async getStorageStats() {
    try {
      const result = await this.listSchoolFiles('');
      
      let totalSize = 0;
      let fileCount = 0;
      
      const calculateFolderStats = async (path) => {
        const folderContents = await this.listSchoolFiles(path);
        fileCount += folderContents.files.length;
        totalSize += folderContents.files.reduce((sum, file) => sum + file.size, 0);
        
        // Recursivamente para subpastas
        for (const folder of folderContents.folders) {
          await calculateFolderStats(folder.fullPath.replace(`escolas/${this.currentSchool}/`, ''));
        }
      };
      
      await calculateFolderStats('');
      
      return {
        totalFiles: fileCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        schoolId: this.currentSchool
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

export const storageService = new MultiTenantStorageService();
```

### 4. Middleware de Autenticação
```javascript
// components/withSchoolAuth.jsx
import { useEffect, useState } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';
import { useSchoolContext } from '../hooks/useSchoolContext';
import { dataService } from '../services/multiTenantService';
import { CircularProgress, Box, Alert } from '@mui/material';

export function withSchoolAuth(WrappedComponent, requiredPermissions = []) {
  return function SchoolAuthWrapper(props) {
    const { user, userRole, loading: authLoading } = useAuthUser();
    const { currentSchool, loading: schoolLoading } = useSchoolContext();
    const [permissions, setPermissions] = useState([]);
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!authLoading && !schoolLoading && user && currentSchool) {
        checkPermissions();
      }
    }, [user, currentSchool, authLoading, schoolLoading]);

    const checkPermissions = async () => {
      try {
        // Verificar se usuário tem acesso à escola atual
        const userData = await dataService.getUserData(user.uid);
        const schoolAccess = userData?.escolas?.[currentSchool];

        if (!schoolAccess || !schoolAccess.ativo) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // Verificar permissões específicas
        const userPermissions = schoolAccess.permissoes || [];
        setPermissions(userPermissions);

        // Verificar se tem todas as permissões necessárias
        const hasRequiredPermissions = requiredPermissions.every(
          permission => userPermissions.includes(permission)
        );

        setAuthorized(hasRequiredPermissions);
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    if (authLoading || schoolLoading || loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!user) {
      return (
        <Alert severity="error">
          Você precisa estar logado para acessar esta página.
        </Alert>
      );
    }

    if (!currentSchool) {
      return (
        <Alert severity="warning">
          Nenhuma escola selecionada. Por favor, selecione uma escola.
        </Alert>
      );
    }

    if (!authorized) {
      return (
        <Alert severity="error">
          Você não tem permissão para acessar esta funcionalidade.
        </Alert>
      );
    }

    // Passar props adicionais para o componente
    return (
      <WrappedComponent
        {...props}
        currentSchool={currentSchool}
        userPermissions={permissions}
      />
    );
  };
}

// Exemplo de uso:
// export default withSchoolAuth(MeuComponente, ['usuarios', 'turmas']);
```

### 5. Seletor de Escola
```javascript
// components/SchoolSelector.jsx
import { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Avatar,
  Chip
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import { useSchoolContext } from '../hooks/useSchoolContext';

export function SchoolSelector() {
  const { currentSchool, availableSchools, switchSchool } = useSchoolContext();
  const [schoolsData, setSchoolsData] = useState({});

  useEffect(() => {
    loadSchoolsData();
  }, [availableSchools]);

  const loadSchoolsData = async () => {
    const data = {};
    for (const schoolId of availableSchools) {
      try {
        const schoolInfo = await dataService.getGlobalData(
          `escolas-cadastradas/${schoolId}`
        );
        data[schoolId] = schoolInfo;
      } catch (error) {
        console.error(`Erro ao carregar dados da escola ${schoolId}:`, error);
      }
    }
    setSchoolsData(data);
  };

  if (availableSchools.length <= 1) {
    // Se usuário só tem acesso a uma escola, não mostrar seletor
    return null;
  }

  return (
    <Box sx={{ minWidth: 200, mr: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Escola</InputLabel>
        <Select
          value={currentSchool || ''}
          label="Escola"
          onChange={(e) => switchSchool(e.target.value)}
          renderValue={(value) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                <SchoolIcon fontSize="small" />
              </Avatar>
              <Typography variant="body2">
                {schoolsData[value]?.nome || value}
              </Typography>
            </Box>
          )}
        >
          {availableSchools.map((schoolId) => (
            <MenuItem key={schoolId} value={schoolId}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <SchoolIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {schoolsData[schoolId]?.nome || schoolId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {schoolsData[schoolId]?.plano || 'Plano não definido'}
                  </Typography>
                </Box>
                <Chip
                  label={schoolsData[schoolId]?.status || 'ativo'}
                  size="small"
                  color={schoolsData[schoolId]?.status === 'ativa' ? 'success' : 'default'}
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
```

### 6. Firebase Security Rules
```javascript
// database.rules.json
{
  "rules": {
    // Dados globais - apenas super-admins
    "global": {
      ".read": "auth != null && root.child('usuarios-globais').child(auth.uid).child('superAdmin').val() === true",
      ".write": "auth != null && root.child('usuarios-globais').child(auth.uid).child('superAdmin').val() === true"
    },
    
    // Usuários globais - cada usuário acessa apenas seus dados
    "usuarios-globais": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('usuarios-globais').child(auth.uid).child('superAdmin').val() === true)",
        ".write": "auth != null && (auth.uid === $uid || root.child('usuarios-globais').child(auth.uid).child('superAdmin').val() === true)"
      }
    },
    
    // Dados das escolas - acesso baseado em vínculo
    "escolas": {
      "$schoolId": {
        ".read": "auth != null && (root.child('usuarios-globais').child(auth.uid).child('escolas').child($schoolId).child('ativo').val() === true || root.child('usuarios-globais').child(auth.uid).child('superAdmin').val() === true)",
        ".write": "auth != null && (root.child('usuarios-globais').child(auth.uid).child('escolas').child($schoolId).child('ativo').val() === true || root.child('usuarios-globais').child(auth.uid).child('superAdmin').val() === true)",
        
        // Regras específicas por coleção
        "usuarios": {
          "$uid": {
            ".read": "auth != null && (auth.uid === $uid || root.child('usuarios-globais').child(auth.uid).child('escolas').child($schoolId).child('permissoes').contains('usuarios'))",
            ".write": "auth != null && root.child('usuarios-globais').child(auth.uid).child('escolas').child($schoolId).child('permissoes').contains('usuarios')"
          }
        },
        
        "turmas": {
          ".read": "auth != null",
          ".write": "auth != null && root.child('usuarios-globais').child(auth.uid).child('escolas').child($schoolId).child('permissoes').contains('turmas')"
        },
        
        "planos-aula": {
          ".read": "auth != null",
          "$planoId": {
            ".write": "auth != null && (data.child('professorUid').val() === auth.uid || root.child('usuarios-globais').child(auth.uid).child('escolas').child($schoolId).child('permissoes').contains('aprovar-planos'))"
          }
        }
      }
    }
  }
}
```

---

## 📅 CRONOGRAMA DETALHADO

### 🚀 FASE 1 - PREPARAÇÃO (2-3 semanas)
**Objetivo:** Criar base técnica para multi-tenancy

#### Semana 1
- [ ] **Dia 1-2:** Análise detalhada do código atual
  - Mapear todas as referências ao Firebase
  - Identificar componentes que precisam de alteração
  - Documentar dependências entre módulos
  
- [ ] **Dia 3-4:** Criação da nova estrutura Firebase
  - Implementar hierarquia de dados proposta
  - Configurar Firebase Rules básicas
  - Testes de conectividade e permissões
  
- [ ] **Dia 5:** Backup completo e validação
  - Backup de todos os dados atuais
  - Validação da integridade dos backups
  - Documentação do processo de restore

#### Semana 2
- [ ] **Dia 1-3:** Implementação dos services base
  - MultiTenantService
  - Hook useSchoolContext
  - Middleware de autenticação
  
- [ ] **Dia 4-5:** Migração controlada dos dados
  - Script de migração para escola-teste
  - Migração de arquivos do Storage
  - Validação da migração
  - Testes de acesso aos dados migrados

#### Semana 3
- [ ] **Dia 1-2:** Atualização dos hooks existentes
  - useAuthUser para estrutura global
  - useSecretariaAccess para multi-tenant
  - Novos hooks específicos
  
- [ ] **Dia 3-5:** Criação de camada de compatibilidade
  - Wrapper para manter APIs existentes
  - Gradual migration helper
  - Testes de regressão

### 🏗️ FASE 2 - CORE MULTI-TENANT (3-4 semanas)
**Objetivo:** Implementar funcionalidades core multi-tenant

#### Semana 4
- [ ] **Dia 1-2:** Sistema de autenticação multi-escola
  - Login com seleção de escola
  - Gestão de sessões por escola
  - Tokens de acesso contextualizados
  
- [ ] **Dia 3-5:** Seletor de escola e contexto
  - Componente SchoolSelector
  - Persistência da escola selecionada
  - Switch entre escolas

#### Semana 5
- [ ] **Dia 1-3:** Atualização dos componentes principais
  - Dashboard com contexto de escola
  - Turmas e alunos por escola
  - Grade horária contextualizada
  
- [ ] **Dia 4-5:** Sistema de permissões granulares
  - Verificação de permissões por ação
  - Interface de gestão de permissões
  - Auditoria de acessos

#### Semana 6
- [ ] **Dia 1-3:** Planejamento de aulas multi-tenant
  - Planos por escola
  - Calendário contextualizado
  - Relatórios por escola
  
- [ ] **Dia 4-5:** Financeiro e secretaria por escola
  - Isolamento de dados financeiros
  - Documentos por escola
  - Comunicação interna

#### Semana 7
- [ ] **Dia 1-2:** Agenda médica e avisos
  - Contexto de escola em avisos
  - Agenda médica isolada
  - Notificações por escola
  
- [ ] **Dia 3-5:** Testes de integração
  - Testes de isolamento entre escolas
  - Performance com múltiplas escolas
  - Validação de segurança

### 🎛️ FASE 3 - DASHBOARD ADMIN (2-3 semanas)
**Objetivo:** Criar interfaces administrativas

#### Semana 8
- [ ] **Dia 1-3:** Interface Super-Admin
  - Dashboard principal
  - Métricas globais
  - Navegação administrativa
  
- [ ] **Dia 4-5:** Gestão de escolas
  - CRUD de escolas
  - Configurações por escola
  - Status e monitoramento

#### Semana 9
- [ ] **Dia 1-3:** Cadastro de novas escolas
  - Wizard de criação
  - Templates de configuração
  - Aplicação automática de estrutura
  
- [ ] **Dia 4-5:** Gestão de usuários globais
  - Interface para usuários cross-school
  - Aprovação de vínculos
  - Relatórios de uso

#### Semana 10 (opcional)
- [ ] **Dia 1-2:** Dashboard Coordenador/Coordenadora
  - Interface para coordenadores locais
  - Gestão de usuários da escola
  - Configurações específicas
  
- [ ] **Dia 3-5:** Relatórios e analytics
  - Métricas por escola
  - Relatórios de uso
  - Exportação de dados

### 🔧 FASE 4 - REFINAMENTO (2 semanas)
**Objetivo:** Polimento e otimização

#### Semana 11
- [ ] **Dia 1-2:** Testes de isolamento
  - Verificação de vazamento de dados
  - Testes de segurança
  - Validação de permissões
  
- [ ] **Dia 3-5:** Otimização de performance
  - Queries otimizadas
  - Cache por escola
  - Lazy loading de dados

#### Semana 12
- [ ] **Dia 1-2:** Documentação para admins
  - Manual do super-admin
  - Guia do coordenador de escola
  - Tutoriais de uso
  
- [ ] **Dia 3-5:** Treinamento de usuários
  - Material de treinamento
  - Videos explicativos
  - FAQ e troubleshooting

### 🚀 FASE 5 - PRODUÇÃO (1 semana)
**Objetivo:** Deploy e monitoramento

#### Semana 13
- [ ] **Dia 1-2:** Deploy controlado
  - Ambiente de staging
  - Testes finais
  - Deploy gradual
  
- [ ] **Dia 3-4:** Monitoramento inicial
  - Métricas de performance
  - Logs de erro
  - Feedback dos usuários
  
- [ ] **Dia 5:** Suporte e ajustes
  - Correções de bugs
  - Ajustes de performance
  - Documentação final

---

## 💰 ESTIMATIVA DE CUSTOS

### Desenvolvimento
- **Horas estimadas:** 480h (12 semanas × 40h)
- **Recursos:** 2 desenvolvedores + 1 tech lead
- **Custo de desenvolvimento:** R$ 96.000 - R$ 144.000

### Infraestrutura (mensal)
- **Firebase Realtime Database:** R$ 200-500/mês
- **Firebase Auth:** R$ 100-200/mês
- **Firebase Storage:** R$ 150-400/mês (com isolamento por escola)
  - Armazenamento: R$ 0,026/GB/mês
  - Download: R$ 0,12/GB
  - Upload: Gratuito
  - Operações: R$ 0,05/10.000 operações
- **Backup e monitoring:** R$ 100/mês
- **Total infraestrutura:** R$ 550-1.200/mês

### Operação (mensal)
- **Suporte técnico:** R$ 4.000/mês
- **Manutenção:** R$ 2.000/mês
- **Monitoramento:** R$ 1.000/mês
- **Total operação:** R$ 7.000/mês

---

## 📊 MÉTRICAS DE SUCESSO

### Técnicas
- **Tempo de resposta:** < 2s para qualquer operação
- **Disponibilidade:** > 99.5% uptime
- **Isolamento:** 0 vazamentos de dados entre escolas
- **Performance:** Suporte a 50+ escolas simultâneas

### Negócio
- **Onboarding:** Nova escola operacional em < 2h
- **Adoção:** 80% dos usuários migrados em 1 mês
- **Satisfação:** NPS > 70 dos coordenadores de escola
- **Escalabilidade:** Crescimento de 5+ escolas/mês

### Operacionais
- **Suporte:** < 4h tempo de resposta
- **Bugs críticos:** 0 bugs de vazamento de dados
- **Treinamento:** 90% dos coordenadores treinados
- **Documentação:** 100% das funcionalidades documentadas

---

## ⚠️ RISCOS E MITIGAÇÕES

### Riscos Técnicos

#### 🔴 Alto Risco
**Vazamento de dados entre escolas**
- **Impacto:** Crítico - violação de privacidade
- **Probabilidade:** Médio
- **Mitigação:** 
  - Testes automatizados de isolamento
  - Code review obrigatório
  - Firebase Rules rigorosas
  - Auditoria contínua

**Performance degradada com múltiplas escolas**
- **Impacto:** Alto - experiência do usuário
- **Probabilidade:** Alto
- **Mitigação:**
  - Índices otimizados no Firebase
  - Cache por escola
  - Lazy loading
  - Monitoramento de performance

#### 🟡 Médio Risco
**Complexidade de migração de dados**
- **Impacto:** Médio - tempo de desenvolvimento
- **Probabilidade:** Alto
- **Mitigação:**
  - Scripts de migração testados
  - Backup completo
  - Migração gradual
  - Rollback plan

**Aumento de custos Firebase**
- **Impacto:** Médio - viabilidade financeira
- **Probabilidade:** Médio
- **Mitigação:**
  - Monitoramento de uso
  - Otimização de queries
  - Planos de uso por escola
  - Cache inteligente

### Riscos de Negócio

#### 🔴 Alto Risco
**Resistência dos usuários atuais**
- **Impacto:** Alto - adoção da plataforma
- **Probabilidade:** Médio
- **Mitigação:**
  - Comunicação clara das vantagens
  - Migração transparente
  - Suporte dedicado
  - Rollback se necessário

**Perda de dados durante migração**
- **Impacto:** Crítico - continuidade do negócio
- **Probabilidade:** Baixo
- **Mitigação:**
  - Múltiplos backups
  - Testes extensivos
  - Migração em etapas
  - Validação contínua

#### 🟡 Médio Risco
**Atraso no cronograma**
- **Impacto:** Médio - time to market
- **Probabilidade:** Alto
- **Mitigação:**
  - Buffer de tempo no cronograma
  - Desenvolvimento ágil
  - Priorização de features core
  - Releases incrementais

**Concorrência**
- **Impacto:** Médio - market share
- **Probabilidade:** Médio
- **Mitigação:**
  - Time to market agressivo
  - Features diferenciadas
  - Relacionamento com clientes
  - Pricing competitivo

---

## 📈 OPORTUNIDADES

### Técnicas
- **Microserviços:** Evolução para arquitetura de microserviços
- **API Pública:** Marketplace de integrações
- **IA/ML:** Analytics preditivos por escola
- **Mobile:** Apps nativos por escola

### Negócio
- **Marketplace:** Venda de módulos específicos
- **White Label:** Customização por escola
- **Franchising:** Modelo de franquias
- **Partnerships:** Integrações com outras EdTechs

### Expansão
- **Segmentos:** Diferentes tipos de escola
- **Geografias:** Expansão regional
- **Idiomas:** Internacionalização
- **Verticais:** Outras áreas educacionais

---

## 🔧 FERRAMENTAS E TECNOLOGIAS

### Desenvolvimento
- **Frontend:** React 18, Next.js 15, Material-UI
- **Backend:** Firebase (Auth, Database, Functions, Storage)
- **Estado:** Context API, hooks customizados
- **Testes:** Jest, React Testing Library, Cypress
- **Versionamento:** Git, GitHub

### DevOps
- **CI/CD:** GitHub Actions
- **Deployment:** Firebase Hosting
- **Monitoramento:** Firebase Analytics, Google Cloud Monitoring
- **Backup:** Firebase Admin SDK scripts
- **Logs:** Cloud Logging

### Gestão
- **Projeto:** GitHub Issues, Milestones
- **Comunicação:** Slack, Google Meet
- **Documentação:** Markdown, Confluence
- **Design:** Figma, Material Design

---

## 📚 REFERÊNCIAS E ESTUDOS

### Arquiteturas Multi-Tenant
- [Multi-tenancy patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multitenancy)
- [Firebase multi-tenant security](https://firebase.google.com/docs/rules/manage-deploy)
- [SaaS architecture patterns](https://aws.amazon.com/saas/)

### EdTech Benchmarks
- Google Classroom architecture
- Canvas LMS multi-tenancy
- Blackboard multi-institutional

### Compliance e Segurança
- LGPD para dados educacionais
- SOC 2 compliance
- ISO 27001 requirements

---

## 📋 PRÓXIMOS PASSOS IMEDIATOS

### Para Aprovação
1. **Review do PRF** com stakeholders
2. **Aprovação do orçamento** e cronograma
3. **Definição da equipe** de desenvolvimento
4. **Setup do ambiente** de desenvolvimento

### Para Início
1. **Criação do projeto** no Firebase
2. **Setup do repositório** com branch específica
3. **Configuração das ferramentas** de desenvolvimento
4. **Primeira reunião** de kick-off

---

## ✅ APROVAÇÕES

| Stakeholder | Cargo | Data | Assinatura | Status |
|-------------|-------|------|------------|---------|
| [Nome] | Product Owner | ___/___/2025 | ___________ | ⏳ Pendente |
| [Nome] | Tech Lead | ___/___/2025 | ___________ | ⏳ Pendente |
| [Nome] | CEO/CTO | ___/___/2025 | ___________ | ⏳ Pendente |

---

## 📞 CONTATOS

**Equipe de Desenvolvimento:**
- **Tech Lead:** [Nome] - [email] - [telefone]
- **Desenvolvedor Frontend:** [Nome] - [email] - [telefone]
- **Desenvolvedor Backend:** [Nome] - [email] - [telefone]

**Stakeholders:**
- **Product Owner:** [Nome] - [email] - [telefone]
- **CEO/CTO:** [Nome] - [email] - [telefone]

---

**Documento gerado automaticamente em:** 09 de outubro de 2025  
**Versão:** 1.0  
**Próxima revisão:** 16 de outubro de 2025