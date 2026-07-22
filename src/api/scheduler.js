import request from '@/utils/request'

export const listSchedulerJobs = (params) => request.get('/scheduler/jobs', { params })
export const getSchedulerJob = (jobId) => request.get(`/scheduler/jobs/${jobId}`)
export const createSchedulerJob = (data) => request.post('/scheduler/jobs', data)
export const updateSchedulerJob = (jobId, data) => request.put(`/scheduler/jobs/${jobId}`, data)
export const pauseSchedulerJob = (jobId) => request.post(`/scheduler/jobs/${jobId}/pause`)
export const resumeSchedulerJob = (jobId) => request.post(`/scheduler/jobs/${jobId}/resume`)
export const runSchedulerJobNow = (jobId) => request.post(`/scheduler/jobs/${jobId}/run-now`)
export const deleteSchedulerJob = (jobId) => request.delete(`/scheduler/jobs/${jobId}`)
export const previewSchedulerCron = (params) => request.get('/scheduler/cron/preview', { params })
export const listSchedulerExecutions = (params) => request.get('/scheduler/executions', { params })
