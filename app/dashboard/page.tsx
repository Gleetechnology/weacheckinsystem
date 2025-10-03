'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider';

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
  englishText?: string;
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

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
      fetchNotifications();
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
        const baseCols = [
          'attendeeId', 'name', 'email', 'phone', 'column2',
          'organization', 'positionInOrganization', 'preferredTitle', 'regionOfWork',
          'phoneKorean', 'koreanText', 'positionKorean', 'englishText',
          'checkedIn', 'qrCode'
        ];
        const allCols = new Set<string>(baseCols);
        data.attendees.forEach((attendee: Attendee) => {
          if (attendee.extraData) {
            Object.keys(attendee.extraData).forEach(col => allCols.add(col));
          }
        });
        // Ensure positionInOrganization comes right after organization
        const orderedCols = baseCols.filter(col => allCols.has(col));
        const extraCols = Array.from(allCols).filter(col => !baseCols.includes(col));
        setAllColumns([...orderedCols, ...extraCols]);
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
        fetchNotifications(); // Refresh notifications after upload
        setPage(1);
        const message = data.message || `Upload completed: ${data.uploaded || 0} attendees added`;
        alert(message);
        if (data.errors > 0 && data.errorDetails) {
          console.log('Upload errors:', data.errorDetails);
        }
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

  // Functional handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      // Filter attendees based on search query
      const filtered = attendees.filter(attendee =>
        attendee.name.toLowerCase().includes(query.toLowerCase()) ||
        attendee.email?.toLowerCase().includes(query.toLowerCase()) ||
        attendee.organization?.toLowerCase().includes(query.toLowerCase())
      );
      setAttendees(filtered);
    } else {
      // Reset to full list if search is empty
      fetchAttendees(1);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'attendees') {
      router.push('/attendees');
    } else if (tab === 'reports') {
      router.push('/reports');
    }
  };


  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Update local state
        setNotifications(notifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.read === false).length;

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`}>
      {/* Enhanced Dashboard Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-red-100 sticky top-0 z-50 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo and Brand Section */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-sm">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">WEA Dashboard</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">General Assembly Management</p>
              </div>
            </div>


            {/* Center Navigation */}
            <div className="hidden lg:flex items-center space-x-1 bg-gray-100 rounded-lg px-1 py-1 dark:bg-gray-700">
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => handleTabChange('attendees')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'attendees'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Attendees</span>
              </button>
              <button
                onClick={() => handleTabChange('reports')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'reports'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-400 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Reports</span>
              </button>
            </div>

            {/* Right Section - Actions & User */}
            <div className="flex items-center space-x-2">
              {/* Global Search */}
              <div className="relative hidden sm:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                   type="text"
                   placeholder="Search attendees..."
                   value={searchQuery}
                   onChange={(e) => {
                     setSearchQuery(e.target.value);
                     handleSearch(e.target.value);
                   }}
                   className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 w-48 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                 />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V12h-5l5-5 5 5h-5v5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadCount}
                    </div>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        <button className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Mark all read</button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              notification.read === false ? 'bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-700'
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`h-2 w-2 rounded-full mt-2 ${notification.read === false ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1 dark:text-gray-400">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1 dark:text-gray-500">
                                  {new Date(notification.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {theme === "dark" ? (
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Check-in Scanner Button */}
              <a
                href="/checkin"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 text-sm font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 21h.01M12 7h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Check-in</span>
              </a>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Admin User</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">admin@wea.org</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2 dark:text-gray-300 dark:hover:bg-gray-700">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Settings</span>
                        </button>

                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2 dark:text-gray-300 dark:hover:bg-gray-700">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                          <span>System Status</span>
                        </button>

                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2 dark:text-gray-300 dark:hover:bg-gray-700">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Help & Support</span>
                        </button>

                        <div className="border-t border-gray-100 mt-2 pt-2 dark:border-gray-700">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2 dark:text-red-400 dark:hover:bg-red-900"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button className="lg:hidden p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="group relative bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden shadow-xl rounded-3xl border border-blue-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:from-blue-900 dark:via-gray-900 dark:to-blue-950 dark:border-blue-700">
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
                      <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Total Attendees</dt>
                      <dd className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="group relative bg-gradient-to-br from-green-50 via-white to-green-50 overflow-hidden shadow-xl rounded-3xl border border-green-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:from-green-900 dark:via-gray-900 dark:to-green-950 dark:border-green-700">
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
                      <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Checked In</dt>
                      <dd className="text-3xl font-bold text-gray-900 dark:text-white">{stats.checkedIn}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="group relative bg-gradient-to-br from-yellow-50 via-white to-yellow-50 overflow-hidden shadow-xl rounded-3xl border border-yellow-200/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:from-yellow-900 dark:via-gray-900 dark:to-yellow-950 dark:border-yellow-700">
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
                      <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Pending</dt>
                      <dd className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Upload Section */}
          <div className="bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl border border-white/30 mb-12">
            <div className="px-6 py-8 sm:p-8">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl leading-6 font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Upload Excel File</h3>
                    <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">Import attendee data from Excel or CSV files</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Supported Formats</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">.xlsx, .xls, .csv</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Max Size</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">10MB</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <a
                  href={getDownloadUrl('/api/template/csv')}
                  className="group bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3"
                  download
                >
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold">Download Template</div>
                    <div className="text-sm opacity-90">Get the correct format</div>
                  </div>
                </a>
                <a
                  href={getDownloadUrl('/api/download/excel')}
                  className="group bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3"
                  download
                >
                  <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold">Export Current Data</div>
                    <div className="text-sm opacity-90">Download all attendees</div>
                  </div>
                </a>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors bg-gradient-to-br from-gray-50 to-purple-50/30">
                <form onSubmit={handleUpload} className="space-y-6">
                  {/* Drag and Drop Zone */}
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      name="file"
                      required
                      id="file-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // You could add file validation here
                          console.log('File selected:', file.name);
                        }
                      }}
                    />
                    <div className="space-y-4">
                      <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                          Drop your Excel file here, or click to browse
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Supports .xlsx, .xls, and .csv files up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200 dark:bg-gray-700 dark:border-purple-700">
                      <div className="flex items-center space-x-3">
                        <svg className="animate-spin h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Uploading file...</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Processing your Excel data</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-3 text-lg font-semibold"
                    >
                      {uploading ? (
                        <>
                          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Upload Excel File</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Instructions */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900 dark:border-blue-700">
                <div className="flex items-start space-x-3">
                  <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1 dark:text-blue-200">Upload Instructions</h4>
                    <ul className="text-sm text-blue-800 space-y-1 dark:text-blue-300">
                      <li>• Use the template file for the correct column format</li>
                      <li>• Ensure required columns: Name (이름) and Email (이메일)</li>
                      <li>• Korean columns (직분, 한글) will be properly detected</li>
                      <li>• English columns (영어직분) are now supported</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Admin Management Section */}
          <div className="bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl border border-white/30 mt-12">
            <div className="px-6 py-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl leading-6 font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-indigo-400">Admin Management</h3>
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
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 dark:from-purple-900 dark:to-indigo-950 dark:border-purple-700">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">Create New Admin Account</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Username</label>
                      <input
                        type="text"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Password</label>
                      <input
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">Username</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">Created At</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/80 divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700">
                    {admins.map((admin, index) => (
                      <tr key={admin.id} className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 dark:hover:from-purple-900 dark:hover:to-indigo-950 ${index % 2 === 0 ? 'bg-white/40 dark:bg-gray-700' : 'bg-white/60 dark:bg-gray-750'}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{admin.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteAdmin(admin.id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-200 dark:text-red-400 dark:bg-red-900 dark:hover:bg-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {admins.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
