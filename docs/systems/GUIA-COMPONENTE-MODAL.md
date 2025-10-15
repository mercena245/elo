# Componente Modal - Documentação

## 📋 Visão Geral

Componente modal reutilizável e responsivo que substitui os `alert()` nativos do JavaScript por uma interface moderna, amigável e acessível.

---

## 🎯 Características

- ✅ **Responsivo**: Adapta-se a todos os tamanhos de tela
- ✅ **Acessível**: Suporta navegação por teclado (ESC para fechar)
- ✅ **Animado**: Transições suaves de entrada e saída
- ✅ **Tipos Predefinidos**: success, warning, error, info
- ✅ **Customizável**: Suporta conteúdo personalizado
- ✅ **Backdrop Blur**: Efeito de desfoque no fundo
- ✅ **Bloqueio de Scroll**: Previne scroll do body quando aberto

---

## 📦 Instalação

O componente já está criado em:
```
src/components/Modal.jsx
```

---

## 🚀 Uso Básico

### Importar o Modal

```javascript
import Modal from '../components/Modal';
```

### Exemplo Simples

```jsx
function MeuComponente() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setModalOpen(true)}>
        Abrir Modal
      </button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type="success"
        title="Sucesso!"
        message="Operação concluída com sucesso."
        confirmText="OK"
      />
    </>
  );
}
```

---

## 📖 Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `isOpen` | boolean | - | **Obrigatório.** Controla se o modal está aberto |
| `onClose` | function | - | Função chamada ao fechar o modal |
| `title` | string | - | Título do modal |
| `message` | string | - | Mensagem a ser exibida |
| `type` | string | 'info' | Tipo do modal: 'success', 'warning', 'error', 'info' |
| `confirmText` | string | 'OK' | Texto do botão de confirmação |
| `cancelText` | string | - | Texto do botão de cancelar (se fornecido, exibe o botão) |
| `onConfirm` | function | - | Função chamada ao clicar em confirmar |
| `onCancel` | function | - | Função chamada ao clicar em cancelar |
| `children` | ReactNode | - | Conteúdo customizado (substitui `message`) |
| `showCloseButton` | boolean | true | Exibe botão X no canto superior direito |
| `size` | string | 'md' | Tamanho do modal: 'sm', 'md', 'lg', 'xl' |

---

## 🎨 Tipos de Modal

### Success (Sucesso)

```jsx
<Modal
  isOpen={true}
  type="success"
  title="✅ Aprovado!"
  message="Usuário aprovado com sucesso."
/>
```

**Aparência:**
- Ícone: ✓ verde
- Cor: Verde
- Uso: Confirmações, operações bem-sucedidas

### Warning (Aviso)

```jsx
<Modal
  isOpen={true}
  type="warning"
  title="⚠️ Atenção"
  message="Selecione uma função antes de continuar."
/>
```

**Aparência:**
- Ícone: ⚠ amarelo
- Cor: Amarelo
- Uso: Avisos, informações importantes

### Error (Erro)

```jsx
<Modal
  isOpen={true}
  type="error"
  title="❌ Erro"
  message="Não foi possível processar a solicitação."
/>
```

**Aparência:**
- Ícone: ✕ vermelho
- Cor: Vermelho
- Uso: Erros, falhas de operação

### Info (Informação)

```jsx
<Modal
  isOpen={true}
  type="info"
  title="ℹ️ Informação"
  message="Sua solicitação está sendo processada."
/>
```

**Aparência:**
- Ícone: ℹ azul
- Cor: Azul
- Uso: Informações gerais, ajuda

---

## 🔥 Exemplos Avançados

### Modal com Botão de Cancelar

```jsx
<Modal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  type="warning"
  title="Confirmar Exclusão"
  message="Tem certeza que deseja excluir este item?"
  confirmText="Sim, excluir"
  cancelText="Cancelar"
  onConfirm={handleDelete}
  onCancel={() => console.log('Cancelado')}
/>
```

### Modal com Conteúdo Customizado

