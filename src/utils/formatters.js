/**
 * Utilitários de formatação para exibição de dados
 */

/**
 * Formatar valor monetário para exibição
 * @param {number|string} valor - Valor a ser formatado
 * @returns {string} Valor formatado como moeda brasileira
 */
export const formatCurrency = (valor) => {
  if (!valor && valor !== 0) return 'R$ 0,00';
  
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
  
  if (isNaN(numero)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numero);
};

/**
 * Formatar data para exibição
 * @param {string|Date} data - Data a ser formatada
 * @param {boolean} comHora - Se deve incluir hora na formatação
 * @returns {string} Data formatada
 */
export const formatDate = (data, comHora = false) => {
  if (!data) return '--';
  
  try {
    const date = new Date(data);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    if (comHora) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('pt-BR', options);
  } catch {
    return String(data);
  }
};

/**
 * Formatar telefone para exibição
 * @param {string} telefone - Telefone a ser formatado
 * @returns {string} Telefone formatado
 */
export const formatPhone = (telefone) => {
  if (!telefone) return '';
  
  const digits = telefone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  
  return telefone;
};

/**
 * Formatar CPF para exibição
 * @param {string} cpf - CPF a ser formatado
 * @returns {string} CPF formatado
 */
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  
  return cpf;
};

/**
 * Formatar texto com primeira letra maiúscula
 * @param {string} texto - Texto a ser formatado
 * @returns {string} Texto formatado
 */
export const capitalize = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

/**
 * Truncar texto com reticências
 * @param {string} texto - Texto a ser truncado
 * @param {number} limite - Limite de caracteres
 * @returns {string} Texto truncado
 */
export const truncateText = (texto, limite = 50) => {
  if (!texto) return '';
  if (texto.length <= limite) return texto;
  return texto.substring(0, limite) + '...';
};