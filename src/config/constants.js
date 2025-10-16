/**
 * Constantes do Sistema
 * Centralizadas para fácil manutenção
 */

// ID do Super Admin
export const SUPER_ADMIN_UID = 'qD6UucWtcgPC9GHA41OB8rSaghZ2';

// Senha temporária do Super Admin (será substituída por 2FA)
export const SUPER_ADMIN_PASSWORD = '984984';

// Roles do sistema
export const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  COORDENADOR: 'coordenador',
  COORDENADORA: 'coordenadora',
  PROFESSOR: 'professor',
  PROFESSORA: 'professora',
  PAI: 'pai',
  SECRETARIA: 'secretaria',
  PENDING: 'pending'
};

// Verificar se um usuário é Super Admin
export const isSuperAdmin = (uid) => {
  return uid === SUPER_ADMIN_UID;
};

// Verificar se uma role é de coordenador
export const isCoordinator = (role) => {
  return role === ROLES.COORDENADOR || role === ROLES.COORDENADORA;
};

// Verificar se uma role é de professor
export const isProfessor = (role) => {
  return role === ROLES.PROFESSOR || role === ROLES.PROFESSORA;
};
