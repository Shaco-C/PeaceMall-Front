<template>
  <div class="shop-detail-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="back-btn" @click="goBack">
        <span>返回</span>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>店铺信息加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="fetchShopInfo" class="retry-btn">重试</button>
      <button @click="goBack" class="back-to-list-btn">返回</button>
    </div>

    <!-- 店铺详情 -->
    <div v-else-if="shop" class="shop-content">
      <!-- 店铺基本信息 -->
      <div class="shop-header-section">
        <div class="shop-header">
          <div class="shop-avatar">
            <img :src="shop.shopAvatarUrl || 'https://peacemall.oss-cn-fuzhou.aliyuncs.com/10d8389c-466b-4477-bde6-f977ead8db3e.png'" alt="店铺头像">
          </div>
          <div class="shop-info">
            <h1 class="shop-name">{{ shop.shopName }}</h1>
            <p class="shop-description">{{ shop.shopDescription }}</p>
            <div class="shop-status">
              <span class="status-label">状态:</span>
              <span class="status-value" :class="statusClass">{{ formatStatus(shop.shopStatus) }}</span>
            </div>
            <div class="shop-created">
              <span>创建于: {{ formatDate(shop.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 商品展示区域 -->
      <div class="shop-products-section">
        <div class="section-title">
          <h2>店铺商品</h2>
        </div>
        
        <div v-if="loadingProducts" class="products-loading">
          <div class="products-spinner"></div>
          <p>商品加载中...</p>
        </div>
        
        <div v-else-if="!products || products.length === 0" class="no-products">
          <p>暂无商品信息</p>
        </div>
        
        <div v-else-if="displayProducts && displayProducts.length > 0" class="products-content">
          <div class="pagination-settings">
            <div class="page-size-selector">
              <span>每页显示：</span>
              <div class="page-size-options">
                <button 
                  v-for="size in [20, 40, 60, 80]" 
                  :key="size"
                  :class="{ active: pageSize === size }"
                  @click="changePageSize(size)"
                >
                  {{ size }}
                </button>
              </div>
            </div>
          </div>
          <div class="product-list">
            <div 
              class="product-card" 
              v-for="product in displayProducts" 
              :key="product.productId"
              @click="goToProductDetail(product.productId)"
            >
              <div class="product-image">
                <img 
                  loading="lazy"
                  :src="product.imageUrl || 'https://peacemall.oss-cn-fuzhou.aliyuncs.com/10d8389c-466b-4477-bde6-f977ead8db3e.png'" 
                  :alt="product.name"
                >
              </div>
              <div class="product-info">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-brand">{{ product.brand }}</div>
                <div class="product-description">{{ product.description }}</div>
                <div class="product-price">¥{{ product.price ? product.price.toFixed(2) : '暂无价格' }}</div>
                <div class="product-sales">已售 {{ product.sales || 0 }}</div>
              </div>
            </div>
          </div>
          
          <!-- 分页控件 -->
          <div class="pagination">
            <button 
              class="pagination-btn" 
              :class="{ disabled: currentPage <= 1 }"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              上一页
            </button>
            
            <div class="pagination-info">
              第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
            </div>
            
            <button 
              class="pagination-btn" 
              :class="{ disabled: currentPage >= totalPages }"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getShopPageInfoByShopId } from '@/api/shop'

export default {
  name: 'ShopDetailPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const shop = ref(null)
    const loading = ref(true)
    const error = ref(null)
    
    // 商品相关状态
    const products = ref([])
    const loadingProducts = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalProducts = ref(0)
    const totalPages = ref(0)

    // 优化商品列表渲染
    const displayProducts = ref([])
    const loadComplete = ref(false)
    
    // 计算店铺状态的CSS类
    const statusClass = computed(() => {
      if (!shop.value) return ''
      
      switch (shop.value.shopStatus) {
        case 'NORMAL':
          return 'status-normal'
        case 'SUSPENDED':
          return 'status-suspended'
        case 'CLOSED':
          return 'status-closed'
        default:
          return ''
      }
    })
    
    // 格式化店铺状态
    const formatStatus = (status) => {
      switch (status) {
        case 'NORMAL':
          return '正常营业'
        case 'SUSPENDED':
          return '暂停营业'
        case 'CLOSED':
          return '已关闭'
        default:
          return status
      }
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    // 分批加载商品列表，优化渲染性能
    const renderProductsBatch = () => {
      if (!products.value || products.value.length === 0) {
        displayProducts.value = []
        loadComplete.value = true
        return
      }
      
      // 先显示前4个商品（或少于4个）
      const initialCount = Math.min(4, products.value.length)
      displayProducts.value = products.value.slice(0, initialCount)
      
      // 如果只有4个或更少，直接完成
      if (products.value.length <= 4) {
        loadComplete.value = true
        return
      }
      
      // 100ms后加载剩余商品
      setTimeout(() => {
        displayProducts.value = products.value
        loadComplete.value = true
      }, 100)
    }

    // 返回上一页
    const goBack = () => {
      router.back()
    }
    
    // 返回首页
    const goToHome = () => {
      router.push('/')
    }
    
    // 获取店铺信息
    const fetchShopInfo = async (page = 1) => {
      loading.value = true
      loadingProducts.value = true
      error.value = null
      
      try {
        const shopId = route.query.id
        
        if (!shopId) {
          error.value = '店铺ID不存在'
          loading.value = false
          loadingProducts.value = false
          return
        }
        
        currentPage.value = page
        
        const response = await getShopPageInfoByShopId(
          shopId, 
          currentPage.value, 
          pageSize.value
        )
        
        if (response.code === 200 && response.data) {
          shop.value = response.data
          
          // 处理商品数据
          if (response.data.productPageDTO) {
            products.value = response.data.productPageDTO.list || []
            totalProducts.value = Number(response.data.productPageDTO.total) || 0
            totalPages.value = Number(response.data.productPageDTO.pages) || 0
          } else {
            products.value = []
            totalProducts.value = 0
            totalPages.value = 0
          }
        } else {
          error.value = response.msg || '获取店铺信息失败'
        }
      } catch (error) {
        console.error('获取店铺信息出错:', error)
        error.value = '获取店铺信息失败，请稍后重试'
      } finally {
        loading.value = false
        loadingProducts.value = false
        // 更新展示的商品
        renderProductsBatch()
      }
    }
    
    // 切换页码
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return
      fetchShopInfo(page)
      
      // 页面滚动到商品区域
      setTimeout(() => {
        document.querySelector('.shop-products-section').scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
    }

    // 跳转到商品详情页面
    const goToProductDetail = (productId) => {
      router.push({
        path: '/product',
        query: { id: productId }
      })
    }

    // 修改页面大小
    const changePageSize = (size) => {
      if (pageSize.value === size) return
      pageSize.value = size
      currentPage.value = 1 // 重置到第一页
      fetchShopInfo()
    }

    // 监听路由变化
    watch(() => route.query.id, (newId) => {
      if (newId) {
        fetchShopInfo()
      }
    })

    onMounted(() => {
      fetchShopInfo()
    })

    return {
      shop,
      loading,
      error,
      products,
      displayProducts,
      loadingProducts,
      currentPage,
      pageSize,
      totalPages,
      statusClass,
      goBack,
      goToHome,
      fetchShopInfo,
      changePage,
      changePageSize,
      goToProductDetail,
      formatStatus,
      formatDate
    }
  }
}
</script>

<style scoped>
.shop-detail-container {
  width: 100%;
  min-height: 100vh;
  background-color: #d1e3ff;
  font-family: 'Noto Sans SC', sans-serif;
}

/* 导航栏样式 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 5%;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo img {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.logo span {
  font-size: 20px;
  font-weight: bold;
  color: #ff69b4;
}

.back-btn {
  color: #ff69b4;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.back-btn:hover {
  color: #ff5ba7;
  transform: translateX(-5px);
}

/* 加载和错误状态 */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #ff69b4;
  border-top: 5px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 60px;
  color: #ff5050;
  margin-bottom: 20px;
}

.retry-btn, .back-to-list-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  margin: 10px;
}

.retry-btn:hover, .back-to-list-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
}

