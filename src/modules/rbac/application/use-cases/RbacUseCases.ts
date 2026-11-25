import { Result } from '@shared/domain/Result';
import {
  ResetPasswordDraft,
  SaveStaffUserDraft,
  StaffUserModel,
} from '../../domain/models/StaffUser.model';
import {
  RbacPermissionDto,
  RbacRoleModel,
  SaveRbacPermissionDraft,
  SaveRbacRoleDraft,
} from '../../domain/models/RbacRole.model';
import {
  RbacRepositoryPort,
  StaffUsersFilter,
  UploadUserPhotoPayload,
} from '../../domain/ports/RbacRepositoryPort';

/**
 * Casos de Uso del Módulo RBAC (Capa de Aplicación - Arquitectura Hexagonal)
 */
export class RbacUseCases {
  constructor(private readonly repository: RbacRepositoryPort) {}

  public async getUsers(filter?: StaffUsersFilter): Promise<Result<StaffUserModel[]>> {
    return this.repository.listUsers(filter);
  }

  public async createUser(draft: SaveStaffUserDraft): Promise<Result<StaffUserModel>> {
    const validOrErr = StaffUserModel.validateDraft(draft, true);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.createUser(validOrErr.getValue());
  }

  public async updateUser(
    id: string,
    draft: SaveStaffUserDraft
  ): Promise<Result<StaffUserModel>> {
    const validOrErr = StaffUserModel.validateDraft(draft, false);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.updateUser(id, validOrErr.getValue());
  }

  public async deleteUser(
    targetUser: StaffUserModel,
    currentUserId: string
  ): Promise<Result<void>> {
    if (!targetUser.canBeDeletedBy(currentUserId)) {
      return Result.fail(
        'Por seguridad no puedes eliminar tu propia cuenta activa ni al Super Administrador principal.'
      );
    }
    return this.repository.deleteUser(targetUser.id);
  }

  public async uploadPhoto(
    userId: string,
    payload: UploadUserPhotoPayload
  ): Promise<Result<StaffUserModel>> {
    if (!payload.fileName || !payload.content) {
      return Result.fail('Selecciona una fotografía válida para el perfil del colaborador.');
    }
    return this.repository.uploadUserPhoto(userId, payload);
  }

  public async resetPassword(draft: ResetPasswordDraft): Promise<Result<void>> {
    const validOrErr = StaffUserModel.validatePasswordReset(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.resetUserPassword(validOrErr.getValue());
  }

  public async getRoles(): Promise<Result<RbacRoleModel[]>> {
    return this.repository.listRoles();
  }

  public async createRole(draft: SaveRbacRoleDraft): Promise<Result<RbacRoleModel>> {
    const validOrErr = RbacRoleModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.createRole(validOrErr.getValue());
  }

  public async updateRole(
    id: string,
    draft: SaveRbacRoleDraft
  ): Promise<Result<RbacRoleModel>> {
    const validOrErr = RbacRoleModel.validateDraft(draft);
    if (validOrErr.isFailure) return Result.fail(validOrErr.error!);
    return this.repository.updateRole(id, validOrErr.getValue());
  }

  public async deleteRole(role: RbacRoleModel): Promise<Result<void>> {
    if (role.isWildcardSuperAdmin) {
      return Result.fail('El rol SUPER_ADMIN es protegido del núcleo del sistema y no puede eliminarse.');
    }
    return this.repository.deleteRole(role.id);
  }

  public async getPermissions(moduleFilter?: string): Promise<Result<RbacPermissionDto[]>> {
    return this.repository.listPermissions(moduleFilter);
  }

  public async createPermission(
    draft: SaveRbacPermissionDraft
  ): Promise<Result<RbacPermissionDto>> {
    const code = `${draft.module.trim().toLowerCase()}:${draft.action.trim().toLowerCase()}`;
    if (!draft.name || draft.name.trim().length < 3) {
      return Result.fail('Ingresa un nombre descriptivo para el permiso.');
    }
    return this.repository.createPermission({
      ...draft,
      code,
      module: draft.module.trim().toUpperCase(),
      action: draft.action.trim().toLowerCase(),
    });
  }
}
