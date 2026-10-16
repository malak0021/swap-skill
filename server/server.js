const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { findMatches } = require('./src/matching/matchingEngine');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Setup file upload storage for learning materials in chat
const UPLOAD_DIR = path.join(__dirname, 'uploads', 'materials');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage with unique naming and safe extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'mat-' + uniqueSuffix + ext);
  }
});

// Allowed file types: PDF, Images (PNG, JPG, WEBP), and educational videos (MP4, WEBM)
const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.mp4', '.webm'];
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Supported types: PDF, Images (PNG, JPG, WEBP), Videos (MP4, WEBM).'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// Serve materials statically
app.use('/uploads/materials', express.static(UPLOAD_DIR));

const DB_FILE = path.join(__dirname, 'database.json');

const defaultData = {
  users: [],
  swaps: [],
  messages: [],
  notifications: [],
  reviews: [],
  skillsCatalog: []
};

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.reviews) parsed.reviews = [];
    if (!parsed.messages) parsed.messages = [];
    if (!parsed.notifications) parsed.notifications = [];
    if (!parsed.swaps) parsed.swaps = [];
    if (!parsed.users) parsed.users = [];
    if (!parsed.skillsCatalog) parsed.skillsCatalog = [];
    return parsed;
  } catch (err) {
    return defaultData;
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB', err);
  }
}

// Category mapping helper ensuring supported categories:
// All, Design, Programming, Language, Business, Music
function getSkillCategory(skillName) {
  const s = (skillName || '').toLowerCase().trim();
  if (/design|photoshop|ui|ux|graphic|motion|illustration|figma|branding|logo|layout/.test(s)) return 'Design';
  if (/programm|code|web|react|python|java|script|html|css|developer|software|node|c\+\+|sql|backend|frontend/.test(s)) return 'Programming';
  if (/language|english|spanish|french|arabic|german|conversation|speak|grammar|italian|chinese|japanese/.test(s)) return 'Language';
  if (/business|excel|cv|interview|market|finance|analys|project|entrepreneur|manage|sales|accounting/.test(s)) return 'Business';
  if (/music|guitar|piano|sing|instrument|theory|drum|violin|vocal|flute/.test(s)) return 'Music';
  return 'Other';
}

// Helper to sanitize public user data (NEVER exposes phone or password)
function sanitizeUser(user, includePrivate = false) {
  if (!user) return null;
  const { password, phone, ...safeUser } = user;
  return safeUser;
}

// ======================= AUTH ROUTES =======================

// 1. Sign Up
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, age } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = loadDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'This email is already registered. Please Sign In.' });
  }

  const validName = name && name.trim() ? name.trim() : email.split('@')[0];

  let parsedAge = null;
  if (age !== undefined && age !== null && age !== '') {
    const num = Number(age);
    if (isNaN(num) || !Number.isInteger(num) || num < 16 || num > 100) {
      return res.status(400).json({ error: 'Please enter a valid age as a positive whole number between 16 and 100.' });
    }
    parsedAge = num;
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    name: validName,
    email: email.toLowerCase().trim(),
    password: password,
    faculty: '',
    bio: '',
    age: parsedAge,
    skillsToTeach: [],
    skillsToLearn: [],
    rating: 0.0,
    reviewsCount: 0,
    profileCompleted: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  db.notifications.push({
    id: 'notif_' + Date.now(),
    userId: newUser.id,
    type: 'welcome',
    title: 'Welcome to Skill Swap! 💜',
    message: 'Set up your skills and age to discover matching peers.',
    read: false,
    link: 'profile',
    relatedId: newUser.id,
    time: 'Just now'
  });

  saveDB(db);
  res.status(201).json({ message: 'User created successfully', user: sanitizeUser(newUser, true) });
});

// 2. Sign In
app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ message: 'Signed in successfully', user: sanitizeUser(user, true) });
});

