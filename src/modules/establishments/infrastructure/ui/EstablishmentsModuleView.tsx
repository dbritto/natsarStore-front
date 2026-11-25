import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  DialogModal,
  FormField,
  FriendlyModal,
  Icon,
  SelectField,
  StatMetricCard,
  TrendPill,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import {
  EstablishmentModel,
  SaveEstablishmentDraft,
} from '../../domain/models/Establishment.model';
import { EstablishmentUseCases } from '../../application/use-cases/EstablishmentUseCases';

export interface EstablishmentsModuleViewProps {
  establishmentUseCases: EstablishmentUseCases;
}

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo Sedes POS & Establecimientos)
 * Construido 100% con `@shared/components` (Atomic Design) y errores suavizados con `FriendlyModal`.
 */
export const EstablishmentsModuleView: React.FC<EstablishmentsModuleViewProps> = ({
  establishmentUseCases,
}) => {
  const [establishments, setEstablishments] = useState<EstablishmentModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SaveEstablishmentDraft>({
    code: '',
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    municipalityId: '68001',
    isMain: false,
    isActive: true,
  });

  const loadEstablishments = async () => {
    const res = await establishmentUseCases.getEstablishments(searchQuery);
    if (res.isSuccess) setEstablishments(res.getValue());
  };

  useEffect(() => {
    void loadEstablishments();
  }, [searchQuery]);

  const openCreateModal = () => {
    setEditingId(null);
    setDraft({
      code: '',
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      municipalityId: '68001',
      isMain: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (est: EstablishmentModel) => {
    setEditingId(est.id);
    setDraft({
      code: est.code,
      name: est.name,
      address: est.address,
      phoneNumber: est.phoneNumber,
      email: est.email,
      municipalityId: est.raw.municipalityId ?? '68001',
      isMain: est.isMain,
      isActive: est.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const res = editingId
      ? await establishmentUseCases.updateEstablishment(editingId, draft)
      : await establishmentUseCases.createEstablishment(draft);

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Revisa los datos de la sede')
      );
      return;
    }

    setIsModalOpen(false);
    await loadEstablishments();
    setFriendlyNotice({
      title: editingId ? 'Sede POS actualizada' : 'Nueva sede POS creada',
      message: `La sucursal "${res.getValue().name}" quedó registrada correctamente en NatsarStore.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleDelete = async (est: EstablishmentModel) => {
    const res = await establishmentUseCases.deleteEstablishment(est);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Sede principal protegida')
      );
      return;
    }
    await loadEstablishments();
    setFriendlyNotice({
      title: 'Sede retirada',
      message: `La sucursal "${est.name}" fue desactivada correctamente.`,
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
          title="Sedes Comerciales POS"
          value={String(establishments.length)}
          trendValue="En Línea"
          trendDirection="up"
          comparisonLine1="Puntos de venta"
          comparisonLine2="habilitados DIAN"
          icon="store"
        />
        <StatMetricCard
          title="Sede Principal"
          value="1 Casa Matriz"
          trendValue="Protegida"
          trendDirection="up"
          comparisonLine1="Resolución SETP"
          comparisonLine2="990000000 activa"
          icon="building"
        />
        <StatMetricCard
          title="Ciudades de Operación"
          value="2 Regiones"
          trendValue="Nacional"
          trendDirection="up"
          comparisonLine1="Bucaramanga y"
          comparisonLine2="Bogotá D.C."
          icon="truck"
        />
      </div>

      {/* Buscador + Botón Nueva Sede */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
          <FormField
            placeholder="Buscar sede por nombre, código o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSlot={<Icon name="search" size={17} />}
          />
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<Icon name="plus" size={17} />}
          onClick={openCreateModal}
        >
          Nueva Sede POS
        </Button>
      </div>

      {/* Grilla de Tarjetas de Sedes (/api/v1/establishments) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '18px',
        }}
      >
        {establishments.map((est) => (
          <div
            key={est.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
              border: est.isMain
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
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                  {est.name}
                </span>
                {est.isMain ? (
                  <TrendPill value="Sede Principal" direction="up" />
                ) : (
                  <Badge tone="neutral">Sucursal</Badge>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge tone="brand">{est.code}</Badge>
                <span style={{ fontSize: '0.77rem', color: '#64748B', fontWeight: 600 }}>
                  {est.municipalityLabel}
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                <span>
                  📍 <strong>Dirección:</strong> {est.address}
                </span>
                <span>
                  📞 <strong>Teléfono:</strong> {est.phoneNumber}
                </span>
                <span>
                  ✉️ <strong>Correo:</strong> {est.email}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px solid #F1F5F9',
              }}
            >
              <Badge tone="success" dot>
                Operativa
              </Badge>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Icon name="edit" size={14} />}
                  onClick={() => openEditModal(est)}
                >
                  Editar
                </Button>
                {!est.isMain && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDelete(est)}
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

      {/* MODAL CREAR / EDITAR SEDE POS */}
      <DialogModal
        isOpen={isModalOpen}
        title={editingId ? 'Editar Sede Comercial POS' : 'Registrar Nueva Sede POS'}
        subtitle="Configura los datos fiscales y de ubicación de la sucursal comercial"
        maxWidth="560px"
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSave()}>
              {editingId ? 'Guardar Cambios' : 'Crear Sede'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              label="Código Único de Sede*"
              placeholder="Ej: POS-SEDE-SUR"
              disabled={Boolean(editingId)}
              value={draft.code}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
            />
            <SelectField
              label="Ciudad / Municipio DIAN*"
              value={draft.municipalityId ?? '68001'}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, municipalityId: e.target.value }))
              }
              options={[
                { value: '68001', label: '68001 - Bucaramanga' },
                { value: '11001', label: '11001 - Bogotá D.C.' },
                { value: '05001', label: '05001 - Medellín' },
                { value: '76001', label: '76001 - Cali' },
              ]}
            />
          </div>

          <FormField
            label="Nombre Comercial de la Sede*"
            placeholder="Ej: Sucursal Sur Cañaveral"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
          />

          <FormField
            label="Dirección Física*"
            placeholder="Ej: Calle 30 # 25 - 10 Local 14"
            value={draft.address}
            onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '12px' }}>
            <FormField
              label="Teléfono de Contacto*"
              placeholder="6076990011"
              value={draft.phoneNumber}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))
              }
            />
            <FormField
              type="email"
              label="Correo Electrónico de la Sede*"
              placeholder="sucursal.sur@natsarstore.com"
              value={draft.email}
              onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <Checkbox
            id="is-main-est-check"
            checked={Boolean(draft.isMain)}
            onChange={(checked) => setDraft((prev) => ({ ...prev, isMain: checked }))}
            label="Designar como Sede Principal (Casa Matriz) del comercio"
          />
        </div>
      </DialogModal>

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
