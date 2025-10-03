'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: string;
  nameCol?: string;
  emailCol?: string;
  phoneCol?: string;
  extraData?: Record<string, string>;
}

interface Columns {
  name: string;
  email: string;
  phone: string;
}

interface Stats {
  total: number;
  checkedIn: number;
  pending: number;
}

interface Admin {
  id: string;
  username: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0, pending: 0 });
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [columns, setColumns] = useState<Columns>({ name: 'Name', email: 'Email', phone: 'Phone' });
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchAttendees(1);
      fetchAdmins();
      setPage(1);
    }
  }, [token]);

  const fetchStats = async () => {
    const res = await fetch('/api/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setStats(data);
  };

  const fetchAttendees = async (pageNum = page) => {
    try {
      const res = await fetch(`/api/attendees?search=${search}&page=${pageNum}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.attendees) {
        setAttendees(data.attendees);
        setTotalPages(data.pages);
        setTotalAttendees(data.total);
        if (data.columns) {
          setColumns(data.columns);
        }
        // Collect all unique columns from attendees
        const allCols = new Set<string>(['name', 'email', 'phone', 'checkedIn', 'qrCode']);
        data.attendees.forEach((attendee: Attendee) => {
          if (attendee.extraData) {
            Object.keys(attendee.extraData).forEach(col => allCols.add(col));
          }
        });
        setAllColumns(Array.from(allCols));
      } else {
        setAttendees([]);
        setTotalPages(1);
        setTotalAttendees(0);
      }
    } catch (error) {
      console.error('Failed to fetch attendees:', error);
      setAttendees([]);
      setTotalPages(1);
      setTotalAttendees(0);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setUploading(true);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        fetchStats();
        fetchAttendees(1);
        setPage(1);
        alert(`Upload successful: ${data.count} attendees added`);
      } else if (res.status === 401) {
        alert('Session expired. Please log in again.');
        router.push('/login');
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Upload failed: Network error');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/login');
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const createAdmin = async () => {
    if (!newAdminUsername || !newAdminPassword) {
      alert('Please enter both username and password');
      return;
    }

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newAdminUsername,
          password: newAdminPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('Admin created successfully');
        setNewAdminUsername('');
        setNewAdminPassword('');
        setShowCreateAdmin(false);
        fetchAdmins();
      } else {
        alert(data.error || 'Failed to create admin');
      }
    } catch (error) {
      alert('Failed to create admin');
    }
  };

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin account?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admins?id=${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Admin deleted successfully');
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete admin');
      }
    } catch (error) {
      alert('Failed to delete admin');
    }
  };

  const getDownloadUrl = (endpoint: string) => {
    if (!token) return endpoint;
    return `${endpoint}?token=${token}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">WEA General Assembly Dashboard</h1>
            </div>
            <div className="flex space-x-4">
              <a
                href="/checkin"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 21h.01M12 7h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Open Check-in Scanner</span>
              </a>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Attendees</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Checked In</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats.checkedIn}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-lg overflow-hidden shadow-xl rounded-2xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                      <dd className="text-3xl font-bold text-gray-900">{stats.pending}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 mb-8">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl leading-6 font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Upload Excel File</h3>
              </div>
              <div className="mb-6 flex flex-wrap gap-4">
                <a
                  href={getDownloadUrl('/api/template/csv')}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  download
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Excel Template</span>
                </a>
                <a
                  href={getDownloadUrl('/api/download/excel')}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  download
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <span>Download Attendees Excel</span>
                </a>
              </div>
              <form onSubmit={handleUpload}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      name="file"
                      required
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-500 file:to-purple-600 file:text-white hover:file:from-indigo-600 hover:file:to-purple-700 file:cursor-pointer file:transition-all file:duration-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl leading-6 font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Attendees</h3>
                </div>
                <div className="relative w-full sm:w-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search attendees..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyUp={() => fetchAttendees(1)}
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white/90 backdrop-blur-sm w-full sm:w-80"
                  />
                </div>
              </div>
              <div className="overflow-x-auto bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      {allColumns.map((col) => (
                        <th key={col} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {col === 'name' ? columns.name :
                           col === 'email' ? columns.email :
                           col === 'phone' ? columns.phone :
                           col === 'checkedIn' ? 'Status' :
                           col === 'qrCode' ? 'QR Code' :
                           col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 divide-y divide-gray-100">
                    {attendees.map((attendee, index) => (
                      <tr key={attendee.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/40' : 'bg-white/60'}`}>
                        {allColumns.map((col) => (
                          <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {col === 'name' ? attendee.name :
                             col === 'email' ? attendee.email :
                             col === 'phone' ? (attendee.phone || '-') :
                             col === 'checkedIn' ? (
                               <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${attendee.checkedIn ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300'}`}>
                                 {attendee.checkedIn ? 'Checked In' : 'Pending'}
                               </span>
                             ) :
                             col === 'qrCode' ? (
                               <div className="flex justify-center">
                                 <img src={attendee.qrCode} alt="QR Code" className="w-16 h-16 rounded-lg shadow-md border border-gray-200" />
                               </div>
                             ) :
                             attendee.extraData?.[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                  <div className="flex justify-between flex-1 sm:hidden">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, page - 1);
                        setPage(newPage);
                        fetchAttendees(newPage);
                      }}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, page + 1);
                        setPage(newPage);
                        fetchAttendees(newPage);
                      }}
                      disabled={page === totalPages}
                      className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(page * 10, totalAttendees)}</span> of{' '}
                        <span className="font-medium">{totalAttendees}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => {
                            const newPage = Math.max(1, page - 1);
                            setPage(newPage);
                            fetchAttendees(newPage);
                          }}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          &larr;
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setPage(pageNum);
                              fetchAttendees(pageNum);
                            }}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === page
                                ? 'z-10 bg-red-50 border-red-500 text-red-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            const newPage = Math.min(totalPages, page + 1);
                            setPage(newPage);
                            fetchAttendees(newPage);
                          }}
                          disabled={page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          &rarr;
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Management Section */}
          <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border border-white/20 mt-8">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl leading-6 font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Admin Management</h3>
                </div>
                <button
                  onClick={() => setShowCreateAdmin(!showCreateAdmin)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Admin</span>
                </button>
              </div>

              {showCreateAdmin && (
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Admin Account</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={createAdmin}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Create Admin
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateAdmin(false);
                        setNewAdminUsername('');
                        setNewAdminPassword('');
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transform transition-all duration-200 hover:scale-105"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 divide-y divide-gray-100">
                    {admins.map((admin, index) => (
                      <tr key={admin.id} className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/40' : 'bg-white/60'}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{admin.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteAdmin(admin.id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admins.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No admin accounts found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
