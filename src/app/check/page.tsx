'use client'

export default function CheckPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ Page Loaded Successfully!</h1>
      <p>If you see this, React is working.</p>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>System Check:</h2>
        <ul>
          <li>✅ Next.js is running</li>
          <li>✅ Page rendering works</li>
          <li>✅ No JavaScript errors (so far)</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p><strong>Next step:</strong> Open browser console (F12) to check for errors</p>
        <p><strong>Try these pages:</strong></p>
        <ul>
          <li><a href="/dashboard" style={{ color: 'blue' }}>/dashboard</a></li>
          <li><a href="/test-firebase" style={{ color: 'blue' }}>/test-firebase</a></li>
        </ul>
      </div>
    </div>
  )
}
