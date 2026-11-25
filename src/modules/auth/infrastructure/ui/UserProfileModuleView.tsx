import React, { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Divider,
  FormField,
  FriendlyModal,
  Icon,
  PasswordField,
  SelectField,
  Typography,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import { UserSession } from '../../domain/models/UserSession.model';
import { RbacUseCases } from '@modules/rbac/application/use-cases/RbacUseCases';

export interface UserProfileModuleViewProps {
  session: UserSession;
  rbacUseCases: RbacUseCases;
  sessionRemainingSeconds: number;
  autoRefreshEnabled: boolean;
  isRefreshingToken: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
  onRefreshSessionToken: () => Promise<boolean>;
  onSimulateExpirationCountdown: (seconds: number) => void;
  onUpdateSession: (updatedSession: UserSession) => void;
  onLogout: () => void;
}

const IDENTIFICATION_TYPE_OPTIONS = [
  { value: '13', label: '13 - Cédula de Ciudadanía (CC)' },
  { value: '31', label: '31 - NIT Empresarial' },
  { value: '22', label: '22 - Cédula de Extranjería (CE)' },
  { value: '41', label: '41 - Pasaporte Internacional' },
];

const ESTABLISHMENT_OPTIONS = [
  {
    value: 'b0000000-0000-4000-8000-000000000001',
    label: 'Sede Principal NatsarStore - Bogotá',
  },
  {
    value: 'b0000000-0000-4000-8000-000000000002',
    label: 'Sucursal Norte NatsarStore - Medellín',
  },
];

/**
 * Vista de Dominio UserProfileModuleView ("Actualizar mis datos")
 * Permite al usuario autenticado visualizar su ficha corporativa completa,
 * actualizar sus datos personales, cambiar su fotografía de perfil, actualizar
 * su contraseña y gestionar la renovación (Refresh Token) o expiración de su sesión.
 */
export const UserProfileModuleView: React.FC<UserProfileModuleViewProps> = ({
  session,
  rbacUseCases,
  sessionRemainingSeconds,
  autoRefreshEnabled,
  isRefreshingToken,
  onToggleAutoRefresh,
  onRefreshSessionToken,
  onSimulateExpirationCountdown,
  onUpdateSession,
  onLogout,
}) => {
  const [names, setNames] = useState(session.names);
  const [surnames, setSurnames] = useState(session.surnames);
  const [email, setEmail] = useState(session.email);
  const [identificationTypeCode, setIdentificationTypeCode] = useState(
    session.identificationTypeCode
  );
  const [identificationNumber, setIdentificationNumber] = useState(
    session.identificationNumber
  );
  const [establishmentId, setEstablishmentId] = useState(session.establishmentId);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [modalNotice, setModalNotice] = useState<FriendlyNotice | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initials = session.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const formatCountdown = (totalSeconds: number): string => {
    const safe = Math.max(0, totalSeconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSavePersonalData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const selectedEst =
      ESTABLISHMENT_OPTIONS.find((opt) => opt.value === establishmentId)?.label ??
      session.establishmentName;

    const result = await rbacUseCases.updateUser(session.id, {
      names,
      surnames,
      email,
      identificationTypeCode,
      identificationNumber,
      roles: session.roles,
      establishmentId,
      isActive: true,
    });

    setIsSavingProfile(false);

    if (result.isFailure) {
      setModalNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          result.error!,
          'Revisa la información de tu perfil'
        )
      );
      return;
    }

    const updatedSession = session.withUpdatedProfile({
      names: names.trim(),
      surnames: surnames.trim(),
      fullName: `${names.trim()} ${surnames.trim()}`.trim(),
      email: email.trim().toLowerCase(),
      identificationTypeCode,
      identificationNumber: identificationNumber.trim(),
      establishmentId,
      establishmentName: selectedEst,
    });

    onUpdateSession(updatedSession);
    setModalNotice({
      title: 'Tus datos han sido actualizados',
      message:
        'Tu información personal y corporativa se guardó correctamente y ya se encuentra reflejada en tu sesión activa.',
      tone: 'info',
      actionLabel: 'Excelente',
    });
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64Content = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

      const res = await rbacUseCases.uploadPhoto(session.id, {
        fileName: file.name,
        content: base64Content,
        mimeType: file.type || 'image/jpeg',
      });

      setIsUploadingPhoto(false);

      if (res.isFailure) {
        setModalNotice(
          FriendlyErrorMapper.toFriendlyNotice(
            res.error!,
            'No se pudo actualizar la fotografía'
          )
        );
        return;
      }

      const updatedUser = res.getValue();
      const updatedSession = session.withUpdatedProfile({
        photoUrl: updatedUser.raw.photoUrl || dataUrl,
      });
      onUpdateSession(updatedSession);

      setModalNotice({
        title: 'Fotografía de perfil actualizada',
        message: 'Tu nueva imagen de perfil se ha sincronizado en la cabecera del sistema.',
        tone: 'info',
        actionLabel: 'Entendido',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);

    const result = await rbacUseCases.resetPassword({
      targetUserId: session.id,
      newPassword,
      confirmPassword,
    });

    setIsSavingPassword(false);

    if (result.isFailure) {
      setModalNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          result.error!,
          'Revisa tu nueva contraseña'
        )
      );
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setModalNotice({
      title: 'Contraseña actualizada con éxito',
      message:
        'Tu clave de acceso ha sido actualizada de forma segura. Se utilizará en tu próximo inicio de sesión.',
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  const handleManualTokenRefresh = async () => {
    const ok = await onRefreshSessionToken();
    if (ok) {
      setModalNotice({
        title: 'Sesión renovada (Refresh Token)',
        message:
          'Se generó un nuevo par de tokens de seguridad y el contador de vigencia de tu sesión se ha reiniciado a 05:00 minutos.',
        tone: 'info',
        actionLabel: 'Continuar',
      });
    } else {
      setModalNotice({
        title: 'No fue posible renovar la sesión',
        message:
          'En este momento no se pudo renovar el token automáticamente. Si el tiempo llega a cero, deberás iniciar sesión nuevamente.',
        tone: 'warning',
        actionLabel: 'Entendido',
      });
    }
  };

  const progressPct = Math.min(100, Math.max(0, (sessionRemainingSeconds / 300) * 100));
  const isExpiringSoon = sessionRemainingSeconds <= 60;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 0.95fr) minmax(360px, 1.35fr)',
        gap: '22px',
        alignItems: 'start',
      }}
    >
      {/* Columna Izquierda: Ficha Corporativa Completa + Control de Sesión y Refresh Token */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Tarjeta 1: Resumen Completo del Perfil */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {session.photoUrl ? (
              <img
                src={session.photoUrl}
                alt={session.fullName}
                style={{
                  width: '78px',
                  height: '78px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #EEF2FF',
                  boxShadow: '0 8px 20px rgba(77, 83, 244, 0.2)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '78px',
                  height: '78px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4D53F4 0%, #818CF8 100%)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.45rem',
                  boxShadow: '0 10px 22px rgba(77, 83, 244, 0.28)',
                  flexShrink: 0,
                }}
              >
                {initials || 'NS'}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Typography as="h2" variant="h2" style={{ fontSize: '1.18rem' }}>
                {session.fullName}
              </Typography>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Badge tone="brand">{session.primaryRoleLabel}</Badge>
                <Badge tone="success">Cuenta Verificada</Badge>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoFileChange}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={isUploadingPhoto}
                  leftIcon={<Icon name="image" size={14} />}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginTop: '4px' }}
                >
                  Cambiar fotografía
                </Button>
              </div>
            </div>
          </div>

          <Divider margin="2px 0" />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.83rem',
              backgroundColor: '#F8FAFC',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#64748B' }}>ID de Usuario:</span>
              <code style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.77rem' }}>
                {session.id}
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#64748B' }}>Correo Corporativo:</span>
              <strong style={{ color: '#0F172A' }}>{session.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#64748B' }}>Documento DIAN:</span>
              <strong style={{ color: '#0F172A' }}>
                Tipo {session.identificationTypeCode} • {session.identificationNumber}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#64748B' }}>Establecimiento POS:</span>
              <strong style={{ color: '#0F172A', textAlign: 'right' }}>
                {session.establishmentName}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#64748B' }}>Roles Asignados:</span>
              <strong style={{ color: '#4D53F4' }}>{session.roles.join(', ')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ color: '#64748B' }}>Alcance de Permisos:</span>
              <strong style={{ color: '#047857' }}>
                {session.permissions.includes('superAdmin:*')
                  ? 'Acceso Total (superAdmin:*)'
                  : session.permissions.join(', ')}
              </strong>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            leftIcon={<Icon name="logout" size={16} />}
            onClick={onLogout}
            style={{
              color: '#DC2626',
              borderColor: '#FECACA',
              backgroundColor: '#FFF5F5',
            }}
          >
            Cerrar Sesión en este Dispositivo
          </Button>
        </div>

        {/* Tarjeta 2: Seguridad de Sesión, Refresh Token y Expiración por Tiempo */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography as="h3" variant="h2" style={{ fontSize: '1.05rem' }}>
                Vigencia de Sesión & Refresh Token
              </Typography>
              <Typography variant="caption" tone="muted">
                Cuando el tiempo llega a 00:00 sin renovarse, la sesión se cierra automáticamente
              </Typography>
            </div>
            <Badge tone={isExpiringSoon ? 'danger' : 'brand'}>
              {formatCountdown(sessionRemainingSeconds)}
            </Badge>
          </div>

          {/* Barra de Progreso del Token */}
          <div
            style={{
              width: '100%',
              height: '10px',
              backgroundColor: '#E2E8F0',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                backgroundColor: isExpiringSoon ? '#EF4444' : '#4D53F4',
                transition: 'width 0.6s linear, background-color 0.3s ease',
              }}
            />
          </div>

          <Checkbox
            id="auto-refresh-toggle"
            checked={autoRefreshEnabled}
            onChange={(checked) => onToggleAutoRefresh(checked)}
            label="Renovar sesión automáticamente (Refresh Token) antes de que caduque el tiempo"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isRefreshingToken}
              leftIcon={<Icon name="refresh" size={15} />}
              onClick={handleManualTokenRefresh}
            >
              Ejecutar Refresh Token
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Icon name="lock" size={15} />}
              onClick={() => onSimulateExpirationCountdown(10)}
              style={{
                color: '#B45309',
                borderColor: '#FDE68A',
                backgroundColor: '#FFFBEB',
              }}
            >
              Probar Expiración (10s)
            </Button>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Formularios para Actualizar Datos Personales y Contraseña */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Formulario 1: Actualizar mis Datos Personales */}
        <form
          onSubmit={handleSavePersonalData}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '26px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography as="h2" variant="h2">
                Actualizar mis Datos Personales
              </Typography>
              <Typography variant="caption" tone="muted">
                Modifica tu nombre, correo electrónico, documento DIAN y sede principal
              </Typography>
            </div>
            <Badge tone="brand">Perfil Activo</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField
              id="profile-names"
              label="Nombres"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Ej. Administrador Principal"
              required
            />
            <FormField
              id="profile-surnames"
              label="Apellidos"
              value={surnames}
              onChange={(e) => setSurnames(e.target.value)}
              placeholder="Ej. del Sistema POS"
              required
            />
          </div>

          <FormField
            id="profile-email"
            type="email"
            label="Correo Electrónico Corporativo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@factuspos.com"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '14px' }}>
            <SelectField
              id="profile-doc-type"
              label="Tipo de Documento DIAN"
              value={identificationTypeCode}
              options={IDENTIFICATION_TYPE_OPTIONS}
              onChange={(e) => setIdentificationTypeCode(e.target.value)}
            />
            <FormField
              id="profile-doc-number"
              label="Número de Identificación"
              value={identificationNumber}
              onChange={(e) => setIdentificationNumber(e.target.value)}
              placeholder="1020304050"
              required
            />
          </div>

          <SelectField
            id="profile-establishment"
            label="Sede / Establecimiento POS Asignado"
            value={establishmentId}
            options={ESTABLISHMENT_OPTIONS}
            onChange={(e) => setEstablishmentId(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingProfile}
              leftIcon={<Icon name="check" size={16} />}
            >
              Guardar Cambios en mis Datos
            </Button>
          </div>
        </form>

        {/* Formulario 2: Actualizar Contraseña de Acceso */}
        <form
          onSubmit={handleUpdatePassword}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '26px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography as="h2" variant="h2">
                Cambiar mi Contraseña de Acceso
              </Typography>
              <Typography variant="caption" tone="muted">
                Asigna una nueva contraseña segura de mínimo 8 caracteres para tu cuenta
              </Typography>
            </div>
            <Badge tone="neutral">Seguridad</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <PasswordField
              id="profile-new-password"
              label="Nueva Contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />
            <PasswordField
              id="profile-confirm-password"
              label="Confirmar Nueva Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="outline"
              size="md"
              isLoading={isSavingPassword}
              leftIcon={<Icon name="lock" size={16} />}
            >
              Actualizar Contraseña
            </Button>
          </div>
        </form>
      </div>

      <FriendlyModal
        isOpen={Boolean(modalNotice)}
        title={modalNotice?.title ?? ''}
        message={modalNotice?.message ?? ''}
        tone={modalNotice?.tone}
        actionLabel={modalNotice?.actionLabel}
        onClose={() => setModalNotice(null)}
      />
    </div>
  );
};
