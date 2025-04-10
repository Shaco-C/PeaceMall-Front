<template>
  <div class="search-result-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="search-bar">
        <input type="text" v-model="searchKey" placeholder="请输入要搜索的商品" @keyup.enter="handleSearch">
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
      <div class="back-btn" @click="goToHome">
        <span>返回首页</span>
      </div>
    </div>

    <!-- 搜索结果显示区域 -->
    <div class="search-content">
      <div class="search-header">
        <h2>搜索结果：{{ searchKey }}</h2>
        <div class="search-filters">
          <div class="filter-group">
            <label>品牌：</label>
            <div class="brand-filter" @click.stop="toggleBrandPanel">
              {{ selectedBrand || '全部' }} <i class="arrow-down">▼</i>
              
              <!-- 品牌选择面板 -->
              <div v-if="showBrandPanel" class="brand-panel" @click.stop>
                <div v-if="brandsLoading" class="brands-loading">
                  <div class="loading-spinner-sm"></div>
                  <span>加载中...</span>
                </div>
                <div v-else-if="brands.length === 0" class="no-brands">
                  暂无品牌信息
                </div>
                <div v-else class="brand-list">
                  <div 
                    class="brand-item"
                    :class="{ active: !selectedBrand }"
                    @click="selectBrand(null)"
                  >
                    全部
                  </div>
                  <div 
                    v-for="brand in brands" 
                    :key="brand"
                    class="brand-item"
                    :class="{ active: selectedBrand === brand }"
                    @click="selectBrand(brand)"
                  >
                    {{ brand }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="filter-group">
            <label>排序方式：</label>
            <select v-model="sortBy" @change="handleSortChange">
              <option value="price">价格</option>
              <option value="sales">销量</option>
            </select>
          </div>
          <div class="filter-group">
            <label>排序顺序：</label>
            <select v-model="isAsc" @change="handleSortChange">
              <option :value="true">升序</option>
              <option :value="false">降序</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 商品列表 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>搜索结果加载中...</p>
      </div>
      
      <div v-else-if="!products || products.length === 0" class="no-products">
        <p>未找到符合条件的商品</p>
        <button class="back-to-home" @click="goToHome">返回首页</button>
      </div>
      
      <div v-else class="products-content">
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
            v-for="product in products" 
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
              <div class="product-category">{{ product.categoryName }}</div>
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
            :class="{ disabled: pageNo <= 1 }"
            :disabled="pageNo <= 1"
            @click="changePage(pageNo - 1)"
          >
            上一页
          </button>
          
          <div class="pagination-info">
            第 {{ pageNo }} 页 / 共 {{ totalPages }} 页
          </div>
          
          <button 
            class="pagination-btn" 
            :class="{ disabled: pageNo >= totalPages }"
            :disabled="pageNo >= totalPages"
            @click="changePage(pageNo + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchProducts, getBrandsByKey } from '@/api/product'

export default {
  name: 'SearchResultPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // 搜索参数
    const searchKey = ref('')
    const pageNo = ref(1)
    const pageSize = ref(20)
    const isAsc = ref(false) // 默认降序
    const sortBy = ref('price') // 默认按价格排序
    
    // 搜索结果
    const products = ref([])
    const loading = ref(true)
    const totalResults = ref(0)
    const totalPages = ref(0)
    
    // 品牌相关
    const selectedBrand = ref(null)
    const showBrandPanel = ref(false)
    const brandsLoading = ref(false)
    const brands = ref([])
    
    // 返回首页
    const goToHome = () => {
      router.push('/')
    }
    
    // 处理搜索
    const handleSearch = () => {
      if (!searchKey.value || searchKey.value.trim() === '') {
        alert('请输入搜索关键字')
        return
      }
      
      // 重置页码
      pageNo.value = 1
      
      router.push({
        path: '/search',
        query: { 
          key: searchKey.value.trim(),
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          isAsc: isAsc.value,
          sortBy: sortBy.value,
          brand: selectedBrand.value
        }
      })
    }
    
    // 获取搜索结果
    const fetchSearchResults = async () => {
      loading.value = true
      
      try {
        // 从路由参数获取搜索关键字
        const key = route.query.key
        
        if (!key) {
          console.error('搜索关键字不存在')
          loading.value = false
          return
        }
        
        searchKey.value = key
        pageNo.value = Number(route.query.pageNo) || 1
        pageSize.value = Number(route.query.pageSize) || 20
        
        // 如果URL中包含排序参数，则使用URL参数
        if (route.query.sortBy) {
          sortBy.value = route.query.sortBy
          isAsc.value = route.query.isAsc === 'true'
        }
        
        // 如果URL中包含品牌参数，则使用URL参数
        selectedBrand.value = route.query.brand || null
        
        const response = await searchProducts(
          searchKey.value, 
          pageNo.value, 
          pageSize.value,
          isAsc.value,
          sortBy.value,
          selectedBrand.value
        )
        
        if (response.code === 200 && response.data) {
          products.value = response.data.list || []
          totalResults.value = Number(response.data.total) || 0
          totalPages.value = Number(response.data.pages) || 0
        } else {
          console.error('搜索失败:', response.msg)
        }
      } catch (error) {
        console.error('搜索出错:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 切换页码
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return
      
      pageNo.value = page
      router.push({
        path: '/search',
        query: { 
          key: searchKey.value,
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          isAsc: isAsc.value,
          sortBy: sortBy.value,
          brand: selectedBrand.value
        }
      })
    }
    
    // 改变每页显示数量
    const changePageSize = (size) => {
      if (pageSize.value === size) return
      
      pageSize.value = size
      pageNo.value = 1 // 重置到第一页
      
      router.push({
        path: '/search',
        query: { 
          key: searchKey.value,
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          isAsc: isAsc.value,
          sortBy: sortBy.value,
          brand: selectedBrand.value
        }
      })
    }
    
    // 处理排序变化
    const handleSortChange = () => {
      pageNo.value = 1 // 重置到第一页
      
      router.push({
        path: '/search',
        query: { 
          key: searchKey.value,
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          isAsc: isAsc.value,
          sortBy: sortBy.value,
          brand: selectedBrand.value
        }
      })
    }
    
    // 品牌相关操作
    const toggleBrandPanel = (event) => {
      if (event) {
        event.stopPropagation()
      }
      
      if (!showBrandPanel.value) {
        fetchBrands()
      }
      showBrandPanel.value = !showBrandPanel.value
    }
    
    const selectBrand = async (brand, event) => {
      if (event) {
        event.stopPropagation()
      }
      
      selectedBrand.value = brand
      showBrandPanel.value = false
      
      // 重置页码
      pageNo.value = 1
      
      router.push({
        path: '/search',
        query: { 
          key: searchKey.value,
          pageNo: pageNo.value,
          pageSize: pageSize.value,
          isAsc: isAsc.value,
          sortBy: sortBy.value,
          brand: brand
        }
      })
    }
    
    // 获取品牌列表
    const fetchBrands = async () => {
      brandsLoading.value = true
      
      try {
        const response = await getBrandsByKey(searchKey.value)
        
        if (response.code === 200 && response.data) {
          brands.value = response.data
        } else {
          console.error('获取品牌列表失败:', response.msg)
        }
      } catch (error) {
        console.error('获取品牌列表出错:', error)
      } finally {
        brandsLoading.value = false
      }
    }
    
    // 跳转到商品详情页面
    const goToProductDetail = (productId) => {
      router.push({
        path: '/product',
        query: { id: productId }
      })
    }
    
    // 点击页面其他位置关闭品牌面板
    const handleClickOutside = (event) => {
      const brandPanel = document.querySelector('.brand-panel')
      const brandFilter = document.querySelector('.brand-filter')
      
      if (showBrandPanel.value && brandPanel && brandFilter) {
        if (!brandPanel.contains(event.target) && !brandFilter.contains(event.target)) {
          showBrandPanel.value = false
        }
      }
    }
    
    // 监听路由变化，重新获取搜索结果
    watch(() => route.query, () => {
      fetchSearchResults()
    }, { deep: true })
    
    onMounted(() => {
      fetchSearchResults()
      document.addEventListener('click', handleClickOutside)
    })
    
    // 移除全局点击事件监听
    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
    })
    
    return {
      searchKey,
      pageNo,
      pageSize,
      isAsc,
      sortBy,
      products,
      loading,
      totalPages,
      goToHome,
      handleSearch,
      changePage,
      changePageSize,
      handleSortChange,
      goToProductDetail,
      selectedBrand,
      showBrandPanel,
      brandsLoading,
      brands,
      toggleBrandPanel,
      selectBrand
    }
  }
}
</script>

