# 📱 Social Media App - MERN Stack

## Complete Project Folder Structure

```
social-media-app/
│
├── 📁 backend/
│   │
│   ├── 📁 config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── socket.js                # Socket.IO configuration
│   │
│   ├── 📁 controllers/
│   │   ├── authController.js        # Login, Signup, JWT
│   │   ├── userController.js        # Profile, Follow/Unfollow
│   │   ├── postController.js        # Create, Like, Comment, Share
│   │   ├── storyController.js       # Upload, View, Auto-delete
│   │   ├── messageController.js     # Send, Receive messages
│   │   └── notificationController.js # Get, Mark as read
│   │
│   ├── 📁 models/
│   │   ├── User.js                  # User schema (Creator/Consumer)
│   │   ├── Post.js                  # Post schema with likes/comments
│   │   ├── Story.js                 # Story schema with TTL index
│   │   ├── Message.js               # Message schema
│   │   ├── Conversation.js          # Conversation schema
│   │   └── Notification.js          # Notification schema
│   │
│   ├── 📁 routes/
│   │   ├── authRoutes.js            # /api/auth/*
│   │   ├── userRoutes.js            # /api/users/*
│   │   ├── postRoutes.js            # /api/posts/*
│   │   ├── storyRoutes.js           # /api/stories/*
│   │   ├── messageRoutes.js         # /api/messages/*
│   │   └── notificationRoutes.js    # /api/notifications/*
│   │
│   ├── 📁 middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── roleMiddleware.js        # Creator/Consumer check
│   │   └── uploadMiddleware.js      # Multer for image uploads
│   │
│   ├── 📁 utils/
│   │   ├── generateToken.js         # JWT token generator
│   │   └── socketHandlers.js        # Socket event handlers
│   │
│   ├── 📁 uploads/
│   │   ├── 📁 profiles/             # Profile images
│   │   ├── 📁 posts/                # Post images
│   │   └── 📁 stories/              # Story images
│   │
│   ├── server.js                    # Express + Socket.IO entry
│   ├── package.json
│   └── .env                         # Environment variables
│
├── 📁 frontend/
│   │
│   ├── 📁 public/
│   │   └── index.html               # React mount point ONLY
│   │
│   ├── 📁 src/
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── 📁 common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── Loader.jsx
│   │   │   │
│   │   │   ├── 📁 posts/
│   │   │   │   ├── PostCard.jsx
│   │   │   │   ├── PostForm.jsx
│   │   │   │   ├── CommentList.jsx
│   │   │   │   ├── CommentForm.jsx
│   │   │   │   └── LikeButton.jsx
│   │   │   │
│   │   │   ├── 📁 stories/
│   │   │   │   ├── StoryBar.jsx
│   │   │   │   ├── StoryCard.jsx
│   │   │   │   ├── StoryViewer.jsx
│   │   │   │   └── StoryUpload.jsx
│   │   │   │
│   │   │   ├── 📁 messages/
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   ├── MessageBubble.jsx
│   │   │   │   ├── ConversationList.jsx
│   │   │   │   └── SharePostModal.jsx
│   │   │   │
│   │   │   ├── 📁 notifications/
│   │   │   │   ├── NotificationBell.jsx
│   │   │   │   └── NotificationItem.jsx
│   │   │   │
│   │   │   ├── 📁 profile/
│   │   │   │   ├── ProfileHeader.jsx
│   │   │   │   ├── ProfileEdit.jsx
│   │   │   │   ├── FollowersList.jsx
│   │   │   │   └── FollowingList.jsx
│   │   │   │
│   │   │   └── 📁 follow/
│   │   │       ├── FollowButton.jsx
│   │   │       └── UserSuggestions.jsx
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Feed.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Explore.jsx
│   │   │   └── NotFound.jsx
│   │   │
│   │   ├── 📁 context/
│   │   │   ├── AuthContext.jsx      # User auth state
│   │   │   ├── SocketContext.jsx    # Socket.IO connection
│   │   │   └── NotificationContext.jsx # Real-time notifications
│   │   │
│   │   ├── 📁 hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useSocket.js
│   │   │   └── useNotifications.js
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── api.js               # Axios instance
│   │   │   ├── authService.js       # Auth API calls
│   │   │   ├── userService.js       # User API calls
│   │   │   ├── postService.js       # Post API calls
│   │   │   ├── storyService.js      # Story API calls
│   │   │   ├── messageService.js    # Message API calls
│   │   │   └── notificationService.js
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── constants.js
│   │   │   ├── helpers.js
│   │   │   └── validators.js
│   │   │
│   │   ├── App.jsx                  # Main app with routing
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Global styles (Tailwind)
│   │
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 📂 Folder Explanations

### Backend Structure

| Folder/File | Purpose |
|------------|---------|
| `config/` | Database connection and Socket.IO setup |
| `controllers/` | Business logic for each feature (MVC pattern) |
| `models/` | Mongoose schemas for MongoDB collections |
| `routes/` | API endpoint definitions |
| `middleware/` | JWT auth, role checks, file uploads |
| `utils/` | Helper functions and socket handlers |
| `uploads/` | Stored images (profiles, posts, stories) |
| `server.js` | Main entry - Express + Socket.IO |

### Frontend Structure

| Folder/File | Purpose |
|------------|---------|
| `components/` | Reusable UI components organized by feature |
| `pages/` | Full page components for routing |
| `context/` | React Context for global state (Auth, Socket, Notifications) |
| `hooks/` | Custom React hooks |
| `services/` | API service files (Axios calls) |
| `utils/` | Constants, helpers, validators |
| `App.jsx` | Main routing and layout |
| `main.jsx` | React DOM render entry |

---

## 🔐 User Roles

### Creator
- ✅ Create posts (image + caption)
- ✅ Like, comment, share posts
- ✅ Follow/unfollow users
- ✅ Real-time messaging
- ✅ Upload stories (24h auto-delete)
- ✅ Edit profile (bio + image)
- ✅ Real-time notifications

### Consumer
- ❌ Cannot create posts
- ✅ Like, comment, share posts
- ✅ Follow/unfollow users
- ✅ Real-time messaging
- ✅ Upload stories (24h auto-delete)
- ✅ Edit profile (bio + image)
- ✅ Real-time notifications

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State | Context API |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Real-time | Socket.IO |
| File Upload | Multer |
| Image Storage | Local (can extend to Cloudinary) |

---

## 📡 API Endpoints Preview

```
AUTH
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

USERS
GET    /api/users/:id
PUT    /api/users/profile
POST   /api/users/follow/:id
DELETE /api/users/unfollow/:id
GET    /api/users/:id/followers
GET    /api/users/:id/following
GET    /api/users/suggestions

POSTS
GET    /api/posts/feed
POST   /api/posts
GET    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
POST   /api/posts/:id/comment
POST   /api/posts/:id/share

STORIES
GET    /api/stories
POST   /api/stories
DELETE /api/stories/:id

MESSAGES
GET    /api/messages/conversations
GET    /api/messages/:conversationId
POST   /api/messages

NOTIFICATIONS
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all
```

---

## 🔌 Socket.IO Events

```
CLIENT → SERVER
- join_room
- send_message
- typing
- stop_typing

SERVER → CLIENT
- receive_message
- new_notification
- user_typing
- user_online
- user_offline
```

---

## 📋 Next Steps

After you confirm, I will proceed with:

**STEP 2:** Backend setup
- server.js with Express + Socket.IO
- MongoDB connection (config/db.js)
- User model with roles
- Environment configuration
