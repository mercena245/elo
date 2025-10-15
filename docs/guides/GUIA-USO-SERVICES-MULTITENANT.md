# Guia de Uso - Services Multi-Tenant

## 📚 Visão Geral

Os services foram refatorados para suportar multi-tenancy. Agora cada escola tem seus próprios dados isolados.

## 🔧 Arquivos Criados

### 1. Services Multi-Tenant

- **`src/services/auditServiceMultiTenant.js`**
  - Factory function que cria instância do auditService
  - Recebe `database` como parâmetro
  - Registra logs no banco da escola específica

- **`src/services/financeiroServiceMultiTenant.js`**
  - Factory function que cria instância do financeiroService
  - Recebe `database` e `storage` como parâmetros
  - Todas as operações financeiras isoladas por escola

### 2. Hook Customizado

- **`src/hooks/useSchoolServices.js`**
  - Hook que facilita o uso dos services
  - Retorna services já configurados com database da escola
  - Inclui constantes úteis (LOG_ACTIONS, LOG_LEVELS)

## 🚀 Como Usar

### Opção 1: Usando o Hook `useSchoolServices` (RECOMENDADO)

```jsx
import { useSchoolServices } from '../../hooks/useSchoolServices';

const MeuComponente = () => {
  const { 
    auditService, 
    financeiroService, 
    LOG_ACTIONS, 
    isReady,
    error 
  } = useSchoolServices();

  // Aguardar services estarem prontos
  if (!isReady) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  // Usar auditService
  const registrarAcao = async () => {
    await auditService.logAction(
      LOG_ACTIONS.STUDENT_CREATE,
      userId,
      { 
        entityId: alunoId,
        description: 'Novo aluno cadastrado',
        changes: { nome: 'João' }
      }
    );
  };

  // Usar financeiroService
  const gerarTitulo = async () => {
    const result = await financeiroService.gerarTitulo({
      alunoId: '123',
      tipo: 'mensalidade',
      valor: 500,
      vencimento: '2025-11-10'
    });
    
    if (result.success) {
      console.log('Título criado:', result.id);
    }
  };

  return <div>...</div>;
};
```

### Opção 2: Usando `useSchoolDatabase` Diretamente

```jsx
import { useSchoolDatabase } from '../../hooks/useSchoolDatabase';
import { createAuditService, LOG_ACTIONS } from '../../services/auditServiceMultiTenant';
import { createFinanceiroService } from '../../services/financeiroServiceMultiTenant';
import { useMemo } from 'react';

const MeuComponente = () => {
  const { database, storage, isReady } = useSchoolDatabase();
  
  // Criar services
  const auditService = useMemo(() => {
    if (!database || !isReady) return null;
    return createAuditService(database);
  }, [database, isReady]);

  const financeiroService = useMemo(() => {
    if (!database || !isReady) return null;
    return createFinanceiroService(database, storage);
  }, [database, storage, isReady]);

  // Usar normalmente
  if (!isReady || !auditService || !financeiroService) {
    return <CircularProgress />;
  }

  return <div>...</div>;
};
```

## 📝 Migração de Código Existente

### Antes (Antigo)
```jsx
import { auditService, LOG_ACTIONS } from '../../services/auditService';
import { financeiroService } from '../../services/financeiroService';

const MeuComponente = () => {
  const registrarLog = async () => {
    await auditService.logAction(LOG_ACTIONS.STUDENT_CREATE, userId, details);
  };

  const gerarMensalidade = async () => {
    await financeiroService.gerarMensalidades(alunoId, dados);
  };

  return <div>...</div>;
};
```

### Depois (Multi-Tenant)
```jsx
import { useSchoolServices } from '../../hooks/useSchoolServices';

const MeuComponente = () => {
  const { auditService, financeiroService, LOG_ACTIONS, isReady } = useSchoolServices();

  if (!isReady) return <CircularProgress />;

  const registrarLog = async () => {
    await auditService.logAction(LOG_ACTIONS.STUDENT_CREATE, userId, details);
  };

  const gerarMensalidade = async () => {
    await financeiroService.gerarMensalidades(alunoId, dados);
  };

  return <div>...</div>;
};
```

