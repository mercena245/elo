# 📓 Diário de Classe - Documentação

## 📋 Visão Geral

O **Diário de Classe** é uma funcionalidade completa para geração e impressão de diários de classe seguindo padrões educacionais. Localizado na **Sala do Professor**, entre as abas "Planejamento" e "Relatórios".

---

## 🎯 Funcionalidades

### ✅ Página 1 - Frequência
- ✅ Listagem de todos os alunos da turma (ordenados alfabeticamente)
- ✅ Grid de frequência por dia do mês
- ✅ Marcação automática de faltas (F)
- ✅ Contagem total de faltas por aluno
- ✅ Informações da turma, professor, período letivo
- ✅ Cabeçalho com logo da escola
- ✅ Campos para assinaturas (Professor, Coordenador, Secretária)

### ✅ Página 2 - Atividades Desenvolvidas
- ✅ Listagem de atividades por data
- ✅ Busca automática dos planos de aula
- ✅ Exibição de disciplinas ministradas
- ✅ Códigos da BNCC de cada disciplina
- ✅ Objetivos de aprendizagem
- ✅ Metodologias aplicadas
- ✅ Campos para assinaturas

---

## 🔧 Como Usar

### 1️⃣ Acessar o Diário

```
Sala do Professor → Aba "Diário de Classe"
```

### 2️⃣ Aplicar Filtros

**Campos Obrigatórios:**
- **Turma**: Selecione a turma desejada
- **Mês/Ano**: Escolha o período (formato: YYYY-MM)

**Campos Opcionais:**
- **Período Letivo**: Filtra pelo ano letivo específico
- **Professor**: Automaticamente detectado da turma

### 3️⃣ Gerar Diário

Clique em **"Gerar Diário"** após preencher os filtros.

O sistema irá:
1. Buscar alunos ativos da turma
2. Carregar frequências do mês
3. Buscar planos de aula do período
4. Calcular faltas automaticamente
5. Organizar atividades por data

### 4️⃣ Imprimir

Clique em **"Imprimir Diário"** ou use `Ctrl+P`.

As duas páginas serão impressas em sequência:
- Página 1: Frequência
- Página 2: Atividades

---

## 📊 Estrutura de Dados

### Frequências
```javascript
{
  turmaId: "turma123",
  data: "2025-08-15",
  presencas: {
    "aluno1": true,
    "aluno2": false,  // Falta
    "aluno3": true
  }
}
```

### Planos de Aula
```javascript
{
  turmaId: "turma123",
  data: "2025-08-15",
  tema: "Encontro Pedagógico",
  disciplinas: [
    {
      nome: "Português",
      habilidadesBNCC: [
        { codigo: "EI02EF01" },
        { codigo: "EI02EF02" }
      ],
      objetivos: "Reconhecimento da vogal A..."
    },
    {
      nome: "Matemática",
      habilidadesBNCC: [
        { codigo: "EI02ET01" }
      ],
      objetivos: "Quantificação e contagem..."
    }
  ]
}
```

---

## 🎨 Layout de Impressão

### Página 1 - Frequência

```
┌─────────────────────────────────────┐
│          [LOGO DA ESCOLA]           │
│             ESCOLA                   │
├─────────────────────────────────────┤
│ Etapa: EDUCAÇÃO INFANTIL            │
│ Turma: MATERNAL 1  Turno: MATUTINO │
│ Professor: Nome do Professor         │
│ Mês: AGOSTO/2025                     │
├─────────────────────────────────────┤
│ NOME          │1│2│3│...│31│ Faltas│
├───────────────┼─┼─┼─┼───┼──┼───────┤
│ ALICE BRAGA   │ │ │F│...│  │   1   │
│ MARIAH BORBA  │ │ │ │...│  │   0   │
│ THEO FILEMON  │F│F│F│...│F │   6   │
└─────────────────────────────────────┘

Assinaturas:
_____________  _____________  _____________
  Professor    Coordenador    Secretária
```

### Página 2 - Atividades

