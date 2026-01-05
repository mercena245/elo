# 🎨 Implementação: Upload com Ctrl+V

**Data:** 1 de dezembro de 2025  
**Feature:** Upload de arquivos com suporte a Ctrl+V, Drag & Drop e seleção tradicional

---

## 🎯 Objetivo

Melhorar a experiência de upload de arquivos no sistema, permitindo que professores colem imagens diretamente da área de transferência (Ctrl+V) ao criar planos diários, além de manter as funcionalidades de arrastar e soltar e seleção de arquivos.

---

## ✨ Funcionalidades Implementadas

### 1. **Colar com Ctrl+V** 🎨
- Cole imagens diretamente da área de transferência
- Suporta prints de tela (Print Screen)
- Feedback visual quando algo é colado
- Nome automático com timestamp

### 2. **Drag & Drop** 📂
- Arraste arquivos para a zona de upload
- Feedback visual durante o arraste
- Suporta múltiplos arquivos

### 3. **Seleção Tradicional** 🖱️
- Clique para abrir o seletor de arquivos
- Compatível com todos navegadores

### 4. **Validações** ✅
- Tamanho máximo de arquivo (padrão: 10MB)
- Tipos de arquivo aceitos
- Mensagens de erro claras

### 5. **Preview** 👁️
- Preview de imagens
- Ícones para outros tipos de arquivo
- Informações de tamanho
- Botão para remover

---

## 📁 Arquivos Criados/Modificados

### Novo Componente
```
src/components/FileUploadZone.jsx
```

Componente reutilizável que pode ser usado em qualquer parte do sistema.

### Modificações
```
src/app/sala-professor/components/shared/EditorPlanoDiario.jsx
```

Integração do novo componente no editor de plano diário.

---

## 🚀 Como Usar

### Uso Básico

```jsx
import FileUploadZone from '@/components/FileUploadZone';

<FileUploadZone
  onFilesSelected={(files) => handleUpload(files)}
  files={arquivosAtuais}
  onRemoveFile={(index) => handleRemove(index)}
  uploading={isUploading}
  progress={uploadProgress}
/>
```

### Props Disponíveis

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `onFilesSelected` | Function | **requerido** | Callback quando arquivos são selecionados |
| `files` | Array | `[]` | Array de arquivos já carregados |
| `onRemoveFile` | Function | - | Callback para remover arquivo |
| `uploading` | Boolean | `false` | Estado de upload em progresso |
| `progress` | Number | `0` | Progresso do upload (0-100) |
| `disabled` | Boolean | `false` | Desabilitar o componente |
| `accept` | String | `"image/*,..."` | Tipos de arquivo aceitos |
| `multiple` | Boolean | `true` | Permitir múltiplos arquivos |
| `maxSize` | Number | `10MB` | Tamanho máximo em bytes |
| `showPreview` | Boolean | `true` | Mostrar preview dos arquivos |

---

## 💡 Exemplos de Uso

### Upload de Imagens Apenas

```jsx
<FileUploadZone
  onFilesSelected={handleImages}
  files={images}
  accept="image/*"
  maxSize={5 * 1024 * 1024} // 5MB
/>
```

### Upload de Documentos

```jsx
<FileUploadZone
  onFilesSelected={handleDocs}
  files={documents}
  accept=".pdf,.doc,.docx"
  multiple={false} // Apenas 1 arquivo
/>
```

### Todos os Tipos

```jsx
<FileUploadZone
  onFilesSelected={handleFiles}
  files={allFiles}
  accept="*"
  maxSize={20 * 1024 * 1024} // 20MB
/>
```

---

## 🎨 Recursos Visuais

### Estados Visuais

1. **Normal**: Borda tracejada cinza
2. **Hover**: Fundo levemente cinza
3. **Drag Active**: Borda azul, fundo azul claro
4. **Paste Active**: Borda verde (feedback de colagem)
5. **Focus**: Borda azul (para acessibilidade)