```jsx
<Modal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  type="info"
  title="Detalhes do Usuário"
>
  <div className="space-y-3">
    <div className="flex justify-between">
      <span className="font-medium">Nome:</span>
      <span>{user.nome}</span>
    </div>
    <div className="flex justify-between">
      <span className="font-medium">Email:</span>
      <span>{user.email}</span>
    </div>
    <div className="flex justify-between">
      <span className="font-medium">Role:</span>
      <span>{user.role}</span>
    </div>
  </div>
</Modal>
```

### Modal com Tamanho Customizado

```jsx
<Modal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  type="success"
  title="Relatório Completo"
  message="Relatório gerado com sucesso."
  size="xl"  // Extra grande
/>
```

### Modal com Estado Gerenciado

```jsx
function MeuComponente() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: ''
  });

  const showSuccess = () => {
    setModalConfig({
      type: 'success',
      title: '✅ Sucesso!',
      message: 'Operação concluída.'
    });
    setModalOpen(true);
  };

  const showError = () => {
    setModalConfig({
      type: 'error',
      title: '❌ Erro!',
      message: 'Algo deu errado.'
    });
    setModalOpen(true);
  };

  return (
    <>
      <button onClick={showSuccess}>Sucesso</button>
      <button onClick={showError}>Erro</button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        {...modalConfig}
      />
    </>
  );
}
```

---

## 🎯 Casos de Uso Implementados

### 1. SchoolSelection.jsx

**Substituiu:**
```javascript
// ANTES
alert('Acesso concedido! Aguardando aprovação da coordenadora...');
alert('Solicitação enviada! Aguardando aprovação...');
```

**Por:**
```javascript
// DEPOIS
setModalConfig({
  type: 'success',
  title: '✅ Acesso Concedido!',
  message: result.message,
  onConfirm: () => window.location.reload()
});
setModalOpen(true);
```

### 2. pending-approvals/page.jsx

**Substituiu:**
```javascript
// ANTES
alert('Por favor, selecione uma função para o usuário');
alert('Usuário aprovado como professor com sucesso!');
alert('Erro ao aprovar usuário. Tente novamente.');
```

**Por:**
```javascript
// DEPOIS
setModalConfig({
  type: 'warning',
  title: '⚠️ Atenção',
  message: 'Por favor, selecione uma função...'
});
setModalOpen(true);
```

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `ESC` | Fecha o modal |
| `Enter` | Confirma ação (quando focado no botão) |
| `Tab` | Navega entre botões |

---

## 🎨 Customização de Estilos

### Cores por Tipo

```javascript
const typeStyles = {
  success: {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  },
  warning: {
    bgColor: 'bg-yellow-50',
    // ...
  },
  // ...
};
```

### Tamanhos

```javascript
const sizeClasses = {
  sm: 'max-w-sm',   // ~384px
  md: 'max-w-md',   // ~448px
  lg: 'max-w-lg',   // ~512px
  xl: 'max-w-xl'    // ~576px
};
```

---

## 🔧 Recursos Técnicos

### Animações

- **fadeIn**: Backdrop aparece gradualmente (0.2s)
- **slideUp**: Modal desliza de baixo para cima (0.3s)

### Bloqueio de Scroll

```javascript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
}, [isOpen]);
```

### Backdrop Blur

```jsx
className="bg-black bg-opacity-50 backdrop-blur-sm"
```

### Acessibilidade

```jsx
role="dialog"
aria-modal="true"
aria-labelledby="modal-title"
```

---

## 📱 Responsividade

- **Mobile**: Padding reduzido, texto menor
- **Tablet**: Botões lado a lado
- **Desktop**: Layout completo

```jsx
className="p-6 md:p-8"  // Padding responsivo
className="text-xl md:text-2xl"  // Texto responsivo
className="flex-col-reverse sm:flex-row"  // Layout responsivo
```

---

## ✅ Checklist de Migração

Para substituir `alert()` por `Modal`:

- [x] Criar componente `Modal.jsx`
- [x] Adicionar estados no componente:
  ```javascript
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({...});
  ```