<style scoped>
.search-result-container {
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
  white-space: nowrap;
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

.search-bar {
  display: flex;
  flex: 1;
  margin: 0 20px;
  max-width: 500px;
}

.search-bar input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #ff69b4;
  border-right: none;
  border-radius: 20px 0 0 20px;
  font-size: 16px;
  outline: none;
}

.search-btn {
  padding: 10px 20px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 0 20px 20px 0;
  cursor: pointer;
}

.back-btn {
  color: #ff69b4;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
  white-space: nowrap;
}

.back-btn:hover {
  color: #ff5ba7;
  transform: translateX(-5px);
}

/* 搜索内容区域 */
.search-content {
  padding: 30px 5%;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.search-header h2 {
  color: #6a4c93;
  margin: 0;
  font-size: 24px;
}

.search-filters {
  display: flex;
  gap: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
}

.filter-group label {
  margin-right: 10px;
  color: #666;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: white;
  cursor: pointer;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ff69b4;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-products {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #666;
}

.back-to-home {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.3s;
}

.back-to-home:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
}

/* 商品列表区域 */
.products-content {
  margin-top: 20px;
}

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
  object-fit: contain;
  background-color: white;
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
  margin-bottom: 5px;
}

.product-category {
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .product-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .search-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .product-list {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .navbar {
    flex-wrap: wrap;
  }
  
  .search-bar {
    order: 3;
    margin: 10px 0 0 0;
    max-width: 100%;
    width: 100%;
  }
  
  .back-btn {
    margin-left: auto;
  }
}

@media (max-width: 480px) {
  .product-list {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .search-filters {
    flex-direction: column;
    gap: 10px;
  }
}

/* 品牌筛选样式 */
.brand-filter {
  position: relative;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  min-width: 120px;
}

.arrow-down {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.brand-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 200px;
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  margin-top: 5px;
}

.brand-list {
  padding: 10px;
}

.brand-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.brand-item:hover {
  background-color: #f0f0f0;
}

.brand-item.active {
  background-color: #ff69b4;
  color: white;
}

.brands-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid #ff69b4;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

.no-brands {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style> 