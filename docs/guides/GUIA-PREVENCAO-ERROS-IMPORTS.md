# 🛡️ GUIA DE PREVENÇÃO DE ERROS DE IMPORTS

## 🎯 Objetivo
Evitar erros de imports relativos em projetos Next.js com estrutura profunda.

---

## ⚡ VALIDAÇÃO RÁPIDA

### Antes de Testar/Deploy
```bash
cd c:\Users\Mariana\OneDrive\Documentos\Gustavo\ELO
python validate-all-imports.py
```

Se ver:
- ✅ **"Nenhum erro encontrado!"** → Pode prosseguir
- ❌ **"X ERRO(S) ENCONTRADO(S)"** → Corrija antes de continuar

---

## 📐 REGRA DE OURO: CONTAGEM DE BARRAS

### Como Calcular o Caminho Correto

1. **Identifique onde está o arquivo:**
   ```
   src/app/[pasta1]/[pasta2]/[arquivo].jsx
   ```

2. **Conte as barras após `src/`:**
   ```
   src/app/agenda/components/DiarioSection.jsx
          │     │          │
          1     2          3  → 3 barras = ../../../
   ```

3. **Use o mesmo número de `../`:**
   ```javascript
   // 3 barras = ../../../
   import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';
   ```

---

## 📊 TABELA DE REFERÊNCIA RÁPIDA

| Localização do Arquivo | Barras | Caminho para hooks/ | Caminho para components/ |
|------------------------|--------|---------------------|--------------------------|
| `src/app/page.jsx` | 1 | `../hooks/` | `../components/` |
| `src/app/alunos/page.jsx` | 2 | `../../hooks/` | `../../components/` |
| `src/app/components/File.jsx` | 2 | `../../hooks/` | `../../components/` |
| `src/app/agenda/components/File.jsx` | 3 | `../../../hooks/` | `../../../components/` |
| `src/app/components/notas/File.jsx` | 3 | `../../../hooks/` | `../../../components/` |
| `src/app/sala/components/shared/File.jsx` | 4 | `../../../../hooks/` | `../../../../components/` |

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### ❌ Erro: "Module not found: Can't resolve '../../../hooks/useSchoolDatabase'"

**Localização:** `src/app/components/LogsViewer.jsx`

**Problema:** Usando `../../../` (3 níveis) mas deveria ser `../../` (2 níveis)

**Como identificar:**
```
src/app/components/LogsViewer.jsx
   │    │           └─ arquivo
   │    └─ 1 barra
   └─ 2 barras = ../../
```

**Solução:**
```javascript
// ❌ ERRADO
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

// ✅ CORRETO
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
```

---

### ❌ Erro: "Module not found: Can't resolve '../components/LogsViewer'"

**Localização:** `src/app/configuracoes/page.jsx`

**Problema:** Usando `../` (1 nível) mas deveria ser `../../` (2 níveis)

**Como identificar:**
```
src/app/configuracoes/page.jsx
   │    │
   └─ 1 barra
   └─ 2 barras = ../../
```

**Solução:**
```javascript
// ❌ ERRADO
import LogsViewer from '../components/LogsViewer';

// ✅ CORRETO
import LogsViewer from '../../components/LogsViewer';
```

---

## 🔧 FERRAMENTAS DE VALIDAÇÃO

### 1. Validação Completa (Recomendado)
```bash
python validate-all-imports.py
```

**O que faz:**
- Escaneia todos os arquivos `.js` e `.jsx` em `src/app/`
- Valida imports de: hooks, context, components, services, utils
- Mostra todos os erros com sugestões de correção

**Quando usar:**
- Antes de fazer commit
- Depois de adicionar novos arquivos
- Após mover/renomear pastas
- Quando houver erros de build

---

### 2. Validação Simples (useSchoolDatabase apenas)
```bash
python validate-imports.py
```

**O que faz:**
- Valida apenas imports de `useSchoolDatabase`
- Mais rápida que a validação completa

**Quando usar:**
- Verificação rápida após editar arquivos com useSchoolDatabase
- Debug específico de problemas com o hook

---

## 📝 CHECKLIST PRÉ-COMMIT

Antes de fazer commit, execute:

- [ ] `python validate-all-imports.py`
- [ ] Verificar se não há erros reportados
- [ ] Se houver erros, corrigir seguindo as sugestões
- [ ] Executar novamente até ver "✅ Nenhum erro encontrado!"
- [ ] Fazer commit com confiança

---

## 🎨 ALTERNATIVA: IMPORTS ABSOLUTOS

Para evitar problemas de navegação relativa, considere usar imports absolutos.

### Configuração no jsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/hooks/*": ["src/hooks/*"],
      "@/components/*": ["src/components/*"],
      "@/context/*": ["src/context/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"]
    }
  }
}
```

### Uso

```javascript
// Ao invés de:
import { useSchoolDatabase } from '../../../hooks/useSchoolDatabase';

// Use:
import { useSchoolDatabase } from '@/hooks/useSchoolDatabase';
```

**Vantagens:**
- ✅ Caminho sempre igual, independente da localização
- ✅ Mais legível
- ✅ Menos propenso a erros

**Desvantagens:**
- ⚠️ Requer configuração inicial
- ⚠️ Todos os desenvolvedores precisam conhecer os aliases

---

## 🆘 TROUBLESHOOTING

### Problema: Script de validação não funciona
```bash
# Verificar se Python está instalado
python --version

# Se não estiver, instalar Python 3.x
# https://www.python.org/downloads/
```

### Problema: Erros persistem após correção
```bash
# Limpar cache do Next.js
rm -rf .next

# Reinstalar dependências
npm install

# Tentar build novamente
npm run build
```

### Problema: Muitos erros ao mesmo tempo
```bash
# Execute o script e copie os erros
python validate-all-imports.py > erros.txt

# Corrija arquivo por arquivo
# Priorize arquivos mais usados (pages, components principais)
```

---

## 📚 RECURSOS ADICIONAIS

### Documentos de Referência
- `MAPEAMENTO-CAMINHOS-CORRETOS.md` - Mapeamento completo de todos os arquivos
- `RELATORIO-CORRECAO-IMPORTS.md` - Histórico de correções realizadas
- Este arquivo - Guia de uso e prevenção

### Scripts
- `validate-all-imports.py` - Validação completa
- `validate-imports.py` - Validação simples (useSchoolDatabase)

---

## ✅ RESUMO EXECUTIVO

### Para Desenvolvedores
1. **Antes de criar arquivo novo:** Conte as barras após `src/` no caminho
2. **Use a fórmula:** Barras = quantidade de `../`
3. **Sempre valide:** `python validate-all-imports.py` antes de commit

### Para Code Review
1. Verificar se imports seguem o padrão
2. Sugerir uso do script de validação
3. Garantir que não há erros de navegação

### Para CI/CD
Adicionar ao pipeline:
```yaml
- name: Validate Imports
  run: python validate-all-imports.py
```

---

**📌 Mantenha este guia atualizado conforme o projeto evolui!**

**Última atualização:** 15/10/2025
