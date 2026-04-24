import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (data) => API.post('/auth/reset-password', data);
export const verifyEmail = (data) => API.post('/auth/verify-email', data);
export const updateProfile = (data) => API.put('/auth/profile', data);
export const deleteAccount = (data) => API.delete('/auth/account', { data });
export const requestEmailChange = (data) => API.post('/auth/email-change/request', data);
export const confirmEmailChange = (data) => API.post('/auth/email-change/confirm', data);

// ─────────────────────────────────────────────
// GROUPS
// ─────────────────────────────────────────────
export const createGroup = (data) => API.post('/groups/create', data);
export const joinGroup = (inviteCode) => API.post('/groups/join', { inviteCode });
export const getMyGroups = () => API.get('/groups/my');
export const getGroup = (groupId) => API.get(`/groups/${groupId}`);
export const inviteByEmail = (groupId, email) => API.post(`/groups/${groupId}/invite-email`, { email });
export const leaveGroup = (groupId) => API.post(`/groups/${groupId}/leave`);
export const removeMember = (groupId, memberId) => API.delete(`/groups/${groupId}/members/${memberId}`);
export const deleteGroup = (groupId) => API.delete(`/groups/${groupId}`);
export const regenerateCode = (groupId) => API.post(`/groups/${groupId}/regenerate-code`);
export const getGroupDetail = (groupId) => API.get(`/groups/${groupId}/detail`);
export const getGroupActivities = (groupId) => API.get(`/groups/${groupId}/activities`); // ← NEW

// ─────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────
export const createGroupTask = (data) => API.post('/tasks/group', data);
export const createPersonalTask = (data) => API.post('/tasks/personal', data);
export const updateTaskStatus = (taskId, status) => API.patch(`/tasks/${taskId}/status`, { status });
export const editTask = (taskId, data) => API.put(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => API.delete(`/tasks/${taskId}`);
export const getMyTasks = () => API.get('/tasks/my');
export const getMyPersonalTasks = () => API.get('/tasks/my/personal');
export const getMyTasksByStatus = (status) => API.get(`/tasks/my/status/${status}`);
export const getGroupTasks = (groupId) => API.get(`/tasks/group/${groupId}`);
export const getGroupTasksByStatus = (groupId, status) => API.get(`/tasks/group/${groupId}/status/${status}`);
export const claimTask = (taskId) => API.post(`/tasks/${taskId}/claim`);
export const denyTask = (taskId) => API.post(`/tasks/${taskId}/deny`); // ← NEW
export const getTasksAssignedByMe = (groupId) => API.get(`/tasks/group/${groupId}/assigned-by-me`);

// ─────────────────────────────────────────────
// LOCATION
// ─────────────────────────────────────────────
export const updateLocation = (data) => API.post('/location/update', data);
export const getGroupLocations = (groupId) => API.get(`/location/group/${groupId}`);
export const getMyLocation = () => API.get('/location/me');

// ─────────────────────────────────────────────
// REWARDS
// ─────────────────────────────────────────────
export const getMyRewards = () => API.get('/rewards/my');
export const getMyCoins = () => API.get('/rewards/my/coins');
export const getGroupRewards = (groupId) => API.get(`/rewards/group/${groupId}`);
export const getLeaderboard = (groupId) => API.get(`/rewards/group/${groupId}/leaderboard`);
export const createRedeemOption = (groupId, data) => API.post(`/rewards/group/${groupId}/redeem-options`, data);
export const getRedeemOptions = (groupId) => API.get(`/rewards/group/${groupId}/redeem-options`);
export const redeemOption = (optionId) => API.post(`/rewards/redeem/${optionId}`);
export const deleteRedeemOption = (optionId) => API.delete(`/rewards/redeem-options/${optionId}`);
export const getRedeemHistory = (groupId) => API.get(`/rewards/group/${groupId}/redeem-history`);