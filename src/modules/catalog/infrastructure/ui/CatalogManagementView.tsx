import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Divider,
  FormField,
  FriendlyModal,
  Icon,
  Typography,
} from '@shared/components';
import {
  CatalogProduct,
  CreateProductInput,
  ProductCategory,
  UpdateProductInput,
} from '../../domain/models/CatalogProduct.model';
import {
  CreateCatalogProductUseCase,
  DeleteCatalogProductUseCase,
  GetCatalogProductsUseCase,
  GetProductCategoriesUseCase,
  UpdateCatalogProductUseCase,
  UploadProductImageUseCase,
} from '../../application/use-cases/CatalogUseCases';

export interface CatalogManagementViewProps {
  getProductsUseCase: GetCatalogProductsUseCase;
  getCategoriesUseCase: GetProductCategoriesUseCase;
  createProductUseCase: CreateCatalogProductUseCase;
  updateProductUseCase: UpdateCatalogProductUseCase;
  deleteProductUseCase: DeleteCatalogProductUseCase;
  uploadImageUseCase: UploadProductImageUseCase;
}

const TAX_OPTIONS = [
  { label: 'IVA General 19% (DIAN 01)', code: '01', rate: 19 },
  { label: 'IVA Reducido 5% (DIAN 01)', code: '01', rate: 5 },
  { label: 'Impoconsumo 8% (DIAN 04 - Cafetería / Restaurante)', code: '04', rate: 8 },
  { label: 'Excluido / Exento 0% (DIAN ZZ)', code: 'ZZ', rate: 0 },
];

