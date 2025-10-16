# 🎨 Sistema de Personalização do Header da Escola

## Visão Geral

Sistema que permite que cada escola personalize completamente o header do seu dashboard, incluindo cores, logo, imagens de fundo e textos customizados.

---

## ✨ Funcionalidades

### 1. **Estilos Personalizáveis**

#### 🎨 Gradiente (Padrão)
- Duas cores customizáveis (primária e secundária)
- Efeito gradiente suave de 135 graus
- 10 paletas predefinidas prontas para usar

#### 🖼️ Imagem de Fundo
- Upload de imagem personalizada (máx 10MB)
- Controle de opacidade do overlay (0-90%)
- Suporte para PNG, JPG, WEBP

#### 🎨 Cor Sólida
- Uma cor única aplicada em todo o header
- Ideal para designs minimalistas

### 2. **Logo da Escola**

- Upload de logo personalizado (máx 5MB)
- Avatar circular com borda elegante
- Fallback automático para emoji 🏫 se não houver logo
- Toggle para mostrar/ocultar

### 3. **Textos Customizáveis**

- **Nome da Escola**: Exibido em destaque no header
- **Slogan/Lema**: Frase motivacional ou lema da escola
- **Cor do Texto**: Branco ou Preto para máximo contraste
- Toggles individuais para cada elemento

### 4. **Elementos Visuais**

- Saudação inteligente baseada na hora do dia:
  - 🌅 Bom dia (0h-12h)
  - ☀️ Boa tarde (12h-18h)
  - 🌙 Boa noite (18h-24h)
- Nome do usuário atual
- Role do usuário (Coordenadora, Professora, Pai/Mãe)
- Chip "Dashboard Inteligente"
- SchoolSelector integrado

### 5. **Controle de Acesso**

- ⚙️ Botão Settings **apenas para Coordenadora**
- Outros perfis veem o header personalizado, mas não podem editar
- Configurações salvas por escola (multi-tenant)

---

## 🎯 Paletas Predefinidas

| Paleta | Cor Primária | Cor Secundária |
|--------|-------------|----------------|
| Roxo Vibrante | #667eea | #764ba2 |
| Azul Oceano | #2193b0 | #6dd5ed |
| Verde Natureza | #56ab2f | #a8e063 |
| Laranja Sunset | #f12711 | #f5af19 |
| Rosa Romântico | #ec008c | #fc6767 |
| Azul Profissional | #1e3c72 | #2a5298 |
| Verde Esmeralda | #11998e | #38ef7d |
| Vermelho Intenso | #c31432 | #240b36 |
| Amarelo Solar | #f2994a | #f2c94c |
| Roxo Galáctico | #4a00e0 | #8e2de2 |

---

## 📱 Responsividade

### Breakpoints Mobile-First

- **xs (0-600px)**: Design compacto, elementos empilhados
- **sm (600-960px)**: Layout intermediário
- **md (960px+)**: Layout completo com espaçamentos generosos

### Adaptações

- **Logo**: 60px (mobile) → 100px (desktop)
- **Tipografia**: Escala fluida baseada no viewport
- **Espaçamentos**: Padding adaptativo (1rem → 2rem)
- **Botões**: Size "small" em mobile, "medium" em desktop

---

## 🔧 Como Usar

### Para Coordenadora:

1. **Acessar Configurações**
   - No dashboard, clique no ícone ⚙️ no canto superior direito do header

2. **Escolher Estilo**
   - Aba "🎨 Cores": Escolha entre gradiente, cor sólida ou imagem
   - Selecione uma paleta predefinida OU crie cores customizadas

3. **Upload de Imagens**
   - Aba "🖼️ Imagens": 
     - Upload do logo (recomendado 500x500px)
     - Upload de imagem de fundo (recomendado 1920x400px)
     - Ajuste a opacidade do overlay se usar imagem de fundo

4. **Configurar Textos**
   - Aba "✏️ Textos":
     - Digite o nome da escola
     - Adicione um slogan (opcional)
     - Escolha quais elementos mostrar (logo, nome, slogan)

5. **Salvar**
   - Clique em "Salvar Alterações"
   - ✅ Confirmação de sucesso aparecerá
   - O header será atualizado instantaneamente

### Para Outros Perfis:

- O header personalizado será exibido automaticamente
- Não há botão de configurações (somente visualização)

---

## 💾 Estrutura de Dados

### Configuração Salva no Firebase

```javascript
// Caminho: configuracoes/header
{
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  backgroundImage: 'https://storage.googleapis.com/...',
  backgroundOverlay: 0.3,
  logoUrl: 'https://storage.googleapis.com/...',
  schoolName: 'Escola ELO',
  motto: 'Educação com Excelência',
  showLogo: true,
  showSchoolName: true,
  showMotto: true,
  textColor: '#ffffff',
  style: 'gradient' // 'gradient', 'image', 'solid'
}
```

### Configuração da Escola

```javascript
// Caminho: configuracoes/escola
{
  nome: 'Escola ELO',
  motto: 'Educação com Excelência'
}
```

---

## 🗂️ Arquivos Criados/Modificados

### Novos Componentes

1. **`src/components/SchoolHeader.jsx`** (380 linhas)
   - Componente principal do header personalizável
   - Renderiza header baseado na configuração
   - Integra SchoolSelector e informações do usuário

