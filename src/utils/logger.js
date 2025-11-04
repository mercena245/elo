/**
 * Sistema de logging condicional
 * Remove automaticamente todos os logs em produção
 * Mantém logs em desenvolvimento para debugging
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';

// Em produção, todos os logs são funções vazias (zero overhead)
const noop = () => {};

export const logger = {
  // Logs de desenvolvimento (removidos em produção)
  log: isDevelopment ? console.log.bind(console) : noop,
  info: isDevelopment ? console.info.bind(console) : noop,
  warn: isDevelopment ? console.warn.bind(console) : noop,
  debug: (isDevelopment || isDebugEnabled) ? console.debug.bind(console) : noop,
  
  // Logs de erro (mantidos em produção para monitoramento)
  error: console.error.bind(console),
  
  // Log condicional (apenas se debug ativado)
  conditional: (condition, ...args) => {
    if (condition && (isDevelopment || isDebugEnabled)) {
      console.log(...args);
    }
  },
  
  // Agrupa logs relacionados
  group: isDevelopment ? console.group.bind(console) : noop,
  groupEnd: isDevelopment ? console.groupEnd.bind(console) : noop,
  
  // Tabela (útil para arrays/objetos)
  table: isDevelopment ? console.table.bind(console) : noop,
  
  // Tempo de execução
  time: isDevelopment ? console.time.bind(console) : noop,
  timeEnd: isDevelopment ? console.timeEnd.bind(console) : noop,
};

// Helper para logs de performance
export const logPerformance = (label, fn) => {
  if (!isDevelopment) return fn();
  
  console.time(label);
  const result = fn();
  console.timeEnd(label);
  return result;
};

// Helper assíncrono
export const logPerformanceAsync = async (label, fn) => {
  if (!isDevelopment) return await fn();
  
  console.time(label);
  const result = await fn();
  console.timeEnd(label);
  return result;
};

export default logger;
