/**
 * Script de Migração: Multi-Project → Single-Project
 * 
 * Este script reorganiza os dados para funcionar em um único projeto Firebase
 * com isolamento por escolaId nas regras de segurança.
 * 
 * ANTES DE EXECUTAR:
 * 1. Faça backup completo do banco
 * 2. Teste em ambiente de desenvolvimento primeiro
 * 3. Execute no console do Firebase: Database → Data → Three-dot menu → Import JSON
 */

// ====================================
// ESTRUTURA FINAL DESEJADA
// ====================================

const estruturaFinal = {
  // 1. Dados de gerenciamento (ficam na raiz)
  "management": {
    "escolas": {
      "-ObZHudPDoVkWnCFvkVD": {
        "nome": "teste",
        "ativa": true,
        "cnpj": "23234234234234",
        "plano": "basico",
        "mensalidade": 1200,
        "status": "pendente",
        "criadoEm": "2025-10-14T19:56:27.918Z",
        "responsavel": "teste",
        "email": "gubra19@gmail.com",
        "telefone": "62984928016",
        "endereco": {
          "rua": "Rua Padre Feijo",
          "cidade": "Goiânia",
          "estado": "SP",
          "cep": "74360-390"
        },
        "configuracoes": {
          "limiteAlunos": 200,
          "limiteProfessores": 15,
          "modulosAtivos": ["financeiro", "notas", "alunos"]
        }
      },
      "-ObZWZIHI1oNnZ5Oss8_": {
        "nome": "Elo Teste",
        "ativa": true,
        "cnpj": "056947571656565",
        "plano": "premium",
        "mensalidade": 2500,
        "status": "pendente",
        "criadoEm": "2025-10-14T21:00:28.513Z",
        "responsavel": "Gustavo",
        "email": "gubra19@gmail.com",
        "telefone": "62984928016",
        "endereco": {
          "rua": "Rua Padre Feijo",
          "cidade": "Goiânia",
          "estado": "SP",
          "cep": "74360-390"
        },
        "configuracoes": {
          "limiteAlunos": 500,
          "limiteProfessores": 30,
          "modulosAtivos": ["financeiro", "notas", "alunos", "secretaria", "agenda", "relatorios", "analytics"]
        }
      }
    },
    
    "userSchools": {
      // UID do usuário → ID da escola
      "qD6UucWtcgPC9GHA41OB8rSaghZ2": "-ObZWZIHI1oNnZ5Oss8_",
      "LcLXCrhTfIWTfbsRbOjeBA3QlCF3": "-ObZWZIHI1oNnZ5Oss8_",
      "WVXDx8LKR0UTSMXCILr8L3BLQxp1": "-ObZHudPDoVkWnCFvkVD",
      "mqjh86urO5NJanRO1JMUsfmcGXt1": "-ObZHudPDoVkWnCFvkVD"
    },
    
    "superAdmins": {
      "qD6UucWtcgPC9GHA41OB8rSaghZ2": true
    }
  },
  
  // 2. Dados isolados por escola
  "escolasData": {
    "-ObZHudPDoVkWnCFvkVD": {
      // Escola vazia por enquanto
      "alunos": {},
      "turmas": {},
      "usuarios": {},
      "colaboradores": {},
      "avisos": {}
    },
    
    "-ObZWZIHI1oNnZ5Oss8_": {
      // Dados da escola "Elo Teste" (vindos do elo-school-default-rtdb)
      "alunos": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "turmas": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "usuarios": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "colaboradores": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "avisos": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "titulos_financeiros": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "audit_logs": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "autorizacoes": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "avisosEspecificos": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "comportamentos": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "GradeHoraria": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "Escola": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "config": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "configuracoes": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "contas_pagar": { /* ... copiar de elo-school-default-rtdb-export.json */ },
      "diario": {},
      "disciplinas": {},
      "fotos": {},
      "frequencia": {},
      "medicamentos": {},
      "mensagens": {},
      "notas": {},
      "periodos": {},
      "planos-aula": {},
      "relatorios-pedagogicos": {},
      "loja_produtos": {}
    }
  }
};

// ====================================
// PASSO A PASSO DA MIGRAÇÃO
// ====================================

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  MIGRAÇÃO MULTI-PROJECT → SINGLE-PROJECT                     ║
╚══════════════════════════════════════════════════════════════╝

📋 CHECKLIST PRÉ-MIGRAÇÃO:

□ 1. Backup do banco "gerenciamento-elo-school" feito
□ 2. Backup do banco "elo-school-default-rtdb" feito  
□ 3. Todos os usuários deslogados do sistema
□ 4. Ambiente de desenvolvimento preparado

─────────────────────────────────────────────────────────────

🔧 ETAPAS DA MIGRAÇÃO:

