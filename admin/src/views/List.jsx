'use client';

import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import ReactDOM from 'react-dom';
import { useEffect, useState } from 'react';
import { backendUrl, currency } from '../config';
import { toast } from 'react-toastify';
import {
  Package, Trash2, Search, Filter, Star, IndianRupee, Grid, List as ListIcon, Tag, 
  Building2, Plus, ChevronLeft, ChevronRight, CheckCircle2, X, Save, Edit3,
  Eye, EyeOff, ArrowUpDown, CheckSquare, Square, BarChart3,
} from 'lucide-react';
import { categoryData, getSizesForSubCategory } from '../assets/categoryData';
import ProductImageSection from '../components/ProductImageSection';
import TextEditor from '../components/TextEditor';

/* Edit-form helpers */
const EMPTY6 = () => [null, null, null, null, null, null];
const STATIC_COMPANIES = ['Vasudhaa Vastrram', 'Anemone Vinkel', 'Jute Smart', 'Korakari'];

const buildEditForm = (product) => ({
  name: product?.name ?? '',
  description: product?.description ?? '',
  price: product?.price ?? '',
  discount: product?.discount ?? 0,
  category: product?.category ?? 'Women',
  subCategory: product?.subCategory ?? '',
  company: product?.company ?? 'Aharyas',
  bestseller: product?.bestseller ?? false,
  sizes: product?.sizes ?? [],
});

const EditOfferPriceRow = ({ price, discount, onDiscountChange }) => {
  const [input, setInput] = useState(
    discount > 0 && price
      ? String(Math.round(Number(price) * (1 - discount / 100)))
      : ''
  );
  useEffect(() => {
    if (!input) return;
    const offer = Number(input);
    const orig = Number(price);
    if (orig > 0 && offer < orig) onDiscountChange(Math.round(((orig - offer) / orig) * 100));
    else onDiscountChange(0);
  }, [price]);
  const handleChange = (val) => {
    setInput(val);
    const offer = Number(val);
    const orig = Number(price);
    if (!val || offer <= 0) onDiscountChange(0);
    else if (orig > 0 && offer < orig) onDiscountChange(Math.round(((orig - offer) / orig) * 100));
    else onDiscountChange(0);
  };
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
        Offer Price ({currency})
        {discount > 0 && (
          <span className="ml-2 inline-block bg-red-100 text-red-600 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {discount}% OFF
          </span>
        )}
      </label>
      <div className="relative">
        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          type="number" min="0" step="1"
          placeholder="Leave blank for no discount"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full pl-8 pr-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
        />
      </div>
      {discount > 0 && price && (
        <p className="mt-1 text-xs text-green-700 font-medium">
          You save: {currency}{(Number(price) * discount / 100).toFixed(0)}
          &nbsp;— Original: <span className="text-gray-400 line-through">{currency}{Number(price).toFixed(0)}</span>
        </p>
      )}
    </div>
  );
};

