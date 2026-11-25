import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  ColorDot,
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
  ProductCategoryModel,
  SaveCategoryDraft,
} from '../../domain/models/ProductCategory.model';
import {
  CatalogItemModel,
  CatalogItemType,
  DianTaxCode,
  ProductImageRecordDto,
  ProductStandardCode,
  SaveCatalogItemDraft,
} from '../../domain/models/CatalogItem.model';
import { BarcodeEntryProps } from '../../domain/value-objects/BarcodeEntry.vo';
import { BarcodeScanMatch } from '../../domain/ports/CatalogRepositoryPort';
import { CatalogUseCases } from '../../application/use-cases/CatalogUseCases';

export interface CatalogModuleViewProps {
  catalogUseCases: CatalogUseCases;
}

type CatalogTabId = 'items' | 'categories' | 'scanner';

const CATEGORY_COLOR_PRESETS = [
  '#4D53F4',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#06B6D4',
  '#8B5CF6',
  '#EF4444',
];

/**
 * Adaptador de Entrada UI (Driving Adapter - Módulo Catálogo Comercial)
 * Construido 100% con componentes de `@shared/components` (Atomic Design) y errores suavizados con `FriendlyModal`.
 */
export const CatalogModuleView: React.FC<CatalogModuleViewProps> = ({ catalogUseCases }) => {
  const [activeTab, setActiveTab] = useState<CatalogTabId>('items');
  const [categories, setCategories] = useState<ProductCategoryModel[]>([]);
  const [items, setItems] = useState<CatalogItemModel[]>([]);

  // Filtros de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<CatalogItemType | ''>('');

  // Modal amigable para errores y avisos al cliente
  const [friendlyNotice, setFriendlyNotice] = useState<FriendlyNotice | null>(null);

  // Estado Modal Crear/Editar Producto
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<SaveCatalogItemDraft>({
    itemType: 'PRODUCT',
    codeReference: '',
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    brand: '',
    standardCode: '999',
    unitMeasureCode: '94',
    basePrice: 0,
    unitCost: 0,
    isTaxExcluded: false,
    isTaxIncludedInPrice: true,
    defaultTaxCode: '01',
    defaultTaxRate: 19,
    trackInventory: true,
    barcodes: [],
    isActive: true,
  });
  const [newBarcodeText, setNewBarcodeText] = useState('');
  const [newBarcodeType, setNewBarcodeType] = useState('EAN13');
  const [newBarcodeFactor, setNewBarcodeFactor] = useState('1');

  // Estado Modal Crear/Editar Categoría
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<SaveCategoryDraft>({
    code: '',
    name: '',
    description: '',
    colorHex: '#4D53F4',
    sortOrder: 0,
    isActive: true,
  });

  // Estado Modal Galería Multi-Foto
  const [galleryItem, setGalleryItem] = useState<CatalogItemModel | null>(null);
  const [galleryImages, setGalleryImages] = useState<ProductImageRecordDto[]>([]);
  const [imageNotes, setImageNotes] = useState('');
  const [markUploadAsPrimary, setMarkUploadAsPrimary] = useState(true);

  // Estado Escáner de Código de Barras
  const [scannerInput, setScannerInput] = useState('7701234500018');
  const [scanResult, setScanResult] = useState<BarcodeScanMatch | null>(null);

  const loadCatalogData = async () => {
    const [catRes, itemRes] = await Promise.all([
      catalogUseCases.getCategories(),
      catalogUseCases.getItems({
        search: searchQuery,
        categoryId: selectedCategoryId || undefined,
        itemType: selectedItemType,
      }),
    ]);

    if (catRes.isSuccess) setCategories(catRes.getValue());
    if (itemRes.isSuccess) setItems(itemRes.getValue());
  };

  useEffect(() => {
    void loadCatalogData();
  }, [searchQuery, selectedCategoryId, selectedItemType]);

  // KPIs calculados desde los modelos de dominio
  const kpis = useMemo(() => {
    const totalBarcodes = items.reduce((acc, i) => acc + i.barcodes.length, 0);
    const avgMargin =
      items.length > 0
        ? (items.reduce((acc, i) => acc + i.grossMarginPct, 0) / items.length).toFixed(1)
        : '0.0';
    return {
      totalItems: items.length,
      totalCategories: categories.length,
      totalBarcodes,
      avgMargin,
    };
  }, [items, categories]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, { name: string; colorHex: string }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, colorHex: c.colorHex }));
    return map;
  }, [categories]);

  // Abrir modal para nuevo producto
  const openCreateItemModal = () => {
    setEditingItemId(null);
    setItemDraft({
      itemType: 'PRODUCT',
      codeReference: '',
      sku: '',
      name: '',
      description: '',
      categoryId: categories[0]?.id ?? '',
      brand: '',
      standardCode: '999',
      unitMeasureCode: '94',
      basePrice: 0,
      unitCost: 0,
      isTaxExcluded: false,
      isTaxIncludedInPrice: true,
      defaultTaxCode: '01',
      defaultTaxRate: 19,
      trackInventory: true,
      barcodes: [],
      isActive: true,
    });
    setNewBarcodeText('');
    setNewBarcodeFactor('1');
    setIsItemModalOpen(true);
  };

  // Abrir modal para editar producto existente
  const openEditItemModal = (item: CatalogItemModel) => {
    const raw = item.raw;
    setEditingItemId(item.id);
    setItemDraft({
      itemType: raw.itemType,
      codeReference: raw.codeReference,
      sku: raw.sku ?? '',
      name: raw.name,
      description: raw.description ?? '',
      categoryId: raw.categoryId ?? '',
      brand: raw.brand ?? '',
      standardCode: raw.standardCode,
      unitMeasureCode: raw.unitMeasureCode,
      basePrice: raw.basePrice,
      unitCost: raw.unitCost,
      isTaxExcluded: raw.isTaxExcluded,
      isTaxIncludedInPrice: raw.isTaxIncludedInPrice,
      defaultTaxCode: raw.defaultTaxCode,
      defaultTaxRate: raw.defaultTaxRate,
      trackInventory: raw.trackInventory,
      barcodes: [...raw.barcodes],
      isActive: raw.isActive,
    });
    setNewBarcodeText('');
    setNewBarcodeFactor('1');
    setIsItemModalOpen(true);
  };

  const handleAddBarcodeToDraft = () => {
    const code = newBarcodeText.trim();
    if (!code) return;
    const factor = Number(newBarcodeFactor) || 1;
    const current = itemDraft.barcodes ?? [];
    if (current.some((b) => b.barcode === code)) {
      setFriendlyNotice({
        title: 'Código de barras duplicado',
        message: 'Este código de barras ya fue agregado en la lista de este producto.',
        tone: 'warning',
        actionLabel: 'Revisar',
      });
      return;
    }

    const nextBarcode: BarcodeEntryProps = {
      barcode: code,
      barcodeType: newBarcodeType,
      unitMeasureCode: factor > 1 ? 'BX' : '94',
      conversionFactor: factor,
      isPrimary: current.length === 0,
      isActive: true,
    };

    setItemDraft((prev) => ({
      ...prev,
      barcodes: [...(prev.barcodes ?? []), nextBarcode],
    }));
    setNewBarcodeText('');
    setNewBarcodeFactor('1');
  };

  const handleRemoveBarcodeFromDraft = (barcode: string) => {
    setItemDraft((prev) => ({
      ...prev,
      barcodes: (prev.barcodes ?? []).filter((b) => b.barcode !== barcode),
    }));
  };

  const handleSaveItem = async () => {
    const result = editingItemId
      ? await catalogUseCases.updateItem(editingItemId, itemDraft)
      : await catalogUseCases.createItem(itemDraft);

    if (result.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          result.error!,
          'Revisa la información del producto'
        )
      );
      return;
    }

    setIsItemModalOpen(false);
    await loadCatalogData();
    setFriendlyNotice({
      title: editingItemId ? 'Producto actualizado' : 'Producto registrado',
      message: `El artículo "${result.getValue().name}" fue guardado correctamente en el catálogo de NatsarStore.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleDeleteItem = async (item: CatalogItemModel) => {
    const res = await catalogUseCases.deleteItem(item.id);
    if (res.isFailure) {
      setFriendlyNotice(FriendlyErrorMapper.toFriendlyNotice(res.error!));
      return;
    }
    await loadCatalogData();
    setFriendlyNotice({
      title: 'Producto retirado del catálogo',
      message: `El producto "${item.name}" fue desactivado correctamente.`,
      tone: 'info',
      actionLabel: 'Entendido',
    });
  };

  // Categorías CRUD
  const openCreateCategoryModal = () => {
    setEditingCategoryId(null);
    setCategoryDraft({
      code: '',
      name: '',
      description: '',
      colorHex: '#4D53F4',
      sortOrder: categories.length,
      isActive: true,
    });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: ProductCategoryModel) => {
    setEditingCategoryId(cat.id);
    setCategoryDraft({
      code: cat.code,
      name: cat.name,
      description: cat.description ?? '',
      colorHex: cat.colorHex,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    const res = editingCategoryId
      ? await catalogUseCases.updateCategory(editingCategoryId, categoryDraft)
      : await catalogUseCases.createCategory(categoryDraft);

    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(
          res.error!,
          'Revisa los datos de la categoría'
        )
      );
      return;
    }

    setIsCategoryModalOpen(false);
    await loadCatalogData();
    setFriendlyNotice({
      title: editingCategoryId ? 'Categoría actualizada' : 'Categoría creada',
      message: `La categoría "${res.getValue().name}" está lista para usarse en el punto de venta.`,
      tone: 'info',
      actionLabel: 'Continuar',
    });
  };

  const handleDeleteCategory = async (cat: ProductCategoryModel) => {
    const res = await catalogUseCases.deleteCategory(cat);
    if (res.isFailure) {
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Categoría protegida')
      );
      return;
    }
    await loadCatalogData();
  };

  // Galería Multi-Foto
  const openGalleryModal = async (item: CatalogItemModel) => {
    setGalleryItem(item);
    setImageNotes('');
    setMarkUploadAsPrimary(true);
    const res = await catalogUseCases.getItemGallery(item.id);
    if (res.isSuccess) {
      setGalleryImages(res.getValue());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !galleryItem) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? '');
      const res = await catalogUseCases.uploadItemImage(galleryItem.id, {
        fileName: file.name,
        content: dataUrl,
        mimeType: file.type || 'image/png',
        isPrimary: markUploadAsPrimary,
        notes: imageNotes || undefined,
      });

      if (res.isFailure) {
        setFriendlyNotice(FriendlyErrorMapper.toFriendlyNotice(res.error!));
        return;
      }

      setGalleryImages(res.getValue());
      setImageNotes('');
      await loadCatalogData();
    };
    reader.readAsDataURL(file);
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!galleryItem) return;
    await catalogUseCases.markPrimaryImage(galleryItem.id, imageId);
    const res = await catalogUseCases.getItemGallery(galleryItem.id);
    if (res.isSuccess) setGalleryImages(res.getValue());
    await loadCatalogData();
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    if (!galleryItem) return;
    await catalogUseCases.removeItemImage(galleryItem.id, imageId);
    const res = await catalogUseCases.getItemGallery(galleryItem.id);
    if (res.isSuccess) setGalleryImages(res.getValue());
    await loadCatalogData();
  };

  // Escáner de Código de Barras
  const handleRunBarcodeScan = async (barcodeToScan?: string) => {
    const target = barcodeToScan ?? scannerInput;
    setScannerInput(target);
    const res = await catalogUseCases.scanBarcode(target);
    if (res.isFailure) {
      setScanResult(null);
      setFriendlyNotice(
        FriendlyErrorMapper.toFriendlyNotice(res.error!, 'Código no encontrado')
      );
      return;
    }
    setScanResult(res.getValue());
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
          title="Artículos en Catálogo"
          value={String(kpis.totalItems)}
          trendValue="Activos"
          trendDirection="up"
          comparisonLine1="Productos, combos"
          comparisonLine2="y servicios DIAN"
          icon="package"
        />
        <StatMetricCard
          title="Categorías POS"
          value={String(kpis.totalCategories)}
          trendValue="Botones Táctiles"
          trendDirection="up"
          comparisonLine1="Clasificación"
          comparisonLine2="de mostrador"
          icon="tag"
        />
        <StatMetricCard
          title="Códigos de Barras"
          value={String(kpis.totalBarcodes)}
          trendValue="Multi-Factor"
          trendDirection="up"
          comparisonLine1="EAN-13, EAN-14"
          comparisonLine2="y Code-128"
          icon="barcode"
        />
        <StatMetricCard
          title="Margen Bruto Promedio"
          value={`${kpis.avgMargin}%`}
          trendValue="+Rentabilidad"
          trendDirection="up"
          comparisonLine1="Sobre precio neto"
          comparisonLine2="antes de IVA/INC"
          icon="bar-chart"
        />
      </div>

      {/* Barra de Pestañas (Productos / Categorías / Escáner) + Acción Principal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <TabSwitcher<CatalogTabId>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              id: 'items',
              label: 'Productos & Combos',
              icon: 'package',
              count: items.length,
            },
            {
              id: 'categories',
              label: 'Categorías POS',
              icon: 'tag',
              count: categories.length,
            },
            {
              id: 'scanner',
              label: 'Escáner Código de Barras',
              icon: 'barcode',
            },
          ]}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeTab === 'categories' ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={openCreateCategoryModal}
            >
              Nueva Categoría
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="plus" size={17} />}
              onClick={openCreateItemModal}
            >
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      {/* VISTA 1: PRODUCTOS, SERVICIOS Y COMBOS */}
      {activeTab === 'items' && (
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
          {/* Filtros de búsqueda */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <FormField
              placeholder="Buscar por nombre, referencia, SKU o código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSlot={<Icon name="search" size={17} />}
            />

            <SelectField
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={[
                { value: '', label: 'Todas las categorías POS' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <SelectField
              value={selectedItemType}
              onChange={(e) => setSelectedItemType(e.target.value as CatalogItemType | '')}
              options={[
                { value: '', label: 'Todos los tipos de artículo' },
                { value: 'PRODUCT', label: 'Productos Físicos (PRODUCT)' },
                { value: 'SERVICE', label: 'Servicios (SERVICE)' },
                { value: 'COMBO', label: 'Combos / Kits (COMBO)' },
              ]}
            />
          </div>

          {/* Lista de Productos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item) => {
              const catInfo = item.categoryId ? categoryNameById.get(item.categoryId) : null;

              return (
                <div
                  key={item.id}
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
                  {/* Bloque Izquierdo: Miniatura + Datos Principales */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '280px', flex: 1 }}>
                    {item.primaryImageUrl ? (
                      <img
                        src={item.primaryImageUrl}
                        alt={item.name}
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '14px',
                          objectFit: 'cover',
                          border: '1px solid #CBD5E1',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '14px',
                          backgroundColor: '#EEF2FF',
                          color: '#4D53F4',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon name="package" size={24} />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0F172A' }}>
                          {item.name}
                        </span>
                        <Badge tone="brand">{item.taxBadgeLabel}</Badge>
                        <Badge tone="neutral">{item.itemTypeLabel}</Badge>
                        {catInfo && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              color: '#475569',
                              backgroundColor: '#FFFFFF',
                              padding: '3px 9px',
                              borderRadius: '999px',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            <ColorDot colorHex={catInfo.colorHex} size={9} />
                            {catInfo.name}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>
                          Ref: <strong>{item.codeReference}</strong>
                        </span>
                        {item.raw.brand && (
                          <span>
                            Marca: <strong>{item.raw.brand}</strong>
                          </span>
                        )}
                        <span>
                          Neto sin impuesto: <strong>{item.formattedNetPrice}</strong>
                        </span>
                        <span>
                          Costo: <strong>{item.formattedUnitCost}</strong>
                        </span>
                      </div>

                      {/* Píldoras de Códigos de Barras */}
                      {item.barcodes.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {item.barcodes.map((b) => (
                            <span
                              key={b.barcode}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                fontSize: '0.71rem',
                                fontWeight: 600,
                                color: '#334155',
                              }}
                            >
                              <Icon name="barcode" size={12} />
                              {b.barcode}
                              {b.conversionFactor > 1 && (
                                <strong style={{ color: '#4D53F4' }}>(x{b.conversionFactor})</strong>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bloque Derecho: Precio POS, Margen y Botones de Acción */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8' }}>
                        Precio Venta POS
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.18rem',
                          fontWeight: 800,
                          color: '#4D53F4',
                        }}
                      >
                        {item.formattedBasePrice}
                      </span>
                    </div>

                    <TrendPill
                      value={`Margen ${item.grossMarginPct}%`}
                      direction={item.grossMarginPct >= 25 ? 'up' : 'neutral'}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Icon name="image" size={15} />}
                        onClick={() => void openGalleryModal(item)}
                      >
                        Galería
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Icon name="edit" size={15} />}
                        onClick={() => openEditItemModal(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteItem(item)}
                        style={{ color: '#EF4444' }}
                      >
                        <Icon name="trash" size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: CATEGORÍAS POS */}
      {activeTab === 'categories' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '18px',
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '22px',
                padding: '22px',
                boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ColorDot colorHex={cat.colorHex} size={18} />
                    <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0F172A' }}>
                      {cat.name}
                    </span>
                  </div>
                  <Badge tone={cat.isProtectedSystemCategory ? 'brand' : 'neutral'}>
                    Orden #{cat.sortOrder}
                  </Badge>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4D53F4' }}>
                  Código: {cat.code}
                </div>

                <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.45 }}>
                  {cat.description || 'Sin descripción adicional.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                <Badge tone="success" dot>
                  Activa en POS
                </Badge>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Icon name="edit" size={14} />}
                    onClick={() => openEditCategoryModal(cat)}
                  >
                    Editar
                  </Button>
                  {!cat.isProtectedSystemCategory && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDeleteCategory(cat)}
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

      {/* VISTA 3: ESCÁNER DE CÓDIGO DE BARRAS (/api/v1/catalog/items/barcode/{barcode}) */}
      {activeTab === 'scanner' && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '26px',
            boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div>
            <Typography as="h2" variant="h2">
              Verificador & Lector de Código de Barras (`/api/v1/catalog/items/barcode/:barcode`)
            </Typography>
            <Typography variant="caption" tone="muted">
              Simula el disparo del lector láser POS o selecciona un código con factor de conversión (Unidad x1 o Caja x12)
            </Typography>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <FormField
                label="Código de Barras EAN / GTIN / Code128"
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                leftSlot={<Icon name="barcode" size={18} />}
                placeholder="Escanea o escribe el código..."
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon name="search" size={17} />}
              onClick={() => void handleRunBarcodeScan()}
            >
              Consultar Código
            </Button>
          </div>

          {/* Botones rápidos para probar códigos con factor de conversión */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.77rem', color: '#64748B', fontWeight: 600 }}>
              Códigos de prueba rápida:
            </span>
            {[
              { code: '7701234500018', label: '7701234500018 (Café Unidad x1)' },
              { code: '17701234500015', label: '17701234500015 (Café Caja x12)' },
              { code: '7701234500025', label: '7701234500025 (Lector 2D x1)' },
            ].map((sample) => (
              <Button
                key={sample.code}
                type="button"
                variant="subtle"
                size="sm"
                onClick={() => void handleRunBarcodeScan(sample.code)}
              >
                {sample.label}
              </Button>
            ))}
          </div>

          {scanResult && (
            <div
              style={{
                marginTop: '6px',
                padding: '22px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #4D53F4 0%, #3730A3 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <TrendPill
                    value={`Factor x${scanResult.matchedBarcode.conversionFactor} (${scanResult.matchedBarcode.unitMeasureCode})`}
                    direction="up"
                  />
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    Código leído: <strong>{scanResult.matchedBarcode.barcode}</strong> ({scanResult.matchedBarcode.barcodeType})
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>
                  {scanResult.item.name}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.82)' }}>
                  Referencia: {scanResult.item.codeReference} • Tributo DIAN: {scanResult.item.taxBadgeLabel}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '0.76rem', color: 'rgba(255,255,255,0.78)' }}>
                  Subtotal Equivalente ({scanResult.matchedBarcode.conversionFactor} ud)
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800 }}>
                  ${' '}
                  {(
                    scanResult.item.basePrice * scanResult.matchedBarcode.conversionFactor
                  ).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREAR / EDITAR PRODUCTO */}
      <DialogModal
        isOpen={isItemModalOpen}
        title={editingItemId ? 'Editar Producto del Catálogo' : 'Nuevo Producto / Artículo POS'}
        subtitle="Configura precios, impuestos DIAN (IVA/INC) y códigos de barras múltiples"
        maxWidth="700px"
        onClose={() => setIsItemModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveItem()}>
              {editingItemId ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <SelectField
              label="Tipo de Artículo*"
              value={itemDraft.itemType}
              onChange={(e) =>
                setItemDraft((prev) => ({
                  ...prev,
                  itemType: e.target.value as CatalogItemType,
                }))
              }
              options={[
                { value: 'PRODUCT', label: 'Producto Físico' },
                { value: 'SERVICE', label: 'Servicio' },
                { value: 'COMBO', label: 'Combo / Kit' },
              ]}
            />
            <FormField
              label="Referencia (codeReference)*"
              placeholder="Ej: CAFE-HUI-500"
              value={itemDraft.codeReference}
              disabled={Boolean(editingItemId)}
              onChange={(e) =>
                setItemDraft((prev) => ({ ...prev, codeReference: e.target.value.toUpperCase() }))
              }
            />
            <FormField
              label="SKU Interno"
              placeholder="Ej: SKU-001"
              value={itemDraft.sku ?? ''}
              onChange={(e) => setItemDraft((prev) => ({ ...prev, sku: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <FormField
              label="Nombre Comercial del Producto*"
              placeholder="Ej: Café Especial Origen Huila 500g"
              value={itemDraft.name}
              onChange={(e) => setItemDraft((prev) => ({ ...prev, name: e.target.value }))}
            />
            <SelectField
              label="Categoría POS"
              value={itemDraft.categoryId ?? ''}
              onChange={(e) => setItemDraft((prev) => ({ ...prev, categoryId: e.target.value }))}
              options={[
                { value: '', label: 'Sin categoría' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <FormField
              label="Marca"
              placeholder="Ej: Natsar Reserve"
              value={itemDraft.brand ?? ''}
              onChange={(e) => setItemDraft((prev) => ({ ...prev, brand: e.target.value }))}
            />
            <SelectField
              label="Estándar DIAN"
              value={itemDraft.standardCode ?? '999'}
              onChange={(e) =>
                setItemDraft((prev) => ({
                  ...prev,
                  standardCode: e.target.value as ProductStandardCode,
                }))
              }
              options={[
                { value: '999', label: '999 - Estándar Contribuyente' },
                { value: '010', label: '010 - GTIN / Código Barras' },
                { value: '001', label: '001 - UNSPSC' },
              ]}
            />
            <SelectField
              label="Unidad de Medida DIAN"
              value={itemDraft.unitMeasureCode ?? '94'}
              onChange={(e) =>
                setItemDraft((prev) => ({ ...prev, unitMeasureCode: e.target.value }))
              }
              options={[
                { value: '94', label: '94 - Unidad' },
                { value: 'KGM', label: 'KGM - Kilogramo' },
                { value: 'LTR', label: 'LTR - Litro' },
                { value: 'BX', label: 'BX - Caja' },
              ]}
            />
          </div>

          <Divider label="Precios & Tributación DIAN" margin="4px 0" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
            <FormField
              type="number"
              label="Precio Venta POS (COP)*"
              value={String(itemDraft.basePrice)}
              onChange={(e) =>
                setItemDraft((prev) => ({ ...prev, basePrice: Number(e.target.value) }))
              }
            />
            <FormField
              type="number"
              label="Costo Unitario (COP)"
              value={String(itemDraft.unitCost)}
              onChange={(e) =>
                setItemDraft((prev) => ({ ...prev, unitCost: Number(e.target.value) }))
              }
            />
            <SelectField
              label="Tributo DIAN"
              value={itemDraft.defaultTaxCode}
              onChange={(e) => {
                const code = e.target.value as DianTaxCode;
                const defaultRate = code === '04' ? 8 : code === 'ZZ' ? 0 : 19;
                setItemDraft((prev) => ({
                  ...prev,
                  defaultTaxCode: code,
                  defaultTaxRate: defaultRate,
                  isTaxExcluded: code === 'ZZ',
                }));
              }}
              options={[
                { value: '01', label: '01 - IVA' },
                { value: '04', label: '04 - INC Consumo' },
                { value: '34', label: '34 - IBUA' },
                { value: '35', label: '35 - ICUI' },
                { value: 'ZZ', label: 'ZZ - Excluido' },
              ]}
            />
            <FormField
              type="number"
              label="Tarifa (%)"
              value={String(itemDraft.defaultTaxRate)}
              disabled={itemDraft.defaultTaxCode === 'ZZ'}
              onChange={(e) =>
                setItemDraft((prev) => ({ ...prev, defaultTaxRate: Number(e.target.value) }))
              }
            />
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Checkbox
              id="tax-included-check"
              checked={Boolean(itemDraft.isTaxIncludedInPrice)}
              onChange={(checked) =>
                setItemDraft((prev) => ({ ...prev, isTaxIncludedInPrice: checked }))
              }
              label="El precio de venta POS ya incluye el impuesto (IVA/INC)"
            />
            <Checkbox
              id="track-inv-check"
              checked={Boolean(itemDraft.trackInventory)}
              onChange={(checked) =>
                setItemDraft((prev) => ({ ...prev, trackInventory: checked }))
              }
              label="Controlar existencias en Kárdex de inventario"
            />
          </div>

          <Divider label="Códigos de Barras Múltiples" margin="4px 0" />

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.8fr auto', gap: '10px', alignItems: 'flex-end' }}>
            <FormField
              label="Nuevo Código de Barras"
              placeholder="Ej: 7701234500099"
              value={newBarcodeText}
              onChange={(e) => setNewBarcodeText(e.target.value)}
            />
            <SelectField
              label="Formato"
              value={newBarcodeType}
              onChange={(e) => setNewBarcodeType(e.target.value)}
              options={[
                { value: 'EAN13', label: 'EAN-13' },
                { value: 'EAN14', label: 'EAN-14 (Caja)' },
                { value: 'CODE128', label: 'Code-128' },
              ]}
            />
            <FormField
              type="number"
              label="Factor (Uds)"
              value={newBarcodeFactor}
              onChange={(e) => setNewBarcodeFactor(e.target.value)}
            />
            <Button type="button" variant="subtle" onClick={handleAddBarcodeToDraft}>
              + Agregar
            </Button>
          </div>

          {(itemDraft.barcodes ?? []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(itemDraft.barcodes ?? []).map((b) => (
                <span
                  key={b.barcode}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#F1F5F9',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <Icon name="barcode" size={14} />
                  <span>
                    {b.barcode} ({b.barcodeType} • Factor x{b.conversionFactor})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBarcodeFromDraft(b.barcode)}
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
                </span>
              ))}
            </div>
          )}
        </div>
      </DialogModal>

      {/* MODAL 2: CREAR / EDITAR CATEGORÍA POS */}
      <DialogModal
        isOpen={isCategoryModalOpen}
        title={editingCategoryId ? 'Editar Categoría POS' : 'Nueva Categoría Comercial POS'}
        subtitle="Clasifica tus productos con botones táctiles y colores identificadores"
        maxWidth="520px"
        onClose={() => setIsCategoryModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={() => void handleSaveCategory()}>
              {editingCategoryId ? 'Actualizar Categoría' : 'Crear Categoría'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField
              label="Código Único*"
              placeholder="Ej: BEBIDAS_FRIAS"
              value={categoryDraft.code}
              disabled={Boolean(editingCategoryId)}
              onChange={(e) =>
                setCategoryDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
              }
            />
            <FormField
              type="number"
              label="Orden de Botón POS"
              value={String(categoryDraft.sortOrder ?? 0)}
              onChange={(e) =>
                setCategoryDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))
              }
            />
          </div>

          <FormField
            label="Nombre de la Categoría*"
            placeholder="Ej: Bebidas Frías & Jugos"
            value={categoryDraft.name}
            onChange={(e) => setCategoryDraft((prev) => ({ ...prev, name: e.target.value }))}
          />

          <FormField
            label="Descripción"
            placeholder="Descripción breve para el equipo de tienda"
            value={categoryDraft.description ?? ''}
            onChange={(e) =>
              setCategoryDraft((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.81rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Color Identificador en Punto de Venta
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {CATEGORY_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setCategoryDraft((prev) => ({ ...prev, colorHex: hex }))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: hex,
                    border:
                      categoryDraft.colorHex === hex
                        ? '3px solid #0F172A'
                        : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogModal>

      {/* MODAL 3: GALERÍA MULTI-FOTO DEL PRODUCTO (/api/v1/catalog/items/:id/images) */}
      <DialogModal
        isOpen={Boolean(galleryItem)}
        title={`Galería Multimedia: ${galleryItem?.name ?? ''}`}
        subtitle="Sube fotos del producto y selecciona la imagen de portada principal para el POS"
        maxWidth="640px"
        onClose={() => setGalleryItem(null)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Zona de subida */}
          <div
            style={{
              padding: '18px',
              borderRadius: '18px',
              backgroundColor: '#F8FAFC',
              border: '1.5px dashed #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <FormField
              label="Nota o descripción de la foto (opcional)"
              placeholder="Ej: Presentación empaque frontal 500g"
              value={imageNotes}
              onChange={(e) => setImageNotes(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <Checkbox
                id="primary-img-check"
                checked={markUploadAsPrimary}
                onChange={setMarkUploadAsPrimary}
                label="Establecer como portada principal del producto"
              />

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#4D53F4',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Icon name="image" size={16} />
                <span>Subir Imagen desde Equipo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Lista de imágenes asociadas */}
          {galleryImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '0.86rem' }}>
              Este producto aún no tiene fotografías cargadas en su galería.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '14px',
              }}
            >
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  style={{
                    borderRadius: '16px',
                    border: img.isPrimary ? '2px solid #4D53F4' : '1px solid #E2E8F0',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.fileName}
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {img.fileName}
                      </span>
                      {img.isPrimary && <Badge tone="brand">Portada</Badge>}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!img.isPrimary && (
                        <Button
                          type="button"
                          variant="subtle"
                          size="sm"
                          onClick={() => void handleSetPrimaryImage(img.id)}
                          style={{ flex: 1, height: '30px', fontSize: '0.72rem' }}
                        >
                          Hacer Portada
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteGalleryImage(img.id)}
                        style={{ height: '30px', color: '#EF4444' }}
                      >
                        <Icon name="trash" size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
