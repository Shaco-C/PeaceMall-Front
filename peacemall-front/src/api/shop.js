import request from '@/utils/request'

// 根据商家ID获取商家页面信息
export function getShopPageInfoByShopId(shopId, page = 1, pageSize = 20) {
  // 确保shopId是字符串类型
  shopId = String(shopId)
  
  return request({
    url: '/shops/getShopPageInfoByShopId',
    method: 'get',
    params: {
      shopId,
      page,
      pageSize
    }
  })
} 