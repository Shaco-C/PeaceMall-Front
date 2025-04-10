import request from '@/utils/request'

// 获取所有分类信息
export function getCategories() {
  return request({
    url: '/categories/getCategories',
    method: 'get'
  })
}

// 根据父分类ID获取子分类
export function getCategoriesByParentId(parentId) {
  // 确保parentId是字符串类型
  parentId = String(parentId)
  
  return request({
    url: '/categories/getCategoriesInfoByParentId',
    method: 'get',
    params: {
      parentId
    }
  })
}