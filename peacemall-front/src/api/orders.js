import request from '@/utils/request'

/**
 * 获取用户订单历史列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise} - 返回订单历史列表的Promise
 */
export function getOrderHistoryList(page = 1, pageSize = 5) {
  return request({
    url: `/orders/getOrderHistoryList?page=${page}&pageSize=${pageSize}`,
    method: 'get'
  })
}

/**
 * 获取订单详情
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 返回订单详情的Promise
 */
export function getOrderDetails(orderId) {
  return request({
    url: `/orders/getOrderDetailsByOrderId/${orderId}`,
    method: 'get'
  })
}

/**
 * 取消订单
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 返回取消订单操作的Promise
 */
export function cancelOrder(orderId) {
  return request({
    url: `/orders/cancelOrder/${orderId}`,
    method: 'put'
  })
}

/**
 * 支付订单
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 返回支付订单操作的Promise
 */
export function payOrder(orderId) {
  return request({
    url: `/orders/payOrder/${orderId}`,
    method: 'put'
  })
}

/**
 * 创建订单
 * @param {Object} orderData - 订单数据
 * @param {string} orderData.userId - 用户ID
 * @param {Array} orderData.items - 订单商品项
 * @param {string} orderData.addressId - 地址ID
 * @returns {Promise} - 返回创建订单操作的Promise
 */
export function createOrder(orderData) {
  return request({
    url: '/orders/create',
    method: 'post',
    data: orderData
  })
}

/**
 * 申请退货
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 返回申请退货操作的Promise
 */
export function applyForReturn(orderId) {
  return request({
    url: `/orders/userApplyForReturn/${orderId}`,
    method: 'put'
  })
}

/**
 * 确认收货
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 返回确认收货操作的Promise
 */
export function confirmReceipt(orderId) {
  return request({
    url: `/orders/userConfirmReceipt/${orderId}`,
    method: 'put'
  })
} 