// 3. Edit Profile
app.put('/api/auth/profile/:id', (req, res) => {
  const { id } = req.params;
  const { name, faculty, bio, age, skillsToTeach, skillsToLearn } = req.body;

  const db = loadDB();
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  let parsedAge = db.users[userIndex].age || null;
  if (age !== undefined && age !== null && age !== '') {
    const num = Number(age);
    if (isNaN(num) || !Number.isInteger(num) || num < 16 || num > 100) {
      return res.status(400).json({ error: 'Age must be a positive whole number between 16 and 100.' });
    }
    parsedAge = num;
  }

  const updated = {
    ...db.users[userIndex],
    name: name && name.trim() ? name.trim() : db.users[userIndex].name,
    faculty: faculty !== undefined ? faculty.trim() : db.users[userIndex].faculty,
    bio: bio !== undefined ? bio.trim() : db.users[userIndex].bio,
    age: parsedAge,
    skillsToTeach: Array.isArray(skillsToTeach) ? skillsToTeach.map(s => s.trim()).filter(Boolean) : db.users[userIndex].skillsToTeach,
    skillsToLearn: Array.isArray(skillsToLearn) ? skillsToLearn.map(s => s.trim()).filter(Boolean) : db.users[userIndex].skillsToLearn,
    profileCompleted: true
  };

  // Ensure no phone is retained
  delete updated.phone;

  db.users[userIndex] = updated;
  saveDB(db);

  res.json({ message: 'Profile updated successfully', user: sanitizeUser(updated, true) });
});

// ======================= SKILLS & USERS =======================

// Explore Skills & Catalog
app.get('/api/skills', (req, res) => {
  const db = loadDB();
  const publicUsers = db.users.map(u => sanitizeUser(u, false));
  
  // Flatten skills offered by peer students
  const skillsOffered = [];
  publicUsers.forEach(u => {
    (u.skillsToTeach || []).forEach((sk, idx) => {
      skillsOffered.push({
        id: `${u.id}_${idx}`,
        skillName: sk,
        category: getSkillCategory(sk),
        studentId: u.id,
        studentName: u.name,
        studentAge: u.age || null,
        studentFaculty: u.faculty || 'University Student',
        studentRating: u.rating || 0.0,
        studentReviewsCount: u.reviewsCount || 0,
        skillsToLearn: u.skillsToLearn || []
      });
    });
  });

  res.json({
    catalog: db.skillsCatalog,
    users: publicUsers,
    skillsOffered
  });
});

// Find Students / Members (Peer Model: Everyone is a swapper)
app.get('/api/students', (req, res) => {
  const db = loadDB();
  const publicUsers = db.users.map(u => sanitizeUser(u, false));
  res.json(publicUsers);
});

// Matching API based on intersection of teach and learn
app.get('/api/matches/:studentId', (req, res) => {
  const { studentId } = req.params;
  const db = loadDB();
  const currentUser = db.users.find(u => u.id === studentId);
  if (!currentUser) return res.status(404).json({ error: 'User not found' });

  const matches = findMatches(currentUser, db.users);
  res.json({ matches });
});

// ======================= SWAP REQUESTS & SESSIONS =======================

// Create a Swap Request
app.post('/api/swaps', (req, res) => {
  const { senderId, receiverId, skillOffered, skillWanted, note } = req.body;
  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'Sender and recipient IDs are required' });
  }
  if (senderId === receiverId) {
    return res.status(400).json({ error: 'You cannot send a swap request to yourself' });
  }
  if (!skillOffered || !skillWanted) {
    return res.status(400).json({ error: 'Both offered and wanted skills must be specified' });
  }

  const db = loadDB();

  // Prevent duplicate active pending swaps between same two users
  const duplicate = db.swaps.find(s => 
    ((s.senderId === senderId && s.receiverId === receiverId) || (s.senderId === receiverId && s.receiverId === senderId)) &&
    (s.status === 'pending' || s.status === 'accepted' || s.status === 'scheduled')
  );
  if (duplicate) {
    return res.status(400).json({ error: 'An active swap request or session already exists with this user' });
  }

  const sender = db.users.find(u => u.id === senderId);
  const newSwap = {
    id: 'swap_' + Date.now(),
    senderId,
    receiverId,
    skillOffered: skillOffered.trim(),
    skillWanted: skillWanted.trim(),
    note: note ? note.trim() : 'Let’s swap skills and learn together!',
    status: 'pending', // pending, accepted, scheduled, completed, rejected, cancelled
    sessionDate: '',
    sessionTime: '',
    sessionDuration: 30, // in minutes
    meetingLink: '',
    agenda: [
      { id: 'ag_1', title: `Learn ${skillWanted}`, duration: 15 },
      { id: 'ag_2', title: `Teach ${skillOffered}`, duration: 15 }
    ],
    agendaConfirmed: false,
    confirmedBy: [],
    createdAt: new Date().toISOString()
  };

  db.swaps.push(newSwap);

  db.notifications.push({
    id: 'notif_' + Date.now(),
    userId: receiverId,
    type: 'swap_request',
    title: 'New Skill Swap Request! 🤝',
    message: `${sender ? sender.name : 'A peer'} wants to swap: ${skillOffered} for ${skillWanted}`,
    read: false,
    link: 'swaps',
    relatedId: newSwap.id,
    time: 'Just now'
  });

  saveDB(db);
  res.status(201).json({ message: 'Swap request created', swap: newSwap });
});