/* 店铺内容区域 */
.shop-content {
  padding: 30px 5%;
}

/* 店铺头部信息 */
.shop-header-section {
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.shop-header {
  display: flex;
  align-items: center;
}

.shop-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 25px;
  border: 3px solid #fff;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.shop-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shop-info {
  flex: 1;
}

.shop-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 10px 0;
}

.shop-description {
  font-size: 16px;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}

.shop-status {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.status-label {
  font-size: 14px;
  color: #666;
  margin-right: 10px;
}

.status-value {
  font-size: 14px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px;
}

.status-normal {
  background-color: #e3fcef;
  color: #00b074;
}

.status-suspended {
  background-color: #fff4e5;
  color: #ff9800;
}

.status-closed {
  background-color: #fee8e8;
  color: #ff5252;
}

.shop-created {
  font-size: 14px;
  color: #999;
}

/* 商品区域样式 */
.shop-products-section {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.section-title h2 {
  color: #6a4c93;
  font-size: 20px;
  margin: 0;
}

.products-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.products-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ff69b4;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.no-products {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
  font-size: 16px;
}

.products-content {
  margin-top: 30px;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  background-color: white;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 15px;
}

.product-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
}

.product-brand {
  color: #6a4c93;
  font-size: 14px;
  margin-bottom: 8px;
}

.product-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-price {
  color: #ff4757;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.product-sales {
  color: #999;
  font-size: 12px;
}

/* 分页控件样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
}

.pagination-btn {
  padding: 8px 16px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(.disabled) {
  background-color: #ff5ba7;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.3);
}

.pagination-btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination-info {
  margin: 0 20px;
  font-size: 14px;
  color: #666;
}

/* 添加分页设置样式 */
.pagination-settings {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.page-size-options {
  display: flex;
  margin-left: 10px;
}

.page-size-options button {
  padding: 5px 10px;
  background-color: #f8f9fe;
  border: 1px solid #ddd;
  margin-right: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-size-options button:hover {
  background-color: #f0f0f0;
}

.page-size-options button.active {
  background-color: #ff69b4;
  color: white;
  border-color: #ff69b4;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .product-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-list {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .shop-header {
    flex-direction: column;
    text-align: center;
  }
  
  .shop-avatar {
    margin-right: 0;
    margin-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .product-list {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style> 