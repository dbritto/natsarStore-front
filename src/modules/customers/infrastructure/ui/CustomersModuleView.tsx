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
  SelectField,
  StatMetricCard,
  TabSwitcher,
  TrendPill,
  Typography,
} from '@shared/components';
import { FriendlyErrorMapper, FriendlyNotice } from '@shared/domain/FriendlyErrorMapper';
import {
  CustomerModel,
  CustomerTributeCode,
  CustomerType,
  FiscalResponsibilityCode,
  LegalOrganizationCode,
  PaymentFormCode,
  SaveCustomerDraft,
} from '../../domain/models/Customer.model';
import {
  TaxCalculationItemInput,
  TaxLiquidationModel,
} from '../../domain/models/TaxLiquidation.model';
import { CustomerUseCases } from '../../application/use-cases/CustomerUseCases';

export interface CustomersModuleViewProps {
  customerUseCases: CustomerUseCases;
}

type CustomersTabId = 'directory' | 'tax-engine';

const FISCAL_RESPONSIBILITY_LIST: Array<{
  code: FiscalResponsibilityCode;
  label: string;
}> = [
  { code: 'O-13', label: 'O-13 • Gran Contribuyente' },
  { code: 'O-15', label: 'O-15 • Autorretenedor' },
  { code: 'O-23', label: 'O-23 • Agente de Retención IVA' },
  { code: 'O-47', label: 'O-47 • Régimen Simple de Tributación' },
  { code: 'R-99-PN', label: 'R-99-PN • No Responsable / Estándar' },
];

const INITIAL_SIMULATION_ITEMS: TaxCalculationItemInput[] = [
  {
    codeReference: 'POS-SCAN-2D',
    name: 'Lector Código de Barras Inalámbrico 2D',
    quantity: 2,
    unitPrice: 285000,
    discountAmount: 0,
    isTaxExcluded: false,
    taxRate: 19,
    tributeCode: '01',
  },
  {
    codeReference: 'CAFE-HUI-500',
    name: 'Café Especial Origen Huila 500g',
    quantity: 4,
    unitPrice: 38500,
    discountAmount: 0,
    isTaxExcluded: false,
    taxRate: 8,
    tributeCode: '04',
  },
];

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo de Clientes & Motor Tributario DIAN)
 * Construido 100% con `@shared/components` (Atomic Design) y errores suavizados con `FriendlyModal`.
 */
