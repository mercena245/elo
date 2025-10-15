# 📦 Como Importar Estrutura Base para Escola Teste

## 🎯 Objetivo
Importar a estrutura básica (esqueleto) do banco de dados para uma escola nova, sem dados de alunos, professores ou registros antigos.

---

## 📁 Arquivo Criado
**`estrutura-base-escola-vazia.json`**

Este arquivo contém:
- ✅ Estrutura completa de todos os nós do banco
- ✅ Exemplos de configuração básica
- ✅ Turnos pré-configurados (Manhã, Tarde, Integral)
- ✅ Disciplinas exemplo (Matemática, Português)
- ✅ Configurações iniciais da escola
- ❌ **SEM** alunos reais
- ❌ **SEM** colaboradores reais
- ❌ **SEM** dados históricos

---

## 🚀 Passo a Passo da Importação

### **Opção 1: Importar no Projeto "elo-teste" (Multi-Project)**

#### 1. Acessar Firebase Console
```
https://console.firebase.google.com/
```

#### 2. Selecionar o projeto
- Clicar em **"elo-teste"** (ou o projeto da escola teste)

#### 3. Acessar Realtime Database
- Menu lateral → **Realtime Database**

#### 4. Verificar se o banco está vazio
- Se houver dados, fazer backup primeiro!
- Three dots (⋮) → **Export JSON** → Salvar backup

#### 5. Importar estrutura
- Selecionar o **nó raiz** (/)
- Three dots (⋮) → **Import JSON**
- Selecionar arquivo: `estrutura-base-escola-vazia.json`
- ⚠️ **ATENÇÃO:** Marcar opção **"Merge"** se quiser manter dados existentes
- Clicar em **Import**

#### 6. Aguardar conclusão
- Pode levar alguns segundos dependendo do tamanho

#### 7. Validar importação
- Navegar pelos nós e verificar se a estrutura foi criada
- Verificar nós principais:
  - `/alunos` (deve estar vazio {})
  - `/turmas` (deve ter "exemplo_turma")
  - `/colaboradores` (deve ter "exemplo")
  - `/config` (deve ter devPassword)
  - `/turnos` (deve ter manhã, tarde, integral)

---

### **Opção 2: Importar no Single-Project (Recomendado para Futuro)**

Se você já migrou para single-project:

#### 1. Acessar Firebase Console do projeto principal
```
https://console.firebase.google.com/
Projeto: elo-school
```

#### 2. Navegar até o nó da escola
```
/escolasData/-ObZHudPDoVkWnCFvkVD/
```
(Use o ID da escola teste)

#### 3. Importar estrutura
- Selecionar o nó `/escolasData/-ObZHudPDoVkWnCFvkVD/`
- Three dots (⋮) → **Import JSON**
- Selecionar arquivo: `estrutura-base-escola-vazia.json`
- Importar

---

## 🔧 Configurações Pós-Importação

### 1. Atualizar informações da escola
Editar o nó `/configuracoes/escola/`:
```json
{
  "nome": "Nome Real da Escola Teste",
  "cnpj": "00.000.000/0001-00",
  "telefone": "(62) 98492-8016",
  "email": "escola@teste.com",
  "endereco": "Rua Exemplo, 123 - Cidade/UF"
}
```

### 2. Criar primeiro usuário coordenador
Editar o nó `/usuarios/`:
```json
{
  "UID_DO_USUARIO": {
    "nome": "Coordenador Teste",
    "email": "coord@teste.com",
    "role": "coordenadora",
    "ativo": true,
    "dataCriacao": "2025-10-15T00:00:00.000Z"
  }
}
```

**⚠️ IMPORTANTE:** Substitua `UID_DO_USUARIO` pelo UID real do Firebase Auth!

### 3. Remover dados de exemplo (opcional)
Depois de criar dados reais, você pode excluir:
- `/colaboradores/exemplo`
- `/turmas/exemplo_turma`
- `/disciplinas/exemplo_*`
- `/periodos/exemplo_2025`
- `/Escola/PeriodosAula/exemplo`

