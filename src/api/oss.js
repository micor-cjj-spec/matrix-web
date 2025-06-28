import request from '@/utils/request'

// Upload a file to Aliyun OSS and return the file URL
export async function uploadToOss(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await request.post('/oss/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  // `request` interceptor returns response.data
  return res.url || res.data?.url || ''
}
