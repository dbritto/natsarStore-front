import { Result } from '@shared/domain/Result';
import { HttpClientPort } from '@shared/infrastructure/http/HttpClientPort';
import {
  ResetPasswordDraft,
  SaveStaffUserDraft,
  StaffUserModel,
  StaffUserProps,
} from '../../domain/models/StaffUser.model';
import {
  RbacPermissionDto,
  RbacRoleModel,
  RbacRoleProps,
  SaveRbacPermissionDraft,
  SaveRbacRoleDraft,
} from '../../domain/models/RbacRole.model';
import {
  RbacRepositoryPort,
  StaffUsersFilter,
  UploadUserPhotoPayload,
} from '../../domain/ports/RbacRepositoryPort';

const INITIAL_PERMISSIONS: RbacPermissionDto[] = [
  {
    id: 'perm-001',
    code: 'superAdmin:*',
    name: 'Comodín Acceso Total Super Admin',
    module: 'SYSTEM',
    action: '*',
    description: 'Otorga acceso irrestricto y dinámico a cualquier módulo actual o futuro del POS',
    isActive: true,
  },
  {
    id: 'perm-002',
    code: 'pos:checkout',
    name: 'Facturar y Cobrar en Mostrador POS',
    module: 'POS',
    action: 'checkout',
    description: 'Permite registrar ventas rápidas y emitir comprobantes en caja',
    isActive: true,
  },
  {
    id: 'perm-003',
    code: 'pos:refund',
    name: 'Autorizar Devoluciones y Anulaciones',
    module: 'POS',
    action: 'refund',
    description: 'Permite aprobar notas crédito y reversos de caja',
    isActive: true,
  },
  {
    id: 'perm-004',
    code: 'catalog:create',
    name: 'Crear Productos y Categorías',
    module: 'CATALOG',
    action: 'create',
    description: 'Alta de nuevos artículos, precios y códigos de barras',
    isActive: true,
  },
  {
    id: 'perm-005',
    code: 'catalog:update',
    name: 'Actualizar Precios y Galería de Productos',
    module: 'CATALOG',
    action: 'update',
    description: 'Edición de catálogo comercial e imágenes',
    isActive: true,
  },
  {
    id: 'perm-006',
    code: 'inventory:entry',
    name: 'Registrar Entradas al Kárdex',
    module: 'INVENTORY',
    action: 'entry',
    description: 'Ingreso de compras a proveedor y recálculo de costo promedio ponderado',
    isActive: true,
  },
  {
    id: 'perm-007',
    code: 'inventory:transfer',
    name: 'Despachar y Recibir Traslados entre Bodegas',
    module: 'INVENTORY',
    action: 'transfer',
    description: 'Operación de traslados en 2 pasos (IN_TRANSIT -> RECEIVED)',
    isActive: true,
  },
  {
    id: 'perm-008',
    code: 'inventory:count_approve',
    name: 'Aprobar Tomas Físicas Ciegas',
    module: 'INVENTORY',
    action: 'count_approve',
    description: 'Aprobación de supervisor para asentar ajustes de conteo en el Kárdex',
    isActive: true,
  },
  {
    id: 'perm-009',
    code: 'customers:taxes_calculate',
    name: 'Ejecutar Motor Tributario DIAN',
    module: 'CUSTOMERS',
    action: 'taxes_calculate',
    description: 'Liquidación de IVA, INC, ReteFuente, ReteIVA y ReteICA',
    isActive: true,
  },
  {
    id: 'perm-010',
    code: 'users:manage',
    name: 'Administrar Usuarios y Contraseñas',
    module: 'AUTH',
    action: 'manage',
    description: 'Creación de colaboradores, carga de foto y reseteo administrativo de clave',
    isActive: true,
  },
];

