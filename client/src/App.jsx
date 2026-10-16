import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5001/api';

// Skill Swap Official Logo: Two Curved Exchange Arrows + Open Book in Center
const SkillSwapLogo = ({ size = 90 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="50%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#5b21b6" />
      </linearGradient>
    </defs>
    <path d="M 30 50 A 35 35 0 0 1 85 30 L 78 22 M 85 30 L 88 42" stroke="url(#purpleGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <polygon points="82,18 95,30 83,43" fill="url(#purpleGrad)" />
    <path d="M 90 70 A 35 35 0 0 1 35 90 L 42 98 M 35 90 L 32 78" stroke="url(#purpleGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <polygon points="38,102 25,90 37,77" fill="url(#purpleGrad)" />
    <g transform="translate(42, 42)">
      <path d="M18 6 C13 3, 4 3, 2 5 L2 27 C4 25, 13 25, 18 28 C23 25, 32 25, 34 27 L34 5 C32 3, 23 3, 18 6 Z" fill="url(#purpleGrad)" opacity="0.95" />
      <line x1="18" y1="6" x2="18" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="12" x2="14" y2="12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="6" y1="17" x2="14" y2="17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="22" y1="12" x2="30" y2="12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="22" y1="17" x2="30" y2="17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </g>
  </svg>
);

// Format file sizes
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function App() {
  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('skill_swap_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'

  // Auth form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile editing state
  const [profileForm, setProfileForm] = useState({
    name: '',
    faculty: '',
    bio: '',
    age: '',
    skillsToTeach: '',
    skillsToLearn: ''
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Data from backend
  const [skillsCatalog, setSkillsCatalog] = useState([]);
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [students, setStudents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [mySwaps, setMySwaps] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // Active Chat and Attachment
  const [chatPartner, setChatPartner] = useState(null);
  const [newMsgText, setNewMsgText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [showVideoLinkModal, setShowVideoLinkModal] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef(null);
  const chatMessagesEndRef = useRef(null);

  // Filters & Categories
  // Categories: All, Design, Programming, Language, Business, Music
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [skillSearch, setSkillSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [swapsFilter, setSwapsFilter] = useState('all');

  // Modals & Popovers
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [swapModalTarget, setSwapModalTarget] = useState(null);
  const [swapForm, setSwapForm] = useState({ skillOffered: '', skillWanted: '', note: '' });

  // Schedule & Agenda
  const [schedulingSwap, setSchedulingSwap] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ sessionDate: '', sessionTime: '', sessionDuration: 60, meetingLink: '' });
  const [agendaForm, setAgendaForm] = useState({ title: '', duration: 15 });
  const [agendaError, setAgendaError] = useState('');

  // Reviews
  const [reviewModalSwap, setReviewModalSwap] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Sync profileForm when currentUser updates
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('skill_swap_user', JSON.stringify(currentUser));
      setProfileForm({
        name: currentUser.name || '',
        faculty: currentUser.faculty || '',
        bio: currentUser.bio || '',
        age: currentUser.age !== undefined && currentUser.age !== null ? currentUser.age : '',
        skillsToTeach: (currentUser.skillsToTeach || []).join(', '),
        skillsToLearn: (currentUser.skillsToLearn || []).join(', ')
      });
      loadInitialData(currentUser.id);
    } else {
      localStorage.removeItem('skill_swap_user');
    }
  }, [currentUser?.id]);

  // Real-time polling for messages, notifications, and swaps every 3 seconds
  useEffect(() => {
    if (!currentUser?.id) return;
    const interval = setInterval(() => {
      pollLiveData(currentUser.id);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Close user avatar menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'messages' && chatPartner) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatPartner, activeTab]);

  const loadInitialData = async (userId) => {
    try {
      const [skillsRes, studentsRes, matchesRes, swapsRes, notifsRes, msgsRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE}/skills`).then(r => r.json()),
        fetch(`${API_BASE}/students`).then(r => r.json()),
        fetch(`${API_BASE}/matches/${userId}`).then(r => r.json()),
        fetch(`${API_BASE}/swaps/${userId}`).then(r => r.json()),
        fetch(`${API_BASE}/notifications/${userId}`).then(r => r.json()),
        fetch(`${API_BASE}/messages/${userId}`).then(r => r.json()),
        fetch(`${API_BASE}/reviews/${userId}`).then(r => r.json())
      ]);

      setSkillsCatalog(skillsRes.catalog || []);
      setSkillsOffered(skillsRes.skillsOffered || []);
      setStudents(studentsRes || []);
      setMatches(matchesRes.matches || []);
      setMySwaps(swapsRes || []);
      setNotifications(notifsRes || []);
      setMessages(msgsRes || []);
      setMyReviews(reviewsRes || []);

      // If currentUser is in studentsRes, refresh ratings and age in state
      const self = (studentsRes || []).find(s => s.id === userId);
      if (self) {
        setCurrentUser(prev => ({
          ...prev,
          rating: self.rating,
          reviewsCount: self.reviewsCount,
          age: self.age,
          name: self.name
        }));
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const pollLiveData = async (userId) => {
    try {
      const [msgsRes, notifsRes, swapsRes, studentsRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE}/messages/${userId}`).then(r => r.json()),
        fetch(`${API_BASE}/notifications/${userId}`).then(r => r.json()),
        fetch(`${API_BASE}/swaps/${userId}`).then(r => r.json()),
        fetch(`${API_BASE}/students`).then(r => r.json()),
        fetch(`${API_BASE}/reviews/${userId}`).then(r => r.json())
      ]);

      setMessages(msgsRes || []);
      setNotifications(notifsRes || []);
      setMySwaps(swapsRes || []);
      setStudents(studentsRes || []);
      setMyReviews(reviewsRes || []);

      const self = (studentsRes || []).find(s => s.id === userId);
      if (self) {
        setCurrentUser(prev => (prev ? {
          ...prev,
          rating: self.rating,
          reviewsCount: self.reviewsCount,
          age: self.age
        } : null));
      }
    } catch (err) {
      // silent network catch
    }
  };

  // Auth Handler (Sign In / Sign Up)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    if (authMode === 'signup') {
      if (!name.trim()) {
        setAuthError('Please enter your full name.');
        setAuthLoading(false);
        return;
      }
      if (age !== '') {
        const numAge = Number(age);
        if (isNaN(numAge) || !Number.isInteger(numAge) || numAge < 16 || numAge > 100) {
          setAuthError('Please enter a valid age between 16 and 100.');
          setAuthLoading(false);
          return;
        }
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.');
        setAuthLoading(false);
        return;
      }
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        setAuthLoading(false);
        return;
      }
    }

    const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/signin';
    const bodyPayload = authMode === 'signup'
      ? { name: name.trim(), email: email.trim(), password, age: age ? Number(age) : null }
      : { email: email.trim(), password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setCurrentUser(data.user);
      if (data.user.profileCompleted) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('profile');
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout Execution
  const confirmLogout = () => {
    setShowLogoutModal(false);
    setShowUserMenu(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAge('');
    setChatPartner(null);
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaveSuccess(false);

    let parsedAge = null;
    if (profileForm.age !== '') {
      parsedAge = Number(profileForm.age);
      if (isNaN(parsedAge) || !Number.isInteger(parsedAge) || parsedAge < 16 || parsedAge > 100) {
        alert('Please enter a valid age as a positive whole number between 16 and 100.');
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          faculty: profileForm.faculty.trim(),
          bio: profileForm.bio.trim(),
          age: parsedAge,
          skillsToTeach: profileForm.skillsToTeach.split(',').map(s => s.trim()).filter(Boolean),
          skillsToLearn: profileForm.skillsToLearn.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setCurrentUser(data.user);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3500);
      loadInitialData(currentUser.id);
    } catch (err) {
      alert(`Error updating profile: ${err.message}`);
    }
  };

  // Swap Requests
  const handleOpenSwapModal = (targetStudent, preselectedWantedSkill = '') => {
    setSwapModalTarget(targetStudent);
    setSwapForm({
      skillOffered: currentUser.skillsToTeach?.[0] || '',
      skillWanted: preselectedWantedSkill || (targetStudent.skillsToTeach?.[0] || ''),
      note: 'Hello! I would love to connect and swap skills with you.'
    });
    setViewingStudent(null);
  };

  const handleSendSwapRequest = async (e) => {
    e.preventDefault();
    if (!swapForm.skillOffered || !swapForm.skillWanted) {
      alert('Please specify both the skill you offer and the skill you want to learn.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/swaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: swapModalTarget.id,
          skillOffered: swapForm.skillOffered,
          skillWanted: swapForm.skillWanted,
          note: swapForm.note
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSwapModalTarget(null);
      loadInitialData(currentUser.id);
      setActiveTab('swaps');
      alert('🎉 Swap request sent successfully!');
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  const handleSwapStatus = async (swapId, status) => {
    try {
      const res = await fetch(`${API_BASE}/swaps/${swapId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: currentUser.id })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      loadInitialData(currentUser.id);
    } catch (err) {
      alert(err.message);
    }
  };

  // Scheduling Modal
  const openScheduleModal = (swap) => {
    setSchedulingSwap(swap);
    setScheduleForm({
      sessionDate: swap.sessionDate || new Date().toISOString().split('T')[0],
      sessionTime: swap.sessionTime || '14:00',
      sessionDuration: swap.sessionDuration || 60,
      meetingLink: swap.meetingLink || ''
    });
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!schedulingSwap) return;

    if (scheduleForm.meetingLink && scheduleForm.meetingLink.trim()) {
      const link = scheduleForm.meetingLink.trim();
      const isValid = /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(link);
      if (!isValid || link.includes('placeholder') || link.includes('xyz-swap-demo')) {
        alert('Please enter a valid, real meeting URL (e.g. https://meet.google.com/xxx-yyyy-zzz).');
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/swaps/${schedulingSwap.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleForm,
          userId: currentUser.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSchedulingSwap(null);
      loadInitialData(currentUser.id);
      alert('📅 Swap session scheduled successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Agenda Management with Strict Duration Matching Rule
  const handleAddAgendaItem = async (swap) => {
    setAgendaError('');
    if (!agendaForm.title.trim()) return;

    const currentAgenda = swap.agenda || [];
    const itemDuration = Number(agendaForm.duration) || 15;
    const currentTotal = currentAgenda.reduce((s, it) => s + (Number(it.duration) || 0), 0);
    const meetingDuration = Number(swap.sessionDuration) || 60;

    if (currentTotal + itemDuration > meetingDuration) {
      setAgendaError(`Cannot add topic: Total agenda duration would exceed meeting duration (${meetingDuration} min).`);
      return;
    }

    const updated = [
      ...currentAgenda,
      { id: 'ag_' + Date.now(), title: agendaForm.title.trim(), duration: itemDuration }
    ];

    try {
      const res = await fetch(`${API_BASE}/swaps/${swap.id}/agenda`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenda: updated, userId: currentUser.id })
      });
      if (res.ok) {
        setAgendaForm({ title: '', duration: 15 });
        loadInitialData(currentUser.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAgendaItem = async (swap, itemId) => {
    setAgendaError('');
    const updated = (swap.agenda || []).filter(it => it.id !== itemId);
    try {
      const res = await fetch(`${API_BASE}/swaps/${swap.id}/agenda`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenda: updated, userId: currentUser.id })
      });
      if (res.ok) {
        loadInitialData(currentUser.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmAgenda = async (swap) => {
    setAgendaError('');
    const currentAgenda = swap.agenda || [];
    const currentTotal = currentAgenda.reduce((s, it) => s + (Number(it.duration) || 0), 0);
    const meetingDuration = Number(swap.sessionDuration) || 60;

    if (currentTotal !== meetingDuration) {
      setAgendaError(`Cannot confirm: Total agenda duration is ${currentTotal} min, but must be exactly ${meetingDuration} minutes.`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/swaps/${swap.id}/agenda`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenda: currentAgenda, userId: currentUser.id, confirmAgenda: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      loadInitialData(currentUser.id);
      alert('✓ Agenda confirmed! It perfectly matches the scheduled meeting duration.');
    } catch (err) {
      setAgendaError(err.message);
    }
  };

  // Confirm Completion
  const handleConfirmCompletion = async (swapId) => {
    try {
      const res = await fetch(`${API_BASE}/swaps/${swapId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`⭐ ${data.message}`);
      loadInitialData(currentUser.id);
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Review & Recalculate Rating
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalSwap) return;
    setReviewSubmitting(true);

    const revieweeId = reviewModalSwap.isSender ? reviewModalSwap.receiverId : reviewModalSwap.senderId;
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swapId: reviewModalSwap.id,
          reviewerId: currentUser.id,
          revieweeId: revieweeId,
          rating: Number(reviewRating),
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReviewModalSwap(null);
      setReviewComment('');
      alert(`⭐ Review submitted successfully! Partner's updated average rating is now ${data.newRating}.`);
      loadInitialData(currentUser.id);
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // File Upload and Message Attachment Handling
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Max 50MB
      if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds the 50MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatPartner) return;
    if (!newMsgText.trim() && !selectedFile && !videoLinkInput) return;

    let attachmentObj = null;

    try {
      setUploadingAttachment(true);

      // If a physical file is selected, upload first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch(`${API_BASE}/messages/upload`, {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

        attachmentObj = {
          originalName: uploadData.originalName,
          fileName: uploadData.fileName,
          fileType: uploadData.fileType,
          fileSize: uploadData.fileSize,
          url: uploadData.url,
          isVideoLink: false
        };
      } else if (videoLinkInput.trim()) {
        attachmentObj = {
          originalName: 'Educational Video Link',
          url: videoLinkInput.trim(),
          fileType: 'video/link',
          isVideoLink: true
        };
      }

      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: chatPartner.id,
          text: newMsgText.trim(),
          attachment: attachmentObj
        })
      });

      const sent = await res.json();
      setMessages(prev => [...prev, sent]);
      setNewMsgText('');
      setSelectedFile(null);
      setVideoLinkInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert(`Error sending message: ${err.message}`);
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Notifications
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      fetch(`${API_BASE}/notifications/${notif.id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    if (notif.link === 'swaps') {
      setActiveTab('swaps');
    } else if (notif.link === 'messages') {
      const partner = students.find(s => s.id === notif.relatedId);
      if (partner) setChatPartner(partner);
      setActiveTab('messages');
    } else if (notif.link === 'reviews') {
      setActiveTab('reviews');
    } else if (notif.link === 'profile') {
      setActiveTab('profile');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    await fetch(`${API_BASE}/notifications/read-all/${currentUser.id}`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Conversation partners
  const conversationPartners = students.filter(st => {
    if (st.id === currentUser?.id) return false;
    const hasMsg = messages.some(m => m.senderId === st.id || m.receiverId === st.id);
    const hasSwap = mySwaps.some(s => s.partner?.id === st.id);
    return hasMsg || hasSwap;
  });

  // Empty state messages for categories
  const getCategoryEmptyState = (cat) => {
    switch (cat) {
      case 'Design':
        return 'No design skills available right now.';
      case 'Programming':
        return 'No programming skills available right now.';
      case 'Language':
        return 'No language skills available right now.';
      case 'Business':
        return 'No business skills available right now.';
      case 'Music':
        return 'No music skills available right now.';
      default:
        return 'No skills available right now matching your criteria.';
    }
  };

  // =========================================================================
  // 1. WELCOME & AUTH SCREEN
  // =========================================================================
  if (!currentUser) {
    return (
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f0ff 0%, #ede5fc 50%, #e4d7fa 100%)',
        position: 'relative',
        padding: '30px 16px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <SkillSwapLogo size={100} />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#2e1065', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Skill Swap <span style={{ color: '#7c3aed' }}>Platform</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, fontWeight: '500' }}>
            Exchange skills. Learn from others. Grow together.
          </p>
        </div>

        <div style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '34px',
          boxShadow: '0 20px 45px rgba(124, 58, 237, 0.12)',
          zIndex: 1,
          border: '1.5px solid rgba(233, 213, 255, 0.8)'
        }}>
          {/* Sign In / Sign Up Switcher */}
          <div style={{ display: 'flex', backgroundColor: '#f5f3ff', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
            <button
              onClick={() => { setAuthMode('signin'); setAuthError(''); }}
              style={{
                flex: 1, padding: '11px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                backgroundColor: authMode === 'signin' ? '#7c3aed' : 'transparent',
                color: authMode === 'signin' ? '#ffffff' : '#6b7280'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              style={{
                flex: 1, padding: '11px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                backgroundColor: authMode === 'signup' ? '#7c3aed' : 'transparent',
                color: authMode === 'signup' ? '#ffffff' : '#6b7280'
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0' }}>
              {authMode === 'signin' ? 'Welcome Back! 👋' : 'Join Skill Swap'}
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              {authMode === 'signin' ? 'Sign in to access your skills dashboard and swap sessions.' : 'Join the campus peer learning community without phone numbers.'}
            </p>
          </div>

          {authError && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', fontWeight: '600' }}>
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {authMode === 'signup' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Malak Mohamed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="16"
                    max="100"
                    placeholder="e.g. 21"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600' }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="example@student.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '11px 44px 11px 14px', borderRadius: '12px', border: '1.5px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600' }}
                />
              </div>
            )}

            {authMode === 'signin' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563', cursor: 'pointer', fontWeight: '600' }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: '#7c3aed' }} />
                  Remember Me
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to your email.'); }} style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: '700' }}>
                  Forgot Password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#ffffff', fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)', marginTop: '4px'
              }}
            >
              {authLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#6b7280' }}>
            {authMode === 'signin' ? (
              <span>Don't have an account? <a href="#signup" onClick={(e) => { e.preventDefault(); setAuthMode('signup'); setAuthError(''); }} style={{ color: '#7c3aed', fontWeight: '700', textDecoration: 'none' }}>Create Account</a></span>
            ) : (
              <span>Already have an account? <a href="#signin" onClick={(e) => { e.preventDefault(); setAuthMode('signin'); setAuthError(''); }} style={{ color: '#7c3aed', fontWeight: '700', textDecoration: 'none' }}>Sign In</a></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN APPLICATION WORKSPACE
  // =========================================================================
  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const activeSwapsCount = mySwaps.filter(s => s.status === 'pending' || s.status === 'accepted' || s.status === 'scheduled').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
    { id: 'explore', label: 'Explore Skills', icon: '🧭' },
    { id: 'students', label: 'Find Peers', icon: '👥' },
    { id: 'swaps', label: 'Swap Requests', icon: '🤝', badge: activeSwapsCount },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadNotifsCount },
    { id: 'reviews', label: 'Reviews & Ratings', icon: '⭐' },
    { id: 'profile', label: 'My Profile', icon: '👤' }
  ];

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{
        width: '270px', minWidth: '270px', backgroundColor: '#ffffff', borderRight: '1px solid #e9d5ff',
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 20
      }}>
        {/* Brand header */}
        <div style={{ padding: '22px 20px', borderBottom: '1px solid #f3e8ff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SkillSwapLogo size={42} />
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#2e1065' }}>Skill Swap</h3>
            <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '700', letterSpacing: '0.5px' }}>PEER EXCHANGE</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: '12px', border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : '#374151',
                  fontSize: '14px', fontWeight: isActive ? '700' : '600', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span style={{
                    backgroundColor: isActive ? '#ffffff' : '#ef4444',
                    color: isActive ? '#7c3aed' : '#ffffff',
                    fontSize: '11px', fontWeight: '800', padding: '2px 7px', borderRadius: '10px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Avatar with User Menu Popover */}
        <div style={{ padding: '16px', borderTop: '1px solid #f3e8ff', position: 'relative' }} ref={userMenuRef}>
          {/* Avatar Click Target */}
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '12px',
              cursor: 'pointer', transition: 'background 0.15s ease',
              backgroundColor: showUserMenu ? '#f5f0ff' : 'transparent'
            }}
          >
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e9d5ff', color: '#6d28d9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px',
              border: '2px solid #c084fc'
            }}>
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {currentUser.reviewsCount > 0 ? (
                  <span style={{ color: '#d97706', fontWeight: '700' }}>⭐ {currentUser.rating} ({currentUser.reviewsCount})</span>
                ) : (
                  <span>0.0 (No reviews yet)</span>
                )}
              </div>
            </div>
            <span style={{ fontSize: '14px', color: '#7c3aed' }}>{showUserMenu ? '▲' : '▼'}</span>
          </div>

          {/* Interactive User Menu Popover (Requirement 5) */}
          {showUserMenu && (
            <div style={{
              position: 'absolute', bottom: '75px', left: '16px', right: '16px', backgroundColor: '#ffffff',
              borderRadius: '16px', padding: '14px', boxShadow: '0 10px 30px rgba(124, 58, 237, 0.18)',
              border: '1.5px solid #e9d5ff', zIndex: 100
            }}>
              <div style={{ borderBottom: '1px solid #f3e8ff', paddingBottom: '10px', marginBottom: '8px' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#2e1065' }}>{currentUser.name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.email}
                </div>
                <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '700', marginTop: '2px' }}>
                  Age: {currentUser.age !== undefined && currentUser.age !== null ? currentUser.age : 'Not specified'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }}
                  style={{ width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}
                >
                  👤 My Profile
                </button>
                <button
                  onClick={() => { setActiveTab('profile'); setShowUserMenu(false); }}
                  style={{ width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}
                >
                  ✏️ Edit Profile
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); setShowLogoutModal(true); }}
                  style={{ width: '100%', padding: '8px 10px', border: 'none', background: '#fff1f2', textAlign: 'left', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#dc2626', cursor: 'pointer', marginTop: '4px' }}
                >
                  🚪 Log Out
                </button>
              </div>
            </div>
          )}

          {/* Regular Logout button below avatar */}
          <button
            onClick={() => setShowLogoutModal(true)}
            style={{
              width: '100%', marginTop: '8px', padding: '9px', borderRadius: '10px', border: '1px solid #fee2e2',
              backgroundColor: '#fff1f2', color: '#e11d48', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Top Header */}
        <header style={{
          height: '70px', minHeight: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e9d5ff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#2e1065', textTransform: 'capitalize' }}>
              {activeTab === 'students' ? 'Find Peers' : activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: '600' }}>
              🎓 {currentUser.faculty || 'University Peer'} • Age: {currentUser.age || '—'}
            </span>
            <button
              onClick={() => setActiveTab('notifications')}
              style={{
                position: 'relative', background: '#f5f3ff', border: '1px solid #e9d5ff',
                padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '15px'
              }}
            >
              🔔
              {unreadNotifsCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444',
                  color: '#fff', fontSize: '10px', fontWeight: '800', padding: '1px 5px', borderRadius: '10px'
                }}>
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content Tabs */}
        <div style={{ flex: 1, padding: '32px' }}>

          {/* =========================================================================
              TAB 1: DASHBOARD
             ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Welcome banner */}
              <div style={{
                backgroundColor: '#ffffff', padding: '24px 28px', borderRadius: '20px',
                border: '1px solid #e9d5ff', marginBottom: '24px', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', color: '#2e1065', fontSize: '24px', fontWeight: '800' }}>
                    Welcome back, {currentUser.name}! 👋
                  </h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Connect with peer students to trade skills, share knowledge, and achieve your university goals.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('explore')}
                  style={{
                    padding: '11px 20px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  🧭 Explore Skills
                </button>
              </div>

              {/* Real DB Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '32px' }}>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Matched Peers</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', marginTop: '6px' }}>{matches.length}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Completed Swaps</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', marginTop: '6px' }}>
                    {mySwaps.filter(s => s.status === 'completed').length}
                  </div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Skills I Offer</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', marginTop: '6px' }}>
                    {currentUser.skillsToTeach?.length || 0}
                  </div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Average Rating</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#d97706', marginTop: '10px' }}>
                    {currentUser.reviewsCount > 0 ? (
                      `⭐ ${currentUser.rating} (${currentUser.reviewsCount})`
                    ) : (
                      '0.0 (No reviews yet)'
                    )}
                  </div>
                </div>
              </div>

              {/* Recommended Matches */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  🔥 Recommended Peer Matches
                </h3>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Based on reciprocal skill overlap</span>
              </div>

              {matches.length === 0 ? (
                <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1.5px dashed #e9d5ff' }}>
                  <p style={{ color: '#4b5563', fontSize: '15px', margin: '0 0 10px 0' }}>No mutual matches found for your current skills.</p>
                  <button onClick={() => setActiveTab('explore')} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    🧭 Explore Skills Catalog
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {matches.map((m, idx) => {
                    const partnerObj = students.find(s => s.id === m.partnerId);
                    return (
                      <div key={idx} style={{ backgroundColor: '#fff', padding: '22px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '17px', color: '#111827' }}>🎓 {m.partnerName}</h4>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{m.partnerFaculty || 'University Peer'}</span>
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px',
                            backgroundColor: m.matchType === 'FULL_MATCH' ? '#dcfce7' : '#fef3c7',
                            color: m.matchType === 'FULL_MATCH' ? '#15803d' : '#b45309'
                          }}>
                            {m.matchType === 'FULL_MATCH' ? '🔥 FULL MATCH' : '✨ PARTIAL'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                          🟢 <b>Teaches You:</b> {m.whatTheyTeachYou.join(', ') || 'N/A'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '16px' }}>
                          🔵 <b>Learns:</b> {m.whatYouTeachThem.join(', ') || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => { if (partnerObj) handleOpenSwapModal(partnerObj); }}
                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                          >
                            🤝 Request Swap
                          </button>
                          <button
                            onClick={() => {
                              if (partnerObj) {
                                setChatPartner(partnerObj);
                                setActiveTab('messages');
                              }
                            }}
                            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff', color: '#7c3aed', fontWeight: '700', cursor: 'pointer' }}
                          >
                            💬 Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: EXPLORE SKILLS (CATEGORIES: All, Design, Programming, Language, Business, Music)
             ========================================================================= */}
          {activeTab === 'explore' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: '800' }}>Available Skills & Swappers</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Filter skills by category or search to discover real student partners.</p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search skill or swapper..."
                  value={skillSearch}
                  onChange={e => setSkillSearch(e.target.value)}
                  style={{ padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #d1d5db', width: '280px', fontSize: '14px', color: '#111827' }}
                />
              </div>

              {/* Exact Categories Required: All, Design, Programming, Language, Business, Music */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
                {['All', 'Design', 'Programming', 'Language', 'Business', 'Music'].map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        border: isSelected ? 'none' : '1px solid #e9d5ff',
                        backgroundColor: isSelected ? '#7c3aed' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#6b7280',
                        boxShadow: isSelected ? '0 2px 8px rgba(124, 58, 237, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Filtered Skills List */}
              {(() => {
                const filtered = skillsOffered
                  .filter(sk => sk.studentId !== currentUser.id)
                  .filter(sk => {
                    if (selectedCategory !== 'All' && sk.category !== selectedCategory) return false;
                    if (skillSearch.trim()) {
                      const q = skillSearch.toLowerCase();
                      return sk.skillName.toLowerCase().includes(q) || sk.studentName.toLowerCase().includes(q);
                    }
                    return true;
                  });

                if (filtered.length === 0) {
                  return (
                    <div style={{ backgroundColor: '#fff', padding: '48px 24px', borderRadius: '16px', textAlign: 'center', border: '1.5px dashed #e9d5ff' }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#111827' }}>
                        {getCategoryEmptyState(selectedCategory)}
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                        Try switching categories or searching for a different skill term.
                      </p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
                    {filtered.map(sk => {
                      const peer = students.find(s => s.id === sk.studentId);
                      return (
                        <div key={sk.id} style={{ backgroundColor: '#fff', padding: '22px', borderRadius: '16px', border: '1px solid #e9d5ff', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase' }}>
                              {sk.category || 'Skill'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                              Age: {sk.studentAge || '—'}
                            </span>
                          </div>

                          <h4 style={{ margin: '6px 0 10px 0', fontSize: '18px', color: '#111827', fontWeight: '800' }}>{sk.skillName}</h4>
                          <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '6px' }}>
                            👤 <b>Offered by:</b> {sk.studentName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '14px' }}>
                            🎓 {sk.studentFaculty} • {sk.studentReviewsCount > 0 ? (
                              <span style={{ color: '#d97706', fontWeight: '700' }}>⭐ {sk.studentRating} ({sk.studentReviewsCount})</span>
                            ) : (
                              '0.0 (No reviews yet)'
                            )}
                          </div>
                          
                          <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => { if (peer) handleOpenSwapModal(peer, sk.skillName); }}
                              style={{ flex: 1, padding: '9px', borderRadius: '10px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                            >
                              Request Swap
                            </button>
                            <button
                              onClick={() => { if (peer) setViewingStudent(peer); }}
                              style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff', color: '#7c3aed', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                            >
                              Profile
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* =========================================================================
              TAB 3: FIND PEERS / STUDENTS DIRECTORY (NO PHONES, INCLUDES AGE)
             ========================================================================= */}
          {activeTab === 'students' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: '800' }}>Campus Peer Directory</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Discover registered university students ready to collaborate.</p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search by student name or faculty..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  style={{ padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #d1d5db', width: '280px', fontSize: '14px', color: '#111827' }}
                />
              </div>

              {students.filter(s => s.id !== currentUser.id).length === 0 ? (
                <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1.5px dashed #e9d5ff' }}>
                  <p style={{ color: '#6b7280', fontSize: '15px', margin: '0 0 8px 0' }}>No other students registered yet.</p>
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Open a private or incognito browser window and sign up with another student account to test pairing!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
                  {students
                    .filter(s => s.id !== currentUser.id)
                    .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.faculty || '').toLowerCase().includes(studentSearch.toLowerCase()))
                    .map(st => (
                      <div key={st.id} style={{ backgroundColor: '#fff', padding: '22px', borderRadius: '16px', border: '1px solid #e9d5ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '17px', color: '#111827' }}>🎓 {st.name}</h4>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                              {st.faculty || 'University Peer'} • Age: {st.age || '—'}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '700' }}>
                            {st.reviewsCount > 0 ? `⭐ ${st.rating} (${st.reviewsCount})` : '0.0 (No reviews yet)'}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 12px 0', minHeight: '36px' }}>
                          {st.bio || 'Ready for peer skill swapping!'}
                        </p>
                        
                        <div style={{ fontSize: '12px', color: '#059669', marginBottom: '6px' }}>
                          <b>Teaches:</b> {st.skillsToTeach?.join(', ') || 'None listed'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '16px' }}>
                          <b>Wants to learn:</b> {st.skillsToLearn?.join(', ') || 'None listed'}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setViewingStudent(st)}
                            style={{ flex: 1, padding: '9px', borderRadius: '10px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff', color: '#7c3aed', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleOpenSwapModal(st)}
                            style={{ flex: 1, padding: '9px', borderRadius: '10px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                          >
                            Request Swap
                          </button>
                          <button
                            onClick={() => {
                              setChatPartner(st);
                              setActiveTab('messages');
                            }}
                            style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#6d28d9', fontWeight: '700', cursor: 'pointer' }}
                          >
                            💬
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 4: SWAP REQUESTS & AGENDA VALIDATION
             ========================================================================= */}
          {activeTab === 'swaps' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: '800' }}>My Skill Swap Requests & Sessions</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Schedule sessions, collaborate on exact-duration agendas, and rate your peers.</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'pending', 'scheduled', 'completed'].map(f => (
                    <button
                      key={f}
                      onClick={() => setSwapsFilter(f)}
                      style={{
                        padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize', cursor: 'pointer',
                        border: swapsFilter === f ? 'none' : '1px solid #e9d5ff',
                        backgroundColor: swapsFilter === f ? '#7c3aed' : '#ffffff',
                        color: swapsFilter === f ? '#ffffff' : '#6b7280'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {mySwaps.length === 0 ? (
                <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1.5px dashed #e9d5ff' }}>
                  <p style={{ color: '#6b7280', fontSize: '15px', margin: '0 0 12px 0' }}>No swap requests yet.</p>
                  <button onClick={() => setActiveTab('students')} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    Find Peers to Swap With
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {mySwaps
                    .filter(s => {
                      if (swapsFilter === 'all') return true;
                      if (swapsFilter === 'pending') return s.status === 'pending';
                      if (swapsFilter === 'scheduled') return s.status === 'scheduled' || s.status === 'accepted';
                      if (swapsFilter === 'completed') return s.status === 'completed';
                      return true;
                    })
                    .map(sw => {
                      const isIncoming = !sw.isSender;
                      const partnerName = sw.partner?.name || 'Peer Member';
                      const meetingDuration = Number(sw.sessionDuration) || 60;
                      const agendaItems = sw.agenda || [];
                      const allocatedMinutes = agendaItems.reduce((sum, it) => sum + (Number(it.duration) || 0), 0);
                      const remainingMinutes = meetingDuration - allocatedMinutes;
                      const isDurationExact = allocatedMinutes === meetingDuration;

                      return (
                        <div key={sw.id} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '18px', border: '1px solid #e9d5ff', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                          {/* Swap header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', backgroundColor: isIncoming ? '#eff6ff' : '#faf5ff', color: isIncoming ? '#2563eb' : '#7c3aed' }}>
                                {isIncoming ? 'INCOMING' : 'OUTGOING'}
                              </span>
                              <h4 style={{ margin: 0, fontSize: '16px', color: '#111827' }}>
                                {isIncoming ? `From: ${partnerName}` : `To: ${partnerName}`}
                              </h4>
                            </div>
                            <span style={{
                              padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase',
                              backgroundColor: sw.status === 'completed' ? '#dcfce7' : (sw.status === 'accepted' || sw.status === 'scheduled') ? '#e0f2fe' : (sw.status === 'rejected' ? '#fee2e2' : '#fef3c7'),
                              color: sw.status === 'completed' ? '#15803d' : (sw.status === 'accepted' || sw.status === 'scheduled') ? '#0284c7' : (sw.status === 'rejected' ? '#b91c1c' : '#b45309')
                            }}>
                              {sw.status}
                            </span>
                          </div>

                          {/* Skill trade line */}
                          <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>
                            Teaching <b>{sw.skillOffered}</b> ⇄ Learning <b>{sw.skillWanted}</b>
                          </div>
                          
                          {sw.note && (
                            <div style={{ backgroundColor: '#f9fafb', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', color: '#4b5563', marginBottom: '14px', borderLeft: '3px solid #7c3aed' }}>
                              "{sw.note}"
                            </div>
                          )}

                          {/* Incoming pending actions */}
                          {isIncoming && sw.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                              <button
                                onClick={() => handleSwapStatus(sw.id, 'accepted')}
                                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                              >
                                Accept Swap ✓
                              </button>
                              <button
                                onClick={() => handleSwapStatus(sw.id, 'rejected')}
                                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                              >
                                Decline ✕
                              </button>
                            </div>
                          )}

                          {/* Accepted or Scheduled Workflow */}
                          {(sw.status === 'accepted' || sw.status === 'scheduled' || sw.status === 'completed') && (
                            <div style={{ marginTop: '14px', borderTop: '1px solid #f3e8ff', paddingTop: '16px' }}>
                              {/* Contact info: Email only, NO PHONES (Requirement 3) */}
                              <div style={{ backgroundColor: '#f0fdf4', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', color: '#166534', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  🔒 <b>Contact Details:</b> Email: <b>{sw.partner?.email}</b> (Phone communication removed in favor of private in-app chat)
                                </div>
                                <button
                                  onClick={() => {
                                    const p = students.find(s => s.id === sw.partner?.id);
                                    if (p) { setChatPartner(p); setActiveTab('messages'); }
                                  }}
                                  style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#166534', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  Open In-App Chat 💬
                                </button>
                              </div>

                              {/* Session Scheduling & Real Google Meet (Requirement 7) */}
                              <div style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '14px', border: '1px solid #f3e8ff', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#2e1065' }}>
                                    📅 Session Schedule & Google Meet Link
                                  </h5>
                                  <button
                                    onClick={() => openScheduleModal(sw)}
                                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#7c3aed', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                  >
                                    ✏️ Edit Schedule
                                  </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                                  <div><b>Date:</b> {sw.sessionDate || 'Not set'}</div>
                                  <div><b>Time:</b> {sw.sessionTime || 'Not set'}</div>
                                  <div><b>Duration:</b> {meetingDuration} minutes</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {sw.meetingLink ? (
                                    <a
                                      href={sw.meetingLink.startsWith('http') ? sw.meetingLink : `https://${sw.meetingLink}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                                        borderRadius: '8px', backgroundColor: '#059669', color: '#fff', textDecoration: 'none',
                                        fontSize: '13px', fontWeight: '700'
                                      }}
                                    >
                                      🎥 Join Meeting ({sw.meetingLink.replace(/^https?:\/\//, '').slice(0, 24)}...)
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                      No meeting link saved yet. Click "Edit Schedule" to generate or paste a real Google Meet URL.
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Collaborative Session Agenda (Strict Duration Validation, Requirement 6) */}
                              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>
                                    📝 Collaborative Session Agenda
                                  </h5>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: isDurationExact ? '#15803d' : '#b45309' }}>
                                    Target Duration: {meetingDuration} min
                                  </span>
                                </div>

                                {/* Live Duration Meter */}
                                <div style={{
                                  padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '12px',
                                  backgroundColor: isDurationExact ? '#dcfce7' : (remainingMinutes > 0 ? '#fef3c7' : '#fee2e2'),
                                  color: isDurationExact ? '#15803d' : (remainingMinutes > 0 ? '#b45309' : '#b91c1c')
                                }}>
                                  {isDurationExact ? (
                                    `✓ Agenda duration (${allocatedMinutes} min) perfectly matches the ${meetingDuration}-minute meeting!`
                                  ) : remainingMinutes > 0 ? (
                                    `⏱️ Allocated: ${allocatedMinutes} min / ${meetingDuration} min (${remainingMinutes} min remaining to allocate)`
                                  ) : (
                                    `⚠️ Allocated: ${allocatedMinutes} min / ${meetingDuration} min (exceeds meeting duration by ${Math.abs(remainingMinutes)} min)`
                                  )}
                                </div>

                                {agendaError && (
                                  <div style={{ color: '#b91c1c', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                                    ⚠️ {agendaError}
                                  </div>
                                )}

                                {/* Agenda Items list */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                                  {agendaItems.map((item, aIdx) => (
                                    <div key={item.id || aIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                                      <span><b>{aIdx + 1}.</b> {item.title}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#64748b', fontWeight: '700' }}>{item.duration} min</span>
                                        {sw.status !== 'completed' && (
                                          <button
                                            onClick={() => handleRemoveAgendaItem(sw, item.id)}
                                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Add Topic & Confirm Agenda */}
                                {sw.status !== 'completed' && (
                                  <div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                      <input
                                        type="text"
                                        placeholder="Enter topic name..."
                                        value={agendaForm.title}
                                        onChange={e => setAgendaForm({ ...agendaForm, title: e.target.value })}
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                      />
                                      <select
                                        value={agendaForm.duration}
                                        onChange={e => setAgendaForm({ ...agendaForm, duration: Number(e.target.value) })}
                                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                      >
                                        <option value={5}>5 min</option>
                                        <option value={10}>10 min</option>
                                        <option value={15}>15 min</option>
                                        <option value={20}>20 min</option>
                                        <option value={25}>25 min</option>
                                        <option value={30}>30 min</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleAddAgendaItem(sw)}
                                        style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                                      >
                                        + Add Topic
                                      </button>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={!isDurationExact}
                                      onClick={() => handleConfirmAgenda(sw)}
                                      style={{
                                        padding: '9px 16px', borderRadius: '8px', border: 'none',
                                        backgroundColor: isDurationExact ? '#059669' : '#9ca3af',
                                        color: '#fff', fontSize: '13px', fontWeight: '700', cursor: isDurationExact ? 'pointer' : 'not-allowed'
                                      }}
                                    >
                                      {sw.agendaConfirmed ? '✓ Agenda Confirmed (Matches Duration)' : 'Confirm Agenda (Requires Exact Duration Match)'}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Completion & Review Actions (Requirement 1) */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {sw.status !== 'completed' ? (
                                  <div>
                                    <button
                                      onClick={() => handleConfirmCompletion(sw.id)}
                                      style={{
                                        padding: '10px 18px', borderRadius: '10px', border: 'none',
                                        backgroundColor: (sw.confirmedBy || []).includes(currentUser.id) ? '#9ca3af' : '#7c3aed',
                                        color: '#fff', fontWeight: '700', fontSize: '13px', cursor: (sw.confirmedBy || []).includes(currentUser.id) ? 'default' : 'pointer'
                                      }}
                                      disabled={(sw.confirmedBy || []).includes(currentUser.id)}
                                    >
                                      {(sw.confirmedBy || []).includes(currentUser.id) ? '✓ Marked Completed by You (Waiting for Partner)' : 'Mark Session Completed ✓'}
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ color: '#15803d', fontWeight: '700', fontSize: '14px' }}>
                                      🎉 Session Completed!
                                    </span>
                                    <button
                                      onClick={() => {
                                        setReviewModalSwap(sw);
                                        setReviewRating(5);
                                        setReviewComment('');
                                      }}
                                      style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
                                    >
                                      ⭐ Leave Review & Rating
                                    </button>
                                  </div>
                                )}
                              </div>

                            </div>
                          )}

                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 5: MESSAGES & LEARNING MATERIALS SHARING (REQUIREMENT 8)
             ========================================================================= */}
          {activeTab === 'messages' && (
            <div style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #e9d5ff', height: '620px', display: 'flex', overflow: 'hidden' }}>
              {/* Partner List */}
              <div style={{ width: '280px', borderRight: '1px solid #f3e8ff', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #f3e8ff', fontWeight: '800', color: '#111827', fontSize: '15px' }}>
                  Conversations ({conversationPartners.length})
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {conversationPartners.length === 0 ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                      <p>No active conversations.</p>
                      <button onClick={() => setActiveTab('students')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Browse Peers
                      </button>
                    </div>
                  ) : (
                    conversationPartners.map(p => {
                      const isSelected = chatPartner?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setChatPartner(p)}
                          style={{
                            padding: '14px 18px', borderBottom: '1px solid #f9fafb', cursor: 'pointer',
                            backgroundColor: isSelected ? '#f5f0ff' : '#ffffff',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: isSelected ? '#7c3aed' : '#e9d5ff', color: isSelected ? '#fff' : '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {p.name[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {p.faculty || 'Peer Student'} • Age: {p.age || '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3e8ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#faf5ff' }}>
                  {chatPartner ? (
                    <div>
                      <div style={{ fontWeight: '800', color: '#111827', fontSize: '15px' }}>
                        💬 {chatPartner.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {chatPartner.faculty || 'University Peer'} • Age: {chatPartner.age || '—'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>Select a conversation to start sharing messages & learning materials.</div>
                  )}
                  {chatPartner && (
                    <button
                      onClick={() => setViewingStudent(chatPartner)}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#fff', color: '#7c3aed', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      View Profile
                    </button>
                  )}
                </div>

                {/* Messages feed */}
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fcfbfe' }}>
                  {!chatPartner ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                      Select a peer or find a student to chat and exchange educational materials.
                    </div>
                  ) : (
                    messages
                      .filter(m => (m.senderId === currentUser.id && m.receiverId === chatPartner.id) || (m.senderId === chatPartner.id && m.receiverId === currentUser.id))
                      .map((m, i) => {
                        const isMe = m.senderId === currentUser.id;
                        const senderName = isMe ? currentUser.name : chatPartner.name;
                        const hasAttachment = Boolean(m.attachment);
                        const isVideo = hasAttachment && (m.attachment.isVideoLink || m.attachment.fileType?.includes('video'));
                        const isImage = hasAttachment && m.attachment.fileType?.includes('image');
                        const isPdf = hasAttachment && m.attachment.fileType?.includes('pdf');

                        return (
                          <div key={m.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                            <div style={{
                              backgroundColor: isMe ? '#7c3aed' : '#ffffff',
                              color: isMe ? '#ffffff' : '#111827',
                              padding: '12px 16px',
                              borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              fontSize: '14px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                              border: isMe ? 'none' : '1px solid #e9d5ff'
                            }}>
                              {/* Attachment Rendering (Requirement 8) */}
                              {hasAttachment && (
                                <div style={{
                                  backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : '#f8fafc',
                                  padding: '10px 12px', borderRadius: '10px', marginBottom: m.text ? '8px' : '0',
                                  border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0'
                                }}>
                                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.85 }}>
                                    📎 Learning Material: {m.attachment.originalName}
                                  </div>

                                  {/* PDF */}
                                  {isPdf && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '6px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: '600' }}>
                                        📄 PDF Document ({formatFileSize(m.attachment.fileSize)})
                                      </span>
                                      <a
                                        href={`${API_BASE.replace('/api', '')}${m.attachment.url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={m.attachment.originalName}
                                        style={{
                                          padding: '5px 12px', borderRadius: '6px',
                                          backgroundColor: isMe ? '#ffffff' : '#7c3aed',
                                          color: isMe ? '#7c3aed' : '#ffffff',
                                          fontWeight: '700', fontSize: '12px', textDecoration: 'none'
                                        }}
                                      >
                                        Download / Open
                                      </a>
                                    </div>
                                  )}

                                  {/* Image */}
                                  {isImage && (
                                    <div>
                                      <img
                                        src={`${API_BASE.replace('/api', '')}${m.attachment.url}`}
                                        alt={m.attachment.originalName}
                                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', display: 'block', marginTop: '6px' }}
                                      />
                                      <a
                                        href={`${API_BASE.replace('/api', '')}${m.attachment.url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ display: 'inline-block', fontSize: '11px', marginTop: '4px', color: isMe ? '#e9d5ff' : '#7c3aed', textDecoration: 'underline' }}
                                      >
                                        Open full image
                                      </a>
                                    </div>
                                  )}

                                  {/* Video */}
                                  {isVideo && (
                                    <div>
                                      {m.attachment.isVideoLink ? (
                                        <div style={{ marginTop: '4px' }}>
                                          <a
                                            href={m.attachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: isMe ? '#ffffff' : '#7c3aed', fontWeight: '700', textDecoration: 'underline' }}
                                          >
                                            🎬 Watch Educational Video ({m.attachment.url})
                                          </a>
                                        </div>
                                      ) : (
                                        <video
                                          src={`${API_BASE.replace('/api', '')}${m.attachment.url}`}
                                          controls
                                          style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', marginTop: '6px' }}
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Text content */}
                              {m.text && <div style={{ wordBreak: 'break-word', fontWeight: '500' }}>{m.text}</div>}
                            </div>
                            <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block', textAlign: isMe ? 'right' : 'left', marginTop: '3px', padding: '0 4px' }}>
                              {senderName} • {m.timestamp || 'Now'}
                            </span>
                          </div>
                        );
                      })
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Selected File Preview Banner before sending */}
                {selectedFile && (
                  <div style={{ padding: '8px 16px', backgroundColor: '#f5f0ff', borderTop: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📎</span>
                      <b>{selectedFile.name}</b>
                      <span style={{ color: '#6b7280' }}>({formatFileSize(selectedFile.size)})</span>
                    </div>
                    <button
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}

                {/* Video link preview banner */}
                {videoLinkInput && (
                  <div style={{ padding: '8px 16px', backgroundColor: '#eff6ff', borderTop: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🎬 Video Link:</span>
                      <b>{videoLinkInput}</b>
                    </div>
                    <button
                      onClick={() => setVideoLinkInput('')}
                      style={{ border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}

                {/* Input area */}
                {chatPartner && (
                  <form onSubmit={handleSendMessage} style={{ padding: '14px 18px', borderTop: '1px solid #f3e8ff', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff' }}>
                    {/* Attachment Paperclip Button */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.webm"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      title="Attach learning materials (PDF, Image, Video)"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #d1d5db', backgroundColor: '#faf5ff', color: '#7c3aed', fontSize: '16px', cursor: 'pointer' }}
                    >
                      📎
                    </button>

                    {/* Educational video link button */}
                    <button
                      type="button"
                      title="Share Educational Video Link (YouTube / Vimeo / Drive)"
                      onClick={() => setShowVideoLinkModal(true)}
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #d1d5db', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🎬
                    </button>

                    <input
                      type="text"
                      placeholder="Type a message or share learning resources..."
                      value={newMsgText}
                      onChange={e => setNewMsgText(e.target.value)}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #d1d5db', color: '#111827', fontSize: '14px', outline: 'none' }}
                    />

                    <button
                      type="submit"
                      disabled={uploadingAttachment}
                      style={{
                        padding: '12px 22px', borderRadius: '12px', border: 'none',
                        backgroundColor: '#7c3aed', color: '#fff', fontWeight: '800', cursor: 'pointer'
                      }}
                    >
                      {uploadingAttachment ? 'Uploading...' : 'Send'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 6: CLICKABLE NOTIFICATIONS
             ========================================================================= */}
          {activeTab === 'notifications' && (
            <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '18px', border: '1px solid #e9d5ff', maxWidth: '750px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: '800' }}>Notifications</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Click any notification to navigate directly to the relevant swap, message, or review.</p>
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff', color: '#7c3aed', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        padding: '14px 18px', borderRadius: '12px', cursor: 'pointer',
                        backgroundColor: n.read ? '#ffffff' : '#faf5ff',
                        border: n.read ? '1px solid #e5e7eb' : '1.5px solid #c084fc',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!n.read && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#7c3aed', display: 'inline-block' }} />
                          )}
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#2e1065' }}>{n.title}</div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#4b5563', margin: '4px 0 2px 0' }}>{n.message}</div>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{n.time || 'Recent'}</span>
                      </div>
                      <span style={{ fontSize: '18px', color: '#7c3aed', marginLeft: '12px' }}>→</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 7: REVIEWS & RATINGS (AUTHENTIC DATA FROM DB, REQUIREMENT 1)
             ========================================================================= */}
          {activeTab === 'reviews' && (
            <div style={{ maxWidth: '800px' }}>
              <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '18px', border: '1px solid #e9d5ff', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '20px', fontWeight: '800' }}>Peer Reviews & Ratings</h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
                  Ratings and reviews are calculated automatically from completed Skill Swap sessions.
                </p>

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: '#faf5ff', padding: '20px', borderRadius: '14px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#2e1065' }}>
                      {currentUser.reviewsCount > 0 ? currentUser.rating : '0.0'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {currentUser.reviewsCount > 0 ? (
                        `Based on ${currentUser.reviewsCount} review${currentUser.reviewsCount > 1 ? 's' : ''}`
                      ) : (
                        'No reviews yet.'
                      )}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid #e9d5ff', paddingLeft: '24px', flex: 1, fontSize: '13px', color: '#4b5563' }}>
                    {currentUser.reviewsCount > 0 ? (
                      <p style={{ margin: 0 }}>
                        Great job! Maintain your positive peer rating by attending scheduled sessions on time and actively collaborating on agendas.
                      </p>
                    ) : (
                      <p style={{ margin: 0 }}>
                        No reviews yet. Complete a skill swap session with a peer to receive your first verified star rating!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>Received Reviews</h4>
              {myReviews.length === 0 ? (
                <div style={{ backgroundColor: '#fff', padding: '36px', borderRadius: '16px', textAlign: 'center', border: '1.5px dashed #e9d5ff' }}>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No reviews yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {myReviews.map(rev => (
                    <div key={rev.id} style={{ backgroundColor: '#fff', padding: '18px 22px', borderRadius: '14px', border: '1px solid #e9d5ff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>
                          👤 Reviewer: {rev.reviewerName}
                        </span>
                        <span style={{ color: '#d97706', fontSize: '14px' }}>
                          {'⭐'.repeat(rev.rating)} <span style={{ fontSize: '12px', color: '#6b7280' }}>({rev.rating}/5)</span>
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 6px 0', fontSize: '13px', color: '#374151' }}>"{rev.comment}"</p>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{rev.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 8: MY PROFILE (INCLUDES AGE, NO PHONE, COMPACT SAVE)
             ========================================================================= */}
          {activeTab === 'profile' && (
            <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e9d5ff', maxWidth: '680px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: '800' }}>My Profile Details</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>Update your personal identity, age, and skill inventory.</p>
                </div>
                <button
                  type="submit"
                  form="profileForm"
                  style={{
                    padding: '9px 18px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                  }}
                >
                  Save Profile
                </button>
              </div>

              {profileSaveSuccess && (
                <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '20px', fontWeight: '700' }}>
                  ✓ Profile saved to database successfully!
                </div>
              )}

              <form id="profileForm" onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Registered Email (Read-Only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#6b7280', fontWeight: '600', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #d1d5db', color: '#111827', fontWeight: '600', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="16"
                    max="100"
                    placeholder="e.g. 21"
                    value={profileForm.age}
                    onChange={e => setProfileForm({ ...profileForm, age: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #d1d5db', color: '#111827', fontWeight: '600', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Faculty & University Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Faculty of Engineering / Computer Science"
                    value={profileForm.faculty}
                    onChange={e => setProfileForm({ ...profileForm, faculty: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #d1d5db', color: '#111827', fontWeight: '600', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px' }}>
                    Short Bio
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell your peers what you are passionate about..."
                    value={profileForm.bio}
                    onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #d1d5db', color: '#111827', fontWeight: '600', fontSize: '14px' }}
                  />
                </div>

                <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#15803d', marginBottom: '5px' }}>
                    Skills I Can Teach (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Photoshop, UI Design, Python Basics"
                    value={profileForm.skillsToTeach}
                    onChange={e => setProfileForm({ ...profileForm, skillsToTeach: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #86efac', color: '#111827', fontWeight: '600', fontSize: '14px', backgroundColor: '#fff' }}
                  />
                </div>

                <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1d4ed8', marginBottom: '5px' }}>
                    Skills I Want to Learn (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Excel & Data Analysis, Spanish, React"
                    value={profileForm.skillsToLearn}
                    onChange={e => setProfileForm({ ...profileForm, skillsToLearn: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #93c5fd', color: '#111827', fontWeight: '600', fontSize: '14px', backgroundColor: '#fff' }}
                  />
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* =========================================================================
          MODAL: LOGOUT CONFIRMATION DIALOG (AS REQUESTED)
         ========================================================================= */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: '420px', backgroundColor: '#ffffff', borderRadius: '20px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>
              🚪
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#111827' }}>
              Are you sure you want to log out?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
              You will need to sign in again to access your active skill swaps, scheduled sessions, and messages.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #d1d5db', backgroundColor: '#ffffff', color: '#374151', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VIEW STUDENT / PEER PROFILE
         ========================================================================= */}
      {viewingStudent && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
          <div style={{ width: '460px', backgroundColor: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: '800' }}>🎓 {viewingStudent.name}</h3>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {viewingStudent.faculty || 'University Peer'} • Age: {viewingStudent.age || '—'}
                </span>
              </div>
              <span style={{ fontSize: '13px', color: '#d97706', fontWeight: '700' }}>
                {viewingStudent.reviewsCount > 0 ? `⭐ ${viewingStudent.rating} (${viewingStudent.reviewsCount})` : '0.0 (No reviews yet)'}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '18px' }}>
              {viewingStudent.bio || 'Passionate student ready for skill swapping!'}
            </p>
            
            <div style={{ backgroundColor: '#f0fdf4', padding: '12px 14px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #dcfce7' }}>
              <b style={{ color: '#059669', fontSize: '13px' }}>Can Teach:</b>
              <div style={{ fontSize: '13px', color: '#166534', marginTop: '4px' }}>{viewingStudent.skillsToTeach?.join(', ') || 'None listed'}</div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', padding: '12px 14px', borderRadius: '12px', marginBottom: '22px', border: '1px solid #dbeafe' }}>
              <b style={{ color: '#2563eb', fontSize: '13px' }}>Wants to Learn:</b>
              <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '4px' }}>{viewingStudent.skillsToLearn?.join(', ') || 'None listed'}</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setViewingStudent(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                Close
              </button>
              <button
                onClick={() => handleOpenSwapModal(viewingStudent)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
              >
                Request Swap
              </button>
              <button
                onClick={() => {
                  setChatPartner(viewingStudent);
                  setViewingStudent(null);
                  setActiveTab('messages');
                }}
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff', color: '#7c3aed', fontWeight: '700', cursor: 'pointer' }}
              >
                Chat 💬
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REQUEST SKILL SWAP
         ========================================================================= */}
      {swapModalTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
          <div style={{ width: '460px', backgroundColor: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '18px', fontWeight: '800' }}>Request Skill Swap 🤝</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#6b7280' }}>
              Propose a reciprocal skill exchange with <b>{swapModalTarget.name}</b> (Age: {swapModalTarget.age || '—'}).
            </p>
            
            <form onSubmit={handleSendSwapRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Skill You Offer to Teach:
                </label>
                <select
                  required
                  value={swapForm.skillOffered}
                  onChange={e => setSwapForm({ ...swapForm, skillOffered: e.target.value })}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #d1d5db', color: '#111827', backgroundColor: '#fff', fontSize: '14px' }}
                >
                  <option value="">Select a skill...</option>
                  {currentUser.skillsToTeach?.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Skill You Want to Learn:
                </label>
                <select
                  required
                  value={swapForm.skillWanted}
                  onChange={e => setSwapForm({ ...swapForm, skillWanted: e.target.value })}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #d1d5db', color: '#111827', backgroundColor: '#fff', fontSize: '14px' }}
                >
                  <option value="">Select a skill...</option>
                  {swapModalTarget.skillsToTeach?.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Proposal Note:
                </label>
                <textarea
                  rows={3}
                  value={swapForm.note}
                  onChange={e => setSwapForm({ ...swapForm, note: e.target.value })}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '13px', color: '#111827' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSwapModalTarget(null)}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                >
                  Send Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SCHEDULE SESSION & REAL GOOGLE MEET (REQUIREMENT 7)
         ========================================================================= */}
      {schedulingSwap && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
          <div style={{ width: '480px', backgroundColor: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '18px', fontWeight: '800' }}>Schedule Session 📅</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>
              Agree on a meeting time and link with <b>{schedulingSwap.partner?.name}</b>.
            </p>

            <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Date:
                </label>
                <input
                  type="date"
                  required
                  value={scheduleForm.sessionDate}
                  onChange={e => setScheduleForm({ ...scheduleForm, sessionDate: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', color: '#111827' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Time:
                </label>
                <input
                  type="time"
                  required
                  value={scheduleForm.sessionTime}
                  onChange={e => setScheduleForm({ ...scheduleForm, sessionTime: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', color: '#111827' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Meeting Duration (Agenda maximum limit):
                </label>
                <select
                  value={scheduleForm.sessionDuration}
                  onChange={e => setScheduleForm({ ...scheduleForm, sessionDuration: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', color: '#111827' }}
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (Standard)</option>
                  <option value={90}>90 Minutes</option>
                </select>
              </div>

              {/* Official Google Meet launch helper */}
              <div style={{ backgroundColor: '#faf5ff', padding: '12px', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#2e1065' }}>Generate Real Google Meet Link:</span>
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '5px 10px', borderRadius: '6px', backgroundColor: '#7c3aed', color: '#fff',
                      fontSize: '11px', fontWeight: '700', textDecoration: 'none'
                    }}
                  >
                    🚀 Launch meet.google.com/new
                  </a>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: 1.4 }}>
                  Click to create a real meeting room in your Google account, then copy and paste the link below.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Google Meet / Video Meeting URL:
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  value={scheduleForm.meetingLink}
                  onChange={e => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', color: '#111827' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSchedulingSwap(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#7c3aed', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LEAVE REVIEW & RATING (REQUIREMENT 1)
         ========================================================================= */}
      {reviewModalSwap && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
          <div style={{ width: '440px', backgroundColor: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '18px', fontWeight: '800' }}>Rate Swap Session ⭐</h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#6b7280' }}>
              How was your experience learning from <b>{reviewModalSwap.partner?.name}</b>?
            </p>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  Star Rating (1 to 5):
                </label>
                <div style={{ display: 'flex', gap: '8px', fontSize: '28px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setReviewRating(star)}
                      style={{ opacity: star <= reviewRating ? 1 : 0.25, transition: 'opacity 0.15s ease' }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                  Feedback & Review:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Great session! Very clear explanations and very helpful."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '13px', color: '#111827' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReviewModalSwap(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                >
                  {reviewSubmitting ? 'Saving...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD EDUCATIONAL VIDEO LINK (REQUIREMENT 8)
         ========================================================================= */}
      {showVideoLinkModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
          <div style={{ width: '420px', backgroundColor: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '17px', fontWeight: '800' }}>
              🎬 Share Educational Video Link
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>
              Enter a link to a tutorial or lecture (YouTube, Vimeo, Google Drive, etc.).
            </p>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoLinkInput}
              onChange={e => setVideoLinkInput(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '13px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setVideoLinkInput(''); setShowVideoLinkModal(false); }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowVideoLinkModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Attach Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}