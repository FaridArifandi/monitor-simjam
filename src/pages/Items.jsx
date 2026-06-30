import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, X, Camera, AlertCircle, Trash2, LayoutGrid, List, Eye, ArrowUpRight, MapPin } from 'lucide-react';
import { fetchItems, createItem, uploadPhoto, deleteItem } from '../lib/dataService';
import { categories } from '../lib/demoData';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import BorrowModal from '../components/BorrowModal';
import styles from './Items.module.css';


export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeBorrowItem, setActiveBorrowItem] = useState(null);

  // Add Item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(categories[0] || 'Elektronik');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPhoto, setNewItemPhoto] = useState(null);
  const [newItemPhotoPreview, setNewItemPhotoPreview] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchItems();
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setAddError('Ukuran file maksimal adalah 5MB.');
        return;
      }
      setNewItemPhoto(file);
      setNewItemPhotoPreview(URL.createObjectURL(file));
      setAddError(null);
    }
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCode.trim()) {
      setAddError('Nama dan Kode barang wajib diisi.');
      return;
    }

    setAddLoading(true);
    setAddError(null);

    try {
      let image_url = null;
      if (newItemPhoto) {
        const uploadResult = await uploadPhoto(newItemPhoto, 'items');
        if (uploadResult.error) {
          throw new Error('Gagal mengupload foto barang: ' + uploadResult.error.message);
        }
        image_url = uploadResult.url;
      }

      const itemPayload = {
        name: newItemName,
        code: newItemCode,
        category: newItemCategory,
        location: newItemLocation,
        description: newItemDescription,
        image_url,
      };

      const res = await createItem(itemPayload);
      if (res.error) {
        throw new Error(res.error.message);
      }

      // Reset form
      setNewItemName('');
      setNewItemCode('');
      setNewItemCategory(categories[0] || 'Elektronik');
      setNewItemLocation('');
      setNewItemDescription('');
      setNewItemPhoto(null);
      setNewItemPhotoPreview(null);
      setShowAddModal(false);
      
      // Reload list
      loadItems();
    } catch (err) {
      setAddError(err.message || 'Terjadi kesalahan saat menambah barang.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
      const res = await deleteItem(id);
      if (res.error) {
        alert('Gagal menghapus barang: ' + res.error.message);
      } else {
        loadItems();
      }
    }
  };

  // Filter items based on search query and category
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.container}>
      {/* Header section with search and add button */}
      <section className={styles.header}>
        <div>
          <h2 className={styles.title}>Daftar Inventaris Barang</h2>
          <p className={styles.subtitle}>Kelola semua data barang kantor di sini</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          <span>Tambah Barang</span>
        </button>
      </section>

      {/* Search and filter toolbar */}
      <section className={`glass ${styles.toolbar}`}>
        <div className={styles.toolbarContent}>
          <div className={styles.searchBarWrapper}>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
            />
          </div>
          <div className={styles.viewToggleGroup}>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.toggleViewBtn} ${viewMode === 'grid' ? styles.toggleActive : ''}`}
              title="Tampilan Grid / Card"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`${styles.toggleViewBtn} ${viewMode === 'table' ? styles.toggleActive : ''}`}
              title="Tampilan Tabel / List"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* List / Grid of items */}
      <section className={styles.gridSection}>
        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shimmer" style={{ height: '320px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={`glass ${styles.emptyState}`}>
            <Package size={48} className={styles.emptyIcon} />
            <h4>Tidak Ada Barang</h4>
            <p>Silakan sesuaikan filter pencarian atau tambahkan barang baru.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className={styles.grid}>
            {filteredItems.map((item) => (
              <div key={item.id} className={styles.cardWrapper}>
                <ItemCard item={item} onBorrow={setActiveBorrowItem} />
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className={styles.deleteCardBtn}
                  title="Hapus Barang"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={`glass ${styles.tableCard}`}>
            <div className={styles.tableResponsive}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Kode</th>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th>Lokasi</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.tableImageWrapper}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className={styles.tableImage} />
                          ) : (
                            <div className={styles.tablePlaceholderImage}>
                              <Package size={18} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <code className={styles.tableCode}>{item.code}</code>
                      </td>
                      <td>
                        <span className={styles.tableItemName}>{item.name}</span>
                      </td>
                      <td>
                        <span className={styles.tableCategory}>{item.category}</span>
                      </td>
                      <td>
                        <div className={styles.tableLocationRow}>
                          <MapPin size={14} />
                          <span>{item.location || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <Link to={`/items/${item.id}`} className={styles.tableActionBtn} title="Lihat Detail">
                            <Eye size={16} />
                          </Link>
                          {item.status === 'tersedia' && (
                            <button
                              onClick={() => setActiveBorrowItem(item)}
                              className={styles.tableBorrowBtn}
                              title="Pinjam Barang"
                            >
                              <ArrowUpRight size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className={styles.tableDeleteBtn}
                            title="Hapus Barang"
                          >
                            <Trash2 size={16} />
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
      </section>

      {/* Modal: Add Item */}
      {showAddModal && (
        <div className={styles.overlay}>
          <div className={`glass ${styles.modal} fade-in`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Tambah Barang Baru</h3>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className={styles.form}>
              {addError && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={18} />
                  <span>{addError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Laptop Lenovo ThinkPad..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Kode Inventaris *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: ELK-009..."
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Kategori</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className={styles.select}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Lokasi Penyimpanan</label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang IT, Gudang Utama..."
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Keterangan / Spesifikasi</label>
                <textarea
                  placeholder="Masukkan spesifikasi singkat..."
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Foto Barang</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className={styles.hiddenInput}
                  id="item-photo-upload"
                />
                {newItemPhotoPreview ? (
                  <div className={styles.previewContainer}>
                    <img src={newItemPhotoPreview} alt="Preview" className={styles.previewImage} />
                    <button
                      type="button"
                      className={styles.removePhotoBtn}
                      onClick={() => {
                        setNewItemPhoto(null);
                        setNewItemPhotoPreview(null);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="item-photo-upload" className={styles.photoPlaceholder}>
                    <Camera size={24} className={styles.cameraIcon} />
                    <span className={styles.photoText}>Upload Foto Barang</span>
                  </label>
                )}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn} disabled={addLoading}>
                  {addLoading ? 'Menyimpan...' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Borrow Item */}
      {activeBorrowItem && (
        <BorrowModal
          item={activeBorrowItem}
          onClose={() => setActiveBorrowItem(null)}
          onSuccess={() => {
            setActiveBorrowItem(null);
            loadItems();
          }}
        />
      )}
    </div>
  );
}