```
┌─────────────────────────────────────┐
│     ATIVIDADES DESENVOLVIDAS        │
│        AGOSTO/2025                   │
├──────────┬──────────────────────────┤
│   DATA   │  ATIVIDADES              │
├──────────┼──────────────────────────┤
│01/08/2025│ ENCONTRO PEDAGÓGICO      │
│          │                           │
│          │ 📚 Português              │
│          │ BNCC: EI02EF01, EI02EF02 │
│          │ Objetivos: Reconhecer...  │
│          │                           │
│          │ 📚 Matemática             │
│          │ BNCC: EI02ET01           │
│          │ Objetivos: Quantificar... │
├──────────┼──────────────────────────┤
│04/08/2025│ Roda de conversa...      │
└──────────┴──────────────────────────┘
```

---

## 🔍 Detalhes Técnicos

### Busca Automática de Dados

```javascript
// 1. Alunos da turma (ativos)
alunos.filter(a => 
  a.turmaId === turmaSelecionada && 
  a.status === 'ativo'
)

// 2. Frequências do mês
frequencias.filter(f => 
  f.turmaId === turmaSelecionada &&
  dayjs(f.data).format('YYYY-MM') === mesAno
)

// 3. Planos de aula
planos.filter(p => 
  p.turmaId === turmaSelecionada &&
  dayjs(p.data).format('YYYY-MM') === mesAno
)
```

### Cálculo de Faltas

```javascript
frequencias.filter(f => 
  f.presencas && 
  f.presencas[alunoId] === false
).length
```

### Formatação de Atividades

```javascript
// Para cada plano de aula:
plano.disciplinas.map(disc => ({
  nome: disc.nome,
  bncc: disc.habilidadesBNCC.map(h => h.codigo).join(', '),
  objetivos: disc.objetivos
}))
```

---

## 📱 Responsividade

### Desktop (≥960px)
- Layout completo em duas colunas
- Tabelas com largura total
- Filtros expandidos

### Tablet (600-960px)
- Layout adaptado
- Tabelas scrolláveis horizontalmente
- Filtros em grid 2 colunas

### Mobile (<600px)
- Layout em coluna única
- Tabelas com scroll horizontal
- Filtros empilhados
- Texto e botões redimensionados

---

## 🖨️ Configurações de Impressão

### CSS de Impressão

```css
@media print {
  /* Ocultar filtros e navegação */
  .no-print { display: none !important; }
  
  /* Página A4 retrato */
  @page {
    size: A4 portrait;
    margin: 1cm;
  }
  
  /* Quebra de página entre páginas */
  .page-1 { page-break-after: always; }
  
  /* Bordas das tabelas */
  table { border-collapse: collapse; }
  td, th { border: 1px solid #000; }
}
```

---

## ✨ Melhorias Futuras

### Curto Prazo
- [ ] Exportação para PDF
- [ ] Envio por email
- [ ] Histórico de diários gerados
- [ ] Observações personalizadas por aluno

### Médio Prazo
- [ ] Diário anual (todos os meses)
- [ ] Comparativo de frequência
- [ ] Gráficos de participação
- [ ] Integração com relatórios

### Longo Prazo
- [ ] Assinatura digital
- [ ] QR Code de verificação
- [ ] Backup automático na nuvem
- [ ] App mobile específico

---

## 🐛 Troubleshooting

### Problema: Diário vazio
**Causa**: Sem planos de aula ou frequências registradas  
**Solução**: Registre planos e frequências antes de gerar o diário

### Problema: Alunos não aparecem
**Causa**: Alunos inativos ou sem turma associada  
**Solução**: Verifique status dos alunos na gestão de alunos

### Problema: Faltas erradas
**Causa**: Frequências não salvas corretamente  
**Solução**: Registre presença/falta no módulo de frequência

### Problema: Atividades sem BNCC
**Causa**: Plano de aula sem códigos BNCC preenchidos  
**Solução**: Edite o plano e adicione habilidades BNCC

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se todos os dados estão cadastrados
2. Confirme que a turma está ativa
3. Valide o período letivo selecionado
4. Teste com mês diferente

---

**Criado em**: 3 de novembro de 2025  
**Versão**: 1.0.0  
**Status**: ✅ Funcional e pronto para uso
