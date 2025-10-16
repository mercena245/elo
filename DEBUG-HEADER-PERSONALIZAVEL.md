# 🔍 Verificação e Troubleshooting - Header Personalizável

## Status da Implementação

### ✅ Arquivos Criados
- `src/components/SchoolHeader.jsx` - Header personalizável
- `src/components/HeaderSettingsDialog.jsx` - Modal de configuração
- `src/hooks/useSchoolStorage.js` - Hook para upload de imagens

### ✅ Arquivos Modificados
- `src/app/dashboard/page.jsx` - Integração do novo header

---

## 🔍 Checklist de Verificação

### 1. Verificar Role do Usuário

**O que verificar:**
```
Abra o console do navegador (F12) e procure por:
🎯 [Dashboard] userRole: coordenadora
```

**Problema**: Botão de Settings não aparece
**Causa provável**: userRole não está como 'coordenadora' ou 'coordenador'

**Solução**:
1. Verifique no console qual é o userRole atual
2. Vá para `src/hooks/useAuthUser.js` ou `src/context/AuthContext.jsx`
3. Certifique-se de que o Super Admin está recebendo role 'coordenadora'

### 2. Verificar Escola Selecionada

**O que verificar:**
```
Console deve mostrar:
🎯 [Dashboard] currentSchool: Nome da Escola
```

**Problema**: "Nenhuma escola selecionada"
**Solução**:
1. Use o SchoolSelector no header
2. Selecione uma escola do dropdown

### 3. Verificar Conexão com Banco

**O que verificar:**
```
No modal de configurações, deve aparecer:
Debug: isReady: ✅ | Banco: Conectado
```

**Problema**: isReady: ❌
**Solução**:
1. Aguarde alguns segundos
2. Verifique no console se há erros de conexão
3. Verifique se a escola tem `databaseURL` configurada

### 4. Verificar Storage

**O que verificar:**
```
Ao fazer upload, console deve mostrar:
📤 [HeaderSettings] Fazendo upload do logo...
✅ [HeaderSettings] Logo uploaded! URL: https://...
```

**Problema**: Erro ao fazer upload
**Soluções**:
- Verifique se a escola tem `storageBucket` configurado
- Verifique se as regras do Storage estão abertas
- Verifique o tamanho do arquivo (máx 5MB para logo, 10MB para background)

---

## 🧪 Testes Passo a Passo

### Teste 1: Botão de Settings Aparece?

1. Faça login como coordenadora
2. Vá para o dashboard
3. Olhe no canto superior direito do header
4. **Deve aparecer**: Ícone de engrenagem (⚙️)

**Se não aparecer**:
- Abra console (F12)
- Verifique: `🎯 [Dashboard] userRole: ???`
- O role deve ser `coordenadora` ou `coordenador`
- **Chip temporário**: No header deve aparecer um chip pequeno mostrando "Role: coordenadora"

### Teste 2: Modal Abre?

1. Clique no botão ⚙️
2. Console deve mostrar: `⚙️ [SchoolHeader] Abrindo configurações...`
3. Modal deve abrir com 3 abas

**Se não abrir**:
- Verifique se há erros no console
- Verifique se `onOpenSettings` está definido no dashboard

### Teste 3: Salvar Funciona?

1. No modal, mude alguma cor
2. Clique em "Salvar Alterações"
3. Console deve mostrar:
   ```
   💾 [HeaderSettings] Iniciando salvamento...
   💾 [HeaderSettings] Salvando em: configuracoes/header
   ✅ [HeaderSettings] Header config salvo!
   ```

**Se não salvar**:
- Verifique se isReady está ✅
- Verifique se há permissões no banco de dados
- Verifique se as regras estão abertas (desenvolvimento)

### Teste 4: Upload de Logo

1. Aba "🖼️ Imagens"
2. Clique em "Enviar Logo"
3. Selecione uma imagem (PNG/JPG, máx 5MB)
4. Console deve mostrar upload progress
5. Logo deve aparecer na prévia

**Se falhar**:
- Verifique tamanho do arquivo
- Verifique formato (deve ser imagem)
- Verifique regras do Storage

---

## 🗂️ Estrutura Multi-Tenant

### Como Funciona

Cada escola tem seu próprio banco de dados e storage:

```
Escola ELO:
├── Database: elo-school-default-rtdb.firebaseio.com
└── Storage: elo-school.appspot.com
    └── configuracoes/
        ├── header (configurações do header)
        ├── escola (nome, motto)
        ├── logo_1234567890.png
        └── background_1234567890.jpg

Escola ELO Teste:
├── Database: eloteste.firebaseio.com  
└── Storage: eloteste.appspot.com
    └── configuracoes/
        ├── header
        ├── escola
        ├── logo_0987654321.png
        └── background_0987654321.jpg
```

### Garantindo Isolamento

1. **useSchoolDatabase** automaticamente conecta no banco correto
2. **useSchoolStorage** usa o storage correto baseado na escola
3. Todas as operações são isoladas por escola

### Verificar Isolamento

1. Selecione Escola A
2. Personalize o header (ex: cor azul)
3. Salve
4. Selecione Escola B
5. Header deve voltar ao padrão (roxo) ou ter configuração diferente
6. Personalize Escola B (ex: cor verde)
7. Volte para Escola A
8. Header deve estar azul ainda (configuração preservada)

