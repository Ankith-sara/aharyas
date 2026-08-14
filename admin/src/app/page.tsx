'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Package, Tag, Star, CheckCircle2, IndianRupee, Building2, Plus, X,
} from 'lucide-react';
import { backendUrl, currency } from '@/config';
import { categoryData, getSizesForSubCategory } from '@/assets/categoryData';
import ProductImageSection from '@/components/ProductImageSection';
import TextEditor from '@/components/TextEditor';
import { useAuth } from '@/context/AuthContext';

const EMPTY6 = () => [null, null, null, null, null, null];

const STATIC_COMPANIES = ['Vasudhaa Vastrram', 'Anemone Vinkel', 'Jute Smart', 'Korakari'];

const buildForm = () => ({
  name: '',
  description: '',
  price: '',
  discount: 0,
  category: 'Women',
  subCategory: '',
  company: 'Aharyas',
  bestseller: false,
  sizes: [] as string[],
});

/* OfferPriceRow helper */
const OfferPriceRow = ({ price, discount, onDiscountChange }: { price: any; discount: number; onDiscountChange: (val: number) => void }) => {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!input) return;
    const offer = Number(input);
    const orig = Number(price);
    if (orig > 0 && offer < orig)
      onDiscountChange(Math.round(((orig - offer) / orig) * 100));
    else
      onDiscountChange(0);
  }, [price]);

  const handleChange = (val: string) => {
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
          <span className="ml-2 inline-block bg-red-100 text-red-600 text-[10px] font-semibold
            px-2 py-0.5 rounded-full uppercase tracking-wider">
            {discount}% OFF
          </span>
        )}
      </label>
      <div className="relative">
        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          type="number"
          min="0"
          step="1"
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

