# Implementação de Filtros Turma/Período Mutuamente Exclusivos

## 📋 Resumo das Modificações

Foi implementado um sistema de filtros mutuamente exclusivos entre **Turma** e **Período Letivo** na tela de gerenciamento de alunos, onde é possível filtrar por um ou outro, mas não pelos dois simultaneamente, evitando conflitos de dados entre períodos.

## 🔄 **Lógica de Filtros Mutuamente Exclusivos**

### **Comportamento Implementado:**
- **Seleção de Turma**: Desabilita o seletor de período letivo
- **Seleção de Período Letivo**: Desabilita o seletor de turma  
- **Limpeza Automática**: Quando um é selecionado, o outro é automaticamente limpo

### **Opções de Visualização:**
1. **Por Turma Específica**: Mostra apenas alunos da turma selecionada
2. **Por Período Letivo**: Mostra alunos de todas as turmas daquele período
3. **Todos os Alunos**: Opção "Todos" no seletor de turmas

## 🎯 **Componentes Implementados**

### **1. Seletor de Período Letivo**
- **Componente**: `SeletorPeriodoLetivo`
- **Localização**: Ao lado do seletor de turmas
- **Fonte de Dados**: `Escola/Periodo` no Firebase
- **Funcionalidades**:
  - Carrega períodos letivos do banco de dados
  - Ordena por ano/período (mais recente primeiro)
  - Mostra status (Ativo/Inativo/Finalizado)
  - Formatação automática: "2025 - 1º Período"

### **2. Filtros de Busca Mantidos**
- Nome do Aluno
- Matrícula  
- Nome do Pai
- Nome da Mãe
- CPF
- ~~Período Letivo~~ (removido dos filtros, agora é seletor principal)

## 🔧 **Implementação Técnica**

### **Estados Adicionados**
```javascript
const [periodoLetivoSelecionado, setPeriodoLetivoSelecionado] = useState('');
```

### **Funções de Controle**
```javascript
// Limpa período quando turma é selecionada
const handleTurmaChange = (value) => {
  setTurmaSelecionada(value);
  if (value) {
    setPeriodoLetivoSelecionado('');
  }
};

// Limpa turma quando período é selecionado  
const handlePeriodoLetivoChange = (value) => {
  setPeriodoLetivoSelecionado(value);
  if (value) {
    setTurmaSelecionada('');
  }
};
```

### **Lógica de Filtros Atualizada**
```javascript
const alunosFiltrados = (() => {
  let alunosBase = [];
  
  if (periodoLetivoSelecionado) {
    // Filtra por período letivo - busca turmas que têm esse período
    alunosBase = alunos.filter(aluno => {
      const turma = turmas[aluno.turmaId];
      return turma?.periodoId === periodoLetivoSelecionado;
    });
  } else if (turmaSelecionada === 'todos') {
    alunosBase = alunos;
  } else if (turmaSelecionada) {
    alunosBase = alunos.filter(aluno => aluno.turmaId === turmaSelecionada);
  } else {
    return [];
  }
  
  // Aplica filtros de busca nos alunos já filtrados
  return alunosBase.filter(aluno => /* filtros de busca */);
})();
```

## 📊 **Estrutura de Dados Necessária**

### **Turmas**
```javascript
{
  nome: "4º Ano A",
  periodo: "meio-periodo",
  periodoId: "2025_1_periodo" // Chave que conecta com período letivo
}
```

### **Períodos Letivos** 
```javascript
// Caminho: Escola/Periodo/{periodoId}
{
  ano: 2025,
  periodo: 1,
  dataInicio: "2025-02-01",
  dataFim: "2025-06-30", 
  ativo: true
}
```

## 🎨 **Interface Atualizada**

### **Layout dos Seletores**
```
[Turma ▼] [Período Letivo ▼] [Nome] [Matrícula] [Pai] [Mãe] [CPF] [Limpar Filtros]
```

### **Estados Visuais**
- **Desabilitado**: Seletor fica cinza quando o outro está ativo
- **Ativo**: Bordas azuis com hover effects
- **Responsivo**: Adapta-se a mobile e desktop

### **Condições de Habilitação**
- **Filtros de busca**: Habilitados quando turma OU período está selecionado
- **Botão Limpar**: Habilitado quando há filtros ativos e turma/período selecionado

## 🔍 **Casos de Uso**

### **1. Busca por Período Letivo**
```
Usuário seleciona: "2025 - 1º Período"
→ Sistema mostra: Todos os alunos de todas as turmas deste período
→ Seletor de turma: Desabilitado
```

### **2. Busca por Turma Específica**  
```
Usuário seleciona: "4º Ano A" 
→ Sistema mostra: Apenas alunos da turma 4º Ano A
→ Seletor de período: Desabilitado
```

### **3. Visualização Geral**
```
Usuário seleciona: "Todos" (em turmas)
→ Sistema mostra: Todos os alunos de todas as turmas
→ Seletor de período: Desabilitado
```

## ⚠️ **Prevenção de Conflitos**

### **Problema Evitado**
Antes: Usuário poderia selecionar "Turma 2024" + "Período 2025" 
→ Resultava em dados inconsistentes ou vazios

### **Solução Implementada**  
Agora: Seletores mutuamente exclusivos
→ Garante consistência temporal dos dados

## 📈 **Performance e Build**

- **Build Size**: Aumento mínimo (91.2kB → 92.2kB)
- **Componente Reutilizado**: `SeletorPeriodoLetivo` já existente no sistema
- **Build Status**: ✅ Compilação bem-sucedida sem erros

## 🚀 **Benefícios Implementados**

1. **Consistência Temporal**: Evita conflitos entre dados de períodos diferentes
2. **UX Intuitiva**: Interface clara sobre quais opções estão disponíveis  
3. **Flexibilidade**: Permite visualização por turma específica ou período completo
4. **Performance**: Filtros otimizados com base na seleção principal
5. **Reutilização**: Aproveitamento de componentes existentes do sistema

## ✅ **Status da Implementação**

- ✅ Seletores mutuamente exclusivos funcionando
- ✅ Integração com `SeletorPeriodoLetivo` existente  
- ✅ Filtros de busca mantidos e funcionais
- ✅ Interface responsiva atualizada
- ✅ Build e testes aprovados
- ✅ Prevenção de conflitos implementada

---

**Data da implementação**: 6 de novembro de 2025  
**Arquivo modificado**: `src/app/alunos/page.jsx`  
**Componente reutilizado**: `src/app/components/shared/SeletorPeriodoLetivo.jsx`