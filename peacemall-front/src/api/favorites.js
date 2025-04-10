import request from '@/utils/request'

/**
 * 获取用户收藏列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise} - 返回收藏列表的Promise
 */
export function getUserFavorites(page = 1, pageSize = 20) {
  return request({
    url: `/favorites/list?page=${page}&pageSize=${pageSize}`,
    method: 'get'
  })
}

/**
 * 添加商品到收藏
 * @param {string} productId - 商品ID
 * @returns {Promise} - 返回添加收藏操作的Promise
 */
export function addToFavorites(productId) {
  return request({
    url: `/favorites/add/${productId}`,
    method: 'post'
  })
}

/**
 * 从收藏中删除商品
 * @param {string} favoriteId - 收藏ID
 * @returns {Promise} - 返回删除收藏操作的Promise
 */
export function removeFromFavorites(favoriteId) {
  return request({
    url: `/favorites/delete/${favoriteId}`,
    method: 'delete'
  })
}

/**
 * 检查商品是否已收藏
 * @param {string} productId - 商品ID
 * @returns {Promise} - 返回检查结果的Promise
 */
export function checkIsFavorite(productId) {
  return request({
    url: `/favorites/check/${productId}`,
    method: 'get'
  })
} 