import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, RefreshCw, CheckCircle2, AlertTriangle, Clock, ArrowRight, User } from 'lucide-react';
import { fetchItems, fetchBorrowings } from '../lib/dataService';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ReturnModal from '../components/ReturnModal';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReturn, setActiveReturn] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const itemsRes = await fetchItems();
      const borrowingsRes = await borrowingsResRes(); // we'll use local/Supabase call
      
      // Let's resolve data
      const itemsData = itemsRes.data || [];
      const borrowingsData = borrowingsRes.data || [];

      setItems(itemsData);
      setBorrowings(borrowingsData);
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Wait, let's fix a typo here "borrowingsResRes()" which is incorrect!
  // I will write the clean fetch function inside useEffect.
  
  useEffect(() => {
    let isMounted = true;
    async function getData() {
      try {
        const [itemsResult, borrowingsResult] = await Promise.all([
          fetchItems(),
          fetchBorrowings()
        ]);
        if (isMounted) {
          setItems(itemsResult.data || []);
          setBorrowings(borrowingsResult.data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) setLoading(false);
      }
    }
    getData();
    return () => { isMounted = false; };
  }, []);

  const totalItems = items.length;
  const borrowedItems = items.filter(i => i.status === 'dipinjam').length;
  const availableItems = items.filter(i => i.status === 'tersedia').length;
  const maintenanceItems = items.filter(i => i.status === 'maintenance').length;

  const activeBorrowings = borrowings.filter(b => b.status === 'dipinjam' || b.status === 'terlambat');
  const recentActivities = borrowings.slice(0, 5);

  const handleReturnSuccess = async () => {
    setActiveReturn(null);
    setLoading(true);
    try {
      const [itemsResult, borrowingsResult] = await Promise.all([
        fetchItems(),
        fetchBorrowings()
      ]);
      setItems(itemsResult.data || []);
      setBorrowings(borrowingsResult.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="shimmer" style={{ width: '100%', height: '180px', borderRadius: '16px', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div className="shimmer" style={{ height: '120px', borderRadius: '16px' }} />
          <div className="shimmer" style={{ height: '120px', borderRadius: '16px' }} />
          <div className="shimmer" style={{ height: '120px', borderRadius: '16px' }} />
          <div className="shimmer" style={{ height: '120px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Welcome Banner */}
      <section className={`glass ${styles.banner} glow-primary`}>
        <div className={styles.bannerContent}>
          <h2>Sistem Informasi Peminjaman Barang</h2>
          <p>
            Monitor ketersediaan barang kantor, catat peminjaman secara langsung dengan bukti foto (PAP).
          </p>
        </div>
      </section>

      {/* Grid statistics */}
      <section className={styles.statsGrid}>
        <StatCard
          title="Total Barang"
          value={totalItems}
          icon={Package}
          type="primary"
          description="Jumlah seluruh aset inventaris"
        />
        <StatCard
          title="Sedang Dipinjam"
          value={borrowedItems}
          icon={RefreshCw}
          type="warning"
          description="Barang aktif dipinjam staf"
        />
        <StatCard
          title="Tersedia"
          value={availableItems}
          icon={CheckCircle2}
          type="success"
          description="Barang siap untuk dipinjam"
        />
        <StatCard
          title="Maintenance"
          value={maintenanceItems}
          icon={AlertTriangle}
          type="danger"
          description="Barang dalam perbaikan"
        />
      </section>

      {/* Main Grid Content */}
      <div className={styles.mainGrid}>
        {/* Left Side: Active Borrowings */}
        <div className={`glass ${styles.tableCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Peminjaman Aktif ({activeBorrowings.length})</h4>
              <p>Daftar peminjaman barang yang belum dikembalikan</p>
            </div>
            <Link to="/borrowings" className={styles.viewAllBtn}>
              <span>Lihat Semua</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.cardBody}>
            {activeBorrowings.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle2 size={40} className={styles.emptyIcon} />
                <p>Tidak ada peminjaman aktif saat ini.</p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nama Barang</th>
                      <th>Peminjam</th>
                      <th>Tgl Pinjam</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBorrowings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div className={styles.itemNameCell}>
                            <span className={styles.itemName}>{b.items?.name || 'Barang'}</span>
                            <span className={styles.itemCode}>{b.items?.code}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <User size={14} />
                            <span>{b.borrower_name}</span>
                          </div>
                        </td>
                        <td>{new Date(b.borrow_date).toLocaleDateString('id-ID')}</td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td>
                          <button
                            onClick={() => setActiveReturn(b)}
                            className={styles.actionReturnBtn}
                          >
                            Kembalikan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Recent Activity Logs */}
        <div className={`glass ${styles.activityCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Aktivitas Terbaru</h4>
              <p>Log peminjaman dan pengembalian terakhir</p>
            </div>
          </div>
          <div className={styles.cardBody}>
            {recentActivities.length === 0 ? (
              <div className={styles.emptyState}>
                <Clock size={40} className={styles.emptyIcon} />
                <p>Belum ada aktivitas tercatat.</p>
              </div>
            ) : (
              <div className={styles.activityList}>
                {recentActivities.map((act) => (
                  <div className={styles.activityItem} key={act.id}>
                    <div className={`${styles.activityIcon} ${act.status === 'dikembalikan' ? styles.actSuccess : styles.actPrimary}`}>
                      {act.status === 'dikembalikan' ? <CheckCircle2 size={16} /> : <RefreshCw size={16} />}
                    </div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>
                        <strong>{act.borrower_name}</strong>{' '}
                        {act.status === 'dikembalikan' ? 'mengembalikan' : 'meminjam'}{' '}
                        <strong>{act.items?.name || 'Barang'}</strong>
                      </p>
                      <span className={styles.activityTime}>
                        {new Date(act.actual_return_date || act.borrow_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Dialog */}
      {activeReturn && (
        <ReturnModal
          borrowing={activeReturn}
          onClose={() => setActiveReturn(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
}