export const CatalogManagementView: React.FC<CatalogManagementViewProps> = ({
  getProductsUseCase,
  getCategoriesUseCase,
  createProductUseCase,
  updateProductUseCase,
  deleteProductUseCase,
  uploadImageUseCase,
}) => {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Estado del Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Campos del formulario
  const [codeReference, setCodeReference] = useState('');
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('15000');
  const [unitCost, setUnitCost] = useState('8000');
  const [taxIndex, setTaxIndex] = useState(0); // 0: IVA 19%
  const [isTaxIncluded, setIsTaxIncluded] = useState(true);
  const [trackInventory, setTrackInventory] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [imageMediaId, setImageMediaId] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Estado del Modal de Eliminación
  const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar productos y categorías iniciales
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);

    const [prodRes, catRes] = await Promise.all([
      getProductsUseCase.execute(),
      getCategoriesUseCase.execute(),
    ]);

    if (prodRes.isSuccess) {
      setProducts(prodRes.getValue().items);
    } else {
      setErrorMessage(prodRes.error ?? 'Error cargando productos.');
    }

    if (catRes.isSuccess) {
      setCategories(catRes.getValue());
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtrado reactivo en memoria
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.codeReference.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
        p.barcodes.some((b) => b.barcode.includes(search));

      const matchCat =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

  // Abrir modal para Crear
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setCodeReference(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
    setSku('');
    setName('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setBasePrice('25000');
    setUnitCost('12000');
    setTaxIndex(0);
    setIsTaxIncluded(true);
    setTrackInventory(true);
    setBarcodeInput('');
    setImageMediaId(null);
    setImagePreviewUrl(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Abrir modal para Editar
  const handleOpenEdit = (prod: CatalogProduct) => {
    setEditingProduct(prod);
    setCodeReference(prod.codeReference);
    setSku(prod.sku || '');
    setName(prod.name);
    setDescription(prod.description || '');
    setCategoryId(prod.categoryId || '');
    setBasePrice(String(prod.basePrice));
    setUnitCost(prod.unitCost !== undefined ? String(prod.unitCost) : '');

    const foundTaxIdx = TAX_OPTIONS.findIndex(
      (t) => t.code === prod.defaultTaxCode && t.rate === prod.defaultTaxRate
    );
    setTaxIndex(foundTaxIdx >= 0 ? foundTaxIdx : 0);

    setIsTaxIncluded(prod.isTaxIncludedInPrice);
    setTrackInventory(prod.trackInventory);
    setBarcodeInput(prod.barcodes?.[0]?.barcode || '');
    setImageMediaId(prod.primaryImageMediaId || null);
    setImagePreviewUrl(prod.primaryImage?.url || null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Subir imagen a Supabase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMessage(null);

    const res = await uploadImageUseCase.execute(file);
    if (res.isSuccess) {
      const data = res.getValue();
      setImageMediaId(data.mediaId);
      setImagePreviewUrl(data.url);
      setSuccessMessage('Imagen subida exitosamente a Supabase Storage.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setErrorMessage(res.error ?? 'No fue posible subir la imagen.');
    }
    setUploadingImage(false);
  };

  // Guardar (Crear o Editar)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeReference.trim() || !name.trim() || !basePrice) {
      setErrorMessage('Por favor completa los campos obligatorios (*).');
      return;
    }

    setFormSubmitting(true);
    setErrorMessage(null);

    const selectedTax = TAX_OPTIONS[taxIndex];
    const barcodes = barcodeInput.trim()
      ? [{ barcode: barcodeInput.trim(), isPrimary: true }]
      : [];

    if (editingProduct) {
      // Editar
      const updatePayload: UpdateProductInput = {
        codeReference,
        sku: sku.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        basePrice: Number(basePrice),
        unitCost: unitCost ? Number(unitCost) : undefined,
        defaultTaxCode: selectedTax.code,
        defaultTaxRate: selectedTax.rate,
        isTaxIncludedInPrice: isTaxIncluded,
        trackInventory,
        barcodes,
        primaryImageMediaId: imageMediaId || undefined,
      };

      const res = await updateProductUseCase.execute(editingProduct.id, updatePayload);
      if (res.isSuccess) {
        setIsModalOpen(false);
        setSuccessMessage(`Producto '${name}' actualizado con éxito.`);
        setTimeout(() => setSuccessMessage(null), 3500);
        await loadData();
      } else {
        setErrorMessage(res.error ?? 'Error al actualizar producto.');
      }
    } else {
      // Crear
      const createPayload: CreateProductInput = {
        codeReference,
        sku: sku.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        basePrice: Number(basePrice),
        unitCost: unitCost ? Number(unitCost) : undefined,
        defaultTaxCode: selectedTax.code,
        defaultTaxRate: selectedTax.rate,
        isTaxIncludedInPrice: isTaxIncluded,
        trackInventory,
        barcodes,
        primaryImageMediaId: imageMediaId || undefined,
      };

      const res = await createProductUseCase.execute(createPayload);
      if (res.isSuccess) {
        setIsModalOpen(false);
        setSuccessMessage(`Producto '${name}' registrado en el catálogo.`);
        setTimeout(() => setSuccessMessage(null), 3500);
        await loadData();
      } else {
        setErrorMessage(res.error ?? 'Error al registrar producto.');
      }
    }

    setFormSubmitting(false);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);

    const res = await deleteProductUseCase.execute(productToDelete.id);
    if (res.isSuccess) {
      setSuccessMessage(`Producto '${productToDelete.name}' eliminado del catálogo.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setProductToDelete(null);
      await loadData();
    } else {
      setErrorMessage(res.error ?? 'No fue posible eliminar el producto.');
    }

    setDeleting(false);
  };

  // Cálculo de margen bruto en vivo para el formulario
  const calculatedMargin = useMemo(() => {
    const price = Number(basePrice) || 0;
    const cost = Number(unitCost) || 0;
    if (price <= 0 || cost <= 0) return null;
    const margin = ((price - cost) / price) * 100;
    return margin.toFixed(1);
  }, [basePrice, unitCost]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner de mensajes */}
      {successMessage && (
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '16px',
            color: '#065F46',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Icon name="check" size={18} />
          <strong>{successMessage}</strong>
        </div>
      )}

      {errorMessage && !isModalOpen && (
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '16px',
            color: '#991B1B',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Icon name="shield" size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Encabezado Principal y Barra de Acciones */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px 28px',
          boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Typography as="h2" variant="h2">
                Catálogo de Productos & Precios POS
              </Typography>
              <Badge tone="brand">{products.length} Referencias</Badge>
            </div>
            <Typography variant="caption" tone="muted">
              Fichas maestras comerciales, códigos de barra EAN-13, impuestos DIAN y fotos en Supabase Storage
            </Typography>
          </div>

          <Button variant="primary" onClick={handleOpenCreate}>
            + Nuevo Producto
          </Button>
        </div>

        {/* Buscador y Filtros por Categoría */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Píldoras de categoría */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedCategory === 'ALL' ? '#4D53F4' : '#F1F5F9',
                color: selectedCategory === 'ALL' ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === c.id ? '#4D53F4' : '#F1F5F9',
                  color: selectedCategory === c.id ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Caja de búsqueda */}
          <div style={{ width: '280px' }}>
            <FormField
              placeholder="Buscar por nombre, ref o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista / Grid de Productos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '18px',
        }}
      >
        {loading && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '60px',
              textAlign: 'center',
              color: '#64748B',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
            }}
          >
            Cargando catálogo desde el backend en Render...
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '60px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              boxShadow: '0 8px 24px -12px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div style={{ color: '#94A3B8', marginBottom: '12px' }}>
              <Icon name="package" size={42} />
            </div>
            <Typography as="h3" variant="h3">
              No hay productos que coincidan
            </Typography>
            <Typography variant="body" tone="muted">
              {search
                ? `No se encontraron resultados para "${search}".`
                : 'Empieza registrando tu primer producto en el botón superior.'}
            </Typography>
          </div>
        )}

        {!loading &&
          filteredProducts.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            const barcode = p.barcodes?.[0]?.barcode;
            const hasImage = Boolean(p.primaryImage?.url);

            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 4px 16px -6px rgba(15, 23, 42, 0.05)',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Cabecera de la tarjeta: Imagen + Identificación */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '14px',
                      backgroundColor: '#F1F5F9',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {hasImage ? (
                      <img
                        src={p.primaryImage!.url}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Icon name="package" size={26} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#EEF2FF',
                          color: '#4D53F4',
                        }}
                      >
                        {p.codeReference}
                      </span>
                      {cat && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            color: '#475569',
                          }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>

                    <strong
                      style={{
                        display: 'block',
                        fontSize: '0.95rem',
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </strong>

                    {p.description && (
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748B',
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tributos y Código de Barras */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '0.78rem',
                    color: '#475569',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Impuesto DIAN:</span>
                    <strong>
                      {p.defaultTaxCode === '01'
                        ? `IVA ${p.defaultTaxRate}%`
                        : p.defaultTaxCode === '04'
                        ? `INC ${p.defaultTaxRate}%`
                        : 'Excluido 0%'}
                    </strong>
                  </div>

                  {barcode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Código de Barras:</span>
                      <code style={{ fontSize: '0.75rem', color: '#1E293B' }}>{barcode}</code>
                    </div>
                  )}

                  {p.unitCost !== undefined && p.unitCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>Costo unitario:</span>
                      <span>$ {Number(p.unitCost).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>

                <Divider margin="4px 0" />

                {/* Pie: Precio y Botones de Acción */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>
                      Precio al Público
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: '#0F172A',
                      }}
                    >
                      $ {Number(p.basePrice).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProductToDelete(p)}
                      style={{ color: '#EF4444' }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '30px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography as="h2" variant="h2">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  Configura precios, códigos de barra, tributos DIAN y fotos en Supabase
                </Typography>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.4rem',
                  color: '#94A3B8',
                }}
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  color: '#991B1B',
                  fontSize: '0.85rem',
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Sección de Imagen Supabase Storage */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                }}
              >
                <div
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '14px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Icon name="package" size={28} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#1E293B',
                      marginBottom: '4px',
                    }}
                  >
                    Fotografía del Producto (Supabase Storage)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploadingImage}
                    style={{ fontSize: '0.8rem', color: '#64748B' }}
                  />
                  {uploadingImage && (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#4D53F4', marginTop: '4px' }}>
                      Subiendo a Supabase Storage...
                    </span>
                  )}
                </div>
              </div>

              {/* Fila: Referencia y Nombre */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Referencia / Código *
                  </label>
                  <FormField
                    placeholder="PRD-001"
                    value={codeReference}
                    onChange={(e) => setCodeReference(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Nombre Comercial *
                  </label>
                  <FormField
                    placeholder="Ej. Café Molido 500g Especial"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Fila: Categoría y SKU */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Categoría
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                    }}
                  >
                    <option value="">Sin categoría asignada</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Código de Barras (EAN-13 / UPC)
                  </label>
                  <FormField
                    placeholder="7701234567890"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Fila: Precios y Costos con Margen en Vivo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Precio al Público ($) *
                  </label>
                  <FormField
                    type="number"
                    min="0"
                    step="100"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Costo Unitario ($)
                  </label>
                  <FormField
                    type="number"
                    min="0"
                    step="100"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Margen Estimado
                  </label>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: calculatedMargin ? '#ECFDF5' : '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: calculatedMargin ? '#065F46' : '#64748B',
                      textAlign: 'center',
                    }}
                  >
                    {calculatedMargin ? `${calculatedMargin}% Margen` : 'Calculando...'}
                  </div>
                </div>
              </div>

              {/* Fila: Impuestos DIAN */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Tratamiento Tributario DIAN *
                </label>
                <select
                  value={taxIndex}
                  onChange={(e) => setTaxIndex(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                >
                  {TAX_OPTIONS.map((opt, i) => (
                    <option key={opt.label} value={i}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes: Control de inventario e impuesto incluido */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={trackInventory}
                    onChange={(e) => setTrackInventory(e.target.checked)}
                  />
                  Controlar existencias en Bodega (Kárdex)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isTaxIncluded}
                    onChange={(e) => setIsTaxIncluded(e.target.checked)}
                  />
                  El precio de venta ya incluye impuestos
                </label>
              </div>

              {/* Botones de acción del Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={formSubmitting || uploadingImage}>
                  {formSubmitting ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {productToDelete && (
        <FriendlyModal
          isOpen={Boolean(productToDelete)}
          title="¿Eliminar producto del catálogo?"
          message={`El producto "${productToDelete.name}" (${productToDelete.codeReference}) será retirado del catálogo comercial de forma segura.`}
          confirmLabel={deleting ? 'Eliminando...' : 'Sí, eliminar'}
          cancelLabel="Cancelar"
          tone="danger"
          onConfirm={handleConfirmDelete}
          onClose={() => setProductToDelete(null)}
        />
      )}
    </div>
  );
};
