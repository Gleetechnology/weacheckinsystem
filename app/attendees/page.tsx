'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

import Image from 'next/image';

function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

interface Attendee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: string;
  nameCol?: string;
  emailCol?: string;
  phoneCol?: string;
  attendeeId?: string;
  fullName?: string;
  column2?: string;
  organization?: string;
  preferredTitle?: string;
  positionInOrganization?: string;
  regionOfWork?: string;
  phoneKorean?: string;
  koreanText?: string;
  positionKorean?: string;
  positionEnglish?: string;
  englishText?: string;
  extraData?: Record<string, string>;
  createdAt: string;
}


interface Stats {
  total: number;
  checkedIn: number;
  pending: number;
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0, pending: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'pending'>('all');
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAttendees, setTotalAttendees] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  

  const debouncedSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current as unknown as number);
    }
    const timeoutId = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
    // Cast to Node-style timeout for the ref type
    searchTimeoutRef.current = timeoutId as unknown as NodeJS.Timeout;
  }, []);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
  }, [router]);



  useEffect(() => {
    if (token) {
      fetchStats();
      fetchAttendees(1);
      setPage(1);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAttendees = async (pageNum = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: pageNum.toString(),
        limit: '15',
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/attendees?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees || []);
        setTotalPages(data.pages || 1);
        setTotalAttendees(data.total || 0);
      } else {
        setAttendees([]);
        setTotalPages(1);
        setTotalAttendees(0);
      }
    } catch (error) {
      console.error('Failed to fetch attendees:', error);
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  };

  // We intentionally trigger on search/statusFilter only; token changes are handled elsewhere
  useEffect(() => {
    if (token) {
      fetchAttendees(1);
      setPage(1);
    }
  }, [search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps



  const getStatusBadge = (checkedIn: boolean, checkedInAt?: string) => {
    if (checkedIn) {
      return (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Checked In {checkedInAt ? formatDate(checkedInAt) : ''}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="group p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Attendees Management
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  View and manage all registered attendees
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="group bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span className="font-medium">Back to Dashboard</span>
              </button>



            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden shadow-xl rounded-2xl border border-blue-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-blue-700 mb-1">Total Attendees</dt>
                      <dd className="text-3xl font-bold text-blue-900 mb-1">{stats.total}</dd>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-green-50 to-green-100 overflow-hidden shadow-xl rounded-2xl border border-green-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-green-700 mb-1">Checked In</dt>
                      <dd className="text-3xl font-bold text-green-900 mb-1">{stats.checkedIn}</dd>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: stats.total > 0 ? `${(stats.checkedIn / stats.total) * 100}%` : '0%'}}></div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-amber-50 to-orange-100 overflow-hidden shadow-xl rounded-2xl border border-amber-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-amber-700 mb-1">Pending</dt>
                      <dd className="text-3xl font-bold text-amber-900 mb-1">{stats.pending}</dd>
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full" style={{width: stats.total > 0 ? `${(stats.pending / stats.total) * 100}%` : '0%'}}></div>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 mb-8">
            <div className="px-8 py-6 border-b border-gray-200/50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-gray-900">All Attendees</h2>
                  <p className="text-sm text-gray-600">
                    {totalAttendees > 0 ? `Showing ${totalAttendees} total attendees` : 'No attendees found'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 lg:w-96">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, email, or organization..."
                        value={searchInput}
                        onChange={(e) => handleSearchInputChange(e.target.value)}
                        className="block w-full pl-12 pr-20 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white transition-all duration-200 group"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
                      {(searchInput || search) && (
                        <button
                          onClick={() => {
                            setSearchInput('');
                            debouncedSearch('');
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200 rounded-lg hover:bg-gray-100"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSearch(searchInput);
                          setPage(1);
                        }}
                        className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!searchInput.trim()}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | 'checked-in' | 'pending')}
                      className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 min-w-[140px]"
                    >
                      <option value="all">All Status</option>
                      <option value="checked-in">Checked In</option>
                      <option value="pending">Pending</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Attendees Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0"></div>
                  </div>
                  <span className="mt-4 text-gray-600 font-medium">Loading attendees...</span>
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No attendees found</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {search || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria to find attendees.'
                      : 'Get started by uploading an Excel file with attendee data to see your attendees here.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table Layout */}
                  <div className="hidden lg:block">
                    <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preferred Title</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Organization</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Region</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">직분</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">한글</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">영어 </th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">한글</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">영어직분</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">QR Code</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendees.map((attendee: any, index: number) => (
                          <tr key={attendee.id} className="group hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.attendeeId || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                                  {attendee.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{attendee.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.preferredTitle || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.email || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.phone || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.organization || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.positionInOrganization || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.regionOfWork || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.positionKorean || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.koreanText || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.englishText || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.column2 || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{attendee.positionEnglish || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {getStatusBadge(attendee.checkedIn, attendee.checkedInAt)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Image src={attendee.qrCode} alt="QR Code" width={64} height={64} className="w-16 h-16 rounded-lg shadow-md" unoptimized />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Layout */}
                  <div className="lg:hidden space-y-4">
                    {attendees.map((attendee: any, index: number) => (
                      <div key={attendee.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {attendee.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{attendee.name}</h3>
                              {getStatusBadge(attendee.checkedIn, attendee.checkedInAt)}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <Image src={attendee.qrCode} alt="QR Code" width={80} height={80} className="w-20 h-20 mx-auto rounded-lg shadow-md" unoptimized />
                        </div>

                        <div className="mb-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-500">Preferred Title: </span>
                            <span className="text-gray-900">{attendee.preferredTitle || '-'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">ID:</span>
                            <p className="text-gray-900 mt-1">{attendee.attendeeId || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Email:</span>
                            <p className="text-gray-900 mt-1">{attendee.email || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Phone:</span>
                            <p className="text-gray-900 mt-1">{attendee.phone || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Organization:</span>
                            <p className="text-gray-900 mt-1">{attendee.organization || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Position:</span>
                            <p className="text-gray-900 mt-1">{attendee.positionInOrganization || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Region:</span>
                            <p className="text-gray-900 mt-1">{attendee.regionOfWork || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Korean Position:</span>
                            <p className="text-gray-900 mt-1">{attendee.positionKorean || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Korean Text:</span>
                            <p className="text-gray-900 mt-1">{attendee.koreanText || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">English Text:</span>
                            <p className="text-gray-900 mt-1">{attendee.englishText || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Column 2:</span>
                            <p className="text-gray-900 mt-1">{attendee.column2 || '-'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">English Position:</span>
                            <p className="text-gray-900 mt-1">{attendee.positionEnglish || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, page - 1);
                      setPage(newPage);
                      fetchAttendees(newPage);
                    }}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * 15 + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(page * 15, totalAttendees)}</span> of{' '}
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
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        return (
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
                        );
                      })}
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
      </main>
    </div>
  );
}