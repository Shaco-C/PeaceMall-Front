import request from '@/utils/request'

// 根据分类ID获取商品（分页）
export function getProductsByCategoryId(categoryId, page = 1, pageSize = 20) {
  // 确保categoryId是字符串类型
  categoryId = String(categoryId)
  
  return request({
    url: '/products/getProductsByCategoryId',
    method: 'get',
    params: {
      categoryId,
      page,
      pageSize
    }
  })
}

// 根据商品ID获取商品详情
export function getProductDetailsById(productId) {
  // 确保productId是字符串类型
  productId = String(productId)
  
  return request({
    url: `/products/getProductDetailsById/${productId}`,
    method: 'get'
  })
}

/**
 * 商品搜索
 * @param {string} key - 搜索关键词
 * @param {number} pageNo - 页码
 * @param {number} pageSize - 每页显示数量
 * @param {boolean} isAsc - 是否升序排序，可选
 * @param {string} sortBy - 排序字段(price或sales)，可选
 * @param {string} brand - 品牌筛选，可选
 * @returns {Promise} - 返回搜索结果的Promise
 */
export function searchProducts(key, pageNo = 1, pageSize = 20, isAsc, sortBy, brand) {
  const params = {
    key,
    pageNo,
    pageSize
  }
  
  // 添加可选排序参数
  if (sortBy) {
    params.sortBy = sortBy
    params.isAsc = isAsc
  }
  
  // 添加品牌筛选
  if (brand) {
    params.brand = brand
  }
  
  return request({
    url: '/search/userInput',
    method: 'get',
    params
  })
}

/**
 * 获取搜索关键字相关的品牌列表
 * @param {string} key - 搜索关键词
 * @returns {Promise} - 返回品牌列表的Promise
 */
export function getBrandsByKey(key) {
  return request({
    url: '/search/brand',
    method: 'get',
    params: { key }
  })
}

/**
 * 获取热销商品
 * @returns {Promise} - 返回热销商品列表的Promise
 */
export function getHotSales() {
  return request({
    url: '/search/hotSales',
    method: 'get'
  })
}

/**
 * 获取无限滚动商品列表
 * @param {number} size - 每次加载的商品数量
 * @param {string} lastProductId - 上一批次最后一个商品的ID，首次加载不需要传
 * @returns {Promise} - 返回商品列表的Promise
 */
export function getInfiniteProducts(size = 18, lastProductId) {
  const params = { size }
  
  if (lastProductId) {
    params.lastProductId = lastProductId
  }
  
  return request({
    url: '/search/search_after',
    method: 'get',
    params
  })
} 