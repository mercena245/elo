/**
 * Constantes do Sistema
 * Centralizadas para fácil manutenção
 */

// Lista de UIDs dos Super Admins
// Para adicionar um novo super admin, basta adicionar o UID do Firebase Auth aqui
export const SUPER_ADMIN_UIDS = [
  'qD6UucWtcgPC9GHA41OB8rSaghZ2', // Mariana - Fundadora
  'ICzjSyn6hedJDtY81J4iwBjmG683', // Novo Super Admin (adicionado 03/12/2025)
];

// Mantém compatibilidade com código legado
export const SUPER_ADMIN_UID = SUPER_ADMIN_UIDS[0];

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
  return SUPER_ADMIN_UIDS.includes(uid);
};

// Verificar se uma role é de coordenador
export const isCoordinator = (role) => {
  return role === ROLES.COORDENADOR || role === ROLES.COORDENADORA;
};

// Verificar se uma role é de professor
export const isProfessor = (role) => {
  return role === ROLES.PROFESSOR || role === ROLES.PROFESSORA;
};