- [x] Substituir `alert()` por:
  ```javascript
  setModalConfig({type, title, message});
  setModalOpen(true);
  ```
- [x] Adicionar componente no JSX:
  ```jsx
  <Modal isOpen={modalOpen} {...modalConfig} />
  ```
- [x] Testar todos os fluxos

---

## 🐛 Troubleshooting

### Modal não abre

**Verificar:**
- `isOpen` está sendo atualizado?
- Estado `modalOpen` existe?
- Console mostra erros?

### Modal não fecha

**Verificar:**
- `onClose` está definido?
- `onClose` atualiza o estado?

### Animações não funcionam

**Verificar:**
- CSS está sendo carregado?
- Tailwind CSS está configurado?

### Scroll não bloqueia

**Verificar:**
- `useEffect` está executando?
- Body style está sendo aplicado?

---

## 🔄 Comparação: Antes vs Depois

### ANTES (Alert)

```javascript
if (!selectedRole) {
  alert('Por favor, selecione uma função para o usuário');
  return;
}

const result = await approve();
if (result.success) {
  alert('Usuário aprovado com sucesso!');
} else {
  alert('Erro ao aprovar usuário.');
}
```

**Problemas:**
- ❌ Visual nativo do browser
- ❌ Não customizável
- ❌ Bloqueia toda a aplicação
- ❌ Sem ícones ou cores
- ❌ UX ruim

### DEPOIS (Modal)

```javascript
if (!selectedRole) {
  setModalConfig({
    type: 'warning',
    title: '⚠️ Atenção',
    message: 'Por favor, selecione uma função para o usuário'
  });
  setModalOpen(true);
  return;
}

const result = await approve();
if (result.success) {
  setModalConfig({
    type: 'success',
    title: '✅ Aprovado!',
    message: 'Usuário aprovado com sucesso!'
  });
  setModalOpen(true);
} else {
  setModalConfig({
    type: 'error',
    title: '❌ Erro',
    message: 'Erro ao aprovar usuário.'
  });
  setModalOpen(true);
}
```

**Benefícios:**
- ✅ Visual moderno e profissional
- ✅ Totalmente customizável
- ✅ Não bloqueia aplicação
- ✅ Ícones e cores contextuais
- ✅ UX excelente
- ✅ Animações suaves
- ✅ Responsivo
- ✅ Acessível

---

## 🎓 Boas Práticas

### 1. Use tipos apropriados

```javascript
// ✅ BOM
type="success"  // Para operações bem-sucedidas
type="warning"  // Para avisos e confirmações
type="error"    // Para erros
type="info"     // Para informações gerais

// ❌ RUIM
type="success"  // Para tudo
```

### 2. Títulos claros e concisos

```javascript
// ✅ BOM
title="✅ Usuário Aprovado"
title="⚠️ Confirmar Exclusão"
title="❌ Erro na Conexão"

// ❌ RUIM
title="Mensagem"
title="Aviso"
title="OK"
```

### 3. Mensagens descritivas

```javascript
// ✅ BOM
message="Usuário aprovado como professor. Ele já pode acessar o sistema."

// ❌ RUIM
message="OK"
message="Sucesso"
```

### 4. Use callbacks quando necessário

```javascript
// ✅ BOM - Ação após fechar
onConfirm={() => {
  // Executar ação
  window.location.reload();
}}

// ❌ RUIM - Sem ação
onConfirm={undefined}  // Se precisa executar algo
```

---

## 📚 Recursos Adicionais

- [Tailwind CSS](https://tailwindcss.com/)
- [React Hooks](https://react.dev/reference/react)
- [ARIA Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

---

## 🔗 Arquivos Relacionados

- `src/components/Modal.jsx` - Componente principal
- `src/components/SchoolSelection.jsx` - Uso em seleção de escola
- `src/app/super-admin/pending-approvals/page.jsx` - Uso em aprovações
- `docs/systems/GUIA-COMPONENTE-MODAL.md` - Esta documentação

---

**Criado em:** 15/10/2025  
**Última atualização:** 15/10/2025  
**Versão:** 1.0.0