---

## 🔐 Regras de Segurança

### Para Multi-Project (Temporário)
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### Para Single-Project (Definitivo)
```json
{
  "rules": {
    "management": {
      ".read": "auth != null",
      "escolas": {
        "$escolaId": {
          ".write": "root.child('management/superAdmins/' + auth.uid).exists()"
        }
      }
    },
    "escolasData": {
      "$escolaId": {
        ".read": "root.child('management/userSchools/' + auth.uid).val() === $escolaId",
        ".write": "root.child('management/userSchools/' + auth.uid).val() === $escolaId"
      }
    }
  }
}
```

---

## ✅ Checklist de Validação

Após importar, verifique:

- [ ] Estrutura completa criada (todos os nós principais existem)
- [ ] Nó `/config/devPassword` existe
- [ ] Nó `/turnos` tem manhã, tarde, integral
- [ ] Nó `/disciplinas` tem exemplos básicos
- [ ] Nó `/configuracoes/escola` tem estrutura básica
- [ ] Nós de dados (`/alunos`, `/turmas`, etc) estão vazios ou com exemplos
- [ ] Consegue fazer login e acessar o sistema
- [ ] Dashboard carrega sem erros
- [ ] Consegue criar novo aluno de teste
- [ ] Consegue criar nova turma

---

## 🚨 Troubleshooting

### Erro: "Permission Denied" após importação
**Causa:** Regras de segurança muito restritivas

**Solução:**
1. Database → Rules
2. Temporariamente usar:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
3. Testar
4. Depois ajustar regras específicas

### Erro: "Data already exists"
**Causa:** Nó já tem dados

**Solução:**
1. Fazer backup dos dados existentes
2. Excluir nó manualmente
3. Importar novamente
4. Ou usar opção "Merge" na importação

### Estrutura não aparece completamente
**Causa:** Importação não concluída

**Solução:**
1. Verificar console do navegador
2. Tentar importar novamente
3. Dividir importação em partes menores se necessário

---

## 📊 Estrutura Completa Criada

```
/
├── Escola/
│   ├── Periodo/
│   └── PeriodosAula/
├── GradeHoraria/
├── alunos/                      ← VAZIO
├── audit_logs/                  ← VAZIO
├── autorizacoes/               ← VAZIO
├── avisos/                     ← VAZIO
├── avisosEspecificos/          ← VAZIO
├── colaboradores/              ← 1 exemplo
├── comportamentos/             ← VAZIO
├── config/                     ← devPassword
├── configuracoes/              ← Dados da escola
├── contas_pagar/               ← VAZIO
├── contas_pagas/               ← VAZIO
├── diario/                     ← VAZIO
├── disciplinas/                ← 2 exemplos
├── fotos/                      ← VAZIO
├── frequencia/                 ← VAZIO
├── historicoMedicacao/         ← VAZIO
├── historico_creditos/         ← VAZIO (array)
├── loja_produtos/              ← VAZIO
├── medicamentos/               ← VAZIO
├── mensagens/                  ← VAZIO
├── notas/                      ← VAZIO
├── periodos/                   ← 1 exemplo
├── planos-aula/                ← VAZIO
├── relatorios-pedagogicos/     ← VAZIO
├── titulos_financeiros/        ← VAZIO
├── turmas/                     ← 1 exemplo
├── turnos/                     ← 3 turnos pré-configurados
└── usuarios/                   ← VAZIO
```

---

## 🎯 Próximo Passo

Após importar a estrutura:
1. Criar primeiro usuário coordenador no Firebase Auth
2. Adicionar UID do usuário em `/usuarios/`
3. Vincular usuário à escola em `/management/userSchools/`
4. Fazer login e começar a usar!

---

**Arquivo:** `estrutura-base-escola-vazia.json`  
**Tamanho:** ~2 KB (muito leve!)  
**Criado em:** 15 de outubro de 2025  
**Versão:** 1.0
