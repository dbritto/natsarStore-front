import { Result } from '@shared/domain/Result';
import {
  ResetPasswordDraft,
  SaveStaffUserDraft,
  StaffUserModel,
} from '../models/StaffUser.model';
import {
  RbacPermissionDto,
  RbacRoleModel,
  SaveRbacPermissionDraft,
  SaveRbacRoleDraft,
} from '../models/RbacRole.model';

export interface StaffUsersFilter {
  search?: string;
  role?: string;
}

export interface UploadUserPhotoPayload {
  fileName: string;
  content: string; // Base64 o DataURL
  mimeType: string;
}

/**
 * Puerto de Salida (Driven Port - Arquitectura Hexagonal) para el Módulo RBAC:
 * Usuarios Colaboradores POS, Foto de Perfil, Reseteo de Contraseña, Roles y Permisos.
 */
export interface RbacRepositoryPort {
  // Usuarios (/api/v1/auth/users)
  listUsers(filter?: StaffUsersFilter): Promise<Result<StaffUserModel[]>>;
  createUser(draft: SaveStaffUserDraft): Promise<Result<StaffUserModel>>;
  updateUser(id: string, draft: SaveStaffUserDraft): Promise<Result<StaffUserModel>>;
  deleteUser(id: string): Promise<Result<void>>;
  uploadUserPhoto(id: string, payload: UploadUserPhotoPayload): Promise<Result<StaffUserModel>>;
  resetUserPassword(draft: ResetPasswordDraft): Promise<Result<void>>;

  // Roles (/api/v1/auth/roles)
  listRoles(): Promise<Result<RbacRoleModel[]>>;
  createRole(draft: SaveRbacRoleDraft): Promise<Result<RbacRoleModel>>;
  updateRole(id: string, draft: SaveRbacRoleDraft): Promise<Result<RbacRoleModel>>;
  deleteRole(id: string): Promise<Result<void>>;

  // Permisos (/api/v1/auth/permissions)
  listPermissions(moduleFilter?: string): Promise<Result<RbacPermissionDto[]>>;
  createPermission(draft: SaveRbacPermissionDraft): Promise<Result<RbacPermissionDto>>;
}
