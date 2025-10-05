'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f9fafb'}}>
      <div style={{textAlign: 'center'}}>
        <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#111827'}}>Page not found</h1>
        <p style={{marginTop: '0.5rem', color: '#4b5563'}}>The page you are looking for does not exist.</p>
        <Link href="/" style={{display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', background: '#ef4444', color: 'white', borderRadius: 8}}>Go home</Link>
      </div>
    </div>
  );
}


