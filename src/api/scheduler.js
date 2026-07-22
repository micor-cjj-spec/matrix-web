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
export const listSchedulerExecutors = () => request.get('/scheduler/executors')
export const listSchedulerExecutorHandlers = (executorCode) =>
  request.get(`/scheduler/executors/${executorCode}/handlers`)
export const listSchedulerExecutorInstances = (executorCode) =>
  request.get(`/scheduler/executors/${executorCode}/instances`)

export const getSchedulerDashboardSummary = () => request.get('/scheduler/dashboard/summary')
export const listSchedulerAlerts = (params) => request.get('/scheduler/alerts', { params })
export const acknowledgeSchedulerAlert = (alertId) => request.post(`/scheduler/alerts/${alertId}/ack`)

export const retrySchedulerExecutionNow = (executionNo, reason) =>
  request.post(`/scheduler/executions/${executionNo}/retry-now`, { reason })
export const stopSchedulerExecutionRetry = (executionNo, reason) =>
  request.post(`/scheduler/executions/${executionNo}/stop-retry`, { reason })
export const cancelSchedulerExecution = (executionNo, reason) =>
  request.post(`/scheduler/executions/${executionNo}/cancel`, { reason })
export const skipSchedulerExecution = (executionNo, reason) =>
  request.post(`/scheduler/executions/${executionNo}/skip`, { reason })
export const markSchedulerExecutionSuccess = (executionNo, reason) =>
  request.post(`/scheduler/executions/${executionNo}/mark-success`, { reason })
export const listSchedulerOperationLogs = (executionNo, params) =>
  request.get(`/scheduler/executions/${executionNo}/operation-logs`, { params })
