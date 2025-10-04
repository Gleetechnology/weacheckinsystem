'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpSupportPage() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
  }, []);

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I upload attendee data?',
      answer: 'You can upload attendee data by going to the Dashboard and using the Excel upload section. Download the template first, fill it with attendee information, then upload the completed file. The system supports .xlsx, .xls, and .csv formats.',
      category: 'Upload'
    },
    {
      id: '2',
      question: 'How does the QR code check-in system work?',
      answer: 'Each attendee gets a unique QR code generated after upload. Attendees can check-in by scanning their QR code using the Check-in Scanner page. The system automatically validates the QR code and marks attendance.',
      category: 'Check-in'
    },
    {
      id: '3',
      question: 'How can I search for specific attendees?',
      answer: 'Use the search bar in the Attendees page. You can search by name, email, organization, position, or region. The search is performed across all attendee fields for comprehensive results.',
      category: 'Search'
    },
    {
      id: '4',
      question: 'How do I generate reports?',
      answer: 'Navigate to the Reports page from the dashboard. You can generate various reports including check-in trends, gender distribution, organization breakdown, and regional statistics. All reports can be exported as needed.',
      category: 'Reports'
    },
    {
      id: '5',
      question: 'What should I do if an attendee cannot check-in?',
      answer: 'First, verify their QR code is valid by checking the Attendees page. If the QR code is damaged, you can regenerate it from the attendee details. Ensure the check-in scanner is working properly and the attendee\'s information is correctly uploaded.',
      category: 'Troubleshooting'
    },
    {
      id: '6',
      question: 'How do I manage admin accounts?',
      answer: 'Admin account management is available in the Dashboard under the "Admin Management" section. You can create new admin accounts, view existing ones, and delete accounts as needed. Each admin gets their own login credentials.',
      category: 'Administration'
    },
    {
      id: '7',
      question: 'Can I export attendee data?',
      answer: 'Yes, you can export attendee data from the Dashboard using the "Export Current Data" button. This will download all attendee information in Excel format for backup or external use.',
      category: 'Export'
    },
    {
      id: '8',
      question: 'How do notifications work?',
      answer: 'The system sends notifications for important events like successful uploads, check-ins, and system alerts. You can view notifications using the bell icon in the header. Notifications are automatically marked as read when viewed.',
      category: 'Notifications'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to an API
    alert('Thank you for your message. We will get back to you soon!');
    setContactForm({ subject: '', message: '', priority: 'normal' });
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  if (!token) {
    return null;
  }

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
                  Help & Support
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Find answers and get assistance with the WEA Check-in System
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
          {/* Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 mb-8">
            <div className="border-b border-gray-200/50">
              <nav className="flex space-x-8 px-8">
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'faq'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  FAQ
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'contact'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Contact Support
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'resources'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Resources
                </button>
              </nav>
            </div>

            <div className="p-8">
              {activeTab === 'faq' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
                    <p className="text-gray-600">Find quick answers to common questions about the WEA Check-in System.</p>
                  </div>

                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleFAQ(faq.id)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded mr-3">
                              {faq.category}
                            </span>
                            <span className="text-gray-900 font-medium">{faq.question}</span>
                          </div>
                          <svg
                            className={`h-5 w-5 text-gray-500 transform transition-transform ${
                              expandedFAQ === faq.id ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {expandedFAQ === faq.id && (
                          <div className="px-6 pb-4">
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Support</h2>
                    <p className="text-gray-600">Need help? Send us a message and we'll get back to you as soon as possible.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <form onSubmit={handleContactSubmit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                          <input
                            type="text"
                            value={contactForm.subject}
                            onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                            placeholder="Brief description of your issue"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                          <select
                            value={contactForm.priority}
                            onChange={(e) => setContactForm({...contactForm, priority: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                          >
                            <option value="low">Low - General question</option>
                            <option value="normal">Normal - Standard support</option>
                            <option value="high">High - Urgent issue</option>
                            <option value="critical">Critical - System down</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                          <textarea
                            value={contactForm.message}
                            onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all duration-200"
                            placeholder="Describe your issue in detail..."
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          Send Message
                        </button>
                      </form>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-blue-900">Email Support</h3>
                        </div>
                        <p className="text-blue-800 mb-2">support@wea.org</p>
                        <p className="text-sm text-blue-700">Response time: 24-48 hours</p>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-green-900">Phone Support</h3>
                        </div>
                        <p className="text-green-800 mb-2">+82-2-123-4567</p>
                        <p className="text-sm text-green-700">Mon-Fri 9:00 AM - 6:00 PM KST</p>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-purple-900">Live Chat</h3>
                        </div>
                        <p className="text-purple-800 mb-2">Available in Dashboard</p>
                        <p className="text-sm text-purple-700">Instant support during business hours</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Resources & Documentation</h2>
                    <p className="text-gray-600">Access guides, templates, and additional resources.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">User Guide</h3>
                      <p className="text-gray-600 text-sm mb-4">Complete guide to using the WEA Check-in System</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Download PDF</button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Tutorials</h3>
                      <p className="text-gray-600 text-sm mb-4">Step-by-step video guides for common tasks</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Watch Videos</button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Templates</h3>
                      <p className="text-gray-600 text-sm mb-4">Download templates for bulk data import</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Download Templates</button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="h-12 w-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Troubleshooting</h3>
                      <p className="text-gray-600 text-sm mb-4">Common issues and their solutions</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Guide</button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="h-12 w-12 bg-yellow-500 rounded-lg flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">API Documentation</h3>
                      <p className="text-gray-600 text-sm mb-4">Technical documentation for developers</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Docs</button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="h-12 w-12 bg-indigo-500 rounded-lg flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Forum</h3>
                      <p className="text-gray-600 text-sm mb-4">Connect with other users and share experiences</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Join Community</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}