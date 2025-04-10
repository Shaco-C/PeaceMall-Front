import request from '@/utils/request'

/**
 * 获取购物车商品列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise} - 返回购物车商品的Promise
 */
export function getCartItems(page = 1, pageSize = 20) {
  return request({
    url: '/cartItem/showCartItems',
    method: 'get',
    params: {
      page,
      pageSize
    }
  })
}

/**
 * 批量删除购物车商品
 * @param {Array<string|number>} cartItemIds - 购物车商品ID数组
 * @returns {Promise} - 返回删除结果的Promise
 */
export function deleteCartItems(cartItemIds) {
  return request({
    url: '/cartItem/deleteProductFromCartBatch',
    method: 'delete',
    data: cartItemIds
  })
}

/**
 * 将商品加入购物车
 * @param {Object} cartItemDTO - 购物车商品数据
 * @param {string|number} cartItemDTO.productId - 商品ID
 * @param {string|number} cartItemDTO.configId - 商品配置ID
 * @param {number} cartItemDTO.quantity - 商品数量
 * @returns {Promise} - 返回添加结果的Promise
 */
export function addToCart(cartItemDTO) {
  return request({
    url: '/cartItem/addProductToCart',
    method: 'post',
    data: cartItemDTO
  })
}

/**
 * 更新购物车商品数量
 * @param {Array<Object>} cartItemDTOList - 购物车商品数据列表
 * @returns {Promise} - 返回更新结果的Promise
 */
export function updateCartItemQuantity(cartItemDTOList) {
  return request({
    url: '/cartItem/updateProductQuantity',
    method: 'put',
    data: cartItemDTOList
  })
} 