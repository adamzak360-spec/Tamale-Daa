import type { Product, ProductVariant } from '../../types'

export type ProductFormState = {
  name: string
  description: string
  price: string
  category: string
  stock_quantity: string
  status: 'active' | 'inactive' | 'out-of-stock'
  image: File | null
  existingImageUrl: string
  galleryImages: File[]
  existingGalleryUrls: string[]
  videos: File[]
  existingVideoUrls: string[]
  videoUploadErrors: Record<number, string>
  has_sizes: boolean
  variants: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>[]
  delivery_fee_tamale: string
  delivery_fee_greater_accra: string
  delivery_fee_lesser_accra: string
  delivery_fee_dhl: string
  delivery_fee_ups: string
  delivery_fee_fedex: string
  specifications: Record<string, string>
  newSpecKey: string
  newSpecValue: string
}

export const defaultFormState: ProductFormState = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock_quantity: '',
  status: 'active',
  image: null,
  existingImageUrl: '',
  galleryImages: [],
  existingGalleryUrls: [],
  videos: [],
  existingVideoUrls: [],
  videoUploadErrors: {},
  has_sizes: false,
  variants: [],
  delivery_fee_tamale: '',
  delivery_fee_greater_accra: '',
  delivery_fee_lesser_accra: '',
  delivery_fee_dhl: '',
  delivery_fee_ups: '',
  delivery_fee_fedex: '',
  specifications: {},
  newSpecKey: '',
  newSpecValue: '',
}

export interface ProductFormErrors {
  name?: string
  description?: string
  price?: string
  category?: string
  stock_quantity?: string
}

interface AdminProductFormProps {
  mode: 'add' | 'edit'
  editProduct: Product | null
  formData: ProductFormState
  formErrors: ProductFormErrors
  isSubmitting: boolean
  categories: string[]
  onSubmit: (e: React.FormEvent) => void
  onFormChange: (next: ProductFormState) => void
  onCancel: () => void
}

