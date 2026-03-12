export default function GlobalFooter() {
  return (
    <footer style={styles.footer}>
      <span>© 2026 Culmina AI, Inc. All rights reserved.</span>
      <span style={styles.links}>
        <a href="#" style={styles.link}>Privacy Policy</a>
        <a href="#" style={styles.link}>Terms of Service</a>
        <a href="#" style={styles.link}>Cookie Policy</a>
        <a href="#" style={styles.link}>Accessibility</a>
      </span>
      <div style={styles.center}>
        <span style={styles.contact}>Contact Us</span>
      </div>
      <div style={styles.right}>
        <a href="#" style={{ fontSize: '.72rem', color: '#9A9188', textDecoration: 'none' }}>Lighting Descriptions</a>
      </div>
    </footer>
  )
}

const styles = {
  footer: {
    background: '#1A1810',
    borderTop: '1px solid #C9924A',
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    flexShrink: 0,
    fontSize: '.72rem',
    color: 'rgba(247,242,232,.4)',
    fontWeight: 200,
  },
  links: { display: 'flex', gap: 0 },
  link: {
    color: 'rgba(247,242,232,.45)',
    margin: '0 8px',
    fontSize: '.72rem',
    textDecoration: 'none',
  },
  center: { margin: '0 auto' },
  contact: {
    color: '#C9924A',
    cursor: 'pointer',
    fontSize: '.72rem',
    fontWeight: 300,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
}

