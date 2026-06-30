import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, ClipboardList, Calendar, User, Clock } from 'lucide-react';
import { fetchItem, fetchItemBorrowings } from '../lib/dataService';
import StatusBadge from '../components/StatusBadge';
import BorrowModal from '../components/BorrowModal';
import styles from './ItemDetail.module.css';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Borrow Modal trigger
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemRes, borrowingsRes] = await Promise.all([
        fetchItem(id),
        fetchItemBorrowings(id),
      ]);

      if (itemRes.error) {
        throw new Error(itemRes.error);
      }

      setItem(itemRes.data);
      setBorrowings(borrowingsRes.data || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat detail barang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleBorrowSuccess = () => {
    setShowBorrowModal(false);
    loadData();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="shimmer" style={{ width: '120px', height: '36px', marginBottom: '24px', borderRadius: '8px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
          <div className="shimmer" style={{ aspectRatio: '1', borderRadius: '16px' }} />
          <div>
            <div className="shimmer" style={{ width: '80%', height: '40px', marginBottom: '16px', borderRadius: '8px' }} />
            <div className="shimmer" style={{ width: '40%', height: '24px', marginBottom: '24px', borderRadius: '8px' }} />
            <div className="shimmer" style={{ width: '100%', height: '120px', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={`glass ${styles.errorContainer}`}>
        <Package size={48} className={styles.errorIcon} />
        <h4>Barang Tidak Ditemukan</h4>
        <p>{error || 'Aset inventaris yang Anda cari tidak ada.'}</p>
        <Link to="/items" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Barang</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back button */}
      <Link to="/items" className={styles.backBtn}>
        <ArrowLeft size={18} />
        <span>Kembali ke Inventaris</span>
      </Link>

      {/* Main detail card */}
      <section className={`glass ${styles.detailCard}`}>
        <div className={styles.gridContainer}>
          {/* Left image column */}
          <div className={styles.imageColumn}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className={styles.itemImage} />
            ) : (
              <div className={styles.placeholderImage}>
                <Package size={80} className={styles.placeholderIcon} />
              </div>
            )}
          </div>

          {/* Right info column */}
          <div className={styles.infoColumn}>
            <div className={styles.badgeRow}>
              <span className={styles.categoryBadge}>{item.category}</span>
              <StatusBadge status={item.status} />
            </div>

            <h2 className={styles.title}>{item.name}</h2>
            <code className={styles.code}>ID Inventaris: {item.code}</code>

            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <MapPin size={18} className={styles.metaIcon} />
                <div>
                  <span className={styles.metaLabel}>Lokasi Penyimpanan</span>
                  <p className={styles.metaVal}>{item.location || 'Tidak ditentukan'}</p>
                </div>
              </div>
            </div>

            <div className={styles.descriptionSection}>
              <h4>Deskripsi / Spesifikasi</h4>
              <p>{item.description || 'Tidak ada spesifikasi tambahan.'}</p>
            </div>

            {item.status === 'tersedia' && (
              <button
                onClick={() => setShowBorrowModal(true)}
                className={styles.borrowBtn}
              >
                Pinjam Barang Ini
              </button>
            )}
          </div>
        </div>
      </section>

      {/* History timeline card */}
      <section className={`glass ${styles.historyCard}`}>
        <div className={styles.cardHeader}>
          <ClipboardList size={20} className={styles.headerIcon} />
          <h4>Riwayat Peminjaman ({borrowings.length})</h4>
        </div>
        <div className={styles.cardBody}>
          {borrowings.length === 0 ? (
            <div className={styles.emptyState}>
              <Clock size={36} className={styles.emptyIcon} />
              <p>Belum ada riwayat peminjaman untuk barang ini.</p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {borrowings.map((b) => (
                <div key={b.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHeader}>
                      <div className={styles.timelineUser}>
                        <User size={16} />
                        <strong>{b.borrower_name}</strong>
                        <span className={styles.divisionText}>({b.borrower_division || '-'})</span>
                      </div>
                      <StatusBadge status={b.status === 'dikembalikan' ? 'dikembalikan' : 'dipinjam'} />
                    </div>

                    <div className={styles.timelineDates}>
                      <div className={styles.dateBlock}>
                        <Calendar size={14} />
                        <span>Pinjam: {new Date(b.borrow_date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className={styles.dateBlock}>
                        <Calendar size={14} />
                        <span>
                          Kembali:{' '}
                          {b.actual_return_date
                            ? new Date(b.actual_return_date).toLocaleDateString('id-ID')
                            : 'Belum dikembalikan'}
                        </span>
                      </div>
                    </div>

                    {b.notes && (
                      <p className={styles.timelineNotes}>
                        <strong>Catatan:</strong> {b.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Borrow Modal */}
      {showBorrowModal && (
        <BorrowModal
          item={item}
          onClose={() => setShowBorrowModal(false)}
          onSuccess={handleBorrowSuccess}
        />
      )}
    </div>
  );
}