2. **`src/components/HeaderSettingsDialog.jsx`** (450 linhas)
   - Modal de configuração com 3 abas
   - Color pickers, upload de imagens, inputs de texto
   - Validação e salvamento de configurações

### Novo Hook

3. **`src/hooks/useSchoolStorage.js`** (90 linhas)
   - Wrapper simplificado para operações de Storage
   - Upload e delete de arquivos
   - Validação de tipos e tamanhos

### Modificações

4. **`src/app/dashboard/page.jsx`**
   - Substituído header hardcoded por `<SchoolHeader />`
   - Adicionado `<HeaderSettingsDialog />`
   - Estado para controle do modal de configurações

---

## 🎨 Exemplos de Uso

### Exemplo 1: Gradiente Roxo Vibrante

```javascript
{
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  style: 'gradient',
  textColor: '#ffffff',
  schoolName: 'Escola ELO',
  motto: 'Educação com Excelência',
  showLogo: true,
  showSchoolName: true,
  showMotto: true
}
```

**Resultado**: Header com gradiente roxo vibrante, logo, nome e motto visíveis.

### Exemplo 2: Imagem de Fundo com Overlay

```javascript
{
  style: 'image',
  backgroundImage: 'https://storage.googleapis.com/escola-elo/background.jpg',
  backgroundOverlay: 0.5,
  textColor: '#ffffff',
  schoolName: 'Escola ELO',
  logoUrl: 'https://storage.googleapis.com/escola-elo/logo.png',
  showLogo: true,
  showSchoolName: true,
  showMotto: false
}
```

**Resultado**: Header com imagem de fundo, overlay de 50%, logo e nome visíveis.

### Exemplo 3: Cor Sólida Minimalista

```javascript
{
  primaryColor: '#1e3c72',
  style: 'solid',
  textColor: '#ffffff',
  schoolName: 'Escola ELO',
  showLogo: false,
  showSchoolName: true,
  showMotto: false
}
```

**Resultado**: Header azul profissional sólido, apenas com nome da escola.

---

## 🔐 Segurança

### Validação de Upload

- **Logo**: Máximo 5MB, tipos permitidos: image/jpeg, image/png, image/jpg, image/webp
- **Background**: Máximo 10MB, mesmos tipos permitidos
- Validação no frontend E backend

### Permissões

- **Edição**: Apenas usuários com role 'coordenadora'
- **Visualização**: Todos os usuários autenticados
- **Storage**: Configurado com regras multi-tenant

---

## 📊 Performance

### Otimizações

- **Lazy Loading**: Componentes carregados sob demanda
- **Memoization**: useCallback para funções de upload
- **Compressão**: Recomendação de imagens otimizadas
- **Caching**: Configurações carregadas uma vez por sessão

### Recomendações de Imagem

| Tipo | Resolução | Tamanho | Formato |
|------|-----------|---------|---------|
| Logo | 500x500px | < 500KB | PNG/WEBP |
| Background | 1920x400px | < 2MB | JPG/WEBP |

---

## 🐛 Troubleshooting

### Logo não aparece

✅ **Verificar**:
- Arquivo foi enviado com sucesso?
- URL está salva em `configuracoes/header/logoUrl`?
- Toggle `showLogo` está ativo?
- Formato da imagem é suportado?

### Cores não mudam

✅ **Verificar**:
- Configuração foi salva corretamente?
- Estilo selecionado é 'gradient' ou 'solid'?
- Navegador está atualizado (Ctrl+F5)?

### Modal não abre

✅ **Verificar**:
- Usuário é coordenadora?
- Escola está selecionada?
- Botão ⚙️ está visível?

### Upload falha

✅ **Verificar**:
- Tamanho do arquivo está dentro do limite?
- Formato é suportado?
- Storage bucket configurado corretamente?
- Conexão com internet está estável?

---

## 🚀 Próximos Passos

### Melhorias Futuras

- [ ] Galeria de templates prontos
- [ ] Preview em tempo real durante edição
- [ ] Histórico de configurações (undo/redo)
- [ ] Exportar/importar configurações
- [ ] Temas sazonais (Natal, Páscoa, etc)
- [ ] Editor de gradientes avançado
- [ ] Filtros para imagem de fundo (blur, brightness)
- [ ] Suporte a vídeo de fundo
- [ ] Dark mode automático

---

## 📝 Notas de Desenvolvimento

### Dependências Utilizadas

- **Material-UI**: Componentes de UI (Dialog, TextField, Switch, Slider)
- **Firebase**: Storage para upload de imagens
- **React Hooks**: useState, useEffect, useCallback para gestão de estado

### Padrões Seguidos

- ✅ Mobile-first design
- ✅ Comentários JSDoc completos
- ✅ Error handling robusto
- ✅ Feedback visual (loading, success, error)
- ✅ Acessibilidade (ARIA labels, keyboard navigation)
- ✅ Multi-tenant ready

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique este documento
2. Confira os logs do console (F12)
3. Entre em contato com o suporte técnico

---

**Desenvolvido com ❤️ para o Sistema ELO**

*Versão: 1.0.0*  
*Data: Janeiro 2025*
