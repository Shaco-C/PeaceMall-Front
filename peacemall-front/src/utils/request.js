import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // 使用代理解决跨域问题
  timeout: 5000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 可以在这里设置请求头等信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['authorization'] = token
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    return res
  },
  error => {
    console.log('错误响应：' + error)
    return Promise.reject(error)
  }
)

export default service 