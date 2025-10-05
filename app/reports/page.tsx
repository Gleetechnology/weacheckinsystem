'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  total: number;
  checkedIn: number;
  pending: number;
}

interface CheckinData {
  date: string;
  count: number;
}

interface OrganizationData {
  name: string;
  count: number;
}

interface RegionData {
  name: string;
  count: number;
  total: number;
}

interface PositionData {
  name: string;
  count: number;
  total: number;
}

interface GenderData {
  gender: string;
  count: number;
  total: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, checkedIn: 0, pending: 0 });
  const [checkinTrend, setCheckinTrend] = useState<CheckinData[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [gender, setGender] = useState<GenderData[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'event' | 'all'>('event');
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

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
      fetchReportsData();
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

  const fetchReportsData = async () => {
    try {
      setLoading(true);

      // Fetch check-in trends (now uses fixed event dates)
      const trendRes = await fetch('/api/reports/checkin-trend', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch organization breakdown
      const orgRes = await fetch('/api/reports/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch region breakdown
      const regionRes = await fetch('/api/reports/regions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch position breakdown
      const positionRes = await fetch('/api/reports/positions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch debug info
      const debugRes = await fetch('/api/debug/attendees', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch gender breakdown
      const genderRes = await fetch('/api/reports/gender', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (trendRes.ok) {
        const trendData = await trendRes.json();
        setCheckinTrend(trendData.data || []);
      }

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrganizations(orgData.data || []);
      }

      if (regionRes.ok) {
        const regionData = await regionRes.json();
        setRegions(regionData.data || []);
      }

      if (positionRes.ok) {
        const positionData = await positionRes.json();
        setPositions(positionData.data || []);
      }

      if (debugRes.ok) {
        const debugData = await debugRes.json();
        setDebugInfo(debugData.debug);
      }

      if (genderRes.ok) {
        const genderData = await genderRes.json();
        setGender(genderData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkinRate = stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;
  const avgCheckinsPerDay = checkinTrend.length > 0 ? Math.round(checkinTrend.reduce((sum, day) => sum + day.count, 0) / checkinTrend.length) : 0;
  const peakCheckinDay = checkinTrend.length > 0 ? checkinTrend.reduce((max, day) => day.count > max.count ? day : max, checkinTrend[0]) : null;

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/download/excel', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to download Excel file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendees_with_qr.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-xl border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-sm"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Reports & Analytics
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">WEA General Assembly Event Insights</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Event Period Badge */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">Event Period</div>
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg">
                    OCT 27-31, 2025
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-8 sm:px-0 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-3 text-gray-600">Loading reports...</span>
            </div>
          ) : (
            <>
              {/* Premium Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {/* Total Attendees Card */}
                <div className="group relative bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-3xl shadow-lg border border-blue-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 mb-1">Total Attendees</h3>
                      <p className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{stats.total}</p>
                      <p className="text-xs text-gray-500">Registered for WEA Assembly</p>
                    </div>
                  </div>
                </div>

                {/* Checked In Card */}
                <div className="group relative bg-gradient-to-br from-green-50 via-white to-green-50 rounded-3xl shadow-lg border border-green-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-green-600 mb-1">Checked In</h3>
                      <p className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">{stats.checkedIn}</p>
                      <p className="text-xs text-gray-500">Present at event location</p>
                    </div>
                  </div>
                </div>

                {/* Pending Card */}
                <div className="group relative bg-gradient-to-br from-yellow-50 via-white to-yellow-50 rounded-3xl shadow-lg border border-yellow-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-600 mb-1">Pending</h3>
                      <p className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-yellow-700 transition-colors">{stats.pending}</p>
                      <p className="text-xs text-gray-500">Awaiting check-in</p>
                    </div>
                  </div>
                </div>

                {/* Check-in Rate Card */}
                <div className="group relative bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-3xl shadow-lg border border-purple-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-purple-600 mb-1">Check-in Rate</h3>
                      <p className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">{checkinRate}%</p>
                      <p className="text-xs text-gray-500">Event participation rate</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                {/* Event Check-in Trend Chart */}
                <div className="group relative bg-gradient-to-br from-white via-white to-blue-50/30 rounded-3xl shadow-2xl border border-blue-200/30 hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-transparent">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">📈 Event Check-in Trend</h3>
                          <p className="text-sm text-gray-600 mt-2">Daily activity during WEA General Assembly • Oct 27-31, 2025</p>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            LIVE DATA
                          </div>
                        </div>
                      </div>
                    </div>
                  <div className="p-6">
                    {checkinTrend.length > 0 ? (
                      <div className="space-y-4">
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                              {checkinTrend.reduce((sum, day) => sum + day.count, 0)}
                            </div>
                            <div className="text-xs text-gray-500">Total Check-ins</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                              {checkinTrend.filter(day => day.count > 0).length}
                            </div>
                            <div className="text-xs text-gray-500">Active Days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">
                              {Math.max(...checkinTrend.map(d => d.count))}
                            </div>
                            <div className="text-xs text-gray-500">Peak Day</div>
                          </div>
                        </div>

                        {/* Daily breakdown */}
                        {checkinTrend.map((day, index) => (
                          <div key={day.date} className="flex items-center space-x-4">
                            <div className="w-20 text-sm text-gray-600">
                              {new Date(day.date).toLocaleDateString()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {day.count} check-in{day.count !== 1 ? 's' : ''}
                                </span>
                                <span className="text-sm text-gray-500">{day.count}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.max((day.count / Math.max(...checkinTrend.map(d => d.count || 1))) * 100, 2)}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Check-in Data Available</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Check-in data will appear here once attendees start checking in through the scanner.
                        </p>
                        <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg inline-block">
                          <strong>Real Data Status:</strong> Connected to database • {stats.total} total attendees • {stats.checkedIn} checked in
                        </div>
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Organization Breakdown */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                  <div className="px-6 py-6 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Organization Breakdown</h3>
                        <p className="text-sm text-gray-600 mt-1">WEA Member organizations and groups</p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {organizations.length > 0 ? (
                      <div className="space-y-4">
                        {organizations.slice(0, 10).map((org, index) => (
                          <div key={org.name} className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 truncate">{org.name || 'Unknown'}</span>
                                <span className="text-sm text-gray-500">{org.count}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${(org.count / organizations[0]?.count || 1) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="mt-2">No organization data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Region Breakdown */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                  <div className="px-6 py-6 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Geographic Distribution</h3>
                        <p className="text-sm text-gray-600 mt-1">Regional representation at WEA Assembly</p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {regions.length > 0 ? (
                      <div className="space-y-4">
                        {regions.slice(0, 8).map((region, index) => (
                          <div key={region.name} className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 truncate">{region.name}</span>
                                <span className="text-sm text-gray-500">{region.count}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${(region.count / regions[0]?.count || 1) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="mt-2">No region data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Position Breakdown */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                  <div className="px-6 py-6 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Position Distribution</h3>
                        <p className="text-sm text-gray-600 mt-1">Leadership roles and job titles breakdown</p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {positions.length > 0 ? (
                      <div className="space-y-4">
                        {positions.slice(0, 8).map((position, index) => (
                          <div key={position.name} className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 truncate">{position.name}</span>
                                <span className="text-sm text-gray-500">{position.count}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${(position.count / positions[0]?.count || 1) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2">No position data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gender Distribution */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                <div className="px-6 py-6 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Gender Distribution</h3>
                      <p className="text-sm text-gray-600 mt-1">Attendee gender breakdown</p>
                    </div>
                    <div className="h-10 w-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m-4-10a4 4 0 110-8 4 4 0 010 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {gender.length > 0 ? (
                    <div className="flex items-center justify-around">
                      {gender.map((item: GenderData) => (
                        <div key={item.gender} className="text-center">
                          <div className="text-4xl font-bold text-gray-900">{item.count}</div>
                          <div className="text-sm text-gray-600">{item.gender}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No gender data available</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Enhanced Summary Statistics */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                  <div className="px-6 py-6 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Event Analytics</h3>
                        <p className="text-sm text-gray-600 mt-1">WEA General Assembly Performance Metrics</p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Event Performance */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{checkinRate}%</div>
                          <div className="text-xs text-gray-600">Participation Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-indigo-600">{avgCheckinsPerDay}</div>
                          <div className="text-xs text-gray-600">Avg Daily Check-ins</div>
                        </div>
                      </div>

                      {/* Detailed Stats */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Total Organizations</span>
                          <span className="text-sm font-bold text-gray-900">{organizations.length}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Regions Represented</span>
                          <span className="text-sm font-bold text-gray-900">{regions.length}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-600">Position Types</span>
                          <span className="text-sm font-bold text-gray-900">{positions.length}</span>
                        </div>
                      </div>

                      {/* Event Timeline */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-600">Peak Activity Day</span>
                          <span className="text-sm font-bold text-gray-900">
                            {peakCheckinDay ?
                              `${new Date(peakCheckinDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (${peakCheckinDay.count} check-ins)` :
                              'No data yet'
                            }
                          </span>
                        </div>

                        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                          <div className="text-sm font-medium text-green-800 mb-1">Event Countdown</div>
                          <div className="text-xs text-green-700">
                            📅 October 27-31, 2025 • 📍 WEA General Assembly • 👥 {stats.total} Registered Attendees
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
  
              {/* Enhanced Debug & System Status */}
              <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                <div className="px-6 py-6 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">System Status & Diagnostics</h3>
                      <p className="text-sm text-gray-600 mt-1">Real-time database health and data verification</p>
                    </div>
                    <button
                      onClick={() => setDebugInfo(debugInfo ? null : debugInfo)}
                      className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{debugInfo ? 'Hide' : 'Show'} System Status</span>
                    </button>
                  </div>
                </div>

                {debugInfo && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Database Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Attendees:</span>
                            <span className="font-medium">{debugInfo.totalAttendees}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Checked In:</span>
                            <span className="font-medium text-green-600">{debugInfo.checkedInCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Check-in Rate:</span>
                            <span className="font-medium">
                              {debugInfo.totalAttendees > 0 ?
                                Math.round((debugInfo.checkedInCount / debugInfo.totalAttendees) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Recent Check-ins:</span>
                            <span className="font-medium">{debugInfo.recentCheckins?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Recent Registrations:</span>
                            <span className="font-medium">{debugInfo.recentRegistrations?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {debugInfo.recentCheckins && debugInfo.recentCheckins.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-3">Latest Check-ins</h4>
                        <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {debugInfo.recentCheckins.map((checkin: any, index: number) => (
                            <div key={checkin.id} className="text-xs text-gray-600 py-1">
                              {checkin.name} - {checkin.checkedInAt ?
                                new Date(checkin.checkedInAt).toLocaleString() :
                                'No check-in time'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-800">
                        <strong>Data Status:</strong> All reports show real data from your database.
                        {debugInfo.totalAttendees === 0 ?
                          ' No attendees yet - upload Excel file to see data.' :
                          ` Found ${debugInfo.totalAttendees} attendees in database.`
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Export & Event Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Export Options */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300">
                  <div className="px-6 py-6 border-b border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Export Reports</h3>
                        <p className="text-sm text-gray-600 mt-1">Download WEA General Assembly reports</p>
                      </div>
                      <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-3">
                      <button className="flex items-center justify-center px-4 py-4 border-2 border-green-200 bg-green-50 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all duration-200 group">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-green-800">Export PDF Report</div>
                            <div className="text-sm text-green-600">Formatted WEA Assembly report</div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleExportExcel}
                        className="flex items-center justify-center px-4 py-4 border-2 border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-blue-800">Export Excel Data</div>
                            <div className="text-sm text-blue-600">Spreadsheet with all attendee data</div>
                          </div>
                        </div>
                      </button>

                      <button className="flex items-center justify-center px-4 py-4 border-2 border-purple-200 bg-purple-50 rounded-xl hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 group">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-purple-800">Export CSV Data</div>
                            <div className="text-sm text-purple-600">Raw data for external analysis</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event Information */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-xl border border-blue-200/50">
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">WEA General Assembly</h3>
                        <p className="text-sm text-gray-600 mt-1">October 27-31, 2025</p>
                      </div>
                      <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6-6m0 0v6m0-6h-6" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Event Location</div>
                          <div className="text-xs text-gray-600">Seoul, South Korea</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Total Registered</div>
                          <div className="text-xs text-gray-600">{stats.total} attendees confirmed</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">Current Participation</div>
                          <div className="text-xs text-gray-600">{checkinRate}% check-in rate</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white">
                      <div className="text-sm font-medium mb-1">Event Status</div>
                      <div className="text-lg font-bold">Pre-Event Preparation</div>
                      <div className="text-xs opacity-90 mt-1">
                        📅 October 27-31, 2025 • 🎯 Ready for WEA General Assembly
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