---

## 📊 Logs Importantes

### Logs do SchoolHeader

```javascript
🔄 [SchoolHeader] Aguardando banco estar pronto...
📋 [SchoolHeader] Carregando configurações...
👤 [SchoolHeader] userRole: coordenadora
🏫 [SchoolHeader] currentSchool: Escola ELO
⚙️ [SchoolHeader] Config carregada: { primaryColor: '#667eea', ... }
🏫 [SchoolHeader] School info: { nome: 'Escola ELO', motto: '...' }
```

### Logs do HeaderSettingsDialog

```javascript
💾 [HeaderSettings] Iniciando salvamento...
💾 [HeaderSettings] Configuração a salvar: { ... }
💾 [HeaderSettings] isReady: true
💾 [HeaderSettings] Salvando em: configuracoes/header
✅ [HeaderSettings] Header config salvo!
💾 [HeaderSettings] Salvando em: configuracoes/escola
✅ [HeaderSettings] School info salvo!
```

### Logs de Upload

```javascript
📤 [HeaderSettings] Fazendo upload do logo...
📤 [HeaderSettings] File: logo.png 245678 image/png
✅ [HeaderSettings] Logo uploaded! URL: https://storage.googleapis.com/...
```

---

## 🐛 Problemas Comuns

### Problema 1: Botão ⚙️ não aparece

**Sintomas**:
- Header aparece normal
- Sem ícone de configurações no canto direito

**Debug**:
1. Abra console (F12)
2. Procure: `👤 [SchoolHeader] userRole: ???`
3. Verifique o chip temporário no header (mostra role atual)

**Soluções**:
- Se role for `undefined`: Usuário não está autenticado corretamente
- Se role for `pai` ou `professora`: Apenas coordenadora pode editar
- Se role for `coordenador` (sem A): Código agora aceita ambos

**Código relevante**:
```jsx
// src/components/SchoolHeader.jsx linha ~190
{(userRole === 'coordenadora' || userRole === 'coordenador') && onOpenSettings && (
  <IconButton onClick={onOpenSettings}>
    <Settings />
  </IconButton>
)}
```

### Problema 2: Modal não abre

**Sintomas**:
- Botão ⚙️ aparece
- Clica mas nada acontece

**Debug**:
1. Verifique console ao clicar:
   ```
   ⚙️ [SchoolHeader] Abrindo configurações...
   🔧 [Dashboard] Abrindo settings modal...
   ```

**Soluções**:
- Verifique se `HeaderSettingsDialog` está importado
- Verifique se `settingsOpen` state existe
- Verifique se há erros de renderização

### Problema 3: Não salva configurações

**Sintomas**:
- Modal abre
- Muda configurações
- Clica em salvar
- Nada acontece ou dá erro

**Debug**:
1. Verifique no modal: "Debug: isReady: ✅"
2. Verifique console:
   ```
   💾 [HeaderSettings] Iniciando salvamento...
   ```

**Soluções**:
- Se isReady está ❌: Aguarde banco conectar
- Se isReady está ✅ mas dá erro: Verifique permissões do banco
- Verifique se as regras do Firebase estão abertas

**Firebase Rules (Desenvolvimento)**:
```json
{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}
```

### Problema 4: Upload falha

**Sintomas**:
- Seleciona imagem
- Mostra "Enviando..."
- Erro ou não completa

**Debug**:
```
📤 [HeaderSettings] Fazendo upload do logo...
❌ Erro: [mensagem de erro]
```

**Soluções**:
- **"Storage não está inicializado"**: Escola não tem storageBucket configurado
- **"Arquivo muito grande"**: Logo > 5MB ou Background > 10MB
- **"Tipo não permitido"**: Usar PNG, JPG, JPEG ou WEBP
- **"Permission denied"**: Regras do Storage precisam estar abertas

**Storage Rules (Desenvolvimento)**:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### Problema 5: Configurações não aparecem após salvar

**Sintomas**:
- Salva com sucesso
- Fecha modal
- Header continua com estilo padrão

**Debug**:
1. Abra Firebase Console
2. Vá para Realtime Database da escola
3. Verifique se existe: `configuracoes/header`

**Soluções**:
- Recarregue a página (F5)
- Verifique se está na escola correta
- Limpe cache do navegador (Ctrl+Shift+Del)

**Fix automático**: O código agora dá reload após salvar:
```javascript
setTimeout(() => {
  window.location.reload();
}, 1500);
```

---

## 🔧 Comandos Úteis

### Ver logs em tempo real
```
Abra Console (F12) e filtre por:
- [SchoolHeader]
- [HeaderSettings]
- [Dashboard]
```

### Limpar cache do navegador
```
Chrome/Edge: Ctrl+Shift+Delete
Selecionar "Imagens e arquivos em cache"
```

### Verificar qual escola está ativa
```javascript
// No console do navegador
console.log(window.localStorage.getItem('selectedSchoolId'));
```

### Forçar reload do banco
```javascript
// No console do navegador
window.location.reload();
```

---

## 📞 Suporte

Se nenhuma das soluções acima funcionar:

1. **Capture screenshots** do console (F12)
2. **Anote** qual escola está selecionada
3. **Descreva** exatamente o que acontece
4. **Compartilhe** os logs relevantes

---

**Última atualização**: 16 de outubro de 2025
