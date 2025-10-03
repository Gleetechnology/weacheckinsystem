'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function CheckinPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();
    setScanning(true);

    try {
      const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
      setResult(result.getText());
      handleCheckin(result.getText());
    } catch (err) {
      console.error(err);
      setMessage('Scanning failed');
    } finally {
      setScanning(false);
      codeReader.reset();
    }
  };

  const stopScanning = () => {
    setScanning(false);
  };

  const handleCheckin = async (qrData: string) => {
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData }),
      });

      const data = await res.json();

      if (res.ok) {
        const attendeeName = data.attendee ? data.attendee.name : '';
        setMessage(`${data.message}: ${attendeeName}`);
        setTimeout(() => {
          setResult('');
          setMessage('');
          startScanning();
        }, 3000);
      } else {
        setMessage(data.error);
        setTimeout(() => {
          setResult('');
          setMessage('');
          startScanning();
        }, 3000);
      }
    } catch (err) {
      setMessage('Check-in failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 21h.01M12 7h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            QR Code Check-in
          </h2>
          <p className="mt-2 text-center text-sm text-emerald-100">
            Scan attendee QR codes for instant check-in
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl opacity-20"></div>
              <video
                ref={videoRef}
                className="relative w-full h-80 bg-gray-900 rounded-2xl border-4 border-white/30 shadow-inner"
                style={{ objectFit: 'cover' }}
              />
              <div className="absolute inset-0 border-2 border-white/50 rounded-2xl pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-lg opacity-70"></div>
              </div>
            </div>

            {scanning && (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-white font-medium">Scanning for QR codes...</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  QR Code detected
                </div>
              </div>
            )}

            {message && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                message.includes('Welcome') || message.includes('successful')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : message.includes('already') || message.includes('not found')
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center">
                  {message.includes('Welcome') || message.includes('successful') ? (
                    <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : message.includes('already') || message.includes('not found') ? (
                    <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {message}
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-emerald-100">
                Position QR code within the frame for automatic scanning
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}