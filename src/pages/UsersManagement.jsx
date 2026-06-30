import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit2, User, Briefcase, X, AlertCircle, Search } from 'lucide-react';
import { fetchOfficeUsers, createOfficeUser, updateOfficeUser, deleteOfficeUser } from '../lib/dataService';
import styles from './UsersManagement.module.css';

export default function UsersManagement() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / forms state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [activeUserId, setActiveUserId] = useState(null);

  // Form inputs
  const [name, setName] = useState('');
  const [division, setDivision] = useState('');
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchOfficeUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setName('');
    setDivision('');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setModalMode('edit');
    setActiveUserId(user.id);
    setName(user.name);
    setDivision(user.division || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const userPayload = { name, division };
      
      if (modalMode === 'add') {
        const res = await createOfficeUser(userPayload);
        if (res.error) throw new Error(res.error.message);
      } else {
        const res = await updateOfficeUser(activeUserId, userPayload);
        if (res.error) throw new Error(res.error.message);
      }

      setShowModal(false);
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini dari database?')) {
      const res = await deleteOfficeUser(id);
      if (res.error) {
        alert('Gagal menghapus pengguna: ' + res.error.message);
      } else {
        loadUsers();
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.division || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <section className={styles.header}>
        <div>
          <h2 className={styles.title}>Database Pengguna (Anggota BPS)</h2>
          <p className={styles.subtitle}>Kelola daftar pegawai yang berhak meminjam inventaris kantor</p>
        </div>
        <button className={styles.addBtn} onClick={handleOpenAdd}>
          <Plus size={20} />
          <span>Tambah Pengguna</span>
        </button>
      </section>

      {/* Searchbar */}
      <section className={`glass ${styles.toolbar}`}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Cari nama pengguna atau divisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </section>

      {/* Users table */}
      <section className={`glass ${styles.tableCard}`}>
        {loading ? (
          <div className={styles.shimmerContainer}>
            <div className="shimmer" style={{ height: '48px', marginBottom: '12px', borderRadius: '8px' }} />
            <div className="shimmer" style={{ height: '48px', marginBottom: '12px', borderRadius: '8px' }} />
            <div className="shimmer" style={{ height: '48px', marginBottom: '12px', borderRadius: '8px' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <User size={48} className={styles.emptyIcon} />
            <h4>Tidak Ada Pengguna</h4>
            <p>Database kosong atau tidak ditemukan pengguna dengan kata kunci tersebut.</p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Pengguna</th>
                  <th>Divisi / Bidang</th>
                  <th>Tanggal Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          <span>{u.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className={styles.userName}>{u.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.userDiv}>{u.division || '-'}</span>
                    </td>
                    <td>
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className={styles.editBtn}
                          title="Edit Pengguna"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className={styles.deleteBtn}
                          title="Hapus Pengguna"
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
        )}
      </section>

      {/* Modal Dialog */}
      {showModal && (
        <div className={styles.overlay}>
          <div className={`glass ${styles.modal} fade-in`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
              </h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {formError && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Lengkap *</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap pegawai..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Divisi / Bidang</label>
                <div className={styles.inputWrapper}>
                  <Briefcase className={styles.inputIcon} size={18} />
                  <input
                    type="text"
                    placeholder="Contoh: IPDS, Neraca, Sosial..."
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
