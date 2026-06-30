import { useState, useRef, useEffect } from 'react';
import { X, Calendar, User, Briefcase, Camera, Image, Check, AlertCircle } from 'lucide-react';
import { createBorrowing, uploadPhoto, fetchOfficeUsers } from '../lib/dataService';
import styles from './BorrowModal.module.css';

export default function BorrowModal({ item, onClose, onSuccess }) {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerDivision, setBorrowerDivision] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetchOfficeUsers();
        setUsers(res.data || []);
      } catch (err) {
        console.error('Gagal memuat database pengguna:', err);
      }
    }
    loadUsers();
  }, []);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal adalah 5MB.');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setError('Nama peminjam wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let borrow_photo_url = null;
      if (photo) {
        const uploadResult = await uploadPhoto(photo, 'borrowings');
        if (uploadResult.error) {
          throw new Error('Gagal mengupload foto bukti (PAP): ' + uploadResult.error.message);
        }
        borrow_photo_url = uploadResult.url;
      }

      const borrowingData = {
        item_id: item.id,
        borrower_name: borrowerName,
        borrower_division: borrowerDivision,
        expected_return_date: expectedReturnDate ? new Date(expectedReturnDate).toISOString() : null,
        borrow_photo_url,
        notes: notes,
      };

      const result = await createBorrowing(borrowingData);
      if (result.error) {
        throw new Error(result.error.message);
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memproses peminjaman.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`glass ${styles.modal} fade-in`}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Peminjaman Barang</h3>
            <p className={styles.subtitle}>{item.name} ({item.code})</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Nama Peminjam *</label>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} size={18} />
              <select
                required
                value={borrowerName}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  setBorrowerName(selectedName);
                  const selectedUser = users.find((u) => u.name === selectedName);
                  if (selectedUser) {
                    setBorrowerDivision(selectedUser.division || '');
                  } else {
                    setBorrowerDivision('');
                  }
                }}
                className={styles.select}
              >
                <option value="">-- Pilih Nama Peminjam --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Divisi / Bidang</label>
            <div className={styles.inputWrapper}>
              <Briefcase className={styles.inputIcon} size={18} />
              <input
                type="text"
                disabled
                placeholder="Divisi terisi otomatis..."
                value={borrowerDivision || ''}
                className={styles.inputDisabled}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Estimasi Tanggal Pengembalian</label>
            <div className={styles.inputWrapper}>
              <Calendar className={styles.inputIcon} size={18} />
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Catatan Peminjaman</label>
            <textarea
              placeholder="Contoh: Digunakan untuk sosialisasi eksternal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Bukti Foto (PAP Peminjaman)</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className={styles.hiddenFileInput}
            />
            {photoPreview ? (
              <div className={styles.previewContainer}>
                <img src={photoPreview} alt="Preview PAP" className={styles.previewImage} />
                <button
                  type="button"
                  className={styles.removePhotoBtn}
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className={styles.photoPlaceholder} onClick={triggerFileInput}>
                <Camera size={24} className={styles.cameraIcon} />
                <span className={styles.photoText}>Ambil Foto / Upload PAP</span>
                <span className={styles.photoSubtext}>Maksimal file 5MB</span>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Memproses...' : 'Konfirmasi Pinjam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