// Get Swaps for a User
app.get('/api/swaps/:userId', (req, res) => {
  const { userId } = req.params;
  const db = loadDB();

  const userSwaps = db.swaps.filter(s => s.senderId === userId || s.receiverId === userId);

  const detailed = userSwaps.map(swap => {
    const isSender = swap.senderId === userId;
    const partnerId = isSender ? swap.receiverId : swap.senderId;
    const partner = db.users.find(u => u.id === partnerId);

    const isContactRevealed = swap.status === 'accepted' || swap.status === 'scheduled' || swap.status === 'completed';

    return {
      ...swap,
      isSender,
      partner: partner ? {
        id: partner.id,
        name: partner.name,
        faculty: partner.faculty,
        age: partner.age || null,
        rating: partner.rating || 0.0,
        reviewsCount: partner.reviewsCount || 0,
        email: isContactRevealed ? partner.email : '🔒 Visible after acceptance'
      } : null
    };
  });

  res.json(detailed);
});

// Update Swap Status (Accept, Reject, Cancel)
app.put('/api/swaps/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, userId } = req.body;

  const validStatuses = ['accepted', 'rejected', 'cancelled', 'scheduled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = loadDB();
  const swapIndex = db.swaps.findIndex(s => s.id === id);
  if (swapIndex === -1) return res.status(404).json({ error: 'Swap not found' });

  const swap = db.swaps[swapIndex];

  if (userId && swap.senderId !== userId && swap.receiverId !== userId) {
    return res.status(403).json({ error: 'Unauthorized to modify this swap' });
  }

  swap.status = status;

  if (status === 'accepted') {
    db.notifications.push({
      id: 'notif_' + Date.now(),
      userId: swap.senderId,
      type: 'swap_accepted',
      title: 'Swap Request Accepted! 🎉',
      message: 'Your partner accepted your skill swap. Propose a schedule and agenda now!',
      read: false,
      link: 'swaps',
      relatedId: swap.id,
      time: 'Just now'
    });
  }

  saveDB(db);
  res.json({ message: `Swap status updated to ${status}`, swap });
});

// Update Schedule for Accepted Swap
app.put('/api/swaps/:id/schedule', (req, res) => {
  const { id } = req.params;
  const { sessionDate, sessionTime, sessionDuration, meetingLink, userId } = req.body;

  const db = loadDB();
  const swapIndex = db.swaps.findIndex(s => s.id === id);
  if (swapIndex === -1) return res.status(404).json({ error: 'Swap not found' });

  const swap = db.swaps[swapIndex];
  if (userId && swap.senderId !== userId && swap.receiverId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (sessionDate) swap.sessionDate = sessionDate;
  if (sessionTime) swap.sessionTime = sessionTime;
  if (sessionDuration) {
    const numDuration = Number(sessionDuration);
    if (numDuration > 0) {
      swap.sessionDuration = numDuration;
    }
  }

  if (meetingLink !== undefined && meetingLink.trim() !== '') {
    const trimmed = meetingLink.trim();
    // Validate meeting URL: require valid URL, reject fake placeholder strings
    const isValidUrl = /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed);
    if (!isValidUrl || trimmed.includes('xyz-swap-demo') || trimmed.includes('placeholder')) {
      return res.status(400).json({ error: 'Please provide a valid, real meeting URL (e.g. https://meet.google.com/xxx-yyyy-zzz).' });
    }
    swap.meetingLink = trimmed;
  }

  swap.status = 'scheduled';

  // Notify other party
  const otherUserId = swap.senderId === userId ? swap.receiverId : swap.senderId;
  db.notifications.push({
    id: 'notif_' + Date.now(),
    userId: otherUserId,
    type: 'session_scheduled',
    title: 'Swap Session Scheduled! 📅',
    message: `Session agreed for ${swap.sessionDate} at ${swap.sessionTime}. Check meeting details.`,
    read: false,
    link: 'swaps',
    relatedId: swap.id,
    time: 'Just now'
  });

  saveDB(db);
  res.json({ message: 'Session schedule updated successfully', swap });
});