export const CustomersModuleView: React.FC<CustomersModuleViewProps> = ({
  customerUseCases,
}) => {
  const [activeTab, setActiveTab] = useState<CustomersTabId>('directory');
  const [customers, setCustomers] = useState<CustomerModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CustomerType | ''>('');

  // Modal amigable compartido
  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);

  // Modal Crear / Editar Cliente
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerDraft, setCustomerDraft] = useState<SaveCustomerDraft>({
    customerType: 'EMPRESA',
    identificationDocumentCode: '31',
    identification: '',
    legalOrganizationCode: '1',
    names: '',
    tradeName: '',
    tributeCode: '01',
    responsibilities: ['R-99-PN'],
    municipalityCode: '68001',
    address: '',
    email: '',
    phone: '',
    defaultPaymentFormCode: '2',
    creditDays: 30,
    isActive: true,
  });

  // Estado del Motor Tributario DIAN (/api/v1/customers/:id/calculate-taxes)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    'c0000000-0000-4000-8000-000000000003'
  );
  const [simItems, setSimItems] = useState<TaxCalculationItemInput[]>(
    INITIAL_SIMULATION_ITEMS
  );
  const [liquidation, setLiquidation] = useState<TaxLiquidationModel | null>(null);

  // Nuevo renglón para el simulador fiscal
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('150000');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemTribute, setNewItemTribute] = useState<'01' | '04' | 'ZZ'>('01');

  const loadCustomers = async () => {
    const res = await customerUseCases.getCustomers({
      search: searchQuery,
      customerType: filterType,
    });
    if (res.isSuccess) {
      const list = res.getValue();
      setCustomers(list);
      if (list.length > 0 && !list.some((c) => c.id === selectedCustomerId)) {
        setSelectedCustomerId(list[0].id);
      }
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, [searchQuery, filterType]);

  const selectedCustomerObj = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) ?? customers[0] ?? null,
    [customers, selectedCustomerId]
  );

  // Ejecutar motor de liquidación cada vez que cambie el cliente o los renglones
  useEffect(() => {
    if (!selectedCustomerObj || simItems.length === 0) {
      setLiquidation(null);
      return;
    }
    void customerUseCases
      .calculateCustomerTaxes(selectedCustomerObj, simItems)
      .then((res) => {
        if (res.isSuccess) setLiquidation(res.getValue());
      });
  }, [selectedCustomerObj, simItems]);

  const kpis = useMemo(() => {
    const companies = customers.filter((c) => c.raw.customerType === 'EMPRESA').length;
    const withholdingAgents = customers.filter((c) => c.isWithholdingAgent).length;
    const creditCustomers = customers.filter(
      (c) => c.raw.defaultPaymentFormCode === '2'
    ).length;

    return {
      total: customers.length,
      companies,
      withholdingAgents,
      creditCustomers,
    };
  }, [customers]);

  // DV calculado en vivo dentro del modal cuando el documento es NIT ('31')
  const liveCalculatedDv = useMemo(() => {
    if (
      customerDraft.identificationDocumentCode === '31' &&
      customerDraft.identification.trim().length >= 4
    ) {
      return CustomerModel.calculateDianDv(customerDraft.identification);
    }
    return null;
  }, [customerDraft.identificationDocumentCode, customerDraft.identification]);

  const openCreateCustomerModal = () => {
    setEditingCustomerId(null);
    setCustomerDraft({
      customerType: 'EMPRESA',
      identificationDocumentCode: '31',
      identification: '',
      legalOrganizationCode: '1',
      names: '',
      tradeName: '',
      tributeCode: '01',
      responsibilities: ['R-99-PN'],
      municipalityCode: '68001',
      address: '',
      email: '',
      phone: '',
      defaultPaymentFormCode: '2',
      creditDays: 30,
      isActive: true,
    });
    setIsCustomerModalOpen(true);
  };

  const openEditCustomerModal = (cust: CustomerModel) => {
    const raw = cust.raw;
    setEditingCustomerId(cust.id);
    setCustomerDraft({
      customerType: raw.customerType,
      identificationDocumentCode: raw.identificationDocumentCode,
      identification: raw.identification,
      dv: raw.dv,
      legalOrganizationCode: raw.legalOrganizationCode,
      company: raw.company,
      tradeName: raw.tradeName ?? '',
      names: raw.names,
      tributeCode: raw.tributeCode,
      responsibilities: [...raw.responsibilities],
      municipalityCode: raw.municipalityCode ?? '68001',
      address: raw.address,
      email: raw.email,
      phone: raw.phone,
      defaultPaymentFormCode: raw.defaultPaymentFormCode,
      creditDays: raw.creditDays,
      isActive: raw.isActive,
    });
    setIsCustomerModalOpen(true);
  };

  const toggleResponsibility = (code: FiscalResponsibilityCode) => {
    setCustomerDraft((prev) => {
      const exists = prev.responsibilities.includes(code);
      if (exists) {
        const next = prev.responsibilities.filter((r) => r !== code);
        return { ...prev, responsibilities: next.length > 0 ? next : ['R-99-PN'] };
      }
      return { ...prev, responsibilities: [...prev.responsibilities, code] };
    });
  };

  const handleSaveCustomer = async () => {
    const res = editingCustomerId
      ? await customerUseCases.updateCustomer(editingCustomerId, customerDraft)
      : await customerUseCases.createCustomer(customerDraft);

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Revisa los datos del adquirente'
        )
      );
      return;
    }

    setIsCustomerModalOpen(false);
    await loadCustomers();
    const saved = res.getValue();
    setSelectedCustomerId(saved.id);
    setFriendlyNotice({
      title: editingCustomerId ? 'Adquirente actualizado' : 'Adquirente registrado',
      message: `El cliente "${saved.names}" (${saved.identificationFormatted}) quedó guardado en el maestro de facturación DIAN.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleAddSimItem = () => {
    const name = newItemName.trim() || 'Artículo Comercial POS';
    const price = Number(newItemPrice);
    const qty = Number(newItemQty);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(qty) || qty <= 0) {
      setFriendlyNotice({
        title: 'Verifica precio y cantidad',
        message: 'La cantidad y el precio unitario del renglón deben ser mayores a cero.',
        tone: 'warning',
        actionLabel: 'Revisar',
      });
      return;
    }

    const newItem: TaxCalculationItemInput = {
      codeReference: `ITEM-${simItems.length + 1}`,
      name,
      quantity: qty,
      unitPrice: price,
      discountAmount: 0,
      isTaxExcluded: newItemTribute === 'ZZ',
      taxRate: newItemTribute === '04' ? 8 : newItemTribute === 'ZZ' ? 0 : 19,
      tributeCode: newItemTribute === 'ZZ' ? '01' : newItemTribute,
    };

    setSimItems((prev) => [...prev, newItem]);
    setNewItemName('');
  };

  const handleRemoveSimItem = (idx: number) => {
    setSimItems((prev) => prev.filter((_, i) => i !== idx));
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
          title="Adquirentes Registrados"
          value={String(kpis.total)}
          trendValue="Anexo 1.9 DIAN"
          trendDirection="up"
          comparisonLine1="Empresas, personas"
          comparisonLine2="y consumidor final"
          icon="users"
        />
        <StatMetricCard
          title="Empresas con NIT"
          value={String(kpis.companies)}
          trendValue="DV Módulo 11"
          trendDirection="up"
          comparisonLine1="Personas jurídicas"
          comparisonLine2="verificadas"
          icon="building"
        />
        <StatMetricCard
          title="Agentes de Retención"
          value={String(kpis.withholdingAgents)}
          trendValue="ReteFuente / IVA"
          trendDirection="up"
          comparisonLine1="Grandes contribuyentes"
          comparisonLine2="y autorretenedores"
          icon="shield"
        />
        <StatMetricCard
          title="Clientes con Cupo Crédito"
          value={String(kpis.creditCustomers)}
          trendValue="30-45 Días"
          trendDirection="up"
          comparisonLine1="Facturación a"
          comparisonLine2="plazo corporativo"
          icon="receipt"
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
        <TabSwitcher<CustomersTabId>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              id: 'directory',
              label: 'Directorio de Clientes DIAN',
              icon: 'users',
              count: customers.length,
            },
            {
              id: 'tax-engine',
              label: 'Motor de Liquidación Tributaria',
              icon: 'calculator',
            },
          ]}
        />

        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<Icon name="plus" size={17} />}
          onClick={openCreateCustomerModal}
        >
          Nuevo Cliente DIAN
        </Button>
      </div>

      {/* VISTA 1: DIRECTORIO DE CLIENTES ADQUIRENTES (/api/v1/customers) */}
      {activeTab === 'directory' && (
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
              placeholder="Buscar adquirente por razón social, nombre, NIT, cédula o correo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSlot={<Icon name="search" size={17} />}
            />

            <SelectField
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CustomerType | '')}
              options={[
                { value: '', label: 'Todos los tipos de adquirente' },
                { value: 'EMPRESA', label: 'Empresas / Personas Jurídicas (NIT)' },
                { value: 'PARTICULAR', label: 'Personas Naturales (Cédula)' },
                { value: 'CONSUMIDOR_FINAL', label: 'Consumidor Final POS (222222222222)' },
                { value: 'EXTRANJERO', label: 'Clientes Extranjeros' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customers.map((cust) => {
              const raw = cust.raw;
              return (
                <div
                  key={cust.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 22px',
                    borderRadius: '18px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                        {cust.names}
                      </span>
                      <Badge tone="brand">{cust.identificationFormatted}</Badge>
                      <Badge tone="neutral">{cust.customerTypeLabel}</Badge>
                      {cust.isWithholdingAgent && (
                        <TrendPill value="Agente Retenedor" direction="up" />
                      )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span>
                        Correo FEV: <strong>{raw.email || 'No registrado'}</strong>
                      </span>
                      <span>
                        Tel: <strong>{raw.phone || 'N/A'}</strong>
                      </span>
                      <span>
                        Dirección: <strong>{raw.address}</strong>
                      </span>
                      <span>
                        Pago:{' '}
                        <strong>
                          {raw.defaultPaymentFormCode === '2'
                            ? `Crédito (${raw.creditDays} días)`
                            : 'Contado'}
                        </strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <Badge tone="brand">{cust.tributeLabel}</Badge>
                      {raw.responsibilities.map((resp) => (
                        <Badge key={resp} tone="neutral">
                          {resp}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Button
                      type="button"
                      variant="subtle"
                      size="sm"
                      leftIcon={<Icon name="calculator" size={15} />}
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setActiveTab('tax-engine');
                      }}
                    >
                      Liquidar Impuestos
                    </Button>
                    {!cust.isConsumidorFinal && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Icon name="edit" size={14} />}
                        onClick={() => openEditCustomerModal(cust)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: MOTOR DE LIQUIDACIÓN TRIBUTARIA DIAN (/api/v1/customers/:id/calculate-taxes) */}
      {activeTab === 'tax-engine' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(340px, 1.15fr) minmax(340px, 0.95fr)',
            gap: '22px',
            alignItems: 'start',
          }}
        >
          {/* Columna Izquierda: Selección de Adquirente y Renglones de Pre-Factura */}
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
            <div>
              <Typography as="h2" variant="h2">
                Configuración de Pre-Factura (`/calculate-taxes`)
              </Typography>
              <Typography variant="caption" tone="muted">
                Selecciona el cliente adquirente y los ítems para simular IVA, INC y Retenciones
              </Typography>
            </div>

            <SelectField
              label="Adquirente / Pagador DIAN"
              value={selectedCustomerObj?.id ?? ''}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.names} (${c.identificationFormatted})`,
              }))}
            />

            {selectedCustomerObj && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  backgroundColor: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#1E1B4B' }}>
                  <strong>Perfil Fiscal:</strong> {selectedCustomerObj.customerTypeLabel} •{' '}
                  {selectedCustomerObj.tributeLabel} • Resp:{' '}
                  {selectedCustomerObj.raw.responsibilities.join(', ')}
                </div>
                <Badge tone={selectedCustomerObj.isWithholdingAgent ? 'brand' : 'neutral'}>
                  {selectedCustomerObj.isWithholdingAgent
                    ? 'Practica Retenciones'
                    : 'Sin Retenciones'}
                </Badge>
              </div>
            )}

            <Divider label="Agregar Renglón a la Simulación" margin="2px 0" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 0.7fr 1fr 1fr auto',
                gap: '8px',
                alignItems: 'flex-end',
              }}
            >
              <FormField
                label="Concepto / Producto"
                placeholder="Ej: Café o Servicio"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <FormField
                type="number"
                label="Cant."
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
              />
              <FormField
                type="number"
                label="Precio Unit."
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
              <SelectField
                label="Tributo"
                value={newItemTribute}
                onChange={(e) =>
                  setNewItemTribute(e.target.value as '01' | '04' | 'ZZ')
                }
                options={[
                  { value: '01', label: 'IVA 19%' },
                  { value: '04', label: 'INC 8%' },
                  { value: 'ZZ', label: 'Exento 0%' },
                ]}
              />
              <Button type="button" variant="subtle" onClick={handleAddSimItem}>
                +
              </Button>
            </div>

            {/* Renglones actuales */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {simItems.map((item, idx) => (
                <div
                  key={`${item.codeReference}-${idx}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>
                      {item.name}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {item.quantity} uds × $ {item.unitPrice.toLocaleString('es-CO')} •{' '}
                      {item.isTaxExcluded
                        ? 'Excluido 0%'
                        : item.tributeCode === '04'
                        ? `INC ${item.taxRate}%`
                        : `IVA ${item.taxRate}%`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>
                      $ {(item.quantity * item.unitPrice).toLocaleString('es-CO')}
                    </strong>
                    {simItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSimItem(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontWeight: 800,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Resultado de Liquidación Tributaria DIAN */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(226, 232, 240, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography as="h2" variant="h2">
                Liquidación Oficial DIAN
              </Typography>
              <Badge tone="success" dot>
                UBL 2.1 Anexo 1.9
              </Badge>
            </div>

            {liquidation && (
              <>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Base Gravable Subtotal:</span>
                    <strong>{TaxLiquidationModel.formatCop(liquidation.result.taxableBase)}</strong>
                  </div>

                  {/* Impuestos (IVA / INC) */}
                  {liquidation.result.taxes.map((t, i) => (
                    <div
                      key={`${t.code}-${i}`}
                      style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}
                    >
                      <span>
                        + {t.code === '04' ? 'INC' : 'IVA'} ({t.rate}%):
                      </span>
                      <strong>+ {TaxLiquidationModel.formatCop(t.amount)}</strong>
                    </div>
                  ))}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: '1px dashed #CBD5E1',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>Total Factura Electrónica:</span>
                    <strong>{TaxLiquidationModel.formatCop(liquidation.result.totalInvoice)}</strong>
                  </div>

                  {/* Retenciones Practicadas (ReteFuente, ReteIVA, ReteICA) */}
                  {liquidation.result.withholdings.length > 0 && (
                    <>
                      <Divider label="Retenciones Practicadas" margin="4px 0" />
                      {liquidation.result.withholdings.map((w) => (
                        <div
                          key={w.code}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#B45309',
                          }}
                        >
                          <span>
                            - {w.name} ({w.rate}%):
                          </span>
                          <strong>- {TaxLiquidationModel.formatCop(w.amount)}</strong>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Caja destacada de Total Neto a Pagar */}
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #4D53F4 0%, #3730A3 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: '0.76rem', color: 'rgba(255,255,255,0.8)' }}>
                      Neto Real a Recaudar en Caja
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                      (Total Factura - Retenciones)
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
                    {TaxLiquidationModel.formatCop(liquidation.result.netPayable)}
                  </span>
                </div>

                {/* Explicación de reglas tributarias */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {liquidation.result.notes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        backgroundColor: '#F1F5F9',
                        fontSize: '0.77rem',
                        color: '#475569',
                        lineHeight: 1.45,
                      }}
                    >
                      ℹ️ {note}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CLIENTE ADQUIRENTE DIAN */}
      <DialogModal
        isOpen={isCustomerModalOpen}
        title={editingCustomerId ? 'Editar Adquirente DIAN' : 'Nuevo Cliente / Adquirente DIAN'}
        subtitle="Incluye cálculo automático en tiempo real del Dígito de Verificación (DV) oficial por Módulo 11"
        maxWidth="660px"
        onClose={() => setIsCustomerModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveCustomer()}>
              {editingCustomerId ? 'Guardar Cambios' : 'Registrar Cliente'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <SelectField
              label="Tipo de Cliente*"
              value={customerDraft.customerType}
              onChange={(e) => {
                const cType = e.target.value as CustomerType;
                const isCompany = cType === 'EMPRESA';
                setCustomerDraft((prev) => ({
                  ...prev,
                  customerType: cType,
                  identificationDocumentCode: isCompany ? '31' : '13',
                  legalOrganizationCode: isCompany ? '1' : '2',
                  tributeCode: isCompany ? '01' : 'ZZ',
                }));
              }}
              options={[
                { value: 'EMPRESA', label: 'Empresa (Persona Jurídica)' },
                { value: 'PARTICULAR', label: 'Persona Natural' },
                { value: 'EXTRANJERO', label: 'Adquirente Extranjero' },
              ]}
            />

            <SelectField
              label="Tipo de Documento DIAN*"
              value={customerDraft.identificationDocumentCode}
              onChange={(e) =>
                setCustomerDraft((prev) => ({
                  ...prev,
                  identificationDocumentCode: e.target.value,
                }))
              }
              options={[
                { value: '31', label: '31 - NIT (Cálculo DV auto)' },
                { value: '13', label: '13 - Cédula de Ciudadanía' },
                { value: '22', label: '22 - Cédula de Extranjería' },
                { value: '41', label: '41 - Pasaporte' },
              ]}
            />

            <FormField
              label="Número NIT / Documento*"
              placeholder="Ej: 901458210"
              value={customerDraft.identification}
              rightLabelSlot={
                liveCalculatedDv !== null ? (
                  <Badge tone="brand">DV DIAN: -{liveCalculatedDv}</Badge>
                ) : undefined
              }
              onChange={(e) =>
                setCustomerDraft((prev) => ({ ...prev, identification: e.target.value }))
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '12px' }}>
            <FormField
              label={
                customerDraft.customerType === 'EMPRESA'
                  ? 'Razón Social Legal*'
                  : 'Nombre Completo*'
              }
              placeholder="Ej: COMERCIALIZADORA NATSAR S.A.S."
              value={customerDraft.names}
              onChange={(e) =>
                setCustomerDraft((prev) => ({ ...prev, names: e.target.value }))
              }
            />
            <FormField
              label="Nombre Comercial / Sigla"
              placeholder="Ej: Natsar Group"
              value={customerDraft.tradeName ?? ''}
              onChange={(e) =>
                setCustomerDraft((prev) => ({ ...prev, tradeName: e.target.value }))
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <SelectField
              label="Organización Jurídica"
              value={customerDraft.legalOrganizationCode}
              onChange={(e) =>
                setCustomerDraft((prev) => ({
                  ...prev,
                  legalOrganizationCode: e.target.value as LegalOrganizationCode,
                }))
              }
              options={[
                { value: '1', label: '1 - Persona Jurídica' },
                { value: '2', label: '2 - Persona Natural' },
              ]}
            />
            <SelectField
              label="Régimen de Tributo"
              value={customerDraft.tributeCode}
              onChange={(e) =>
                setCustomerDraft((prev) => ({
                  ...prev,
                  tributeCode: e.target.value as CustomerTributeCode,
                }))
              }
              options={[
                { value: '01', label: '01 - Responsable de IVA' },
                { value: '04', label: '04 - Impoconsumo (INC)' },
                { value: 'ZZ', label: 'ZZ - No Responsable de IVA' },
              ]}
            />
            <SelectField
              label="Municipio DIAN"
              value={customerDraft.municipalityCode ?? '68001'}
              onChange={(e) =>
                setCustomerDraft((prev) => ({ ...prev, municipalityCode: e.target.value }))
              }
              options={[
                { value: '68001', label: '68001 - Bucaramanga' },
                { value: '11001', label: '11001 - Bogotá D.C.' },
                { value: '05001', label: '05001 - Medellín' },
                { value: '76001', label: '76001 - Cali' },
              ]}
            />
          </div>

          {/* Responsabilidades Fiscales DIAN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.81rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Responsabilidades Fiscales en RUT (Determinan ReteFuente / ReteIVA)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {FISCAL_RESPONSIBILITY_LIST.map((resp) => (
                <Checkbox
                  key={resp.code}
                  id={`resp-${resp.code}`}
                  checked={customerDraft.responsibilities.includes(resp.code)}
                  onChange={() => toggleResponsibility(resp.code)}
                  label={resp.label}
                />
              ))}
            </div>
          </div>

          <Divider label="Contacto & Condiciones Comerciales" margin="4px 0" />

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
            <FormField
              type="email"
              label="Correo Recepción Factura Electrónica"
              placeholder="facturacion@empresa.co"
              value={customerDraft.email ?? ''}
              onChange={(e) =>
                setCustomerDraft((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <FormField
              label="Teléfono"
              placeholder="6076850000"
              value={customerDraft.phone ?? ''}
              onChange={(e) =>
                setCustomerDraft((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
            <FormField
              label="Dirección Fiscal"
              placeholder="Calle / Carrera # Ciudad"
              value={customerDraft.address ?? ''}
              onChange={(e) =>
                setCustomerDraft((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <SelectField
              label="Forma de Pago Predeterminada"
              value={customerDraft.defaultPaymentFormCode}
              onChange={(e) =>
                setCustomerDraft((prev) => ({
                  ...prev,
                  defaultPaymentFormCode: e.target.value as PaymentFormCode,
                }))
              }
              options={[
                { value: '1', label: '1 - Contado Inmediato' },
                { value: '2', label: '2 - Crédito Corporativo' },
              ]}
            />
            <FormField
              type="number"
              label="Plazo de Crédito (Días)"
              disabled={customerDraft.defaultPaymentFormCode === '1'}
              value={String(
                customerDraft.defaultPaymentFormCode === '1'
                  ? 0
                  : customerDraft.creditDays
              )}
              onChange={(e) =>
                setCustomerDraft((prev) => ({
                  ...prev,
                  creditDays: Number(e.target.value),
                }))
              }
            />
          </div>
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