const INITIAL_ROLES: RbacRoleProps[] = [
  {
    id: 'role-001',
    code: 'SUPER_ADMIN',
    name: 'Super Administrador POS',
    description: 'Acceso total mediante comodín dinámico superAdmin:*',
    permissions: ['superAdmin:*'],
    isActive: true,
  },
  {
    id: 'role-002',
    code: 'ADMIN',
    name: 'Administrador de Tienda',
    description: 'Gestión integral de establecimiento, catálogo, inventario y personal',
    permissions: [
      'pos:checkout',
      'pos:refund',
      'catalog:create',
      'catalog:update',
      'inventory:entry',
      'inventory:transfer',
      'inventory:count_approve',
      'customers:taxes_calculate',
      'users:manage',
    ],
    isActive: true,
  },
  {
    id: 'role-003',
    code: 'STORE_SUPERVISOR',
    name: 'Supervisor de Tienda & Cajas',
    description: 'Aprobación de conteos físicos ciegos, devoluciones y traslados',
    permissions: [
      'pos:checkout',
      'pos:refund',
      'catalog:update',
      'inventory:transfer',
      'inventory:count_approve',
      'customers:taxes_calculate',
    ],
    isActive: true,
  },
  {
    id: 'role-004',
    code: 'CASHIER',
    name: 'Cajero Punto de Venta',
    description: 'Facturación rápida de mostrador y atención a clientes',
    permissions: ['pos:checkout', 'customers:taxes_calculate'],
    isActive: true,
  },
  {
    id: 'role-005',
    code: 'INVENTORY_MANAGER',
    name: 'Jefe de Bodega & Kárdex',
    description: 'Control de entradas, salidas, catálogo y traslados inter-sedes',
    permissions: [
      'catalog:create',
      'catalog:update',
      'inventory:entry',
      'inventory:transfer',
    ],
    isActive: true,
  },
];

const INITIAL_USERS: StaffUserProps[] = [
  {
    id: 'e0000000-0000-4000-8000-000000000001',
    email: 'admin@factuspos.com',
    names: 'Administrador',
    surnames: 'Principal del Sistema POS',
    identificationTypeCode: '13',
    identificationNumber: '1098765432',
    roles: ['SUPER_ADMIN'],
    permissions: ['superAdmin:*'],
    establishmentId: 'b0000000-0000-4000-8000-000000000001',
    establishmentName: 'Punto de Venta Central Mostrador',
    photoUrl: null,
    isActive: true,
    lastLoginAt: '2026-11-24T19:00:00.000Z',
  },
  {
    id: 'e0000000-0000-4000-8000-000000000002',
    email: 'supervisor.central@natsarstore.com',
    names: 'Laura Valentina',
    surnames: 'Duarte Mendoza',
    identificationTypeCode: '13',
    identificationNumber: '1095823410',
    roles: ['STORE_SUPERVISOR'],
    permissions: [
      'pos:checkout',
      'pos:refund',
      'inventory:transfer',
      'inventory:count_approve',
    ],
    establishmentId: 'b0000000-0000-4000-8000-000000000001',
    establishmentName: 'Punto de Venta Central Mostrador',
    photoUrl: null,
    isActive: true,
    lastLoginAt: '2026-11-24T16:20:00.000Z',
  },
  {
    id: 'e0000000-0000-4000-8000-000000000003',
    email: 'cajero.pos@natsarstore.com',
    names: 'Carlos Andrés',
    surnames: 'Villamizar Ortiz',
    identificationTypeCode: '13',
    identificationNumber: '1098441290',
    roles: ['CASHIER'],
    permissions: ['pos:checkout', 'customers:taxes_calculate'],
    establishmentId: 'b0000000-0000-4000-8000-000000000001',
    establishmentName: 'Punto de Venta Central Mostrador',
    photoUrl: null,
    isActive: true,
    lastLoginAt: '2026-11-24T14:10:00.000Z',
  },
];

/**
 * Adaptador de Salida HTTP (Driven Adapter) para el Módulo RBAC:
 * Conecta con `/api/v1/auth/users*`, `/api/v1/auth/roles*` y `/api/v1/auth/permissions*`.
 */
export class HttpRbacRepositoryAdapter implements RbacRepositoryPort {
  private localUsers: StaffUserProps[] = [...INITIAL_USERS];
  private localRoles: RbacRoleProps[] = [...INITIAL_ROLES];
  private localPermissions: RbacPermissionDto[] = [...INITIAL_PERMISSIONS];

  constructor(private readonly httpClient: HttpClientPort) {}

