'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Upload, Image as ImageIcon, Trash2, Link, GripVertical, Plus
} from 'lucide-react';

/* Google Drive helpers */
const GDRIVE_FILE_RE = /\/file\/d\/([a-zA-Z0-9_-]+)/;
const GDRIVE_FOLDER_RE = /\/folders\/([a-zA-Z0-9_-]+)/;

export const extractGDriveFileId = (url) => {
  const t = url.trim();
  const m = t.match(GDRIVE_FILE_RE) || t.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
};
export const extractGDriveFolderId = (url) => {
  const m = url.trim().match(GDRIVE_FOLDER_RE);
  return m ? m[1] : null;
};
export const gdriveThumbUrl = (id) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
export const fetchFolderImageIds = async (folderId) => {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'image/'&fields=files(id,name)&key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return (data.files || []).map((f) => f.id);
  } catch {
    return [];
  }
};



/* TABS for the link panel */
const LINK_TABS = [
  { id: 'url', label: 'Image URL' },
  { id: 'drive', label: 'Drive File' },
  { id: 'folder', label: 'Drive Folder' },
];

/* ProductImageSection */
const ProductImageSection = ({
  images,
  gdriveIds,
  urlImages,
  existingImages = [null, null, null, null, null, null],
  onImagesChange,
  onGdriveIdsChange,
  onUrlImagesChange,
  onExistingImagesChange = (_val) => {},
}) => {
  /* link-panel state */
  const [activeTab, setActiveTab] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [driveFileUrl, setDriveFileUrl] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggingSlot, setDraggingSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  const fileInputRef = useRef(null);

  /* preview helper */
  const getPreview = (i) => {
    if (images[i]) return { src: URL.createObjectURL(images[i]), badge: null };
    if (gdriveIds[i]) return { src: gdriveThumbUrl(gdriveIds[i]), badge: 'Drive' };
    if (urlImages[i]) return { src: urlImages[i], badge: urlImages[i].includes('ik.imagekit.io') ? 'Uploaded' : 'URL' };
    if (existingImages[i]) return { src: existingImages[i], badge: 'Saved' };
    return null;
  };

  const filledCount =
    images.filter(Boolean).length +
    gdriveIds.filter((id, i) => id && !images[i]).length +
    urlImages.filter((u, i) => u && !images[i] && !gdriveIds[i]).length +
    existingImages.filter((e, i) => e && !images[i] && !gdriveIds[i] && !urlImages[i]).length;

  /* slot helpers */
  const swapSlots = (a, b) => {
    const ni = [...images];[ni[a], ni[b]] = [ni[b], ni[a]]; onImagesChange(ni);
    const ng = [...gdriveIds];[ng[a], ng[b]] = [ng[b], ng[a]]; onGdriveIdsChange(ng);
    const nu = [...urlImages];[nu[a], nu[b]] = [nu[b], nu[a]]; onUrlImagesChange(nu);
    if (onExistingImagesChange) {
      const ne = [...existingImages];[ne[a], ne[b]] = [ne[b], ne[a]]; onExistingImagesChange(ne);
    }
  };

  const removeSlot = (i) => {
    onImagesChange(images.map((v, idx) => idx === i ? null : v));
    onGdriveIdsChange(gdriveIds.map((v, idx) => idx === i ? null : v));
    onUrlImagesChange(urlImages.map((v, idx) => idx === i ? null : v));
    if (onExistingImagesChange)
      onExistingImagesChange(existingImages.map((v, idx) => idx === i ? null : v));
  };

  const emptySlots = () =>
    Array.from({ length: 6 }, (_, i) => i)
      .filter(i => !images[i] && !gdriveIds[i] && !urlImages[i] && !existingImages[i]);

  /* file upload helpers */
  const uploadFiles = async (files) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) { toast.error('Please select image files only'); return; }

    const slots = emptySlots();
    if (!slots.length) { toast.warning('All 6 image slots are filled'); return; }

    const toAdd = arr.slice(0, slots.length);
    if (arr.length > slots.length)
      toast.warning(`Only ${slots.length} slot(s) available — adding first ${slots.length}.`);

    onImagesChange((prev) => {
      const ni = [...prev];
      toAdd.forEach((f, idx) => { ni[slots[idx]] = f; });
      return ni;
    });
  };

  /* drag-drop zone */
  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }, [images, gdriveIds, urlImages, existingImages]);

  /* slot drag-to-reorder */
  const handleSlotDragStart = (e, i) => {
    e.stopPropagation();
    setDraggingSlot(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('slotIndex', String(i));
  };
  const handleSlotDragOver = (e, i) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; setDragOverSlot(i); };
  const handleSlotDrop = (e, target) => {
    e.preventDefault(); e.stopPropagation();
    const src = Number(e.dataTransfer.getData('slotIndex'));
    if (!isNaN(src) && src !== target) swapSlots(src, target);
    setDraggingSlot(null); setDragOverSlot(null);
  };
  const handleSlotDragEnd = () => { setDraggingSlot(null); setDragOverSlot(null); };

  const handleSlotFilePick = async (file, index) => {
    if (!file) return;
    onImagesChange((prev) => { const ni = [...prev]; ni[index] = file; return ni; });
    onUrlImagesChange((prev) => prev.map((v, i) => i === index ? null : v));
    onGdriveIdsChange((prev) => prev.map((v, i) => i === index ? null : v));
  };

  /* URL import */
  const handleUrlImport = async () => {
    const raw = urlInput.trim();
    if (!raw) { toast.error('Paste at least one image URL'); return; }

    const urls = raw.split(/[\n,]+/).map((u) => u.trim()).filter(Boolean);
    for (const u of urls) {
      try { new URL(u); } catch { toast.error(`Invalid URL: ${u}`); return; }
    }

    const slots = emptySlots();
    if (!slots.length) { toast.warning('All 6 image slots are filled'); return; }

    const toAdd = urls.slice(0, slots.length);
    if (urls.length > slots.length)
      toast.warning(`Only ${slots.length} slot(s) available — using first ${slots.length}.`);

    setUrlInput('');
    onUrlImagesChange((prev) => {
      const nu = [...prev];
      toAdd.forEach((u, idx) => { nu[slots[idx]] = u; });
      return nu;
    });
    toast.success(`${toAdd.length} image(s) added!`);
  };

  /* Drive file import */
  const handleDriveFileImport = async () => {
    if (!driveFileUrl.trim()) { toast.error('Paste a Google Drive file link'); return; }
    const fileId = extractGDriveFileId(driveFileUrl);
    if (!fileId) { toast.error('Could not extract file ID — use a direct share link (file/d/…)'); return; }
    const slots = emptySlots();
    if (!slots.length) { toast.warning('All 6 image slots are filled'); return; }

    setDriveFileUrl('');
    onGdriveIdsChange((prev) => {
      const ng = [...prev];
      ng[slots[0]] = fileId;
      return ng;
    });
    toast.success('Drive image added!');
  };

  /* Drive folder import */
  const handleDriveFolderImport = async () => {
    if (!driveFolderUrl.trim()) { toast.error('Paste a Google Drive folder link'); return; }
    const folderId = extractGDriveFolderId(driveFolderUrl);
    if (!folderId) { toast.error('Invalid folder URL — must contain /folders/…'); return; }
    setDriveLoading(true);
    const ids = await fetchFolderImageIds(folderId);
    setDriveLoading(false);
    if (!ids.length) { toast.error('No images found — ensure folder is shared as "Anyone with the link → Viewer"'); return; }

    const slots = emptySlots();
    const toImport = ids.slice(0, slots.length);
    if (ids.length > slots.length)
      toast.warning(`Only ${slots.length} slot(s) available — importing first ${slots.length}.`);

    setDriveFolderUrl('');
    onGdriveIdsChange((prev) => {
      const ng = [...prev];
      toImport.forEach((id, idx) => {
        ng[slots[idx]] = id;
      });
      return ng;
    });
    toast.success(`${toImport.length} Drive image(s) added!`);
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <ImageIcon size={18} className="text-gray-600" />
            <h2 className="text-sm sm:text-lg font-medium uppercase tracking-wide text-black">Product Images</h2>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 font-light">{filledCount}/6</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">

        {/* Drag & Drop zone */}
        <div
          className={`relative border-2 border-dashed transition-all duration-200 cursor-pointer select-none
            ${dragActive
              ? 'border-black bg-gray-50 scale-[1.005]'
              : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Upload
              size={28}
              className={`transition-colors duration-200 ${dragActive ? 'text-black' : 'text-gray-300'}`}
            />
            <p className="text-sm text-gray-500 font-light">
              {dragActive ? 'Drop to upload' : 'Drag & drop images here'}
            </p>
            <p className="text-xs text-gray-400">or click to browse files</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.length && uploadFiles(e.target.files)}
          />
        </div>

        {/* Link / URL / Drive panel */}
        <div className="border border-gray-200">
          <div className="w-full flex items-center px-3 py-2.5
            text-xs font-semibold uppercase tracking-widest text-gray-500">
            <span className="flex items-center gap-1.5">
              <Link size={12} />
              Add via URL or Google Drive
            </span>
          </div>

          <div className="border-t border-gray-100">
            <div className="flex border-b border-gray-100 px-3 pt-3 gap-1">
              {LINK_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs px-3 py-1.5 border-b-2 transition-colors font-medium uppercase tracking-wider
                    ${activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-3">
              {activeTab === 'url' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">
                    Paste one or more image URLs (one per line or comma-separated)
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      rows={3}
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm resize-none
                        focus:outline-none focus:border-black transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleUrlImport();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleUrlImport}
                      className="bg-black text-white px-4 text-xs font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors self-stretch"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">Ctrl+Enter to submit</p>
                </div>
              )}

              {/* Drive File */}
              {activeTab === 'drive' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">
                    Paste a Google Drive <strong>file</strong> share link (…/file/d/…)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={driveFileUrl}
                      onChange={(e) => setDriveFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/…"
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm
                        focus:outline-none focus:border-black transition-colors"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDriveFileImport(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleDriveFileImport}
                      className="bg-black text-white px-4 text-xs font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Drive Folder */}
              {activeTab === 'folder' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-400">
                    Paste a Google Drive <strong>folder</strong> link — all images will be imported. Ensure the folder is shared as "Anyone with the link → Viewer".
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={driveFolderUrl}
                      onChange={(e) => setDriveFolderUrl(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/…"
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDriveFolderImport(); } }}
                    />
                    <button
                      type="button"
                      disabled={driveLoading}
                      onClick={handleDriveFolderImport}
                      className="bg-black text-white px-4 text-xs font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {driveLoading ? '…' : 'Import'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image grid with drag-to-reorder */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {Array.from({ length: 6 }, (_, index) => {
            const preview = getPreview(index);
            const isDragging = draggingSlot === index;
            const isOver = dragOverSlot === index && draggingSlot !== null && draggingSlot !== index;

            return (
              <div
                key={index}
                className={`relative group aspect-square transition-all duration-200
                  ${isDragging ? 'opacity-40 scale-95' : ''}
                  ${isOver ? 'ring-2 ring-black ring-offset-1 scale-[1.04]' : ''}`}
              >
                {/* Slot number badge */}
                <div className={`absolute top-1 left-1 z-20 w-4 h-4 flex items-center justify-center
                  text-[9px] font-bold leading-none pointer-events-none
                  ${index === 0 ? 'bg-black text-white' : 'bg-white/80 text-gray-600 border border-gray-300'}`}>
                  {index + 1}
                </div>

                {preview ? (
                  <>
                    {/* Grip handle */}
                    <div className="absolute top-1 right-1 z-20 bg-black/60 text-white p-0.5
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <GripVertical size={11} />
                    </div>

                    {/* Draggable image */}
                    <div
                      className={`absolute inset-0 bg-white border-2 border-gray-200 hover:border-black
                        flex items-center justify-center overflow-hidden transition-all duration-300
                        cursor-grab active:cursor-grabbing
                        ${isOver ? 'border-black' : ''}`}
                      draggable
                      onDragStart={(e) => handleSlotDragStart(e, index)}
                      onDragOver={(e) => handleSlotDragOver(e, index)}
                      onDrop={(e) => handleSlotDrop(e, index)}
                      onDragEnd={handleSlotDragEnd}
                    >
                      <img
                        src={preview.src}
                        alt={`Slot ${index + 1}`}
                        className="object-cover w-full h-full select-none"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40
                        transition-all duration-300 flex items-center justify-center pointer-events-none">
                        <ImageIcon className="text-white opacity-0 group-hover:opacity-100
                          transition-opacity duration-300" size={18} />
                      </div>
                      {preview.badge && preview.badge !== 'Saved' && (
                        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-0.5 pointer-events-none">
                          <span className={`text-white text-[9px] px-1.5 py-0.5 uppercase tracking-wide
                            ${preview.badge === 'Drive' ? 'bg-black/70' : preview.badge === 'Uploaded' ? 'bg-green-600/80' : 'bg-blue-600/80'}`}>
                            {preview.badge}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Empty slot — click to pick a file, also accepts drops */
                  <div
                    className={`absolute inset-0 bg-white border-2 border-gray-200 hover:border-black
                      flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300
                      ${isOver ? 'border-black' : ''}`}
                    onClick={() => document.getElementById(`img-slot-${index}`)?.click()}
                    onDragOver={(e) => handleSlotDragOver(e, index)}
                    onDrop={(e) => handleSlotDrop(e, index)}
                    onDragEnd={handleSlotDragEnd}
                  >
                    <div className="flex flex-col items-center justify-center text-gray-300 p-2">
                      <Plus size={18} strokeWidth={1.5} className="mb-0.5" />
                      <span className="text-[9px] uppercase tracking-wider font-light">Add</span>
                    </div>
                  </div>
                )}

                {/* Remove button */}
                {preview && (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="absolute -top-2 -right-2 bg-black hover:bg-red-600 text-white p-1
                      opacity-0 group-hover:opacity-100 transition-all duration-300 z-30"
                  >
                    <Trash2 size={10} />
                  </button>
                )}

                <input
                  type="file"
                  id={`img-slot-${index}`}
                  hidden
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleSlotFilePick(e.target.files[0], index)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductImageSection;