# Mapeamento Correto de Caminhos - useSchoolDatabase

## 📐 Regra de Cálculo

Hook está em: `src/hooks/useSchoolDatabase.js`

Para calcular o caminho relativo:
1. Conte quantos níveis precisa subir de onde o arquivo está até `src/`
2. Adicione `hooks/useSchoolDatabase`

## ✅ Mapeamento Correto por Localização

### 📁 src/app/[rota]/page.jsx (2 níveis até src/)
**Caminho correto: `../../hooks/useSchoolDatabase`**
- ✅ src/app/avisos/page.jsx
- ✅ src/app/colaboradores/page.jsx
- ✅ src/app/alunos/page.jsx
- ✅ src/app/galeriafotos/page.jsx
- ✅ src/app/turma-filho/page.jsx
- ✅ src/app/notas-frequencia/page.jsx
- ✅ src/app/configuracoes/page.jsx
- ✅ src/app/financeiro/page.jsx
- ✅ src/app/escola/page.jsx
- ✅ src/app/loja/page.jsx
- ✅ src/app/grade-horaria/page.jsx
- ✅ src/app/secretaria-digital/page.jsx
- ✅ src/app/dashboard/page.jsx
- ✅ src/app/agenda/page.jsx

### 📁 src/app/components/[arquivo].jsx (2 níveis até src/)
**Caminho correto: `../../hooks/useSchoolDatabase`**
- ❌ src/app/components/LogsViewer.jsx (ERRO: usando ../../../)
- ✅ src/app/components/ExemploUsoSchoolDatabase.jsx (usando ../../../, mas pode estar correto se for exemplo)

### 📁 src/app/components/[subpasta]/[arquivo].jsx (3 níveis até src/)
**Caminho correto: `../../../hooks/useSchoolDatabase`**
- ✅ src/app/components/impressoes/Impressoes.jsx
- ✅ src/app/components/notas-frequencia/LancamentoNotas.jsx
- ✅ src/app/components/notas-frequencia/RegistroFaltas.jsx
- ✅ src/app/components/notas-frequencia/BoletimAluno.jsx
- ✅ src/app/components/notas-frequencia/ConsultaBoletim.jsx
- ✅ src/app/components/grade-horaria/ConfigPeriodosAula.jsx
- ✅ src/app/components/grade-horaria/GradeVisualizador.jsx
- ✅ src/app/components/grade-horaria/ModalHorario.jsx
- ✅ src/app/components/grade-horaria/RelatoriosGrade.jsx
- ✅ src/app/components/shared/SeletorPeriodoLetivo.jsx

### 📁 src/app/[rota]/components/[arquivo].jsx (3 níveis até src/)
**Caminho correto: `../../../hooks/useSchoolDatabase`**
- ✅ src/app/agenda/components/DiarioSection.jsx
- ✅ src/app/agenda/components/MensagensSection.jsx
- ✅ src/app/agenda/components/ComportamentosSection.jsx
- ✅ src/app/agenda/components/AgendaMedicaSection.jsx
- ✅ src/app/agenda/components/AvisosEspecificosSection.jsx
- ✅ src/app/agenda/components/AutorizacoesSection.jsx
- ✅ src/app/sala-professor/components/BibliotecaMateriais.jsx
- ✅ src/app/sala-professor/components/CronogramaAcademico.jsx
- ✅ src/app/sala-professor/components/PlanejamentoAulas.jsx
- ✅ src/app/sala-professor/components/SeletorTurmaAluno.jsx
- ✅ src/app/sala-professor/components/RelatoriosPedagogicos.jsx

### 📁 src/app/[rota]/components/shared/[arquivo].jsx (4 níveis até src/)
**Caminho correto: `../../../../hooks/useSchoolDatabase`**
- ✅ src/app/sala-professor/components/shared/CalendarioGrade.jsx
- ✅ src/app/sala-professor/components/shared/EditorPlanoAula.jsx

### 📁 src/hooks/[arquivo].js (0 níveis - mesmo diretório)
**Caminho correto: `./useSchoolDatabase`**
- ✅ src/hooks/useSchoolServices.js

## 🔴 Arquivos COM ERRO que precisam correção

1. **src/app/components/LogsViewer.jsx**
   - ❌ Atual: `import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';`
   - ✅ Correto: `import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';`

## 📝 Regra Simples

```
Localização do arquivo          | Níveis | Caminho correto
--------------------------------|--------|------------------
src/app/[rota]/page.jsx         | 2      | ../../hooks/
src/app/components/[file].jsx   | 2      | ../../hooks/
src/app/[pasta]/[sub]/file.jsx  | 3      | ../../../hooks/
src/app/[p]/[s]/[ss]/file.jsx   | 4      | ../../../../hooks/
```

## ✅ Validação

Para validar se um caminho está correto:
1. Conte as barras no caminho do arquivo após `src/`
2. Use o mesmo número de `../`
3. Adicione `hooks/useSchoolDatabase`

Exemplo:
- `src/app/components/LogsViewer.jsx` = 2 barras após src/ = `../../hooks/`
- `src/app/agenda/components/DiarioSection.jsx` = 3 barras após src/ = `../../../hooks/`
