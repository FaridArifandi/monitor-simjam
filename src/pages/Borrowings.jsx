import { useState, useEffect } from 'react';
import { Search, RefreshCw, Calendar, User, Eye, ClipboardList, CheckCircle } from 'lucide-react';
import { fetchBorrowings } from '../lib/dataService';
import StatusBadge from '../components/StatusBadge';
import ReturnModal from '../components/ReturnModal';
import styles from './Borrowings.module.css';

export default function Borrowings() {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Return Modal state
  const [activeReturn, setActiveReturn] = useState(null);

  // Detail Modal state for PAP preview
  const [activeDetail, setActiveDetail] = useState(null);

  const loadBorrowings = async () => {
    setLoading(true);
    try {
      const res = await fetchBorrowings();
      setBorrowings(res.data || []);
    } catch (err) {
      console.error('Error fetching borrowings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBorrowings();
  }, []);

  const handleReturnSuccess = () => {
    setActiveReturn(null);
    loadBorrowings();
  };

  // Filter borrowings
  const filteredBorrowings = borrowings.filter((b) => {
    const matchesSearch =
      b.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.items?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.items?.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? b.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <section className={styles.header}>
        <div>
          <h2 className={styles.title}>Transaksi Peminjaman Barang</h2>
          <p className={styles.subtitle}>Pantau status peminjaman, pengembalian, dan verifikasi PAP</p>
        </div>
      </section>

      {/* Toolbar */}
      <section className={`glass ${styles.toolbar}`}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Cari peminjam, nama barang, atau kode inventaris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterWrapper}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.selectFilter}
          >
            <option value="">Semua Status</option>
            <option value="dipinjam">Sedang Dipinjam</option>
            <option value="dikembalikan">Dikembalikan</option>
            <option value="terlambat">Terlambat</option>
          </select>
        </div>
      </section>

      {/* Table Section */}
      <section className={`glass ${styles.tableCard}`}>
        {loading ? (
          <div className={styles.shimmerContainer}>
            <div className="shimmer" style={{ height: '48px', marginBottom: '12px', borderRadius: '8px' }} />
            <div className="shimmer" style={{ height: '48px', marginBottom: '12px', borderRadius: '8px' }} />
            <div className="shimmer" style={{ height: '48px', marginBottom: '12px', borderRadius: '8px' }} />
            <div className="shimmer" style={{ height: '48px', marginBottom: '12px', borderRadius: '8px' }} />
          </div>
        ) : filteredBorrowings.length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardList size={48} className={styles.emptyIcon} />
            <h4>Belum Ada Riwayat Peminjaman</h4>
            <p>Data riwayat transaksi kosong atau tidak sesuai filter.</p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Peminjam</th>
                  <th>Tgl Pinjam</th>
                  <th>Batas Kembali</th>
                  <th>Tgl Kembali</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>PAP</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrowings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className={styles.itemCell}>
                        <span className={styles.itemName}>{b.items?.name || 'Barang'}</span>
                        <span className={styles.itemCode}>{b.items?.code}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.userName}>{b.borrower_name}</span>
                        <span className={styles.userDiv}>{b.borrower_division || '-'}</span>
                      </div>
                    </td>
                    <td>{new Date(b.borrow_date).toLocaleDateString('id-ID')}</td>
                    <td>
                      {b.expected_return_date
                        ? new Date(b.expected_return_date).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td>
                      {b.actual_return_date
                        ? new Date(b.actual_return_date).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setActiveDetail(b)}
                        className={styles.papBtn}
                        title="Lihat Foto Bukti (PAP)"
                      >
                        <Eye size={16} />
                        <span>PAP</span>
                      </button>
                    </td>
                    <td>
                      {(b.status === 'dipinjam' || b.status === 'terlambat') && (
                        <button
                          onClick={() => setActiveReturn(b)}
                          className={styles.returnBtn}
                        >
                          Kembalikan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Return Modal Dialog */}
      {activeReturn && (
        <ReturnModal
          borrowing={activeReturn}
          onClose={() => setActiveReturn(null)}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* Detail/PAP Dialog */}
      {activeDetail && (
        <div className={styles.overlay} onClick={() => setActiveDetail(null)}>
          <div className={`glass ${styles.detailModal} fade-in`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detail & Bukti Foto (PAP)</h3>
              <button className={styles.closeBtn} onClick={() => setActiveDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalMetaGrid}>
                <div>
                  <label className={styles.metaLabel}>Barang</label>
                  <p className={styles.metaVal}>{activeDetail.items?.name}</p>
                </div>
                <div>
                  <label className={styles.metaLabel}>Peminjam</label>
                  <p className={styles.metaVal}>
                    {activeDetail.borrower_name} ({activeDetail.borrower_division || '-'})
                  </p>
                </div>
                <div>
                  <label className={styles.metaLabel}>Tanggal Pinjam</label>
                  <p className={styles.metaVal}>
                    {new Date(activeDetail.borrow_date).toLocaleString('id-ID')}
                  </p>
                </div>
                {activeDetail.actual_return_date && (
                  <div>
                    <label className={styles.metaLabel}>Tanggal Kembali</label>
                    <p className={styles.metaVal}>
                      {new Date(activeDetail.actual_return_date).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </div>

              {activeDetail.notes && (
                <div style={{ marginTop: '16px' }}>
                  <label className={styles.metaLabel}>Catatan</label>
                  <p className={styles.metaVal} style={{ fontStyle: 'italic' }}>
                    {activeDetail.notes}
                  </p>
                </div>
              )}

              {/* Photos Gallery */}
              <div className={styles.photoGalleryGrid}>
                <div className={styles.galleryCard}>
                  <span className={styles.galleryTitle}>PAP Saat Pinjam</span>
                  {activeDetail.borrow_photo_url ? (
                    <img
                      src={activeDetail.borrow_photo_url}
                      alt="PAP Pinjam"
                      className={styles.galleryImg}
                    />
                  ) : (
                    <div className={styles.galleryPlaceholder}>Tidak ada foto bukti pinjam</div>
                  )}
                </div>

                <div className={styles.galleryCard}>
                  <span className={styles.galleryTitle}>PAP Saat Kembali</span>
                  {activeDetail.return_photo_url ? (
                    <img
                      src={activeDetail.return_photo_url}
                      alt="PAP Kembali"
                      className={styles.galleryImg}
                    />
                  ) : (
                    <div className={styles.galleryPlaceholder}>Belum dikembalikan/Tidak ada foto</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick helper to write X icon
function X({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
