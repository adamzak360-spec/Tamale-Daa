import { useMemo, useState } from 'react'
import type { Product } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { Button, Select, StatusBadge, PageHeader, DataTable, TableToolbar, Modal } from '../../components/ui'
import type { DataTableColumn } from '../../components/ui'
import { Search, Pencil, Trash2, Package } from 'lucide-react'

interface AdminProductsProps {
  products: Product[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  filterCategory: string
  onFilterCategoryChange: (v: string) => void
  onEdit: (product: Product) => void
  onDelete: (id: string, name: string) => void
  onAddProduct: () => void
  onExport?: () => void
}

export default function AdminProducts({ products, loading, searchTerm: externalSearch, onSearchChange: externalSetSearch, filterCategory: externalFilter, onFilterCategoryChange: externalSetFilter, onEdit, onDelete, onAddProduct, onExport }: AdminProductsProps) {
  const [internalSearch, setInternalSearch] = useState('')
  const searchTerm = externalSearch !== undefined ? externalSearch : internalSearch
  const setSearchTerm = externalSetSearch || setInternalSearch
  const [internalFilter, setInternalFilter] = useState('')
  const filterCategory = externalFilter !== undefined ? externalFilter : internalFilter
  const setFilterCategory = externalSetFilter || setInternalFilter
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null)

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !filterCategory || p.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, filterCategory])

  const statusText = (p: Product): 'active' | 'inactive' | 'out-of-stock' => p.status

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'product', header: 'Product', minWidth: '220px',
      cell: p => (
        <div className="dt-product">
          <span className="dt-thumb">
            {p.image_url ? <img src={p.image_url} alt={p.name} /> : <Package size={15} style={{ color: 'var(--color-text-muted)' }} />}
          </span>
          <span className="dt-product-name" title={p.name}>{p.name}</span>
          {p.sku && <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>{p.sku}</span>}
        </div>
      ),
    },
    { key: 'category', header: 'Category', width: '130px', cell: p => p.category },
    { key: 'price', header: 'Price', width: '100px', align: 'right', cell: p => <span className="dt-amount">{formatCurrency(p.price)}</span> },
    { key: 'stock', header: 'Stock', width: '80px', align: 'center', cell: p => p.stock_quantity },
    {
      key: 'status', header: 'Status', width: '130px', align: 'center',
      cell: p => (
        <StatusBadge status={statusText(p)}>
          {p.status === 'active' ? 'Active' : p.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions', header: 'Actions', width: '110px', sticky: 'right', align: 'right',
      cell: p => (
        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => onEdit(p)}>Edit</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirmTarget({ id: p.id, name: p.name })} />
        </div>
      ),
    },
  ]

  return (
    <div className="page-content">
      <PageHeader title="Products" subtitle={`${filtered.length} of ${products.length} products`} actions={
        <>
          {onExport && <Button variant="outline" size="sm" onClick={onExport}>Export CSV</Button>}
          <Button variant="primary" size="sm" onClick={onAddProduct} icon={<Search size={15} />}>+ Add Product</Button>
        </>
      } />
      <TableToolbar>
        <input
          className="form-input"
          type="text"
          placeholder="Search products…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search products"
          style={{ minWidth: '220px' }}
        />
        <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} aria-label="Filter category" style={{ minWidth: '170px' }}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Select>
      </TableToolbar>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading && products.length === 0}
        emptyTitle={products.length === 0 ? 'No products yet' : 'No products match your search'}
        emptyMessage={products.length === 0 ? 'Start by adding your first product to the marketplace.' : 'Try adjusting your search or filters.'}
        stickyHeader
        caption={`${filtered.length} of ${products.length} products`}
        rowKey={p => p.id}
      />

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="Delete Product"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            <Button variant="danger-solid" size="sm" onClick={() => { if (confirmTarget) onDelete(confirmTarget.id, confirmTarget.name); setConfirmTarget(null) }}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete <strong>"{confirmTarget?.name}"</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
