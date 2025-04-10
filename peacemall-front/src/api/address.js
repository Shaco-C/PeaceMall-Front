import request from '@/utils/request'

// 获取用户地址列表
export function getUserAddresses() {
  return request({
    url: '/addresses/list',
    method: 'get'
  })
}

// 添加用户地址
export function addUserAddress(addressData) {
  return request({
    url: '/addresses/add',
    method: 'post',
    data: addressData
  })
}

// 更新用户地址
export function updateUserAddress(addressData) {
  // 确保addressId是字符串类型
  if (addressData.addressId !== null && addressData.addressId !== undefined) {
    addressData.addressId = String(addressData.addressId)
  }
  
  return request({
    url: '/addresses/update',
    method: 'put',
    data: addressData
  })
}

// 设置默认地址
export function setDefaultAddress(addressId) {
  // 确保addressId是字符串类型
  addressId = String(addressId)
  
  return request({
    url: `/addresses/setDefaultAddress/${addressId}`,
    method: 'put'
  })
}

// 删除地址(批量)
export function deleteAddresses(addressIds) {
  // 确保所有ID都是字符串类型
  const stringIds = addressIds.map(id => String(id))
  
  return request({
    url: '/addresses/delete',
    method: 'put',
    data: {
      idsList: stringIds
    }
  })
} 