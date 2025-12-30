import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  banUser,
  unbanUser,
  deleteUser,
  getAllPosts,
  deleteAnyPost,
  getRecentActivity
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/auth.js';
import { paginationValidator } from '../utils/validators.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/activity', getRecentActivity);

// User management
router.get('/users', paginationValidator, getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);
router.delete('/users/:id', deleteUser);

// Post management
router.get('/posts', paginationValidator, getAllPosts);
router.delete('/posts/:id', deleteAnyPost);

export default router;