// Google Meet Integration Helper Endpoint
app.post('/api/swaps/:id/google-meet', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const swap = db.swaps.find(s => s.id === id);
  if (!swap) return res.status(404).json({ error: 'Swap not found' });

  // Inspect environment for genuine Google Calendar OAuth credentials
  const hasGoogleCreds = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

  if (!hasGoogleCreds) {
    return res.json({
      configured: false,
      helperUrl: 'https://meet.google.com/new',
      message: 'Google Cloud Calendar API credentials are not set in the server environment (.env). You can instantly launch Google Meet directly via https://meet.google.com/new, create your room, and paste your meeting link.'
    });
  }

  // If real credentials existed, Google Calendar API would be invoked here.
  res.json({ configured: true });
});

// Update & Validate Session Agenda (Strict Meeting Duration Constraint)
app.put('/api/swaps/:id/agenda', (req, res) => {
  const { id } = req.params;
  const { agenda, userId, confirmAgenda } = req.body;

  const db = loadDB();
  const swapIndex = db.swaps.findIndex(s => s.id === id);
  if (swapIndex === -1) return res.status(404).json({ error: 'Swap not found' });

  const swap = db.swaps[swapIndex];
  if (userId && swap.senderId !== userId && swap.receiverId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (Array.isArray(agenda)) {
    const totalDuration = agenda.reduce((sum, item) => sum + (Number(item.duration) || 0), 0);
    const targetDuration = Number(swap.sessionDuration) || 30;

    // If confirmation is requested, enforce strict equality
    if (confirmAgenda) {
      if (totalDuration !== targetDuration) {
        return res.status(400).json({
          error: `Total agenda duration (${totalDuration} min) must exactly match the meeting duration of ${targetDuration} minutes before confirmation.`
        });
      }
      swap.agendaConfirmed = true;
    } else {
      swap.agendaConfirmed = (totalDuration === targetDuration);
    }

    swap.agenda = agenda;
  }

  saveDB(db);
  res.json({ message: 'Agenda updated successfully', swap });
});

// Confirm Session Completion
app.put('/api/swaps/:id/complete', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const db = loadDB();
  const swapIndex = db.swaps.findIndex(s => s.id === id);
  if (swapIndex === -1) return res.status(404).json({ error: 'Swap not found' });

  const swap = db.swaps[swapIndex];
  if (swap.senderId !== userId && swap.receiverId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!swap.confirmedBy) swap.confirmedBy = [];
  if (!swap.confirmedBy.includes(userId)) {
    swap.confirmedBy.push(userId);
  }

  // If both participants confirmed, mark status as completed
  if (swap.confirmedBy.includes(swap.senderId) && swap.confirmedBy.includes(swap.receiverId)) {
    swap.status = 'completed';

    // Notify both to leave reviews
    [swap.senderId, swap.receiverId].forEach(uId => {
      db.notifications.push({
        id: 'notif_' + Date.now() + Math.random(),
        userId: uId,
        type: 'swap_completed',
        title: 'Session Completed! ⭐',
        message: 'Your swap session was marked as completed. Please leave a review for your partner!',
        read: false,
        link: 'reviews',
        relatedId: swap.id,
        time: 'Just now'
      });
    });
  }

  saveDB(db);
  res.json({ 
    message: swap.status === 'completed' ? 'Swap marked as fully completed!' : 'Your completion is confirmed. Waiting for partner confirmation.', 
    swap 
  });
});

// ======================= REVIEWS & RATINGS =======================

