export default function Avatar({ name, color, size = '', src }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
  const sizeClass = size === 'lg' ? 'lg' : size === 'xl' ? 'xl' : size === 'xxl' ? 'xxl' : '';
  const style = { background: color || 'var(--color-primary)' };
  if (src) {
    return <img src={src} alt={name} className={`avatar ${sizeClass}`} style={{ objectFit: 'cover' }} />;
  }
  return <div className={`avatar ${sizeClass}`} style={style}>{initials}</div>;
}
