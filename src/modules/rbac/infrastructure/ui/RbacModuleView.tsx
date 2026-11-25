import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  DialogModal,
  Divider,
  FormField,
  FriendlyModal,
  Icon,
  PasswordField,
  SelectField,
  StatMetricCard,
  TabSwitcher,
  TrendPill,
  Typography,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import {
  SaveStaffUserDraft,
  StaffUserModel,
} from '../../domain/models/StaffUser.model';
import {
  RbacPermissionDto,
  RbacRoleModel,
  SaveRbacPermissionDraft,
  SaveRbacRoleDraft,
} from '../../domain/models/RbacRole.model';
import { RbacUseCases } from '../../application/use-cases/RbacUseCases';

export interface RbacModuleViewProps {
  currentUserId: string;
  rbacUseCases: RbacUseCases;
}

type RbacTabId = 'users' | 'roles' | 'permissions';

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo Usuarios, Roles y Permisos RBAC)
 * Construido 100% con `@shared/components` (Atomic Design) y errores suavizados con `FriendlyModal`.
 */
export const RbacModuleView: React.FC<RbacModuleViewProps> = ({
  currentUserId,
  rbacUseCases,
}) => {
  const [activeTab, setActiveTab] = useState<RbacTabId>('users');
  const [users, setUsers] = useState<StaffUserModel[]>([]);
  const [roles, setRoles] = useState<RbacRoleModel[]>([]);
  const [permissions, setPermissions] = useState<RbacPermissionDto[]>([]);

  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterPermModule, setFilterPermModule] = useState('');

  // Modal amigable compartido
  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);

  // Modal 1: Crear / Editar Colaborador POS
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userDraft, setUserDraft] = useState<SaveStaffUserDraft>({
    email: '',
    password: '',
    names: '',
    surnames: '',
    identificationTypeCode: '13',
    identificationNumber: '',
    roles: ['CASHIER'],
    establishmentId: 'b0000000-0000-4000-8000-000000000001',
    isActive: true,
  });

  // Modal 2: Restablecer Contraseña (/api/v1/auth/users/:id/reset-password)
  const [resetTargetUser, setResetTargetUser] = useState<StaffUserModel | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Modal 3: Crear / Editar Rol RBAC (/api/v1/auth/roles)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<SaveRbacRoleDraft>({
    code: '',
    name: '',
    description: '',
    permissions: ['pos:checkout'],
    isActive: true,
  });

  // Modal 4: Crear Permiso Granular (/api/v1/auth/permissions)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permDraft, setPermDraft] = useState<SaveRbacPermissionDraft>({
    code: '',
    name: '',
    module: 'POS',
    action: '',
    description: '',
  });

  const loadRbacData = async () => {
    const [usrRes, roleRes, permRes] = await Promise.all([
      rbacUseCases.getUsers({ search: searchUser, role: filterRole || undefined }),
      rbacUseCases.getRoles(),
      rbacUseCases.getPermissions(filterPermModule || undefined),
    ]);

    if (usrRes.isSuccess) setUsers(usrRes.getValue());
    if (roleRes.isSuccess) setRoles(roleRes.getValue());
    if (permRes.isSuccess) setPermissions(permRes.getValue());
  };

  useEffect(() => {
    void loadRbacData();
  }, [searchUser, filterRole, filterPermModule]);

  const kpis = useMemo(() => {
    const superAdmins = users.filter((u) => u.isSuperAdmin).length;
    return {
      usersCount: users.length,
      rolesCount: roles.length,
      permissionsCount: permissions.length,
      superAdmins,
    };
  }, [users, roles, permissions]);

  // --- Operaciones de Usuarios ---
  const openCreateUserModal = () => {
    setEditingUserId(null);
    setUserDraft({
      email: '',
      password: '',
      names: '',
      surnames: '',
      identificationTypeCode: '13',
      identificationNumber: '',
      roles: ['CASHIER'],
      establishmentId: 'b0000000-0000-4000-8000-000000000001',
      isActive: true,
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: StaffUserModel) => {
    const raw = user.raw;
    setEditingUserId(user.id);
    setUserDraft({
      email: raw.email,
      names: raw.names,
      surnames: raw.surnames,
      identificationTypeCode: raw.identificationTypeCode,
      identificationNumber: raw.identificationNumber,
      roles: [...raw.roles],
      establishmentId: raw.establishmentId,
      isActive: raw.isActive,
    });
    setIsUserModalOpen(true);
  };

  const toggleUserRole = (roleCode: string) => {
    setUserDraft((prev) => {
      const exists = prev.roles.includes(roleCode);
      if (exists) {
        const next = prev.roles.filter((r) => r !== roleCode);
        return { ...prev, roles: next.length > 0 ? next : ['CASHIER'] };
      }
      return { ...prev, roles: [...prev.roles, roleCode] };
    });
  };

  const handleSaveUser = async () => {
    const res = editingUserId
      ? await rbacUseCases.updateUser(editingUserId, userDraft)
      : await rbacUseCases.createUser(userDraft);

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Revisa los datos del colaborador'
        )
      );
      return;
    }

    setIsUserModalOpen(false);
    await loadRbacData();
    const saved = res.getValue();
    setFriendlyNotice({
      title: editingUserId ? 'Colaborador actualizado' : 'Colaborador registrado',
      message: `La cuenta de "${saved.fullName}" (${saved.primaryRoleLabel}) fue guardada exitosamente.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleDeleteUser = async (user: StaffUserModel) => {
    const res = await rbacUseCases.deleteUser(user, currentUserId);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Acción protegida')
      );
      return;
    }
    await loadRbacData();
    setFriendlyNotice({
      title: 'Colaborador retirado',
      message: `El acceso de "${user.fullName}" fue desactivado correctamente.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  const handleAvatarUpload = (user: StaffUserModel, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? '');
      const res = await rbacUseCases.uploadPhoto(user.id, {
        fileName: file.name,
        content: dataUrl,
        mimeType: file.type || 'image/png',
      });
      if (res.isFailure) {
        setFriendlyNotice(FriendlyErrorMapper.toFriendlyNotice(res.error!));
        return;
      }
      await loadRbacData();
      setFriendlyNotice({
        title: 'Fotografía actualizada',
        message: `La foto de perfil de "${user.fullName}" fue asociada correctamente.`,
        tone: 'info',
        actionLabel: 'Continuar',
      });
    };
    reader.readAsDataURL(file);
  };

  const openResetPasswordModal = (user: StaffUserModel) => {
    setResetTargetUser(user);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetTargetUser) return;
    const res = await rbacUseCases.resetPassword({
      targetUserId: resetTargetUser.id,
      newPassword,
      confirmPassword,
    });

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Verifica la nueva contraseña'
        )
      );
      return;
    }

    const name = resetTargetUser.fullName;
    setResetTargetUser(null);
    setFriendlyNotice({
      title: 'Contraseña restablecida',
      message: `La clave de acceso de "${name}" fue actualizada exitosamente.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  // --- Operaciones de Roles y Permisos ---
  const openCreateRoleModal = () => {
    setEditingRoleId(null);
    setRoleDraft({
      code: '',
      name: '',
      description: '',
      permissions: ['pos:checkout'],
      isActive: true,
    });
    setIsRoleModalOpen(true);
  };

  const openEditRoleModal = (role: RbacRoleModel) => {
    setEditingRoleId(role.id);
    setRoleDraft({
      code: role.code,
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      isActive: role.raw.isActive,
    });
    setIsRoleModalOpen(true);
  };

  const toggleRolePermission = (permCode: string) => {
    setRoleDraft((prev) => {
      const exists = prev.permissions.includes(permCode);
      if (exists) {
        const next = prev.permissions.filter((p) => p !== permCode);
        return { ...prev, permissions: next };
      }
      return { ...prev, permissions: [...prev.permissions, permCode] };
    });
  };

  const handleSaveRole = async () => {
    const res = editingRoleId
      ? await rbacUseCases.updateRole(editingRoleId, roleDraft)
      : await rbacUseCases.createRole(roleDraft);

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Revisa los datos del rol')
      );
      return;
    }

    setIsRoleModalOpen(false);
    await loadRbacData();
    setFriendlyNotice({
      title: editingRoleId ? 'Rol RBAC actualizado' : 'Rol RBAC creado',
      message: `El rol "${res.getValue().name}" quedó configurado con ${res.getValue().permissions.length} permiso(s).`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleDeleteRole = async (role: RbacRoleModel) => {
    const res = await rbacUseCases.deleteRole(role);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Rol protegido')
      );
      return;
    }
    await loadRbacData();
  };

  const handleCreatePermission = async () => {
    const res = await rbacUseCases.createPermission(permDraft);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Revisa el permiso')
      );
      return;
    }

    setIsPermissionModalOpen(false);
    await loadRbacData();
    setFriendlyNotice({
      title: 'Permiso registrado',
      message: `El permiso "${res.getValue().code}" ya está disponible para asignarse a cualquier rol.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Fila Superior de KPIs estilo DealDeck */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        <StatMetricCard
          featured
          title="Colaboradores POS"
          value={String(kpis.usersCount)}
          trendValue="Sesiones RS256"
          trendDirection="up"
          comparisonLine1="Personal activo"
          comparisonLine2="en NatsarStore"
          icon="users"
        />
        <StatMetricCard
          title="Roles RBAC"
          value={String(kpis.rolesCount)}
          trendValue="Jerarquía POS"
          trendDirection="up"
          comparisonLine1="Cajeros, supervisores"
          comparisonLine2="y administradores"
          icon="shield"
        />
        <StatMetricCard
          title="Permisos Granulares"
          value={String(kpis.permissionsCount)}
          trendValue="modulo:accion"
          trendDirection="up"
          comparisonLine1="Control de mínimo"
          comparisonLine2="privilegio activo"
          icon="lock"
        />
        <StatMetricCard
          title="Comodín superAdmin:*"
          value={String(kpis.superAdmins)}
          trendValue="Acceso Total"
          trendDirection="up"
          comparisonLine1="Super administradores"
          comparisonLine2="de plataforma"
          icon="sparkles"
        />
      </div>

      {/* Barra de Pestañas + Acción Principal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <TabSwitcher<RbacTabId>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              id: 'users',
              label: 'Colaboradores POS',
              icon: 'users',
              count: users.length,
            },
            {
              id: 'roles',
              label: 'Matriz de Roles RBAC',
              icon: 'shield',
              count: roles.length,
            },
            {
              id: 'permissions',
              label: 'Catálogo de Permisos',
              icon: 'lock',
              count: permissions.length,
            },
          ]}
        />

        <div>
          {activeTab === 'users' && (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={openCreateUserModal}
            >
              Nuevo Colaborador
            </Button>
          )}
          {activeTab === 'roles' && (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={openCreateRoleModal}
            >
              Nuevo Rol RBAC
            </Button>
          )}
          {activeTab === 'permissions' && (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={() => {
                setPermDraft({
                  code: '',
                  name: '',
                  module: 'POS',
                  action: '',
                  description: '',
                });
                setIsPermissionModalOpen(true);
              }}
            >
              Nuevo Permiso
            </Button>
          )}
        </div>
      </div>

      {/* VISTA 1: COLABORADORES POS (/api/v1/auth/users) */}
      {activeTab === 'users' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(226, 232, 240, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px' }}>
            <FormField
              placeholder="Buscar colaborador por nombre, correo o cédula..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              leftSlot={<Icon name="search" size={17} />}
            />
            <SelectField
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              options={[
                { value: '', label: 'Todos los roles RBAC' },
                ...roles.map((r) => ({ value: r.code, label: `${r.name} (${r.code})` })),
              ]}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map((usr) => {
              const raw = usr.raw;
              return (
                <div
                  key={usr.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderRadius: '18px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                    {raw.photoUrl ? (
                      <img
                        src={raw.photoUrl}
                        alt={usr.fullName}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #4D53F4',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4D53F4 0%, #818CF8 100%)',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.96rem',
                          flexShrink: 0,
                        }}
                      >
                        {usr.initials}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0F172A' }}>
                          {usr.fullName}
                        </span>
                        {usr.roles.map((r) => (
                          <Badge key={r} tone={r === 'SUPER_ADMIN' ? 'brand' : 'neutral'}>
                            {r}
                          </Badge>
                        ))}
                        <TrendPill value="Activo" direction="up" />
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <span>
                          Correo: <strong>{usr.email}</strong>
                        </span>
                        <span>
                          Doc: <strong>{raw.identificationNumber}</strong>
                        </span>
                        <span>
                          Sede: <strong>{raw.establishmentName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones: Subir Foto, Resetear Clave, Editar, Eliminar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        height: '36px',
                        padding: '0 12px',
                        borderRadius: '12px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#0F172A',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon name="image" size={14} />
                      <span>Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarUpload(usr, e)}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Icon name="lock" size={14} />}
                      onClick={() => openResetPasswordModal(usr)}
                    >
                      Clave
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Icon name="edit" size={14} />}
                      onClick={() => openEditUserModal(usr)}
                    >
                      Editar
                    </Button>

                    {usr.canBeDeletedBy(currentUserId) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteUser(usr)}
                        style={{ color: '#EF4444' }}
                      >
                        <Icon name="trash" size={15} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: MATRIZ DE ROLES RBAC (/api/v1/auth/roles) */}
      {activeTab === 'roles' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '18px',
          }}
        >
          {roles.map((role) => (
            <div
              key={role.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '22px',
                padding: '22px',
                boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
                border: role.isWildcardSuperAdmin
                  ? '1.5px solid #4D53F4'
                  : '1px solid rgba(226, 232, 240, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.04rem', color: '#0F172A' }}>
                    {role.name}
                  </span>
                  <Badge tone={role.isWildcardSuperAdmin ? 'brand' : 'neutral'}>
                    {role.code}
                  </Badge>
                </div>

                <p style={{ fontSize: '0.81rem', color: '#64748B', lineHeight: 1.45 }}>
                  {role.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {role.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      tone={perm === 'superAdmin:*' ? 'brand' : 'neutral'}
                    >
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #F1F5F9',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  {role.isWildcardSuperAdmin
                    ? 'Comodín Total Activo'
                    : `${role.permissions.length} permisos asignados`}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Icon name="edit" size={14} />}
                    onClick={() => openEditRoleModal(role)}
                  >
                    Permisos
                  </Button>
                  {!role.isWildcardSuperAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDeleteRole(role)}
                      style={{ color: '#EF4444' }}
                    >
                      <Icon name="trash" size={15} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VISTA 3: CATÁLOGO DE PERMISOS (/api/v1/auth/permissions) */}
      {activeTab === 'permissions' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(226, 232, 240, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['', 'SYSTEM', 'POS', 'CATALOG', 'INVENTORY', 'CUSTOMERS', 'AUTH'].map((mod) => (
              <Button
                key={mod || 'ALL'}
                type="button"
                size="sm"
                variant={filterPermModule === mod ? 'primary' : 'outline'}
                onClick={() => setFilterPermModule(mod)}
              >
                {mod ? `Módulo ${mod}` : 'Todos los Módulos'}
              </Button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {permissions.map((perm) => (
              <div
                key={perm.id}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <code style={{ fontWeight: 800, fontSize: '0.86rem', color: '#4D53F4' }}>
                    {perm.code}
                  </code>
                  <Badge tone="neutral">{perm.module}</Badge>
                </div>
                <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{perm.name}</strong>
                <span style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.4 }}>
                  {perm.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREAR / EDITAR COLABORADOR POS */}
      <DialogModal
        isOpen={isUserModalOpen}
        title={editingUserId ? 'Editar Colaborador POS' : 'Nuevo Colaborador POS'}
        subtitle="Asigna credenciales corporativas y roles RBAC para acceso a NatsarStore"
        maxWidth="600px"
        onClose={() => setIsUserModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveUser()}>
              {editingUserId ? 'Guardar Cambios' : 'Crear Colaborador'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              label="Nombres*"
              placeholder="Ej: Laura Valentina"
              value={userDraft.names}
              onChange={(e) => setUserDraft((prev) => ({ ...prev, names: e.target.value }))}
            />
            <FormField
              label="Apellidos*"
              placeholder="Ej: Duarte Mendoza"
              value={userDraft.surnames}
              onChange={(e) => setUserDraft((prev) => ({ ...prev, surnames: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <SelectField
              label="Tipo de Documento*"
              value={userDraft.identificationTypeCode}
              onChange={(e) =>
                setUserDraft((prev) => ({
                  ...prev,
                  identificationTypeCode: e.target.value,
                }))
              }
              options={[
                { value: '13', label: '13 - Cédula de Ciudadanía' },
                { value: '22', label: '22 - Cédula de Extranjería' },
                { value: '41', label: '41 - Pasaporte' },
              ]}
            />
            <FormField
              label="Número de Identificación*"
              placeholder="Ej: 1098765432"
              value={userDraft.identificationNumber}
              onChange={(e) =>
                setUserDraft((prev) => ({
                  ...prev,
                  identificationNumber: e.target.value,
                }))
              }
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: editingUserId ? '1fr' : '1fr 1fr',
              gap: '12px',
            }}
          >
            <FormField
              type="email"
              label="Correo Electrónico Corporativo*"
              placeholder="colaborador@natsarstore.com"
              value={userDraft.email}
              onChange={(e) => setUserDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
            {!editingUserId && (
              <PasswordField
                label="Contraseña Inicial (Mín. 8 caracteres)*"
                placeholder="Contraseña segura"
                value={userDraft.password ?? ''}
                onChange={(e) =>
                  setUserDraft((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            )}
          </div>

          <Divider label="Asignación de Roles RBAC" margin="4px 0" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {roles.map((r) => (
              <Checkbox
                key={r.code}
                id={`chk-role-${r.code}`}
                checked={userDraft.roles.includes(r.code)}
                onChange={() => toggleUserRole(r.code)}
                label={`${r.name} (${r.code})`}
              />
            ))}
          </div>
        </div>
      </DialogModal>

      {/* MODAL 2: RESTABLECIMIENTO ADMINISTRATIVO DE CONTRASEÑA (/api/v1/auth/users/:id/reset-password) */}
      <DialogModal
        isOpen={Boolean(resetTargetUser)}
        title={`Restablecer Clave: ${resetTargetUser?.fullName ?? ''}`}
        subtitle="Asigna una nueva contraseña corporativa verificada para este colaborador"
        maxWidth="460px"
        onClose={() => setResetTargetUser(null)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setResetTargetUser(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleResetPasswordSubmit()}
            >
              Actualizar Contraseña
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PasswordField
            label="Nueva Contraseña (Mín. 8 caracteres)*"
            placeholder="Ingresa la nueva clave"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordField
            label="Confirmar Nueva Contraseña*"
            placeholder="Repite la nueva clave"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </DialogModal>

      {/* MODAL 3: CREAR / EDITAR ROL RBAC Y MATRIZ DE PERMISOS (/api/v1/auth/roles) */}
      <DialogModal
        isOpen={isRoleModalOpen}
        title={editingRoleId ? 'Configurar Rol y Permisos RBAC' : 'Nuevo Rol RBAC'}
        subtitle="Selecciona los permisos granulares modulo:accion que tendrá este rol"
        maxWidth="620px"
        onClose={() => setIsRoleModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveRole()}>
              {editingRoleId ? 'Guardar Rol' : 'Crear Rol'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '12px' }}>
            <FormField
              label="Código del Rol*"
              placeholder="Ej: AUDITOR_POS"
              disabled={Boolean(editingRoleId)}
              value={roleDraft.code}
              onChange={(e) =>
                setRoleDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
            />
            <FormField
              label="Nombre Descriptivo*"
              placeholder="Ej: Auditor Interno de Tienda"
              value={roleDraft.name}
              onChange={(e) => setRoleDraft((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <FormField
            label="Descripción de Responsabilidades"
            placeholder="Alcance operativo del rol dentro de NatsarStore"
            value={roleDraft.description}
            onChange={(e) =>
              setRoleDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <Divider label="Matriz de Permisos Asignados" margin="4px 0" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {permissions.map((perm) => (
              <Checkbox
                key={perm.code}
                id={`role-perm-${perm.code}`}
                checked={roleDraft.permissions.includes(perm.code)}
                onChange={() => toggleRolePermission(perm.code)}
                label={`${perm.code} — ${perm.name}`}
              />
            ))}
          </div>
        </div>
      </DialogModal>

      {/* MODAL 4: CREAR NUEVO PERMISO GRANULAR (/api/v1/auth/permissions) */}
      <DialogModal
        isOpen={isPermissionModalOpen}
        title="Registrar Permiso Granular"
        subtitle="Se codificará automáticamente en formato estándar modulo:accion"
        maxWidth="480px"
        onClose={() => setIsPermissionModalOpen(false)}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPermissionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleCreatePermission()}
            >
              Crear Permiso
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <SelectField
              label="Módulo*"
              value={permDraft.module}
              onChange={(e) => setPermDraft((prev) => ({ ...prev, module: e.target.value }))}
              options={[
                { value: 'POS', label: 'POS (Punto de Venta)' },
                { value: 'CATALOG', label: 'CATALOG (Catálogo)' },
                { value: 'INVENTORY', label: 'INVENTORY (Inventario)' },
                { value: 'CUSTOMERS', label: 'CUSTOMERS (Clientes)' },
                { value: 'AUTH', label: 'AUTH (Seguridad)' },
              ]}
            />
            <FormField
              label="Acción (ej: export)*"
              placeholder="export"
              value={permDraft.action}
              onChange={(e) => setPermDraft((prev) => ({ ...prev, action: e.target.value }))}
            />
          </div>

          <FormField
            label="Nombre del Permiso*"
            placeholder="Ej: Exportar Reportes Contables"
            value={permDraft.name}
            onChange={(e) => setPermDraft((prev) => ({ ...prev, name: e.target.value }))}
          />

          <FormField
            label="Descripción"
            placeholder="Explica qué habilita este permiso"
            value={permDraft.description}
            onChange={(e) =>
              setPermDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
        </div>
      </DialogModal>

      {/* MODAL COMPARTIDO PARA SUAVIZAR ERRORES Y AVISOS AL CLIENTE */}
      <FriendlyModal
        isOpen={Boolean(friendlyNotice)}
        title={friendlyNotice?.title ?? ''}
        message={friendlyNotice?.message ?? ''}
        tone={friendlyNotice?.tone}
        actionLabel={friendlyNotice?.actionLabel}
        onClose={() => setFriendlyNotice(null)}
      />
    </div>
  );
};