┌─ ETAPA 1: Preparar Management Database ─────────────────────┐
│                                                               │
│ 1.1. Acessar Firebase Console:                              │
│      https://console.firebase.google.com/                    │
│                                                               │
│ 1.2. Selecionar projeto "elo-school"                        │
│                                                               │
│ 1.3. Database → Realtime Database → Data                    │
│                                                               │
│ 1.4. RENOMEAR nó raiz:                                      │
│      /escolas → /management/escolas                          │
│      /usuarios → /management_usuarios_old (backup)           │
│                                                               │
│ 1.5. CRIAR novo nó:                                         │
│      /management/userSchools                                 │
│      {                                                        │
│        "qD6UucWtcgPC9GHA41OB8rSaghZ2": "-ObZWZIHI1oNnZ5Oss8_",│
│        "LcLXCrhTfIWTfbsRbOjeBA3QlCF3": "-ObZWZIHI1oNnZ5Oss8_",│
│        "WVXDx8LKR0UTSMXCILr8L3BLQxp1": "-ObZHudPDoVkWnCFvkVD",│
│        "mqjh86urO5NJanRO1JMUsfmcGXt1": "-ObZHudPDoVkWnCFvkVD"│
│      }                                                        │
│                                                               │
│ 1.6. CRIAR nó superAdmins:                                  │
│      /management/superAdmins                                 │
│      {                                                        │
│        "qD6UucWtcgPC9GHA41OB8rSaghZ2": true                  │
│      }                                                        │
└───────────────────────────────────────────────────────────────┘

┌─ ETAPA 2: Criar estrutura escolasData ──────────────────────┐
│                                                               │
│ 2.1. CRIAR nó:                                               │
│      /escolasData                                            │
│                                                               │
│ 2.2. CRIAR subnó escola vazia:                              │
│      /escolasData/-ObZHudPDoVkWnCFvkVD                      │
│      {                                                        │
│        "alunos": {},                                          │
│        "turmas": {},                                          │
│        "usuarios": {}                                         │
│      }                                                        │
│                                                               │
│ 2.3. CRIAR subnó escola principal:                          │
│      /escolasData/-ObZWZIHI1oNnZ5Oss8_                      │
│      (deixar vazio por enquanto - vamos copiar depois)       │
└───────────────────────────────────────────────────────────────┘

┌─ ETAPA 3: Copiar dados da escola "Elo Teste" ───────────────┐
│                                                               │
│ 3.1. Acessar banco "elo-school-default-rtdb"                │
│                                                               │
│ 3.2. Exportar nó raiz completo:                             │
│      Three dots → Export JSON                                │
│      (você já tem: elo-school-default-rtdb-export.json)      │
│                                                               │
│ 3.3. Voltar para banco "elo-school" (management)            │
│                                                               │
│ 3.4. Selecionar nó:                                         │
│      /escolasData/-ObZWZIHI1oNnZ5Oss8_                      │
│                                                               │
│ 3.5. Importar JSON:                                          │
│      Three dots → Import JSON                                │
│      Selecionar: elo-school-default-rtdb-export.json         │
│                                                               │
│ RESULTADO: Todos os dados agora estão em                    │
│ /escolasData/-ObZWZIHI1oNnZ5Oss8_/alunos                    │
│ /escolasData/-ObZWZIHI1oNnZ5Oss8_/turmas                    │
│ /escolasData/-ObZWZIHI1oNnZ5Oss8_/usuarios                  │
│ ... etc                                                       │
└───────────────────────────────────────────────────────────────┘

┌─ ETAPA 4: Atualizar Regras de Segurança ────────────────────┐
│                                                               │
│ 4.1. Database → Rules                                        │
│                                                               │
│ 4.2. Substituir por:                                         │

{
  "rules": {
    "management": {
      ".read": "auth != null",
      "escolas": {
        "$escolaId": {
          ".write": "root.child('management/superAdmins/' + auth.uid).exists()"
        }
      },
      "userSchools": {
        "$userId": {
          ".read": "auth.uid === $userId",
          ".write": "auth.uid === $userId || root.child('management/superAdmins/' + auth.uid).exists()"
        }
      },
      "superAdmins": {
        ".read": "root.child('management/superAdmins/' + auth.uid).exists()",
        ".write": false
      }
    },
    "escolasData": {
      "$escolaId": {
        ".read": "root.child('management/userSchools/' + auth.uid).val() === $escolaId || root.child('management/superAdmins/' + auth.uid).exists()",
        ".write": "root.child('management/userSchools/' + auth.uid).val() === $escolaId || root.child('management/superAdmins/' + auth.uid).exists()"
      }
    }
  }
}

│                                                               │
│ 4.3. Publish                                                 │
└───────────────────────────────────────────────────────────────┘

┌─ ETAPA 5: Atualizar Código ─────────────────────────────────┐
│                                                               │
│ Vou gerar os arquivos atualizados para você!                │
└───────────────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────────────

⏱️  TEMPO ESTIMADO: 15-20 minutos

⚠️  IMPORTANTE: 
- Faça isso em horário de baixo uso
- Tenha os backups prontos para rollback
- Teste primeiro com a escola vazia
`);

module.exports = { estruturaFinal };
