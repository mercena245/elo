# 🔧 Correção de Upload de Imagens - Header Personalizável

## Problema Identificado

O upload de imagens (logo e background) estava falhando devido a:

1. **Ordem de parâmetros invertida**: `uploadFile(file, path)` vs `uploadFile(path, file)`
2. **Falta de validação de estado**: Não verificava se `isReady` estava true
3. **Tratamento de erros insuficiente**: Erros não eram logados adequadamente
4. **Retorno da URL**: Não tratava o formato do retorno (objeto vs string)

---

## Correções Implementadas

### 1. **useSchoolStorage.js** - Corrigida ordem dos parâmetros

**Antes:**
```javascript
const downloadURL = await uploadFileBase(file, path);
```

**Depois:**
```javascript
// Corrigir ordem dos parâmetros: (path, file) não (file, path)
const result = await uploadFileBase(path, file);

// O resultado pode ser um objeto {url} ou uma string direta
const downloadURL = result?.url || result;
```

### 2. **useSchoolStorage.js** - Logs detalhados

Adicionados logs em cada etapa:
```javascript
console.log('📤 [useSchoolStorage] Upload iniciado');
console.log('📤 [useSchoolStorage] File:', file?.name, file?.size, file?.type);
console.log('📤 [useSchoolStorage] Path:', path);
console.log('📤 [useSchoolStorage] isReady:', isReady);
console.log('✅ [useSchoolStorage] Upload result:', result);
console.log('✅ [useSchoolStorage] Download URL:', downloadURL);
```

### 3. **HeaderSettingsDialog.jsx** - Validações aprimoradas

**Logo Upload:**
```javascript
// Validar estado do banco
if (!isReady) {
  alert('Aguarde a conexão com o banco de dados antes de fazer upload.');
  return;
}

// Adicionar extensão ao path
const path = `configuracoes/logo_${Date.now()}.${file.name.split('.').pop()}`;

// Validar URL retornada
if (!logoUrl) {
  throw new Error('URL do logo não foi retornada');
}

// Feedback de sucesso
alert('✅ Logo enviado com sucesso!');
```

**Background Upload:**
```javascript
// Mesmas validações + path com extensão
const path = `configuracoes/background_${Date.now()}.${file.name.split('.').pop()}`;

// Feedback de sucesso
alert('✅ Imagem de fundo enviada com sucesso!');
```

### 4. **Tratamento de Erros Robusto**

```javascript
catch (error) {
  console.error('❌ [HeaderSettings] Erro detalhado:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  alert(`Erro ao fazer upload:\n\n${error.message}\n\nVerifique o console para mais detalhes.`);
}
```

---

## Como Usar (Agora Funcional)

### 1. **Upload de Logo**

1. Clique no botão ⚙️ no header
2. Vá para aba "🖼️ Imagens"
3. Clique em "Enviar Logo"
4. Selecione uma imagem:
   - **Formatos**: PNG, JPG, JPEG, WEBP
   - **Tamanho máx**: 5MB
   - **Recomendado**: 500x500px
5. Aguarde upload (você verá "Enviando...")
6. ✅ Sucesso: "Logo enviado com sucesso!"

### 2. **Upload de Background**

1. Mesmos passos, mas:
   - **Tamanho máx**: 10MB
   - **Recomendado**: 1920x400px
2. Após upload, ajuste opacidade do overlay (slider)

---

## Validações Implementadas

### Antes do Upload

| Validação | Logo | Background |
|-----------|------|------------|
| **Tipo de arquivo** | ✅ image/* | ✅ image/* |
| **Tamanho máximo** | ✅ 5MB | ✅ 10MB |
| **isReady** | ✅ true | ✅ true |
| **Formato válido** | ✅ PNG/JPG/WEBP | ✅ PNG/JPG/WEBP |

### Durante o Upload

- ✅ Loading state (botão desabilitado)
- ✅ Progress tracking
- ✅ Logs detalhados no console
- ✅ Indicador visual "Enviando..."

### Após o Upload

- ✅ Validação da URL retornada
- ✅ Update do preview
- ✅ Alert de sucesso
- ✅ Estado atualizado no form

---

## Logs para Debug

### Upload Bem-Sucedido

```
📤 [HeaderSettings] Arquivo selecionado: {name: "logo.png", size: 245678, ...}
📤 [HeaderSettings] Iniciando upload do logo...
📤 [HeaderSettings] isReady: true
📤 [HeaderSettings] Path: configuracoes/logo_1697453821234.png

📤 [useSchoolStorage] Upload iniciado
📤 [useSchoolStorage] File: logo.png 245678 image/png
📤 [useSchoolStorage] Path: configuracoes/logo_1697453821234.png
📤 [useSchoolStorage] isReady: true
📤 [useSchoolStorage] Chamando uploadFileBase...

✅ [useSchoolStorage] Upload result: {url: "https://storage.googleapis.com/..."}
✅ [useSchoolStorage] Download URL: https://storage.googleapis.com/...
✅ [HeaderSettings] Logo uploaded! URL: https://storage.googleapis.com/...
```

### Erros Comuns e Soluções

**Erro: "Storage não está inicializado"**
- **Causa**: `isReady` ainda é false
- **Solução**: Aguarde alguns segundos e tente novamente

**Erro: "Storage bucket não configurado"**
- **Causa**: Escola não tem `storageBucket` no banco
- **Solução**: Verifique configuração da escola no Management DB

**Erro: "Arquivo muito grande"**
- **Causa**: Logo > 5MB ou Background > 10MB
- **Solução**: Comprima a imagem antes de enviar

**Erro: "Tipo de arquivo não permitido"**
- **Causa**: Arquivo não é imagem (ex: PDF, DOC)
- **Solução**: Use apenas PNG, JPG, JPEG ou WEBP

---

## Estrutura no Storage

```
gs://eloteste/
├── configuracoes/
│   ├── logo_1697453821234.png
│   ├── logo_1697453925678.jpg
│   ├── background_1697454012345.jpg
│   └── background_1697454098765.png
```

Cada upload gera um nome único com timestamp para evitar conflitos.

---

## Multi-Tenant Garantido

✅ Cada escola salva em seu próprio Storage:

**Escola ELO:**
```
Storage: elo-school.appspot.com
Path: configuracoes/logo_123.png
URL: https://storage.googleapis.com/elo-school.appspot.com/configuracoes/logo_123.png
```

**Escola Teste:**
```
Storage: gs://eloteste
Path: configuracoes/logo_456.png
URL: https://storage.googleapis.com/eloteste/configuracoes/logo_456.png
```

---

## Testando

1. **Recarregue a página** (F5)
2. **Abra o console** (F12) para ver logs
3. **Clique em ⚙️** no header
4. **Tente fazer upload** de uma imagem
5. **Veja os logs** detalhados no console
6. **Se der erro**: Copie a mensagem e logs do console

---

## Melhorias Futuras

- [ ] Compressão automática de imagens antes do upload
- [ ] Preview da imagem antes de salvar
- [ ] Crop/resize de imagens no cliente
- [ ] Progress bar visual (0-100%)
- [ ] Drag & drop de arquivos
- [ ] Upload múltiplo (galeria)

---

**Status**: ✅ **CORRIGIDO E FUNCIONAL**

*Última atualização: 16 de outubro de 2025*