const EditModal = ({ product, onSuccess, onCancel, token }) => {
  const [images, setImages] = useState(EMPTY6());
  const [gdriveIds, setGdriveIds] = useState(EMPTY6());
  const [urlImages, setUrlImages] = useState(EMPTY6());
  const [existingImgs, setExistingImgs] = useState(() =>
    product?.images ? Array.from({ length: 6 }, (_, i) => product.images[i] || null) : EMPTY6()
  );
  const [form, setForm] = useState(() => buildEditForm(product));
  const [companies, setCompanies] = useState(STATIC_COMPANIES);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(buildEditForm(product));
    setImages(EMPTY6()); setGdriveIds(EMPTY6()); setUrlImages(EMPTY6());
    setExistingImgs(product?.images ? Array.from({ length: 6 }, (_, i) => product.images[i] || null) : EMPTY6());
    setShowAddCompany(false); setNewCompanyName('');
  }, [product]);

  const categoryMeta = categoryData[form.category] || { subCategories: [], sizes: { default: [] } };
  const currentSizes = getSizesForSubCategory(form.category, form.subCategory);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));


  const toggleSize = (size) =>
    setField('sizes', form.sizes.includes(size)
      ? form.sizes.filter((s) => s !== size)
      : [...form.sizes, size]);

  const handleAddCompany = () => {
    const n = newCompanyName.trim();
    if (!n) { toast.error('Enter a valid company name'); return; }
    if (companies.includes(n)) { toast.error('Company already exists'); return; }
    const updated = [...companies, n].sort();
    setCompanies(updated);
    setField('company', n);
    setNewCompanyName('');
    setShowAddCompany(false);
    toast.success(`Company "${n}" added`);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.price || !form.subCategory) {
      toast.error('Please fill in all required fields'); return;
    }
    const hasImage =
      images.some(Boolean) || gdriveIds.some(Boolean) || urlImages.some(Boolean) ||
      existingImgs.some(Boolean);
    if (!hasImage) { toast.error('Please add at least one product image'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('discount', form.discount || 0);
      fd.append('category', form.category);
      fd.append('subCategory', form.subCategory);
      fd.append('company', form.company || 'Aharyas');
      fd.append('bestseller', form.bestseller);
      fd.append('sizes', JSON.stringify(form.sizes));
      images.forEach((img, i) => { if (img) fd.append(`image${i + 1}`, img); });
      const driveLinks = gdriveIds
        .map((id, i) => (id && !images[i]) ? `https://drive.google.com/uc?export=download&id=${id}` : null)
        .filter(Boolean);
      if (driveLinks.length) fd.append('driveImageUrls', JSON.stringify(driveLinks));
      const directUrls = urlImages.filter((u, i) => u && !images[i] && !gdriveIds[i]);
      if (directUrls.length) fd.append('directImageUrls', JSON.stringify(directUrls));

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' };
      const response = await axios.put(`${backendUrl}/api/v1/product/edit/${product._id}`, fd, { headers });

      if (response.data.success) {
        toast.success('Product updated');
        onSuccess(response.data.product);
      } else {
        toast.error(response.data.message || 'Something went wrong');
      }
    } catch (error) {
      if (error.response?.status === 401) toast.error('Session expired — please log in again');
      else if (error.response) toast.error(`Server error: ${error.response.data?.message || 'Unknown'}`);
      else if (error.request) toast.error('Network error — could not reach server');
      else toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Edit3 size={18} className="text-gray-600" />
          <div>
            <h2 className="text-sm sm:text-lg font-medium uppercase tracking-wide text-black">Edit Product</h2>
            {form.name && (
              <p className="text-xs text-gray-500 font-light uppercase tracking-wider hidden sm:block truncate max-w-xs">
                {form.name}
              </p>
            )}
          </div>
        </div>
        <button type="button" onClick={onCancel} disabled={loading}
          className="p-2 text-gray-400 hover:text-black transition-colors flex-shrink-0">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-3 sm:p-6">
        <div className="space-y-4">
          
          {/* Images */}
          <ProductImageSection
            images={images} gdriveIds={gdriveIds} urlImages={urlImages}
            existingImages={existingImgs}
            onImagesChange={setImages} onGdriveIdsChange={setGdriveIds} onUrlImagesChange={setUrlImages}
            onExistingImagesChange={setExistingImgs}
          />

          {/* Product Information */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-gray-600" />
                <h3 className="text-sm font-medium uppercase tracking-wide text-black">Product Information</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Product Name *</label>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)}
                  placeholder="Enter product name" required
                  className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Description *</label>
                <TextEditor
                  value={form.description}
                  onChange={(html) => setField('description', html)}
                  placeholder="Describe the product in detail (use the toolbar to style and format, Ctrl+Z to undo, Ctrl+Y to redo)"
                />
              </div>
            </div>
          </div>

          {/* Brand / Company */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-600" />
                <h3 className="text-sm font-medium uppercase tracking-wide text-black">Brand / Company</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Select Company</label>
                <div className="flex gap-2">
                  <select value={form.company} onChange={(e) => setField('company', e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm">
                    <option value="Aharyas">Aharyas</option>
                    {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowAddCompany(true)}
                    className="px-3 sm:px-4 py-2.5 bg-black hover:bg-gray-800 text-white transition-all duration-300 flex items-center gap-1 font-light uppercase tracking-wide text-xs flex-shrink-0">
                    <Plus size={13} />Add
                  </button>
                </div>
              </div>
              {showAddCompany && (
                <div className="bg-gray-50 border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium uppercase tracking-wide text-black">Add Company</h4>
                    <button type="button" onClick={() => { setShowAddCompany(false); setNewCompanyName(''); }}
                      className="text-gray-400 hover:text-black"><X size={14} /></button>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompany())} />
                    <button type="button" onClick={handleAddCompany}
                      className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-light uppercase tracking-wide text-xs flex-shrink-0">Add</button>
                  </div>
                </div>
              )}
              <div className="bg-gray-50 border border-gray-100 p-2.5">
                <div className="flex items-center gap-2 text-gray-700">
                  <Building2 size={13} />
                  <span className="text-xs font-light">Selected: <span className="font-medium">{form.company || 'Aharyas'}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Category & Pricing */}
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-gray-600" />
                <h3 className="text-sm font-medium uppercase tracking-wide text-black">Category &amp; Pricing</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Category *</label>
                  <select value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value, subCategory: '', sizes: [] }))}
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm">
                    {Object.keys(categoryData).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Sub-Category *</label>
                  <select value={form.subCategory} onChange={(e) => setField('subCategory', e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm">
                    {categoryMeta.subCategories.map((sub, i) => (
                      <option key={i} value={sub}>{sub || 'Select Sub-Category'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Price ({currency}) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input value={form.price} onChange={(e) => setField('price', e.target.value)}
                      type="number" min="0" step="0.01" placeholder="0.00" required
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm" />
                  </div>
                </div>
                <EditOfferPriceRow
                  price={form.price} discount={form.discount}
                  onDiscountChange={(d) => setField('discount', d)}
                />
              </div>
            </div>
          </div>

          {/* Sizes */}
          {currentSizes.length > 0 && (
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-gray-600" />
                  <h3 className="text-sm font-medium uppercase tracking-wide text-black">Available Sizes</h3>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {currentSizes.map((size) => (
                    <button key={size} type="button" onClick={() => toggleSize(size)}
                      className={`px-4 py-2 border-2 text-xs font-light uppercase tracking-wide transition-all duration-300
                        ${form.sizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-black'}`}>
                      {size}
                    </button>
                  ))}
                </div>
                {form.sizes.length > 0 && (
                  <div className="bg-green-50 border border-green-200 p-2.5">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 size={13} />
                      <span className="text-xs font-light uppercase tracking-wide">
                        {form.sizes.length} size{form.sizes.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bestseller */}
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-white border border-gray-200">
            <input type="checkbox" id="bestseller-edit" checked={form.bestseller}
              onChange={() => setField('bestseller', !form.bestseller)}
              className="w-4 h-4 text-black border-gray-300 focus:ring-black flex-shrink-0" />
            <label htmlFor="bestseller-edit"
              className="cursor-pointer flex items-center gap-2 text-black font-light uppercase tracking-wide text-xs sm:text-sm">
              <Star className="text-gray-600 flex-shrink-0" size={14} />
              Mark as Bestseller
            </label>
          </div>

        </div>
      </div>

      {/* Sticky modal footer */}
      <div className="p-3 sm:p-5 border-t border-gray-200 bg-gray-50 flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button type="button" onClick={onCancel} disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 border-2 border-gray-300 text-black text-sm font-light uppercase tracking-wide hover:border-black transition-all duration-300">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="w-full sm:w-auto sm:ml-auto px-6 py-2.5 bg-black text-white text-sm font-light uppercase tracking-wide hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
          ) : (
            <><Save size={14} />Save Changes</>
          )}
        </button>
      </div>
    </>
  );
};

/* sort helpers */
const CATEGORY_ORDER = Object.keys(categoryData);
const SUBCATEGORY_ORDER = Object.fromEntries(
  Object.entries(categoryData).map(([cat, val]) => [
    cat,
    val.subCategories.filter((s) => s !== ''),
  ])
);
const catIdx = (p) => { const i = CATEGORY_ORDER.indexOf(p.category); return i === -1 ? CATEGORY_ORDER.length : i; };
const subCatIdx = (p) => { const s = SUBCATEGORY_ORDER[p.category] || []; const i = s.indexOf(p.subCategory); return i === -1 ? s.length : i; };
const productTs = (p) => {
  if (p.createdAt) return new Date(p.createdAt).getTime();
  if (p.date) return typeof p.date === 'number' ? p.date : new Date(p.date).getTime();
  return 0;
};
const productUpdateTime = (p) => {
  if (p.updatedAt) return new Date(p.updatedAt).getTime();
  if (p.createdAt) return new Date(p.createdAt).getTime();
  if (p.date) return typeof p.date === 'number' ? p.date : new Date(p.date).getTime();
  return 0;
};
const sortByUpdateTime = (arr) =>
  [...arr].sort((a, b) => productUpdateTime(b) - productUpdateTime(a));

const sortByRelevance = (arr) =>
  [...arr].sort((a, b) => {
    const cd = catIdx(a) - catIdx(b); if (cd !== 0) return cd;
    const sd = subCatIdx(a) - subCatIdx(b); if (sd !== 0) return sd;
    return productTs(b) - productTs(a);
  });

const imageThumb = (url, width = 300) => {
  if (!url) return url;
  if (url.includes('ik.imagekit.io')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}tr=w-${width},h-${width},cm-pad_resize,f-auto,q-auto`;
  }
  if (url.includes('cloudinary.com'))
    return url.replace('/upload/', `/upload/w_${width},h_${width},c_pad,f_auto,q_auto/`);
  return url;
};

/* ProductCard */
const ProductCard = ({ item, index, onEdit, onRemove, onToggleVisibility, onSelect, isSelected }) => (
  <div className={`bg-white border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 relative ${item.visible === false ? 'opacity-60' : ''}`}>
    {/* Selection checkbox */}
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(item._id); }}
      className="absolute top-2 left-2 z-20 p-1 bg-white/90 backdrop-blur-sm border border-gray-200 hover:border-black transition-all duration-200"
    >
      {isSelected
        ? <CheckSquare size={14} className="text-black" />
        : <Square size={14} className="text-gray-400" />}
    </button>
    <div className="relative h-60 sm:h-80">
      <img
        src={imageThumb(item.images?.[0]) || '/api/placeholder/300/200'}
        alt={item.name}
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = '/api/placeholder/300/200'; }}
      />
      {item.visible === false && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
          <span className="bg-black/80 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
            Hidden
          </span>
        </div>
      )}
      {item.bestseller && (
        <div className="absolute top-2 right-2 bg-black text-white p-1.5 z-10">
          <Star size={11} fill="white" />
        </div>
      )}
      {item.discount > 0 && (
        <div className="absolute top-2 left-10 bg-red-500 text-white px-2 py-1 text-xs font-bold uppercase tracking-wider z-10">
          -{Math.round(item.discount)}%
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5">
        <span className="text-xs font-light text-white">#{index + 1}</span>
      </div>
    </div>
    <div className="p-3 sm:p-4">
      <h3 className="font-medium text-gray-900 mb-1.5 line-clamp-2 text-xs sm:text-sm uppercase tracking-wide">{item.name}</h3>
      <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-600 uppercase tracking-wider flex-wrap">
        <Tag size={11} className="text-gray-400 flex-shrink-0" />
        <span className="font-light">{item.category}</span>
        {item.subCategory && (<><span className="text-gray-400">•</span><span className="font-light">{item.subCategory}</span></>)}
      </div>
      {item.company && item.company !== 'Aharyas' && (
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 size={11} className="text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-700 font-medium uppercase tracking-wide truncate">{item.company}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
        <div>
          {item.discount > 0 ? (
            <div>
              <div className="flex items-center gap-0.5">
                <IndianRupee size={13} className="text-black" />
                <span className="font-medium text-black text-base sm:text-lg">{(item.price * (1 - item.discount / 100)).toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-0.5 text-xs text-gray-400 line-through">
                <IndianRupee size={10} /><span>{item.price}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-0.5">
              <IndianRupee size={14} className="text-black" />
              <span className="font-medium text-black text-base sm:text-lg">{item.price}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => onToggleVisibility(item)}
            title={item.visible === false ? 'Show on storefront' : 'Hide from storefront'}
            className={`p-1.5 border transition-all duration-300
              ${item.visible === false
                ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100'
                : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'}`}
          >
            {item.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={() => onEdit(item)}
            title="Edit Product"
            className="p-1.5 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all duration-300"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={() => onRemove(item)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200
              hover:border-red-200 transition-all duration-300"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const List = () => {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  /* ── New advanced state ─────────────────────────────────────────── */
  const [sortOption, setSortOption] = useState('updated');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  /* data fetching */
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/v1/product/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setList(res.data.products || []);
        setFilteredList(res.data.products || []);
      } else {
        toast.error(`Error: ${res.data.message}`);
      }
    } catch {
      toast.error('Error fetching products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id) => {
    setLoading(true);
    try {
      const res = await axios.delete(`${backendUrl}/api/v1/product/remove/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) { toast.success('Product removed.'); await fetchList(); }
      else toast.error(`Error: ${res.data.message}`);
    } catch {
      toast.error('Error removing product.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Toggle visibility ──────────────────────────────────────────── */
  const toggleVisibility = async (product) => {
    // Optimistic update
    const newVisible = !(product.visible !== false);
    setList((prev) => prev.map((p) => p._id === product._id ? { ...p, visible: newVisible } : p));
    try {
      const res = await axios.patch(
        `${backendUrl}/api/v1/product/toggle-visibility/${product._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setList((prev) => prev.map((p) => p._id === product._id ? res.data.product : p));
      } else {
        // Revert on failure
        setList((prev) => prev.map((p) => p._id === product._id ? product : p));
        toast.error(res.data.message || 'Failed to toggle visibility');
      }
    } catch {
      setList((prev) => prev.map((p) => p._id === product._id ? product : p));
      toast.error('Error toggling product visibility.');
    }
  };

  /* ── Bulk actions ───────────────────────────────────────────────── */
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === currentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map((p) => p._id)));
    }
  };

  const bulkToggleVisibility = async (makeVisible) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    let success = 0;
    for (const id of selectedIds) {
      const product = list.find((p) => p._id === id);
      if (!product) continue;
      const currentlyVisible = product.visible !== false;
      if (currentlyVisible === makeVisible) continue;
      try {
        const res = await axios.patch(
          `${backendUrl}/api/v1/product/toggle-visibility/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setList((prev) => prev.map((p) => p._id === id ? res.data.product : p));
          success++;
        }
      } catch { /* continue */ }
    }
    setBulkLoading(false);
    setSelectedIds(new Set());
    if (success > 0) toast.success(`${success} product${success !== 1 ? 's' : ''} ${makeVisible ? 'shown' : 'hidden'}`);
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    let success = 0;
    for (const id of selectedIds) {
      try {
        const res = await axios.delete(`${backendUrl}/api/v1/product/remove/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) success++;
      } catch { /* continue */ }
    }
    setBulkLoading(false);
    setSelectedIds(new Set());
    if (success > 0) {
      toast.success(`${success} product${success !== 1 ? 's' : ''} deleted`);
      await fetchList();
    }
  };

  /* ── Sorting helper ─────────────────────────────────────────────── */
  const applySortOption = (arr, opt) => {
    switch (opt) {
      case 'updated': return sortByUpdateTime(arr);
      case 'price-asc': return [...arr].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...arr].sort((a, b) => b.price - a.price);
      case 'name-asc': return [...arr].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'bestseller': return [...arr].sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
      case 'relevance': return sortByRelevance(arr);
      default: return sortByUpdateTime(arr);
    }
  };

  /* filter / sort */
  useEffect(() => {
    let filtered = list;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(s) ||
        p.category?.toLowerCase().includes(s) ||
        p.subCategory?.toLowerCase().includes(s) ||
        p.company?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
      );
    }
    if (selectedCategory) filtered = filtered.filter((p) => p.category === selectedCategory);
    if (selectedSubCategory) filtered = filtered.filter((p) => p.subCategory === selectedSubCategory);
    if (visibilityFilter === 'visible') filtered = filtered.filter((p) => p.visible !== false);
    if (visibilityFilter === 'hidden') filtered = filtered.filter((p) => p.visible === false);
    setFilteredList(applySortOption(filtered, sortOption));
    setCurrentPage(1);
  }, [list, searchTerm, selectedCategory, selectedSubCategory, visibilityFilter, sortOption]);

  useEffect(() => { fetchList(); }, [token]);

  /* pagination */
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) for (let i = 1; i <= totalPages; i++) pages.push(i);
    else if (currentPage <= 3) [1, 2, 3, 4, '…', totalPages].forEach(p => pages.push(p));
    else if (currentPage >= totalPages - 2) [1, '…', totalPages - 3, totalPages - 2, totalPages - 1, totalPages].forEach(p => pages.push(p));
    else[1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages].forEach(p => pages.push(p));
    return pages;
  };

  const getSubCategoryOptions = () =>
    categoryData[selectedCategory]?.subCategories.filter((s) => s !== '') || [];

  /* ── Product stats ──────────────────────────────────────────────── */
  const stats = {
    total: list.length,
    visible: list.filter((p) => p.visible !== false).length,
    hidden: list.filter((p) => p.visible === false).length,
    bestsellers: list.filter((p) => p.bestseller).length,
  };

  /* edit success callback */
  const handleEditSuccess = (updatedProduct) => {
    setList((prev) => prev.map((p) => p._id === updatedProduct._id ? updatedProduct : p));
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-white px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      {deleteConfirm && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Product?</h3>
                <p className="text-sm text-gray-500 font-light mt-0.5 line-clamp-1">"{deleteConfirm.name}"</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-light mb-6">
              This action cannot be undone. The product will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => { removeProduct(deleteConfirm._id); setDeleteConfirm(null); }}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingProduct(null); }}
        >
          <div className="bg-white w-full max-w-4xl flex flex-col" style={{ maxHeight: '95dvh' }}>
            <EditModal
              product={editingProduct}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingProduct(null)}
              token={token}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">

        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-light text-black mb-2 sm:mb-3 tracking-wide uppercase">
            Product Inventory
          </h1>
          <div className="w-16 sm:w-20 h-0.5 bg-black mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600 font-light tracking-wide">
            Manage your product catalogue and inventory
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-gray-200 mb-4 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Search size={18} className="text-gray-600" />
                <h2 className="text-sm sm:text-lg font-medium uppercase tracking-wide text-black">Search &amp; Filter</h2>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-light">{filteredList.length}</div>
                <div className="text-xs text-gray-600 uppercase tracking-wider">Products</div>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Name, category, company…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 border border-gray-300
                      focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Category</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(''); }}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 border border-gray-300
                      focus:outline-none focus:border-black transition-all duration-300 appearance-none text-sm"
                  >
                    <option value="">All Categories</option>
                    {Object.keys(categoryData).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Sub-Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    disabled={!selectedCategory}
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 border border-gray-300
                      focus:outline-none focus:border-black transition-all duration-300
                      appearance-none text-sm disabled:opacity-50"
                  >
                    <option value="">All</option>
                    {getSubCategoryOptions().map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Visibility Filter + Sort Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                {/* Visibility filter */}
                <div className="flex border border-gray-300 text-xs">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'visible', label: 'Visible', icon: <Eye size={11} /> },
                    { key: 'hidden', label: 'Hidden', icon: <EyeOff size={11} /> },
                  ].map((opt) => (
                    <button key={opt.key} onClick={() => setVisibilityFilter(opt.key)}
                      className={`px-2.5 py-2 flex items-center gap-1 transition-all duration-200 uppercase tracking-wider font-light
                        ${visibilityFilter === opt.key ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider font-light">
                    <ArrowUpDown size={12} />
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="py-2 pl-1 pr-6 border border-gray-300 focus:outline-none focus:border-black text-xs appearance-none uppercase tracking-wider"
                    >
                      <option value="updated">Recently Updated</option>
                      <option value="price-asc">Price ↑ Low → High</option>
                      <option value="price-desc">Price ↓ High → Low</option>
                      <option value="name-asc">Name A → Z</option>
                      <option value="bestseller">Bestsellers First</option>
                      <option value="relevance">Category Relevance</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-600 uppercase tracking-wider font-light">
                  {filteredList.length > 0
                    ? `${startIndex + 1}–${Math.min(startIndex + itemsPerPage, filteredList.length)} of ${filteredList.length}`
                    : '0 products'}
                </div>
                <div className="flex border border-gray-300">
                  <button onClick={() => setViewMode('grid')}
                    className={`p-2 sm:p-3 transition-all duration-300 ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    title="Grid View"><Grid size={15} /></button>
                  <button onClick={() => setViewMode('list')}
                    className={`p-2 sm:p-3 transition-all duration-300 ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    title="List View"><ListIcon size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Stats Summary */}
        {list.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
            {[
              { label: 'Total', value: stats.total, icon: <Package size={14} />, color: 'border-gray-200' },
              { label: 'Visible', value: stats.visible, icon: <Eye size={14} />, color: 'border-green-200 bg-green-50/50' },
              { label: 'Hidden', value: stats.hidden, icon: <EyeOff size={14} />, color: 'border-red-200 bg-red-50/50' },
              { label: 'Bestsellers', value: stats.bestsellers, icon: <Star size={14} />, color: 'border-yellow-200 bg-yellow-50/50' },
            ].map((s) => (
              <div key={s.label} className={`border ${s.color} p-2.5 sm:p-4 text-center`}>
                <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                  {s.icon}
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider font-light">{s.label}</span>
                </div>
                <div className="text-lg sm:text-2xl font-light text-black">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div className="bg-black text-white mb-4 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={selectAll}
                className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-light hover:text-gray-300 transition-colors">
                {selectedIds.size === currentItems.length
                  ? <><CheckSquare size={14} /> Deselect All</>
                  : <><Square size={14} /> Select All</>}
              </button>
              <span className="text-xs font-light opacity-70">
                {selectedIds.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bulkToggleVisibility(true)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs uppercase tracking-wider font-light transition-colors disabled:opacity-50"
              >
                <Eye size={12} /> Show
              </button>
              <button
                onClick={() => bulkToggleVisibility(false)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs uppercase tracking-wider font-light transition-colors disabled:opacity-50"
              >
                <EyeOff size={12} /> Hide
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs uppercase tracking-wider font-light transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} /> Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 hover:text-gray-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <Package size={18} className="text-gray-600" />
              <h2 className="text-sm sm:text-lg font-medium uppercase tracking-wide text-black">Product Collection</h2>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600 font-light uppercase tracking-wide">Loading products…</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <Package className="mx-auto text-gray-300 mb-4" size={56} />
                <h3 className="text-lg sm:text-xl font-medium text-black mb-2 uppercase tracking-wide">
                  {list.length === 0 ? 'No products yet' : 'No matching products'}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto font-light px-4 mb-6">
                  {list.length === 0
                    ? 'Your catalogue is empty. Add your first product to get started.'
                    : 'Try adjusting your search or filters.'}
                </p>
                {list.length === 0 ? (
                  <Link to="/add-product"
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 bg-black text-white
                      text-sm uppercase tracking-wide font-light hover:bg-gray-800 transition-all duration-300">
                    <Plus size={15} />Add First Product
                  </Link>
                ) : (
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory(''); setSelectedSubCategory(''); setVisibilityFilter('all'); setSortOption('updated'); }}
                    className="px-6 sm:px-8 py-3 bg-black text-white text-sm uppercase tracking-wide
                      font-light hover:bg-gray-800 transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {currentItems.map((item, index) => (
                      <ProductCard
                        key={item._id}
                        item={item}
                        index={startIndex + index}
                        onEdit={setEditingProduct}
                        onRemove={setDeleteConfirm}
                        onToggleVisibility={toggleVisibility}
                        onSelect={toggleSelect}
                        isSelected={selectedIds.has(item._id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border border-gray-200 overflow-hidden">
                    {/* Mobile list */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {currentItems.map((item) => (
                        <div key={item._id} className={`p-3 hover:bg-gray-50 ${item.visible === false ? 'opacity-60' : ''}`}>
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <button onClick={() => toggleSelect(item._id)} className="p-0.5">
                                {selectedIds.has(item._id)
                                  ? <CheckSquare size={14} className="text-black" />
                                  : <Square size={14} className="text-gray-300" />}
                              </button>
                              <div className="relative">
                                <img
                                  src={imageThumb(item.images?.[0], 80) || '/api/placeholder/100/100'}
                                  alt={item.name}
                                  className="w-14 h-14 object-cover border border-gray-200"
                                />
                                {item.bestseller && <Star className="absolute -top-1 -right-1 text-black fill-black" size={12} />}
                                {item.visible === false && (
                                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-red-500 uppercase">Hidden</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 uppercase tracking-wide truncate">{item.name}</p>
                              <p className="text-xs text-gray-500 font-light mt-0.5">{item.category}{item.subCategory ? ` · ${item.subCategory}` : ''}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-0.5">
                                  <IndianRupee size={13} className="text-black" />
                                  <span className="font-medium text-black text-sm">
                                    {item.discount > 0 ? (item.price * (1 - item.discount / 100)).toFixed(0) : item.price}
                                  </span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => toggleVisibility(item)}
                                    title={item.visible === false ? 'Show' : 'Hide'}
                                    className={`p-1.5 border transition-all ${item.visible === false
                                      ? 'text-red-500 border-red-200 bg-red-50'
                                      : 'text-green-600 border-green-200 bg-green-50'}`}>
                                    {item.visible === false ? <EyeOff size={11} /> : <Eye size={11} />}
                                  </button>
                                  <button onClick={() => setEditingProduct(item)}
                                    title="Edit Product"
                                    className="p-1.5 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all">
                                    <Edit3 size={11} />
                                  </button>
                                  <button onClick={() => setDeleteConfirm(item)}
                                    className="p-1.5 border border-gray-200 hover:border-red-300 hover:text-red-600 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-left w-10">
                              <button onClick={selectAll} className="p-0.5">
                                {selectedIds.size === currentItems.length && currentItems.length > 0
                                  ? <CheckSquare size={14} className="text-black" />
                                  : <Square size={14} className="text-gray-400" />}
                              </button>
                            </th>
                            {['#', 'Image', 'Product', 'Category', 'Company', 'Price', 'Status', 'Actions'].map((h) => (
                              <th key={h}
                                className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider
                                  ${h === 'Actions' || h === 'Status' ? 'text-center' : 'text-left'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {currentItems.map((item, index) => (
                            <tr key={item._id} className={`hover:bg-gray-50 ${item.visible === false ? 'opacity-60' : ''}`}>
                              <td className="px-4 py-4">
                                <button onClick={() => toggleSelect(item._id)} className="p-0.5">
                                  {selectedIds.has(item._id)
                                    ? <CheckSquare size={14} className="text-black" />
                                    : <Square size={14} className="text-gray-400" />}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 font-light">#{startIndex + index + 1}</td>
                              <td className="px-6 py-4">
                                <div className="relative">
                                  <img src={imageThumb(item.images?.[0], 80) || '/api/placeholder/100/100'} alt={item.name}
                                    className="w-16 h-16 object-cover border border-gray-200" />
                                  {item.visible === false && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                      <span className="text-[8px] font-bold text-red-500 uppercase">Hidden</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <h3 className="font-medium text-gray-900 mb-1 uppercase tracking-wide text-sm">{item.name}</h3>
                                <p className="text-xs text-gray-600 line-clamp-2 font-light">{item.description}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900 text-sm uppercase">{item.category}</div>
                                {item.subCategory && <div className="text-xs text-gray-600 font-light uppercase">{item.subCategory}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                  <Building2 size={12} className="text-gray-500" />
                                  <span className="text-xs text-gray-700 font-medium uppercase">{item.company || 'Aharyas'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {item.discount > 0 ? (
                                  <div>
                                    <div className="flex items-center gap-1 font-medium text-black">
                                      <IndianRupee size={14} />{(item.price * (1 - item.discount / 100)).toFixed(0)}
                                    </div>
                                    <div className="flex items-center gap-0.5 text-xs text-gray-400 line-through">
                                      <IndianRupee size={11} />{item.price}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 font-medium text-black">
                                    <IndianRupee size={14} />{item.price}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => toggleVisibility(item)}
                                  title={item.visible === false ? 'Show on storefront' : 'Hide from storefront'}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide border transition-all duration-300
                                    ${item.visible === false
                                      ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                                      : 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100'}`}
                                >
                                  {item.visible === false ? <><EyeOff size={12} /> Hidden</> : <><Eye size={12} /> Visible</>}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => setEditingProduct(item)}
                                    title="Edit Product"
                                    className="p-1.5 border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all duration-300">
                                    <Edit3 size={14} />
                                  </button>
                                  <button onClick={() => setDeleteConfirm(item)}
                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200
                                      hover:border-red-200 transition-all duration-300">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3
                    border-t border-gray-200 pt-4 sm:pt-6">
                    <div className="text-xs sm:text-sm text-gray-600 font-light order-2 sm:order-1">
                      Page <span className="font-medium text-black">{currentPage}</span> of{' '}
                      <span className="font-medium text-black">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                        className="p-1.5 sm:p-2 border border-gray-300 hover:border-black hover:bg-gray-50
                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex gap-1">
                        {getPageNumbers().map((page, idx) => (
                          page === '…' ? (
                            <span key={`e-${idx}`} className="px-2 py-1.5 text-gray-400 text-sm">…</span>
                          ) : (
                            <button key={page} onClick={() => goToPage(page)}
                              className={`w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm border transition-all duration-300
                                ${currentPage === page
                                  ? 'bg-black text-white border-black'
                                  : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}>
                              {page}
                            </button>
                          )
                        ))}
                      </div>
                      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                        className="p-1.5 sm:p-2 border border-gray-300 hover:border-black hover:bg-gray-50
                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-light order-3">{filteredList.length} total</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default List;