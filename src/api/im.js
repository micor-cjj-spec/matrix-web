import request from '@/utils/request'

function dataOf(response) { return response?.data ?? response }
export async function listNotifications(params = {}) { return dataOf(await request.get('/im/notifications', { params })) }
export async function getUnreadCount() { return dataOf(await request.get('/im/notifications/unread-count')) }
export async function markNotificationRead(notificationId) { return dataOf(await request.post(`/im/notifications/${notificationId}/read`)) }
export async function markAllNotificationsRead() { return dataOf(await request.post('/im/notifications/read-all')) }
export async function syncNotificationEvents(afterVersion = 0, limit = 100) { return dataOf(await request.get('/im/sync', { params: { afterVersion, limit } })) }
