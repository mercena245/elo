# Sistema de Grade Horária - Plano de Implementação

## 1. Estruturas de Dados

### Períodos de Aula (Configuração da Escola)
```javascript
periodosAula: {
  "1h": { nome: "1º Horário", inicio: "07:30", fim: "08:20" },
  "2h": { nome: "2º Horário", inicio: "08:20", fim: "09:10" },
  "recreio": { nome: "Recreio", inicio: "09:10", fim: "09:30", tipo: "intervalo" },
  "3h": { nome: "3º Horário", inicio: "09:30", fim: "10:20" },
  "4h": { nome: "4º Horário", inicio: "10:20", fim: "11:10" },
  "5h": { nome: "5º Horário", inicio: "11:10", fim: "12:00" }
}
```

### Horários das Aulas
```javascript
horarios: {
  "horario_001": {
    turmaId: "id_turma_6a",
    professorId: "prof_maria_123", 
    disciplinaId: "disciplina_matematica",
    diaSemana: 1, // Segunda-feira
    periodoAula: "1h",
    periodoLetivo: "2024_1_xxx",
    observacoes: "" // opcional
  }
}
```

## 2. Componentes Sugeridos

### GradeHorarios/
```
├── GradeHorariosCard.jsx       // Card principal no GestaoEscolarCard
├── GradeVisualizador.jsx       // Visualização tipo planilha
├── AulaEditor.jsx              // Modal para criar/editar aula
├── ConfigPeriodos.jsx          // Configurar horários da escola
├── ValidadorConflitos.js       // Helper para validar conflitos
└── gradeHelpers.js            // Utilitários
```

## 3. Funcionalidades

### 3.1 Configuração Inicial
- [ ] Cadastrar períodos de aula da escola (1º, 2º, recreio, etc.)
- [ ] Definir dias letivos (seg-sex, incluir sábado?)

### 3.2 Montagem da Grade
- [ ] Selecionar turma para montar grade
- [ ] Arrastar disciplinas para slots de horário
- [ ] Atribuir professor para cada aula
- [ ] Validação automática de conflitos

### 3.3 Validações
- [ ] Professor não pode ter 2 aulas no mesmo horário
- [ ] Turma não pode ter 2 disciplinas no mesmo horário  
- [ ] Respeitar carga horária da disciplina
- [ ] Verificar disponibilidade do professor

### 3.4 Visualização
- [ ] Grade visual (planilha)
- [ ] Cores por disciplina
- [ ] Filtros: turma, professor, dia
- [ ] Imprimir/exportar grade

## 4. Fluxo de Uso

### Para Coordenadora:
1. **Configurar** → Definir horários dos períodos de aula
2. **Disciplinas** → Criar/editar disciplinas com carga horária
3. **Professores** → Vincular professores a disciplinas  
4. **Montar Grade** → Arrastar disciplinas para horários
5. **Validar** → Sistema avisa sobre conflitos
6. **Salvar** → Grade aprovada e salva

### Para Professor:
1. **Visualizar** → Ver sua grade de horários
2. **Filtrar** → Por turma que leciona
3. **Imprimir** → Grade para levar para aula

## 5. Exemplo de Interface

```
┌─────────────────── GRADE HORÁRIA - 6º ANO A ───────────────────┐
│                                                                 │
│  Período │ Segunda │ Terça   │ Quarta  │ Quinta  │ Sexta      │
│  ──────────────────────────────────────────────────────────── │
│  1º H    │ MAT     │ PORT    │ MAT     │ HIST    │ ED.FÍSICA  │
│  07:30   │ Prof.A  │ Prof.B  │ Prof.A  │ Prof.C  │ Prof.D     │
│  ──────────────────────────────────────────────────────────── │
│  2º H    │ PORT    │ MAT     │ CIÊNC   │ GEOG    │ INGLÊS     │
│  08:20   │ Prof.B  │ Prof.A  │ Prof.E  │ Prof.F  │ Prof.G     │
│  ──────────────────────────────────────────────────────────── │
│  RECREIO │         │         │         │         │            │
│  09:10   │    🍎 INTERVALO PARA LANCHE 🍎                     │
│  ──────────────────────────────────────────────────────────── │
│  3º H    │ HIST    │ CIÊNC   │ PORT    │ MAT     │ ARTE       │
│  09:30   │ Prof.C  │ Prof.E  │ Prof.B  │ Prof.A  │ Prof.H     │
└─────────────────────────────────────────────────────────────────┘

[🎯 Nova Aula] [📋 Imprimir] [⚙️ Configurar Períodos]
```

## 6. Benefícios

### Para a Escola:
✅ Organização visual da grade  
✅ Controle automático de conflitos  
✅ Fácil reorganização quando necessário  
✅ Histórico de alterações  

### Para Professores:
✅ Visualização clara dos horários  
✅ Grade personalizada por professor  
✅ Impressão para sala de aula  

### Para Coordenação:
✅ Visão geral de todas as turmas  
✅ Controle de carga horária  
✅ Relatórios de ocupação  

## 7. Próximos Passos

1. **Criar estrutura de dados** no Firebase
2. **Implementar ConfigPeriodos** (horários da escola)  
3. **Criar GradeVisualizador** (interface visual)
4. **Desenvolver validações** de conflito
5. **Integrar com sistema** existente
6. **Testes** e refinamentos

---
*Este é um esboço inicial. Ajuste conforme as necessidades específicas da escola.*