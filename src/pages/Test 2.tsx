export default function Test() {
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      fontFamily: 'Arial'
    }}>
      <h1 style={{ color: '#333', fontSize: '48px' }}>✅ React is Working!</h1>
      <p style={{ fontSize: '24px' }}>If you see this, the app is rendering correctly.</p>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>
        Timestamp: {new Date().toISOString()}
      </p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h2>Environment Check:</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✓ React: Loaded</li>
          <li>✓ TypeScript: Compiled</li>
          <li>✓ Routing: Active</li>
        </ul>
      </div>
    </div>
  );
}