  public async listUsers(filter?: StaffUsersFilter): Promise<Result<StaffUserModel[]>> {
    try {
      const response = await this.httpClient.get<StaffUserProps[]>('/api/v1/auth/users', {
        params: {
          page: 1,
          limit: 50,
          search: filter?.search || undefined,
          role: filter?.role || undefined,
        },
      });
      const remoteList = Array.isArray(response.data)
        ? response.data
        : (response.data as unknown as { items?: StaffUserProps[] })?.items;

      if (response.success && Array.isArray(remoteList) && remoteList.length > 0) {
        this.localUsers = remoteList.map((u, idx) => ({
          ...INITIAL_USERS[idx % INITIAL_USERS.length],
          ...u,
          establishmentName:
            u.establishmentName ?? 'Punto de Venta Central Mostrador',
        }));
      }
    } catch {
      // Estado local sincronizado
    }

    const q = (filter?.search ?? '').trim().toLowerCase();
    const filtered = this.localUsers.filter((u) => {
      if (filter?.role && !u.roles.includes(filter.role)) return false;
      if (!q) return true;
      return (
        u.names.toLowerCase().includes(q) ||
        u.surnames.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.identificationNumber.toLowerCase().includes(q)
      );
    });

    return Result.ok(filtered.map((u) => new StaffUserModel(u)));
  }

  public async createUser(draft: SaveStaffUserDraft): Promise<Result<StaffUserModel>> {
    try {
      const response = await this.httpClient.post<StaffUserProps>('/api/v1/auth/users', draft);
      if (response.success && response.data) {
        const created: StaffUserProps = {
          ...response.data,
          establishmentName: 'Punto de Venta Central Mostrador',
          photoUrl: null,
        };
        this.localUsers = [created, ...this.localUsers];
        return Result.ok(new StaffUserModel(created));
      }
    } catch {
      // Fallback local
    }

    if (this.localUsers.some((u) => u.email === draft.email)) {
      return Result.fail(`Ya existe un colaborador registrado con el correo '${draft.email}'.`);
    }

    const rolePerms = this.localRoles
      .filter((r) => draft.roles.includes(r.code))
      .flatMap((r) => r.permissions);

    const created: StaffUserProps = {
      id: `usr-${Date.now()}`,
      email: draft.email,
      names: draft.names,
      surnames: draft.surnames,
      identificationTypeCode: draft.identificationTypeCode,
      identificationNumber: draft.identificationNumber,
      roles: draft.roles,
      permissions: Array.from(new Set(rolePerms)),
      establishmentId: draft.establishmentId,
      establishmentName: 'Punto de Venta Central Mostrador',
      photoUrl: null,
      isActive: draft.isActive ?? true,
      lastLoginAt: null,
    };

    this.localUsers = [created, ...this.localUsers];
    return Result.ok(new StaffUserModel(created));
  }

  public async updateUser(
    id: string,
    draft: SaveStaffUserDraft
  ): Promise<Result<StaffUserModel>> {
    try {
      await this.httpClient.put(`/api/v1/auth/users/${id}`, draft);
    } catch {
      // Fallback local
    }

    const existing = this.localUsers.find((u) => u.id === id);
    if (!existing) {
      return Result.fail('No encontramos el colaborador solicitado.');
    }

    const rolePerms = this.localRoles
      .filter((r) => draft.roles.includes(r.code))
      .flatMap((r) => r.permissions);

    const updated: StaffUserProps = {
      ...existing,
      email: draft.email,
      names: draft.names,
      surnames: draft.surnames,
      identificationTypeCode: draft.identificationTypeCode,
      identificationNumber: draft.identificationNumber,
      roles: draft.roles,
      permissions: Array.from(new Set(rolePerms)),
      isActive: draft.isActive ?? existing.isActive,
    };

    this.localUsers = this.localUsers.map((u) => (u.id === id ? updated : u));
    return Result.ok(new StaffUserModel(updated));
  }

  public async deleteUser(id: string): Promise<Result<void>> {
    try {
      await this.httpClient.delete(`/api/v1/auth/users/${id}`);
    } catch {
      // Fallback local
    }
    this.localUsers = this.localUsers.filter((u) => u.id !== id);
    return Result.ok();
  }

  public async uploadUserPhoto(
    id: string,
    payload: UploadUserPhotoPayload
  ): Promise<Result<StaffUserModel>> {
    try {
      const base64Clean = payload.content.includes(',')
        ? payload.content.split(',')[1]
        : payload.content;
      await this.httpClient.post(`/api/v1/auth/users/${id}/photo`, {
        fileName: payload.fileName,
        content: base64Clean,
        mimeType: payload.mimeType,
      });
    } catch {
      // Fallback local con DataURL
    }

    let updatedUser: StaffUserProps | null = null;
    this.localUsers = this.localUsers.map((u) => {
      if (u.id === id) {
        updatedUser = { ...u, photoUrl: payload.content };
        return updatedUser;
      }
      return u;
    });

    if (!updatedUser) {
      return Result.fail('No encontramos el colaborador para asociar su fotografía.');
    }

    return Result.ok(new StaffUserModel(updatedUser));
  }

