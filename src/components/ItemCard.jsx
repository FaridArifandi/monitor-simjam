import { Link } from 'react-router-dom';
import { Package, MapPin, Eye, ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import styles from './ItemCard.module.css';

export default function ItemCard({ item, onBorrow }) {
  const { id, name, code, category, status, location, image_url } = item;

  return (
    <div className={`glass ${styles.card}`}>
      <div className={styles.imageSection}>
        {image_url ? (
          <img src={image_url} alt={name} className={styles.itemImage} />
        ) : (
          <div className={styles.placeholderImage}>
            <Package size={48} className={styles.placeholderIcon} />
          </div>
        )}
        <div className={styles.badgeOverlay}>
          <StatusBadge status={status} />
        </div>
        <span className={styles.categoryTag}>{category}</span>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.metaRow}>
          <span className={styles.code}>{code}</span>
        </div>
        <h4 className={styles.itemName} title={name}>
          {name}
        </h4>
        <div className={styles.locationRow}>
          <MapPin size={16} />
          <span>{location || 'Tidak ada lokasi'}</span>
        </div>
      </div>

      <div className={styles.actionSection}>
        <Link to={`/items/${id}`} className={styles.detailBtn} title="Lihat Detail">
          <Eye size={18} />
          <span>Detail</span>
        </Link>
        {status === 'tersedia' && (
          <button onClick={() => onBorrow(item)} className={styles.borrowBtn}>
            <span>Pinjam</span>
            <ArrowUpRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
