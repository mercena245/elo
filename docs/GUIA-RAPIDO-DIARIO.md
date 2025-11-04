# 🚀 Guia Rápido - Diário de Classe

## ✅ Funcionalidade Implementada!

A nova aba **"Diário de Classe"** foi adicionada com sucesso na Sala do Professor!

---

## 📍 Como Acessar

1. Faça login no sistema
2. Acesse **"Sala do Professor"** no menu lateral
3. Clique na aba **"📓 Diário de Classe"** (segunda aba, entre Planejamento e Relatórios)

---

## 🎯 Como Usar (3 Passos)

### Passo 1: Selecione os Filtros
- **Turma**: Escolha a turma desejada
- **Mês/Ano**: Selecione o período (ex: 08/2025)
- **Período Letivo** (opcional): Ano letivo

### Passo 2: Gere o Diário
Clique no botão **"Gerar Diário"**

### Passo 3: Imprima
Clique em **"Imprimir Diário"** ou pressione `Ctrl+P`

---

## 📄 O que Será Gerado?

### 📋 Página 1 - Frequência
```
┌────────────────────────────────┐
│ LOGO + Nome da Escola          │
├────────────────────────────────┤
│ Turma: MATERNAL 1 - MATUTINO  │
│ Professor(a): Nome do Professor│
│ Mês: AGOSTO/2025               │
├────────────────────────────────┤
│ Tabela de Frequência:          │
│ - Alunos (ordem alfabética)    │
│ - Dias do mês (1-31)           │
│ - Marcação "F" para faltas     │
│ - Total de faltas por aluno    │
└────────────────────────────────┘
```

### 📝 Página 2 - Atividades
```
┌────────────────────────────────┐
│ ATIVIDADES DESENVOLVIDAS       │
├─────────┬──────────────────────┤
│  DATA   │ ATIVIDADES           │
├─────────┼──────────────────────┤
│01/08/25 │ ENCONTRO PEDAGÓGICO  │
│         │ 📚 Português         │
│         │ BNCC: EI02EF01...    │
│         │ Objetivos: ...       │
│         │ 📚 Matemática        │
│         │ BNCC: EI02ET01...    │
│         │ Objetivos: ...       │
└─────────┴──────────────────────┘
```

---

## 🔄 Busca Automática de Dados

O sistema busca **automaticamente**:

✅ **Alunos da turma** (somente ativos)  
✅ **Frequências** do mês selecionado  
✅ **Faltas** de cada aluno (calculadas)  
✅ **Planos de aula** do período  
✅ **Disciplinas** ministradas  
✅ **Códigos BNCC** de cada disciplina  
✅ **Objetivos de aprendizagem**  
✅ **Metodologias** aplicadas  
✅ **Professor** responsável pela turma  

---

## 📊 Exemplo Prático

### Cenário: Turma Maternal 1, Agosto/2025

**Alunos**:
- Alice Tedesco Bragança
- Mariah Borba Pereira Bazílio
- Theo Espendião Filemon
- Saulo Barreira F. Silva
- Luciana Tedesco Bragança

**Frequências Registradas**:
- 01/08: Theo faltou (F)
- 05/08: Theo faltou (F)
- 13/08: Mariah faltou (F)

**Planos de Aula**:
- 01/08: Encontro Pedagógico
  - Português: Reconhecimento vogal A (BNCC: EI02EF01)
  - Matemática: Quantificação (BNCC: EI02ET01)
- 04/08: Roda de conversa
  - Linguagem: Coordenação motora fina
- 05/08: Psicomotricidade
  - Educação Física: Traçado da vogal A

**Resultado no Diário**:

Página 1:
```
NOME              | 1 | 4 | 5 |...|31| Faltas
──────────────────┼───┼───┼───┼───┼──┼───────
ALICE TEDESCO     |   |   |   |   |  |   0
LUCIANA TEDESCO   |   |   |   |   |  |   0
MARIAH BORBA      |   |   | F |   |  |   1
SAULO BARREIRA    |   |   |   |   |  |   0
THEO ESPENDIÃO    | F |   | F |   |  |   2
```

Página 2:
```
DATA        | ATIVIDADES DESENVOLVIDAS
────────────┼──────────────────────────
01/08/2025  | ENCONTRO PEDAGÓGICO
            | 
            | 📚 Português
            | BNCC: EI02EF01
            | Objetivos: Reconhecimento da vogal A,
            | coordenação motora fina.
            |
            | 📚 Matemática
            | BNCC: EI02ET01
            | Objetivos: Quantificação, inglês.
────────────┼──────────────────────────
04/08/2025  | Roda de conversa, coordenação
            | motora fina. Quantificação, inglês.
```

---

## 🖨️ Dicas de Impressão

### Configurações Recomendadas:
- **Orientação**: Retrato
- **Tamanho**: A4
- **Margens**: Normal (1cm)
- **Páginas**: Todas
- **Cabeçalhos/Rodapés**: Desativados

### Impressão Perfeita:
1. Clique em "Imprimir Diário"
2. Na janela de impressão:
   - Verifique a pré-visualização
   - Ajuste margens se necessário
   - Confirme que ambas as páginas aparecem
3. Imprimir!

---

## 📱 Funciona em Dispositivos Móveis?

**SIM!** ✅ O layout é totalmente responsivo:

- **Desktop**: Layout completo
- **Tablet**: Tabelas com scroll horizontal
- **Mobile**: Interface adaptada, scroll em tabelas grandes

---

## ❓ FAQ Rápido

**P: Preciso preencher algo manualmente?**  
R: NÃO! Tudo é buscado automaticamente do sistema.

**P: Como marco faltas?**  
R: Use o módulo de Frequência. O diário buscará automaticamente.

**P: E se não tiver plano de aula?**  
R: A página 2 ficará com a mensagem "Nenhum plano registrado".

**P: Posso editar o diário impresso?**  
R: Sim, mas recomenda-se corrigir os dados no sistema e gerar novamente.

**P: Funciona sem internet?**  
R: Não, precisa estar conectado ao Firebase.

**P: Posso salvar em PDF?**  
R: Sim! Na janela de impressão, escolha "Salvar como PDF".

---

## 🎨 Personalização

### Logo da Escola
O logo é buscado de: `/icon.svg`

Para mudar, substitua o arquivo ou edite:
```javascript
<Box component="img" src="/icon.svg" alt="Logo" />
```

### Nome da Escola
Atualmente mostra "ESCOLA". Para personalizar, edite:
```javascript
<Typography variant="h6">NOME DA SUA ESCOLA</Typography>
```

---

## ✅ Checklist de Pré-Requisitos

Antes de gerar o diário, certifique-se:

- [ ] Turma criada e ativa
- [ ] Alunos cadastrados na turma
- [ ] Professor atribuído à turma
- [ ] Frequências registradas no mês
- [ ] Planos de aula criados (com BNCC e objetivos)
- [ ] Período letivo configurado

---

## 🚀 Teste Agora!

1. Acesse: http://localhost:3001
2. Login como Professor
3. Sala do Professor → Diário de Classe
4. Selecione turma e mês
5. Gerar Diário
6. Imprimir!

---

## 📞 Suporte

Problemas ou dúvidas?
1. Verifique os dados cadastrados
2. Confirme as datas corretas
3. Teste com turma diferente
4. Veja a documentação completa em `DIARIO-CLASSE.md`

---

**Status**: ✅ Implementado e funcionando!  
**Servidor**: http://localhost:3001  
**Pronto para usar!** 🎉
