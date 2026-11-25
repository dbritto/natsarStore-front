import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  DialogModal,
  FormField,
  FriendlyModal,
  Icon,
  SelectField,
  StatMetricCard,
  TabSwitcher,
  TrendPill,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import {
  AppSettingModel,
  SaveAppSettingDraft,
} from '../../domain/models/AppSetting.model';
import {
  MediaAssetModel,
  MediaCategoryDto,
  SaveMediaCategoryDraft,
} from '../../domain/models/MediaAsset.model';
import { SettingsUseCases } from '../../application/use-cases/SettingsUseCases';

export interface SettingsModuleViewProps {
  settingsUseCases: SettingsUseCases;
}

type SettingsTabId = 'settings' | 'media' | 'media-categories';

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo Configuración Global & Gestor Multimedia)
 * Construido 100% con `@shared/components` (Atomic Design) y errores suavizados con `FriendlyModal`.
 */
export const SettingsModuleView: React.FC<SettingsModuleViewProps> = ({
  settingsUseCases,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('settings');
  const [settings, setSettings] = useState<AppSettingModel[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaAssetModel[]>([]);
  const [mediaCategories, setMediaCategories] = useState<MediaCategoryDto[]>([]);

  const [searchSetting, setSearchSetting] = useState('');
  const [filterMediaCat, setFilterMediaCat] = useState('');

  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);

  // Modal 1: Crear / Editar Parámetro Singleton (/api/v1/settings)
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [editingSettingId, setEditingSettingId] = useState<string | null>(null);
  const [settingDraft, setSettingDraft] = useState<SaveAppSettingDraft>({
    key: '',
    name: '',
    description: '',
    rawValueText: '{"enabled": true}',
  });

  // Modal 2: Crear Categoría Multimedia (/api/v1/media/categories)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<SaveMediaCategoryDraft>({
    name: '',
    description: '',
  });

  const loadAllSettingsData = async () => {
    const [setRes, medRes, catRes] = await Promise.all([
      settingsUseCases.getSettings(searchSetting),
      settingsUseCases.getMediaFiles(filterMediaCat || undefined),
      settingsUseCases.getMediaCategories(),
    ]);

    if (setRes.isSuccess) setSettings(setRes.getValue());
    if (medRes.isSuccess) setMediaFiles(medRes.getValue());
    if (catRes.isSuccess) setMediaCategories(catRes.getValue());
  };

  useEffect(() => {
    void loadAllSettingsData();
  }, [searchSetting, filterMediaCat]);

  const openCreateSettingModal = () => {
    setEditingSettingId(null);
    setSettingDraft({
      key: '',
      name: '',
      description: '',
      rawValueText: '{\n  "enabled": true\n}',
    });
    setIsSettingModalOpen(true);
  };

  const openEditSettingModal = (setting: AppSettingModel) => {
    setEditingSettingId(setting.id);
    setSettingDraft({
      key: setting.key,
      name: setting.name,
      description: setting.description ?? '',
      rawValueText: setting.formattedValueJson,
    });
    setIsSettingModalOpen(true);
  };

  const handleSaveSetting = async () => {
    const res = editingSettingId
      ? await settingsUseCases.updateSetting(editingSettingId, settingDraft)
      : await settingsUseCases.createSetting(settingDraft);

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Revisa la configuración del parámetro'
        )
      );
      return;
    }

    setIsSettingModalOpen(false);
    await loadAllSettingsData();
    setFriendlyNotice({
      title: 'Parámetro aplicado en caliente',
      message: `La configuración "${res.getValue().key}" fue hidratada en el Singleton de NatsarStore.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleDeleteSetting = async (setting: AppSettingModel) => {
    const res = await settingsUseCases.deleteSetting(setting);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Parámetro protegido')
      );
      return;
    }
    await loadAllSettingsData();
  };

  const handleUploadMediaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? '');
      const targetCatId = filterMediaCat || mediaCategories[0]?.id || 'mcat-001';
      const res = await settingsUseCases.uploadMedia({
        fileName: file.name,
        content: dataUrl,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size || 12400,
        categoryId: targetCatId,
      });

      if (res.isFailure) {
        setFriendlyNotice(FriendlyErrorMapper.toFriendlyNotice(res.error!));
        return;
      }

      await loadAllSettingsData();
      setFriendlyNotice({
        title: 'Archivo multimedia cargado',
        message: `El archivo "${file.name}" fue almacenado y clasificado correctamente.`,
        tone: 'info',
        actionLabel: 'Continuar',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMediaFile = async (id: string) => {
    await settingsUseCases.deleteMedia(id);
    await loadAllSettingsData();
  };

  const handleCreateMediaCategory = async () => {
    const res = await settingsUseCases.createMediaCategory(categoryDraft);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Revisa la categoría')
      );
      return;
    }

    setIsCategoryModalOpen(false);
    await loadAllSettingsData();
    setFriendlyNotice({
      title: 'Categoría multimedia creada',
      message: `La categoría "${res.getValue().name}" ya está disponible para clasificar archivos.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  const handleDeleteMediaCategory = async (cat: MediaCategoryDto) => {
    const res = await settingsUseCases.deleteMediaCategory(cat);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Categoría protegida')
      );
      return;
    }
    await loadAllSettingsData();
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
          title="Parámetros Singleton"
          value={String(settings.length)}
          trendValue="Hot-Reload"
          trendDirection="up"
          comparisonLine1="Hidratados desde"
          comparisonLine2="base de datos"
          icon="settings"
        />
        <StatMetricCard
          title="Archivos Multimedia"
          value={String(mediaFiles.length)}
          trendValue="Polimórfico"
          trendDirection="up"
          comparisonLine1="Imágenes, logos"
          comparisonLine2="y soportes PDF"
          icon="image"
        />
        <StatMetricCard
          title="Categorías Media"
          value={String(mediaCategories.length)}
          trendValue="Clasificación"
          trendDirection="up"
          comparisonLine1="Organización de"
          comparisonLine2="activos digitales"
          icon="tag"
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
        <TabSwitcher<SettingsTabId>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              id: 'settings',
              label: 'Parámetros Singleton',
              icon: 'settings',
              count: settings.length,
            },
            {
              id: 'media',
              label: 'Archivos Multimedia',
              icon: 'image',
              count: mediaFiles.length,
            },
            {
              id: 'media-categories',
              label: 'Categorías Media',
              icon: 'tag',
              count: mediaCategories.length,
            },
          ]}
        />

        <div>
          {activeTab === 'settings' && (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={openCreateSettingModal}
            >
              Nuevo Parámetro
            </Button>
          )}
          {activeTab === 'media' && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                height: '46px',
                padding: '0 20px',
                borderRadius: '12px',
                backgroundColor: '#4D53F4',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 20px -4px rgba(79, 85, 241, 0.28)',
              }}
            >
              <Icon name="plus" size={17} />
              <span>Subir Archivo Multimedia</span>
              <input
                type="file"
                onChange={handleUploadMediaFile}
                style={{ display: 'none' }}
              />
            </label>
          )}
          {activeTab === 'media-categories' && (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={() => {
                setCategoryDraft({ name: '', description: '' });
                setIsCategoryModalOpen(true);
              }}
            >
              Nueva Categoría Media
            </Button>
          )}
        </div>
      </div>

      {/* VISTA 1: PARÁMETROS SINGLETON (/api/v1/settings) */}
      {activeTab === 'settings' && (
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
          <FormField
            placeholder="Filtrar parámetro por llave (ej: INVENTORY_DEFAULT_MIN_STOCK) o nombre..."
            value={searchSetting}
            onChange={(e) => setSearchSetting(e.target.value)}
            leftSlot={<Icon name="search" size={17} />}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {settings.map((st) => (
              <div
                key={st.id}
                style={{
                  borderRadius: '20px',
                  padding: '20px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <code style={{ fontWeight: 800, fontSize: '0.83rem', color: '#4D53F4' }}>
                      {st.key}
                    </code>
                    {st.isSystem ? (
                      <Badge tone="brand">Sistema</Badge>
                    ) : (
                      <Badge tone="neutral">Personalizado</Badge>
                    )}
                  </div>

                  <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{st.name}</strong>
                  <p style={{ fontSize: '0.79rem', color: '#64748B', lineHeight: 1.4 }}>
                    {st.description || 'Sin descripción'}
                  </p>

                  <pre
                    style={{
                      marginTop: '4px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      backgroundColor: '#131622',
                      color: '#A5B4FC',
                      fontSize: '0.74rem',
                      overflowX: 'auto',
                    }}
                  >
                    {st.formattedValueJson}
                  </pre>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
                  <TrendPill value="Hidratado" direction="up" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Icon name="edit" size={14} />}
                      onClick={() => openEditSettingModal(st)}
                    >
                      Editar Valor
                    </Button>
                    {!st.isSystem && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteSetting(st)}
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
        </div>
      )}

      {/* VISTA 2: ARCHIVOS MULTIMEDIA (/api/v1/media) */}
      {activeTab === 'media' && (
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
          <div style={{ maxWidth: '340px' }}>
            <SelectField
              label="Filtrar por Categoría Multimedia"
              value={filterMediaCat}
              onChange={(e) => setFilterMediaCat(e.target.value)}
              options={[
                { value: '', label: 'Todas las categorías multimedia' },
                ...mediaCategories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mediaFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  padding: '15px 18px',
                  borderRadius: '16px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {file.isImage && file.props.url ? (
                    <img
                      src={file.props.url}
                      alt={file.props.fileName}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        backgroundColor: '#EEF2FF',
                        color: '#4D53F4',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="image" size={20} />
                    </div>
                  )}

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                      {file.props.fileName}
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                      MIME: {file.props.mimeType} • Tamaño: <strong>{file.formattedSize}</strong> • Fecha: {file.formattedDate}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Badge tone="brand">{file.props.categoryName}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDeleteMediaFile(file.id)}
                    style={{ color: '#EF4444' }}
                  >
                    <Icon name="trash" size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 3: CATEGORÍAS MULTIMEDIA (/api/v1/media/categories) */}
      {activeTab === 'media-categories' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {mediaCategories.map((cat) => (
            <div
              key={cat.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '22px',
                boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
                border: '1px solid rgba(226, 232, 240, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '0.96rem', color: '#0F172A' }}>{cat.name}</strong>
                  <Badge tone={cat.isSystem ? 'brand' : 'neutral'}>
                    {cat.isSystem ? 'Sistema' : 'Personalizada'}
                  </Badge>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '8px', lineHeight: 1.45 }}>
                  {cat.description || 'Sin descripción'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                <Badge tone="success" dot>
                  Activa
                </Badge>
                {!cat.isSystem && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDeleteMediaCategory(cat)}
                    style={{ color: '#EF4444' }}
                  >
                    <Icon name="trash" size={15} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: CREAR / EDITAR PARÁMETRO SINGLETON */}
      <DialogModal
        isOpen={isSettingModalOpen}
        title={editingSettingId ? 'Editar Parámetro Singleton' : 'Nuevo Parámetro del Sistema'}
        subtitle="El valor se hidratará automáticamente en memoria del servidor"
        maxWidth="540px"
        onClose={() => setIsSettingModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsSettingModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveSetting()}>
              Guardar Parámetro
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField
            label="Llave Única (UPPER_SNAKE_CASE)*"
            placeholder="Ej: POS_MAX_DISCOUNT_PCT"
            disabled={Boolean(editingSettingId)}
            value={settingDraft.key}
            onChange={(e) =>
              setSettingDraft((prev) => ({ ...prev, key: e.target.value.toUpperCase() }))
            }
          />
          <FormField
            label="Nombre Descriptivo*"
            placeholder="Ej: Porcentaje Máximo de Descuento en Caja"
            value={settingDraft.name}
            onChange={(e) => setSettingDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <FormField
            label="Descripción"
            placeholder="Explicación de uso del parámetro"
            value={settingDraft.description ?? ''}
            onChange={(e) =>
              setSettingDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <FormField
            label="Valor (JSON o Texto)*"
            placeholder='{"maxDiscountPct": 15}'
            value={settingDraft.rawValueText}
            onChange={(e) =>
              setSettingDraft((prev) => ({ ...prev, rawValueText: e.target.value }))
            }
          />
        </div>
      </DialogModal>

      {/* MODAL 2: CREAR CATEGORÍA MULTIMEDIA */}
      <DialogModal
        isOpen={isCategoryModalOpen}
        title="Nueva Categoría Multimedia"
        subtitle="Clasifica documentos, imágenes o actas en el repositorio"
        maxWidth="460px"
        onClose={() => setIsCategoryModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleCreateMediaCategory()}
            >
              Crear Categoría
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField
            label="Nombre de la Categoría*"
            placeholder="Ej: FACTURAS_PROVEEDORES"
            value={categoryDraft.name}
            onChange={(e) => setCategoryDraft((prev) => ({ ...prev, name: e.target.value }))}
          />
          <FormField
            label="Descripción"
            placeholder="Archivos que se almacenarán en esta categoría"
            value={categoryDraft.description ?? ''}
            onChange={(e) =>
              setCategoryDraft((prev) => ({ ...prev, description: e.target.value }))
            }
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
