# PixelSphere Backend

A robust Node.js + Express + MongoDB backend for the PixelSphere social media platform.

## 🚀 Features

- **Authentication**: JWT-based auth with signup, login, logout
- **User Management**: Profiles, follow/unfollow, search, suggestions
- **Posts**: Create, like, comment, share, save posts
- **Stories**: 24-hour stories with views, likes, replies, highlights
- **Real-time Messaging**: Socket.IO powered chat with typing indicators
- **Notifications**: Real-time notifications for likes, comments, follows
- **Admin Dashboard**: User management, stats, content moderation
- **Image Upload**: Cloudinary integration for media storage

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js                 # MongoDB connection
│   └── cloudinary.js         # Cloudinary configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User operations
│   ├── postController.js     # Post CRUD operations
│   ├── messageController.js  # Messaging logic
│   ├── storyController.js    # Story operations
│   └── adminController.js    # Admin operations
├── middleware/
│   ├── auth.js               # JWT verification
│   ├── errorHandler.js       # Error handling
│   └── upload.js             # Multer configuration
├── models/
│   ├── User.js               # User schema
│   ├── Post.js               # Post schema
│   ├── Message.js            # Message schema
│   ├── Story.js              # Story schema
│   └── Notification.js       # Notification schema
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── postRoutes.js
│   ├── messageRoutes.js
│   ├── storyRoutes.js
│   └── adminRoutes.js
├── sockets/
│   └── socket.js             # Socket.IO logic
├── utils/
│   ├── generateToken.js      # JWT utilities
│   └── validators.js         # Input validation
├── .env.example
├── package.json
└── server.js                 # Entry point
```

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📝 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |
| PUT | `/api/auth/change-password` | Change password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/:username` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/avatar` | Update avatar |
| POST | `/api/users/:id/follow` | Follow user |
| DELETE | `/api/users/:id/follow` | Unfollow user |
| GET | `/api/users/:username/followers` | Get followers |
| GET | `/api/users/:username/following` | Get following |
| GET | `/api/users/me/suggestions` | Get suggestions |
| GET | `/api/users/me/notifications` | Get notifications |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post (Creator only) |
| GET | `/api/posts/feed/me` | Get feed |
| GET | `/api/posts/explore` | Get explore posts |
| GET | `/api/posts/:id` | Get single post |
| GET | `/api/posts/user/:username` | Get user's posts |
| POST | `/api/posts/:id/like` | Like/unlike post |
| POST | `/api/posts/:id/save` | Save/unsave post |
| POST | `/api/posts/:id/comments` | Add comment |
| DELETE | `/api/posts/:id` | Delete post |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | Get all conversations |
| GET | `/api/messages/:userId` | Get messages with user |
| POST | `/api/messages/:userId` | Send message |
| PUT | `/api/messages/:userId/seen` | Mark as seen |
| DELETE | `/api/messages/:messageId` | Delete message |

### Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stories` | Create story (Creator only) |
| GET | `/api/stories/feed` | Get story feed |
| GET | `/api/stories/user/:username` | Get user stories |
| POST | `/api/stories/:id/view` | View story |
| POST | `/api/stories/:id/like` | Like story |
| DELETE | `/api/stories/:id` | Delete story |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | Get all users |
| PUT | `/api/admin/users/:id/ban` | Ban user |
| PUT | `/api/admin/users/:id/unban` | Unban user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/posts` | Get all posts |
| DELETE | `/api/admin/posts/:id` | Delete any post |

## 🔌 Socket.IO Events

### Client to Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `conversationId` | Join chat room |
| `leave_conversation` | `conversationId` | Leave chat room |
| `typing_start` | `{ conversationId, receiverId }` | Start typing |
| `typing_stop` | `{ conversationId, receiverId }` | Stop typing |
| `message_seen` | `{ conversationId, senderId }` | Mark as seen |
| `get_online_users` | `[userIds]` | Check online status |

### Server to Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `message` | New message received |
| `message_delivered` | `{ messageId }` | Message delivered |
| `messages_seen` | `{ conversationId, seenBy }` | Messages seen |
| `user_typing` | `{ conversationId, user }` | User is typing |
| `user_stopped_typing` | `{ conversationId, userId }` | User stopped typing |
| `notification` | `notification` | New notification |
| `user_status_change` | `{ userId, isOnline }` | Online status change |

## 👥 User Roles

- **Consumer**: Can browse, like, comment, follow, message
- **Creator**: All consumer abilities + can create posts/stories
- **Admin**: All abilities + admin dashboard access

## 🔐 Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

## 🚀 Deployment

### Azure App Service

1. Create Azure App Service
2. Configure environment variables in Application Settings
3. Deploy via GitHub Actions or Azure CLI

```bash
az webapp up --name pixelsphere-api --resource-group myResourceGroup
```

## 📄 License

MIT License