// Submit a Review (Recalculates actual average rating across all valid reviews)
app.post('/api/reviews', (req, res) => {
  const { swapId, reviewerId, revieweeId, rating, comment } = req.body;

  if (!swapId || !reviewerId || !revieweeId || rating === undefined) {
    return res.status(400).json({ error: 'Swap ID, reviewer, reviewee, and rating are required' });
  }
  if (reviewerId === revieweeId) {
    return res.status(400).json({ error: 'You cannot review yourself' });
  }

  const numRating = Number(rating);
  if (numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  const db = loadDB();

  // Validate swap completion
  const swap = db.swaps.find(s => s.id === swapId);
  if (!swap || swap.status !== 'completed') {
    return res.status(400).json({ error: 'Reviews can only be submitted after the swap is completed' });
  }

  // Validate participants belong to swap
  if ((swap.senderId !== reviewerId && swap.receiverId !== reviewerId) ||
      (swap.senderId !== revieweeId && swap.receiverId !== revieweeId)) {
    return res.status(403).json({ error: 'Reviewer or reviewee is not a participant in this swap' });
  }

  // Prevent duplicate review for same swap by same reviewer
  const duplicate = db.reviews.find(r => r.swapId === swapId && r.reviewerId === reviewerId);
  if (duplicate) {
    return res.status(400).json({ error: 'You have already submitted a review for this session' });
  }

  const reviewer = db.users.find(u => u.id === reviewerId);
  const revieweeIndex = db.users.findIndex(u => u.id === revieweeId);
  if (revieweeIndex === -1) return res.status(404).json({ error: 'Reviewee not found' });

  const newReview = {
    id: 'rev_' + Date.now(),
    swapId,
    reviewerId,
    reviewerName: reviewer ? reviewer.name : 'A Member',
    revieweeId,
    rating: numRating,
    comment: comment ? comment.trim() : 'Great skill swap session!',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  db.reviews.push(newReview);

  // Recalculate reviewee average rating from all valid reviews
  const validReviews = db.reviews.filter(r => r.revieweeId === revieweeId);
  const totalScore = validReviews.reduce((sum, r) => sum + Number(r.rating), 0);
  const avg = validReviews.length > 0 ? Number((totalScore / validReviews.length).toFixed(1)) : 0.0;

  db.users[revieweeIndex].rating = avg;
  db.users[revieweeIndex].reviewsCount = validReviews.length;

  // Send notification to reviewee
  db.notifications.push({
    id: 'notif_' + Date.now(),
    userId: revieweeId,
    type: 'review_received',
    title: 'New Review Received! ⭐',
    message: `${newReview.reviewerName} rated you ${numRating}/5: "${newReview.comment}"`,
    read: false,
    link: 'reviews',
    relatedId: newReview.id,
    time: 'Just now'
  });

  saveDB(db);
  res.status(201).json({
    message: 'Review submitted successfully',
    review: newReview,
    newRating: avg,
    reviewsCount: validReviews.length
  });
});

// Get Reviews for a User
app.get('/api/reviews/:userId', (req, res) => {
  const { userId } = req.params;
  const db = loadDB();
  const userReviews = db.reviews.filter(r => r.revieweeId === userId).reverse();
  res.json(userReviews);
});

// ======================= MESSAGES & ATTACHMENTS =======================

// Upload chat attachment (PDF, Images, Educational Videos)
app.post('/api/messages/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or file format rejected' });
  }

  const fileUrl = `/uploads/materials/${req.file.filename}`;
  res.json({
    attachmentId: 'att_' + Date.now(),
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileType: req.file.mimetype || path.extname(req.file.originalname).replace('.', ''),
    fileSize: req.file.size,
    url: fileUrl
  });
});

// Get all messages for user
app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const db = loadDB();
  const userMessages = db.messages.filter(m => m.senderId === userId || m.receiverId === userId);
  res.json(userMessages);
});

// Send a message (Supports text and/or file attachments / video links)
app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, text, attachment } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'Sender and receiver are required' });
  
  if ((!text || !text.trim()) && !attachment) {
    return res.status(400).json({ error: 'Message text or attachment is required' });
  }

  const db = loadDB();
  const sender = db.users.find(u => u.id === senderId);

  const newMsg = {
    id: 'msg_' + Date.now(),
    senderId,
    senderName: sender ? sender.name : 'Partner',
    receiverId,
    text: text ? text.trim() : '',
    attachment: attachment || null,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMsg);

  // Send notification to recipient
  const previewText = attachment ? `[Attachment: ${attachment.originalName || 'File'}] ${newMsg.text}` : newMsg.text;
  db.notifications.push({
    id: 'notif_' + Date.now(),
    userId: receiverId,
    type: 'message',
    title: `New message from ${sender ? sender.name : 'Partner'} 💬`,
    message: previewText.length > 55 ? previewText.slice(0, 55) + '...' : previewText,
    read: false,
    link: 'messages',
    relatedId: senderId,
    time: 'Just now'
  });

  saveDB(db);
  res.status(201).json(newMsg);
});

// ======================= NOTIFICATIONS =======================

app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const db = loadDB();
  const list = db.notifications.filter(n => n.userId === userId).reverse();
  res.json(list);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const notif = db.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveDB(db);
  }
  res.json({ ok: true });
});

app.put('/api/notifications/read-all/:userId', (req, res) => {
  const { userId } = req.params;
  const db = loadDB();
  db.notifications.forEach(n => {
    if (n.userId === userId) {
      n.read = true;
    }
  });
  saveDB(db);
  res.json({ ok: true });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Skill Swap Architecture Server running on http://localhost:${PORT}`);
  console.log(`📁 Attachments stored in: ${UPLOAD_DIR}`);
  console.log(`===============================================`);
});