### Feedback Visual

- 🎯 **Chip "Ctrl+V"**: Lembra o usuário da funcionalidade
- 📊 **Barra de Progresso**: Durante upload
- ⚠️ **Alertas de Erro**: Para arquivos inválidos
- ✅ **Preview**: Mostra arquivos anexados

---

## 🔧 Detalhes Técnicos

### Como Funciona o Ctrl+V

```javascript
// Listener de paste no elemento
const handlePaste = (e) => {
  const items = e.clipboardData?.items;
  
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === 'file') {
      const file = items[i].getAsFile();
      // Processa o arquivo...
    }
  }
};

// Adiciona listener quando componente monta
useEffect(() => {
  dropZone.addEventListener('paste', handlePaste);
  dropZone.setAttribute('tabindex', '0'); // Torna focável
}, []);
```

### Validação de Arquivos

```javascript
const validateFile = (file) => {
  // Verifica tamanho
  if (file.size > maxSize) {
    return 'Arquivo muito grande';
  }
  
  // Verifica tipo (extensão ou MIME type)
  const acceptedTypes = accept.split(',');
  // Valida contra lista aceita...
  
  return null; // Válido
};
```

---

## 🎯 Onde Está Implementado

### Sala do Professor - Novo Plano Diário

**Caminho no sistema:**
1. Faça login
2. Acesse "Sala do Professor"
3. Aba "Planejamento de Aulas"
4. Clique em "Novo Plano Diário"
5. Selecione turma e data
6. Na seção "Recursos e Materiais" de cada aula

**Como testar:**
1. **Print Screen**: Aperte PrtScn, depois Ctrl+V na zona de upload
2. **Copiar Imagem**: Clique direito em uma imagem → Copiar → Ctrl+V na zona
3. **Arrastar**: Arraste arquivos da pasta para a zona
4. **Selecionar**: Clique na zona para abrir o seletor

---

## 🚀 Próximos Passos (Sugestões)

### Implementar em Outros Módulos

O componente `FileUploadZone` pode ser facilmente integrado em:

- ✅ **Plano Diário** (implementado)
- ⏳ **Plano de Aula** (similar ao diário)
- ⏳ **Galeria de Fotos** (upload de álbuns)
- ⏳ **Avisos** (anexos em avisos)
- ⏳ **Biblioteca de Materiais** (upload de materiais didáticos)
- ⏳ **Secretaria Digital** (documentos de alunos)

### Melhorias Futuras

1. **Redimensionamento Automático**
   - Redimensionar imagens grandes automaticamente
   - Economizar espaço de storage

2. **Compressão de Imagens**
   - Comprimir imagens antes de enviar
   - Manter qualidade aceitável

3. **Upload por URL**
   - Permitir colar URL de imagem
   - Download e upload automático

4. **Editor de Imagem Simples**
   - Recortar, girar antes de enviar
   - Adicionar anotações

5. **Upload Múltiplo Paralelo**
   - Enviar vários arquivos simultaneamente
   - Barra de progresso individual

---

## 📝 Notas

- O componente é totalmente independente e reutilizável
- Funciona em todos navegadores modernos
- Mobile-friendly (touch events)
- Acessível (keyboard navigation)
- Suporta internacionalização (facilmente traduzível)

---

## 🐛 Troubleshooting

### Ctrl+V não funciona

**Solução:** O elemento precisa estar focado. Clique na zona de upload primeiro.

### Arquivo não aceito

**Solução:** Verifique o tipo de arquivo e a propriedade `accept`.

### Erro de tamanho

**Solução:** Ajuste a prop `maxSize` ou reduza o tamanho do arquivo.

---

## 📚 Referências

- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [MDN: Drag and Drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [Firebase Storage: Upload Files](https://firebase.google.com/docs/storage/web/upload-files)

---

**Desenvolvido com ❤️ para o Sistema ELO School**