export default function AddProductPage() {
  const { token } = useAuth();
  const [images, setImages] = useState(EMPTY6());
  const [gdriveIds, setGdriveIds] = useState(EMPTY6());
  const [urlImages, setUrlImages] = useState(EMPTY6());
  const [form, setForm] = useState(buildForm);
  const [companies, setCompanies] = useState(STATIC_COMPANIES);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [loading, setLoading] = useState(false);
  const categoryMeta = categoryData[form.category] || { subCategories: [], sizes: { default: [] } };
  const currentSizes = getSizesForSubCategory(form.category, form.subCategory);
  const setField = (key: string, val: any) => setForm((prev: any) => ({ ...prev, [key]: val }));

  const toggleSize = (size: string) =>
    setField('sizes', form.sizes.includes(size)
      ? form.sizes.filter((s: string) => s !== size)
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

  const resetForm = () => {
    setForm(buildForm());
    setImages(EMPTY6()); setGdriveIds(EMPTY6()); setUrlImages(EMPTY6());
    setShowAddCompany(false); setNewCompanyName('');
  };

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.price || !form.subCategory) {
      toast.error('Please fill in all required fields'); return;
    }
    const hasImage =
      images.some(Boolean) ||
      gdriveIds.some(Boolean) ||
      urlImages.some(Boolean);
    if (!hasImage) { toast.error('Please add at least one product image'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('discount', String(form.discount || 0));
      fd.append('category', form.category);
      fd.append('subCategory', form.subCategory);
      fd.append('company', form.company || 'Aharyas');
      fd.append('bestseller', String(form.bestseller));
      fd.append('sizes', JSON.stringify(form.sizes));

      images.forEach((img, i) => { if (img) fd.append(`image${i + 1}`, img); });

      const driveLinks = gdriveIds
        .map((id, i) => (id && !images[i]) ? `https://drive.google.com/uc?export=download&id=${id}` : null)
        .filter(Boolean);
      if (driveLinks.length) fd.append('driveImageUrls', JSON.stringify(driveLinks));

      const directUrls = urlImages.filter((u, i) => u && !images[i] && !gdriveIds[i]);
      if (directUrls.length) fd.append('directImageUrls', JSON.stringify(directUrls));

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' };
      const response = await axios.post(`${backendUrl}/api/v1/product/add`, fd, { headers });

      if (response.data.success) {
        toast.success(`Added: ${response.data.message}`);
        resetForm();
      } else {
        toast.error(response.data.message || 'Something went wrong');
      }
    } catch (error: any) {
      if (error.response?.status === 401) toast.error('Session expired — please log in again');
      else if (error.response) toast.error(`Server error: ${error.response.data?.message || 'Unknown'}`);
      else if (error.request) toast.error('Network error — could not reach server');
      else toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-light text-black mb-2 sm:mb-3 tracking-wide uppercase">
            Add New Product
          </h1>
          <div className="w-16 sm:w-20 h-0.5 bg-black mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600 font-light tracking-wide">
            Fill in the details below to add a new product to the catalogue
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">

          {/* Images */}
          <ProductImageSection
            images={images}
            gdriveIds={gdriveIds}
            urlImages={urlImages}
            existingImages={EMPTY6()}
            onImagesChange={setImages}
            onGdriveIdsChange={setGdriveIds}
            onUrlImagesChange={setUrlImages}
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
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Description *</label>
                <TextEditor
                  value={form.description}
                  onChange={(html: string) => setField('description', html)}
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
                  <select
                    value={form.company}
                    onChange={(e) => setField('company', e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  >
                    <option value="Aharyas">Aharyas</option>
                    {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(true)}
                    className="px-3 sm:px-4 py-2.5 bg-black hover:bg-gray-800 text-white transition-all duration-300 flex items-center gap-1 font-light uppercase tracking-wide text-xs flex-shrink-0"
                  >
                    <Plus size={13} />Add
                  </button>
                </div>
              </div>

              {showAddCompany && (
                <div className="bg-gray-50 border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium uppercase tracking-wide text-black">Add Company</h4>
                    <button
                      type="button"
                      onClick={() => { setShowAddCompany(false); setNewCompanyName(''); }}
                      className="text-gray-400 hover:text-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompany())}
                    />
                    <button
                      type="button"
                      onClick={handleAddCompany}
                      className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-light uppercase tracking-wide text-xs flex-shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-100 p-2.5">
                <div className="flex items-center gap-2 text-gray-700">
                  <Building2 size={13} />
                  <span className="text-xs font-light">
                    Selected: <span className="font-medium">{form.company || 'Aharyas'}</span>
                  </span>
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
                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value, subCategory: '', sizes: [] }))}
                    className="w-full px-3 py-2.5 border border-gray-300  focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  >
                    {Object.keys(categoryData).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Sub-category */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Sub-Category *</label>
                  <select
                    value={form.subCategory}
                    onChange={(e) => setField('subCategory', e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 focus:outline-none focus:border-black transition-all duration-300 text-sm"
                  >
                    {categoryMeta.subCategories.map((sub: string, i: number) => (
                      <option key={i} value={sub}>{sub || 'Select Sub-Category'}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Price ({currency}) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      value={form.price}
                      onChange={(e) => setField('price', e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-300  focus:outline-none focus:border-black transition-all duration-300 text-sm"
                    />
                  </div>
                </div>

                {/* Offer Price */}
                <OfferPriceRow
                  price={form.price}
                  discount={form.discount}
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
                  {currentSizes.map((size: string) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-4 py-2 border-2 text-xs font-light uppercase tracking-wide transition-all duration-300
                        ${form.sizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-black'}`}
                    >
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
            <input
              type="checkbox"
              id="bestseller-add"
              checked={form.bestseller}
              onChange={() => setField('bestseller', !form.bestseller)}
              className="w-4 h-4 text-black border-gray-300 focus:ring-black flex-shrink-0"
            />
            <label
              htmlFor="bestseller-add"
              className="cursor-pointer flex items-center gap-2 text-black font-light
                uppercase tracking-wide text-xs sm:text-sm"
            >
              <Star className="text-gray-600 flex-shrink-0" size={14} />
              Mark as Bestseller
            </label>
          </div>

          {/* Action row */}
          <div className="bg-white border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300
                  text-black text-sm font-light uppercase tracking-wide
                  hover:border-black transition-all duration-300"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto sm:ml-auto px-6 sm:px-8 py-3 sm:py-4
                  bg-black text-white text-sm font-light uppercase tracking-wide
                  hover:bg-gray-800 transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding…
                  </>
                ) : (
                  <><Package size={16} />Add Product</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