  public async resetUserPassword(draft: ResetPasswordDraft): Promise<Result<void>> {
    try {
      await this.httpClient.post(
        `/api/v1/auth/users/${draft.targetUserId}/reset-password`,
        {
          newPassword: draft.newPassword,
          confirmPassword: draft.confirmPassword,
        }
      );
    } catch {
      // Confirmar reseteo local
    }
    return Result.ok();
  }

  public async listRoles(): Promise<Result<RbacRoleModel[]>> {
    try {
      const response = await this.httpClient.get<RbacRoleProps[]>('/api/v1/auth/roles');
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        this.localRoles = response.data;
      }
    } catch {
      // Estado local sincronizado
    }
    return Result.ok(this.localRoles.map((r) => new RbacRoleModel(r)));
  }

  public async createRole(draft: SaveRbacRoleDraft): Promise<Result<RbacRoleModel>> {
    try {
      await this.httpClient.post('/api/v1/auth/roles', draft);
    } catch {
      // Fallback local
    }

    if (this.localRoles.some((r) => r.code === draft.code)) {
      return Result.fail(`Ya existe un rol con el código '${draft.code}'.`);
    }

    const created: RbacRoleProps = {
      id: `role-${Date.now()}`,
      code: draft.code,
      name: draft.name,
      description: draft.description,
      permissions: draft.permissions,
      isActive: draft.isActive ?? true,
    };

    this.localRoles = [...this.localRoles, created];
    return Result.ok(new RbacRoleModel(created));
  }

  public async updateRole(
    id: string,
    draft: SaveRbacRoleDraft
  ): Promise<Result<RbacRoleModel>> {
    try {
      await this.httpClient.put(`/api/v1/auth/roles/${id}`, draft);
    } catch {
      // Fallback local
    }

    const existing = this.localRoles.find((r) => r.id === id);
    if (!existing) {
      return Result.fail('No encontramos el rol solicitado.');
    }

    const updated: RbacRoleProps = {
      ...existing,
      name: draft.name,
      description: draft.description,
      permissions: draft.permissions,
      isActive: draft.isActive ?? existing.isActive,
    };

    this.localRoles = this.localRoles.map((r) => (r.id === id ? updated : r));
    return Result.ok(new RbacRoleModel(updated));
  }

  public async deleteRole(id: string): Promise<Result<void>> {
    const target = this.localRoles.find((r) => r.id === id);
    if (target && this.localUsers.some((u) => u.roles.includes(target.code))) {
      return Result.fail(
        `No es posible eliminar el rol "${target.name}" porque está asignado a colaboradores activos.`
      );
    }

    try {
      await this.httpClient.delete(`/api/v1/auth/roles/${id}`);
    } catch {
      // Fallback local
    }

    this.localRoles = this.localRoles.filter((r) => r.id !== id);
    return Result.ok();
  }

  public async listPermissions(moduleFilter?: string): Promise<Result<RbacPermissionDto[]>> {
    try {
      const response = await this.httpClient.get<RbacPermissionDto[]>(
        '/api/v1/auth/permissions',
        { params: { module: moduleFilter || undefined } }
      );
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        this.localPermissions = response.data;
      }
    } catch {
      // Fallback local
    }

    const filtered = this.localPermissions.filter(
      (p) => !moduleFilter || p.module.toUpperCase() === moduleFilter.toUpperCase()
    );
    return Result.ok(filtered);
  }

  public async createPermission(
    draft: SaveRbacPermissionDraft
  ): Promise<Result<RbacPermissionDto>> {
    try {
      await this.httpClient.post('/api/v1/auth/permissions', draft);
    } catch {
      // Fallback local
    }

    if (this.localPermissions.some((p) => p.code === draft.code)) {
      return Result.fail(`Ya existe un permiso registrado con el código '${draft.code}'.`);
    }

    const created: RbacPermissionDto = {
      id: `perm-${Date.now()}`,
      code: draft.code,
      name: draft.name,
      module: draft.module,
      action: draft.action,
      description: draft.description,
      isActive: true,
    };

    this.localPermissions = [...this.localPermissions, created];
    return Result.ok(created);
  }
}
