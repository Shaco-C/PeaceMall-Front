import request from '@/utils/request'

// 用户登录
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/user/getUserInfo',
    method: 'get'
  })
}

// 更新用户信息
export function updateUserInfo(data) {
  return request({
    url: '/user/updateUserInfo',
    method: 'put',
    data
  })
}

// 上传文件到阿里云OSS
// 返回格式: {code: 200, msg: "OK", data: "https://example.com/avatar.jpg"}
// 其中data字段直接是URL字符串
export function uploadFileToAliOSS(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/file/uploadToAliOSS/single',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 修改密码
export function updatePassword(currentPassword, newPassword) {
  return request({
    url: '/user/updatePassword',
    method: 'put',
    data: {
      currentInfo: currentPassword,
      newInfo: newPassword
    }
  })
}

// 修改手机号
export function updatePhoneNumber(currentPassword, newPhone) {
  return request({
    url: '/user/updatePhoneNumber',
    method: 'put',
    data: {
      currentInfo: currentPassword,
      newInfo: newPhone
    }
  })
}

// 注销账号
export function closeAccount(password) {
  return request({
    url: '/user/closeAccount',
    method: 'put',
    data: {
      currentInfo: password
    }
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/user/logout',
    method: 'post'
  })
}

// 修改邮箱
export function updateEmail(currentPassword, newEmail) {
  return request({
    url: '/user/updateEmail',
    method: 'put',
    data: {
      currentInfo: currentPassword,
      newInfo: newEmail
    }
  })
}

/**
 * 用户申请成为商家
 * @param {object} merchantData - 商家申请数据
 * @param {string} merchantData.shopName - 商店名称
 * @param {string} merchantData.shopAvatarUrl - 商店头像URL
 * @param {string} merchantData.shopDescription - 商店描述
 * @returns {Promise} - 返回申请结果的Promise
 */
export function applyBecomeMerchant(merchantData) {
  return request({
    url: '/merchant-applications/userCreateMerchantApplication',
    method: 'post',
    data: merchantData
  })
}

/**
 * 获取用户商家申请记录
 * @returns {Promise} - 返回申请记录的Promise
 */
export function getMerchantApplications() {
  return request({
    url: '/merchant-applications/userGetMerchantApplication',
    method: 'get'
  })
}

/**
 * 取消商家申请
 * @param {string} applicationId - 申请ID
 * @returns {Promise} - 返回取消结果的Promise
 */
export function cancelMerchantApplication(applicationId) {
  return request({
    url: `/merchant-applications/userCancelMerchantApplication?applicationId=${applicationId}`,
    method: 'put'
  })
} 