export default function AdminProductForm({
  mode,
  editProduct,
  formData,
  formErrors,
  isSubmitting,
  categories,
  onSubmit,
  onFormChange,
  onCancel,
}: AdminProductFormProps) {
  const set = (patch: Partial<ProductFormState>) => onFormChange({ ...formData, ...patch })

  return (
    <div className="product-form-content">
      <h3>{mode === 'edit' ? `Edit: ${editProduct?.name}` : 'Add New Product'}</h3>
      <form onSubmit={onSubmit} className="admin-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => set({ name: e.target.value })}
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <span className="error-text">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => set({ category: e.target.value })}
              className={formErrors.category ? 'error' : ''}
              list="category-list"
            />
            <datalist id="category-list">
              {categories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            {formErrors.category && <span className="error-text">{formErrors.category}</span>}
          </div>

          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => set({ price: e.target.value })}
              className={formErrors.price ? 'error' : ''}
            />
            {formErrors.price && <span className="error-text">{formErrors.price}</span>}
          </div>

          <div className="form-group">
            <label>Stock Quantity</label>
            <input
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => set({ stock_quantity: e.target.value })}
              className={formErrors.stock_quantity ? 'error' : ''}
            />
            {formErrors.stock_quantity && <span className="error-text">{formErrors.stock_quantity}</span>}
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => set({ status: e.target.value as ProductFormState['status'] })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          <div className="form-group full-width">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="has_sizes"
                checked={formData.has_sizes}
                onChange={(e) => set({ has_sizes: e.target.checked })}
              />
              <label htmlFor="has_sizes">This product has variants (e.g. Sizes)</label>
            </div>
          </div>

          {formData.has_sizes && (
            <div className="form-group full-width variants-section">
              <h4>Product Variants</h4>
              <div className="variants-grid">
                {formData.variants.map((variant, idx) => (
                  <div key={idx} className="variant-row">
                    <div className="variant-inputs">
                      <input
                        type="text"
                        placeholder="Size (e.g. M, XL, 42)"
                        value={variant.variant_value}
                        onChange={(e) => {
                          const updated = [...formData.variants]
                          updated[idx].variant_value = e.target.value
                          set({ variants: updated })
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={variant.stock_quantity}
                        onChange={(e) => {
                          const updated = [...formData.variants]
                          updated[idx].stock_quantity = parseInt(e.target.value) || 0
                          set({ variants: updated })
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-delete-small"
                      onClick={() => {
                        const updated = [...formData.variants]
                        updated.splice(idx, 1)
                        set({ variants: updated })
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="variant-actions">
                <button
                  type="button"
                  className="btn-add-variant"
                  onClick={() => {
                    const newVariant = {
                      product_id: editProduct?.id || '',
                      variant_type: 'size',
                      variant_value: '',
                      stock_quantity: 0,
                      active: true
                    }
                    set({ variants: [...formData.variants, newVariant] })
                  }}
                >
                  + Add Size Variant
                </button>
                <div className="quick-sizes">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                    <button
                      key={size}
                      type="button"
                      className="btn-quick-size"
                      onClick={() => {
                        if (!formData.variants.some(v => v.variant_value === size)) {
                          const newVariant = {
                            product_id: editProduct?.id || '',
                            variant_type: 'size',
                            variant_value: size,
                            stock_quantity: 0,
                            active: true
                          }
                          set({ variants: [...formData.variants, newVariant] })
                        }
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => set({ description: e.target.value })}
              className={formErrors.description ? 'error' : ''}
              rows={4}
            />
            {formErrors.description && <span className="error-text">{formErrors.description}</span>}
          </div>

          <div className="form-group full-width">
            <label>Cover Image</label>
            <div className="image-upload-container">
              {formData.existingImageUrl && !formData.image && (
                <div className="current-image-preview">
                  <img src={formData.existingImageUrl} alt="Current" />
                  <span>Current Cover</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => set({ image: e.target.files?.[0] || null })}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Gallery Images</label>
            <div className="gallery-upload-container">
              <div className="existing-gallery">
                {formData.existingGalleryUrls.map((url, idx) => (
                  <div key={idx} className="gallery-preview-item">
                    <img src={url} alt={`Gallery ${idx}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        const updated = [...formData.existingGalleryUrls]
                        updated.splice(idx, 1)
                        set({ existingGalleryUrls: updated })
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {formData.galleryImages.map((file, idx) => (
                  <div key={`new-${idx}`} className="gallery-preview-item new">
                    <img src={URL.createObjectURL(file)} alt={`New Gallery ${idx}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        const updated = [...formData.galleryImages]
                        updated.splice(idx, 1)
                        set({ galleryImages: updated })
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  set({ galleryImages: [...formData.galleryImages, ...files] })
                }}
              />
              <p className="help-text">Add more images to the product gallery</p>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Product Videos (Optional)</label>
            <div className="gallery-upload-container">
              <div className="existing-gallery">
                {formData.existingVideoUrls.map((url, idx) => (
                  <div key={idx} className="gallery-preview-item">
                    <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        const updated = [...formData.existingVideoUrls]
                        updated.splice(idx, 1)
                        set({ existingVideoUrls: updated })
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {formData.videos.map((file, idx) => (
                  <div key={`new-${idx}`} className="gallery-preview-item new">
                    <video src={URL.createObjectURL(file)} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {formData.videoUploadErrors[idx] && (
                      <div className="error-overlay" style={{ color: 'red', fontSize: '0.8rem', padding: '0.5rem' }}>
                        {formData.videoUploadErrors[idx]}
                      </div>
                    )}
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => {
                        const updated = [...formData.videos]
                        updated.splice(idx, 1)
                        const errors = { ...formData.videoUploadErrors }
                        delete errors[idx]
                        set({ videos: updated, videoUploadErrors: errors })
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  set({ videos: [...formData.videos, ...files] })
                }}
              />
              <p className="help-text">Add product videos (MP4, MOV, WEBM - max 500MB each)</p>
            </div>
          </div>

          <div className="form-group full-width">
            <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Delivery Fees (Optional)</h4>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>Leave empty if delivery option is not available for this product</p>
            <div className="form-grid">
              <div className="form-group">
                <label>Tamale Delivery Fee (GH₵)</label>
                <input type="number" step="0.01" min="0" value={formData.delivery_fee_tamale} onChange={(e) => set({ delivery_fee_tamale: e.target.value })} placeholder="Optional - e.g., 15.00" />
              </div>
              <div className="form-group">
                <label>STC Transport Fee (GH₵)</label>
                <input type="number" step="0.01" min="0" value={formData.delivery_fee_greater_accra} onChange={(e) => set({ delivery_fee_greater_accra: e.target.value })} placeholder="Optional - e.g., 25.00" />
              </div>
              <div className="form-group">
                <label>VIP Transport Fee (GH₵)</label>
                <input type="number" step="0.01" min="0" value={formData.delivery_fee_lesser_accra} onChange={(e) => set({ delivery_fee_lesser_accra: e.target.value })} placeholder="Optional - e.g., 35.00" />
              </div>
              <div className="form-group">
                <label>OA Transport Fee (GH₵)</label>
                <input type="number" step="0.01" min="0" value={formData.delivery_fee_dhl} onChange={(e) => set({ delivery_fee_dhl: e.target.value })} placeholder="Optional - e.g., 40.00" />
              </div>
              <div className="form-group">
                <label>VVIP Transport Fee (GH₵)</label>
                <input type="number" step="0.01" min="0" value={formData.delivery_fee_ups} onChange={(e) => set({ delivery_fee_ups: e.target.value })} placeholder="Optional - e.g., 50.00" />
              </div>
              <div className="form-group">
                <label>FedEx Transport Fee (GH₵)</label>
                <input type="number" step="0.01" min="0" value={formData.delivery_fee_fedex} onChange={(e) => set({ delivery_fee_fedex: e.target.value })} placeholder="Optional - e.g., 60.00" />
              </div>
            </div>
          </div>

          {/* Dynamic Product Specifications System */}
          <div className="form-section full-width" style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <h3>Dynamic Product Specifications</h3>
            <p className="help-text" style={{ marginBottom: '15px', color: '#4b5563', fontSize: '14px' }}>
              Add optional specifications such as Weight, Weight Unit, Colour, Multiple Colours, Material, Size, Packaging, Brand, Manufacturer, Country of Origin, Food Information, Pharmacy Information, Electronics Information, Clothing Information, Warranty, Return Policy, Delivery Information, Frequently Asked Questions, Supplier Associations, etc.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Specification Name (e.g. Material, Warranty)"
                value={formData.newSpecKey}
                onChange={(e) => set({ newSpecKey: e.target.value })}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <input
                type="text"
                placeholder="Specification Value (e.g. 100% Cotton, 1 Year)"
                value={formData.newSpecValue}
                onChange={(e) => set({ newSpecValue: e.target.value })}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.newSpecKey.trim() && formData.newSpecValue.trim()) {
                    const updated = { ...formData.specifications, [formData.newSpecKey.trim()]: formData.newSpecValue.trim() }
                    set({ specifications: updated, newSpecKey: '', newSpecValue: '' })
                  }
                }}
                className="btn-secondary"
                style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Add Spec
              </button>
            </div>

            {Object.keys(formData.specifications).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                {Object.entries(formData.specifications).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <span><strong>{key}:</strong> {String(val)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...formData.specifications }
                        delete updated[key]
                        set({ specifications: updated })
                      }}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