## 🔍 Diferenças Principais

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Import** | Importa service diretamente | Importa hook |
| **Database** | Global (único para todos) | Específico da escola |
| **Inicialização** | Automática | Requer `isReady` check |
| **Isolamento** | ❌ Todos compartilham dados | ✅ Cada escola tem seus dados |

## ⚠️ Pontos de Atenção

### 1. Sempre verificar `isReady`
```jsx
const { auditService, isReady } = useSchoolServices();

if (!isReady) {
  return <CircularProgress />;
}
```

### 2. Services podem ser `null`
```jsx
const { financeiroService } = useSchoolServices();

if (!financeiroService) {
  return <Alert severity="error">Service não disponível</Alert>;
}
```

### 3. useMemo para performance
```jsx
const auditService = useMemo(() => {
  return database ? createAuditService(database) : null;
}, [database]);
```

## 📊 Funções Disponíveis

### AuditService
- `logAction(action, userId, details, level)` - Registra log
- `getLogs(filters)` - Busca logs
- `getEntityLogs(entity, entityId, limit)` - Logs de entidade
- `getLogStats(period)` - Estatísticas

### FinanceiroService
- `gerarTitulo(tituloData)` - Gera título
- `gerarTitulosNovoAluno(alunoId, dadosAluno)` - Títulos de matrícula
- `gerarMensalidades(alunoId, dadosFinanceiros, meses)` - Mensalidades
- `darBaixa(tituloId, dadosPagamento)` - Baixa em título
- `cancelarTitulo(tituloId, motivo, canceladoPor)` - Cancela título
- `buscarTitulosAluno(alunoId, filtros)` - Busca títulos
- `buscarTitulosVencidos()` - Títulos vencidos
- `calcularMetricas(filtros)` - Métricas financeiras
- `adicionarCredito(alunoId, valor, motivo)` - Crédito
- `utilizarCredito(alunoId, valor, tituloId)` - Usa crédito
- E muitas outras...

## 🎯 Exemplo Completo

```jsx
import React, { useState, useEffect } from 'react';
import { useSchoolServices } from '../../hooks/useSchoolServices';
import { CircularProgress, Alert, Button } from '@mui/material';

const PaginaFinanceiro = () => {
  const { 
    financeiroService, 
    auditService, 
    LOG_ACTIONS,
    isReady, 
    error 
  } = useSchoolServices();

  const [titulos, setTitulos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && financeiroService) {
      carregarTitulos();
    }
  }, [isReady, financeiroService]);

  const carregarTitulos = async () => {
    setLoading(true);
    const result = await financeiroService.buscarTitulosVencidos();
    if (result.success) {
      setTitulos(result.titulos);
    }
    setLoading(false);
  };

  const pagarTitulo = async (tituloId) => {
    const result = await financeiroService.darBaixa(tituloId, {
      formaPagamento: 'pix',
      baixadoPor: 'user123'
    });

    if (result.success) {
      // Registrar no audit
      await auditService.logAction(
        LOG_ACTIONS.SYSTEM_EXPORT,
        'user123',
        { description: `Título ${tituloId} pago` }
      );
      
      carregarTitulos(); // Recarregar lista
    }
  };

  if (!isReady) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (loading) return <CircularProgress />;

  return (
    <div>
      <h1>Títulos Vencidos</h1>
      {titulos.map(titulo => (
        <div key={titulo.id}>
          <p>{titulo.descricao} - R$ {titulo.valor}</p>
          <Button onClick={() => pagarTitulo(titulo.id)}>
            Pagar
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PaginaFinanceiro;
```

## ✅ Checklist de Migração

- [ ] Substituir imports de services antigos
- [ ] Adicionar `useSchoolServices` hook
- [ ] Adicionar verificação `isReady`
- [ ] Adicionar tratamento de erro
- [ ] Testar funcionalidade
- [ ] Verificar logs no console
- [ ] Confirmar isolamento de dados

## 🐛 Troubleshooting

### "Service is null"
- Verifique se `isReady` é `true`
- Verifique se há escola selecionada
- Verifique console para erros de database

### "Cannot read property 'logAction' of null"
- Adicione verificação: `if (!auditService) return;`
- Verifique se o hook está sendo chamado dentro do componente

### Dados não aparecem
- Verifique se a escola está selecionada
- Verifique console do Firebase (network tab)
- Confirme que databaseURL está correto no `managementDB`
