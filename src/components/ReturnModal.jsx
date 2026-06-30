import { useState, useRef } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { returnBorrowing, uploadPhoto } from '../lib/dataService';
import styles from './ReturnModal.module.css';

export default function ReturnModal({ borrowing, onClose, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setLoading(true);
    setError(null);

    try {
      let return_photo_url = null;
      if (photo) {
        const uploadResult = await uploadPhoto(photo, 'returns');
        if (uploadResult.error) {
          throw new Error('Gagal mengupload foto bukti (PAP): ' + uploadResult.error.message);
        }
        return_photo_url = uploadResult.url;
      }

      const returnData = {
        return_photo_url,
        notes: notes ? `${borrowing.notes ? borrowing.notes + ' | ' : ''}Kembali: ${notes}` : borrowing.notes,
      };

      const result = await returnBorrowing(borrowing.id, returnData);
      if (result.error) {
        throw new Error(result.error.message);
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengembalikan barang.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`glass ${styles.modal} fade-in`}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Pengembalian Barang</h3>
            <p className={styles.subtitle}>
              {borrowing?.items?.name || 'Barang'} (Peminjam: {borrowing?.borrower_name})
            </p>
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
            <label className={styles.label}>Catatan Pengembalian</label>
            <textarea
              placeholder="Masukkan kondisi barang saat dikembalikan (Contoh: Kembali dengan aman dan lengkap)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Bukti Pengembalian (PAP Pengembalian)</label>
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
                <span className={styles.photoText}>Ambil Foto / Upload PAP Pengembalian</span>
                <span className={styles.photoSubtext}>Maksimal file 5MB</span>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Memproses...' : 'Konfirmasi Pengembalian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
