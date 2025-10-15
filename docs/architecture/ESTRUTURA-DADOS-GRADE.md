# Estrutura de Dados - Grade Horária

## 📊 **Dados Existentes Que Serão Reutilizados:**

### 1. Turmas (já existe)
```javascript
turmas: {
  "id_turma_6a": {
    nome: "6º Ano A",
    status: "ativo",
    turnoId: "Manhã",
    periodoId: "2024_1_xxx"
  }
}
```

### 2. Disciplinas (já existe)
```javascript
disciplinas: {
  "disciplina_matematica": {
    nome: "Matemática"
  }
}
```

### 3. Professores (já existe como usuários)
```javascript
usuarios: {
  "prof_maria_123": {
    nome: "Maria Silva",
    role: "professora",
    disciplinas: ["disciplina_matematica", "disciplina_fisica"]
  }
}
```

## 🆕 **Novas Estruturas a Serem Criadas:**

### 1. Períodos de Aula (configuração da escola)
```javascript
Escola: {
  PeriodosAula: {
    "1h": {
      nome: "1º Horário",
      inicio: "07:30",
      fim: "08:20",
      ordem: 1
    },
    "2h": {
      nome: "2º Horário", 
      inicio: "08:20",
      fim: "09:10",
      ordem: 2
    },
    "recreio": {
      nome: "Recreio",
      inicio: "09:10", 
      fim: "09:30",
      ordem: 3,
      tipo: "intervalo"
    },
    "3h": {
      nome: "3º Horário",
      inicio: "09:30",
      fim: "10:20", 
      ordem: 4
    }
  }
}
```

### 2. Grade Horária (horários das aulas)
```javascript
GradeHoraria: {
  "horario_001": {
    turmaId: "id_turma_6a",
    professorId: "prof_maria_123",
    disciplinaId: "disciplina_matematica", 
    diaSemana: 1, // 1=Segunda, 2=Terça, ..., 5=Sexta
    periodoAula: "1h",
    periodoLetivo: "2024_1_xxx",
    createdAt: "2024-09-26T10:30:00Z",
    createdBy: "coord_123"
  }
}
```

## 🔄 **Relacionamentos:**

### Chave composta única:
- `turmaId + diaSemana + periodoAula` = única aula por slot
- `professorId + diaSemana + periodoAula` = professor não pode estar em dois lugares

### Validações automáticas:
1. **Conflito de Professor**: Mesmo professor não pode ter 2 aulas no mesmo horário
2. **Conflito de Turma**: Turma não pode ter 2 disciplinas no mesmo horário  
3. **Vinculação Professor-Disciplina**: Professor só pode lecionar disciplinas que estão em seu perfil
4. **Período Ativo**: Só pode criar horários para períodos letivos ativos

## 📋 **Exemplo de Grade Completa:**

Para a turma "6º Ano A" na Segunda-feira:
```javascript
[
  {
    id: "horario_001",
    periodoAula: "1h", // 07:30-08:20
    disciplina: "Matemática",
    professor: "Maria Silva"
  },
  {
    id: "horario_002", 
    periodoAula: "2h", // 08:20-09:10
    disciplina: "Português",
    professor: "João Santos"
  },
  {
    periodoAula: "recreio", // 09:10-09:30
    tipo: "intervalo"
  },
  {
    id: "horario_003",
    periodoAula: "3h", // 09:30-10:20 
    disciplina: "História",
    professor: "Ana Costa"
  }
]
```

## 🎯 **Vantagens desta Estrutura:**

✅ **Reutiliza dados existentes** (turmas, disciplinas, professores)  
✅ **Flexível** - fácil de adicionar novos períodos  
✅ **Escalável** - suporta múltiplas turmas e horários  
✅ **Validação automática** de conflitos  
✅ **Auditoria** - quem criou e quando  
✅ **Consistente** com o padrão atual do Firebase

---

*Esta estrutura será implementada gradualmente, mantendo a compatibilidade com o sistema existente.*