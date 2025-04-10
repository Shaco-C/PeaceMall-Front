<template>
  <div class="category-detail-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>{{ categoryName }}</h1>
      </div>
      <div class="back-btn" @click="goToHome">
        <span>返回首页</span>
      </div>
    </div>

    <!-- 子分类展示 -->
    <div class="subcategories-section">
      <div class="section-title">
        <h2>{{ categoryName }}分类</h2>
      </div>
      
      <div class="subcategories-content">
        <div v-if="loading" class="subcategory-loading">
          <div class="subcategory-spinner"></div>
        </div>
        <div v-else-if="subcategories && subcategories.length > 0" class="subcategory-list">
          <div 
            class="subcategory-item" 
            v-for="subcategory in subcategories" 
            :key="subcategory.categoryId"
            @click="goToSubCategoryDetail(subcategory.categoryId, subcategory.categoryName)"
          >
            <div class="subcategory-icon" v-if="subcategory.icon">
              <img :src="subcategory.icon" alt="分类图标" class="subcategory-icon-img">
            </div>
            <div class="subcategory-icon" v-else>📦</div>
            <span class="subcategory-name">{{ subcategory.categoryName }}</span>
          </div>
        </div>
        <div v-else class="no-subcategories">
          暂无子分类信息
        </div>
      </div>
    </div>

    <!-- 商品展示区域 -->
    <div class="products-section">
      <div class="section-title">
        <h2>{{ categoryName }}商品</h2>
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
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCategoriesByParentId } from '@/api/category'
import { getProductsByCategoryId } from '@/api/product'

export default {
  name: 'CategoryDetailPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const subcategories = ref([])
    const loading = ref(true)
    const categoryId = ref('')
    const categoryName = ref('')
    
    // 商品相关状态
    const products = ref([])
    const loadingProducts = ref(true)
    const currentPage = ref(1)
    const pageSize = ref(20) // 修改为默认显示20个商品
    const totalProducts = ref(0)
    const totalPages = ref(0)

    // 优化商品列表渲染
    const displayProducts = ref([])
    const loadComplete = ref(false)

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

    // 跳转到首页
    const goToHome = () => {
      router.push('/')
    }

    // 获取子分类信息
    const fetchSubcategories = async () => {
      loading.value = true
      
      try {
        // 从路由参数获取分类ID和名称
        categoryId.value = route.query.id
        categoryName.value = route.query.name || '分类详情'
        
        if (!categoryId.value) {
          console.error('分类ID不存在')
          loading.value = false
          return
        }
        
        const response = await getCategoriesByParentId(categoryId.value)
        
        if (response.code === 200 && response.data) {
          subcategories.value = response.data
        } else {
          console.error('获取子分类失败:', response.msg)
        }
      } catch (error) {
        console.error('获取子分类出错:', error)
      } finally {
        loading.value = false
        // 子分类加载完成后再加载商品
        fetchProducts()
      }
    }
    
    // 获取商品信息
    const fetchProducts = async (page = 1) => {
      loadingProducts.value = true
      
      try {
        if (!categoryId.value) {
          console.error('分类ID不存在')
          loadingProducts.value = false
          return
        }
        
        currentPage.value = page
        
        const response = await getProductsByCategoryId(
          categoryId.value, 
          currentPage.value, 
          pageSize.value
        )
        
        if (response.code === 200 && response.data) {
          products.value = response.data.list || []
          totalProducts.value = Number(response.data.total) || 0
          totalPages.value = Number(response.data.pages) || 0
        } else {
          console.error('获取商品失败:', response.msg)
        }
      } catch (error) {
        console.error('获取商品出错:', error)
      } finally {
        loadingProducts.value = false
        // 更新展示的商品
        renderProductsBatch()
      }
    }
    
    // 切换页码
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return
      fetchProducts(page)
      
      // 页面滚动到商品区域
      setTimeout(() => {
        document.querySelector('.products-section').scrollIntoView({ 
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
      fetchProducts()
    }

    // 添加子分类跳转方法
    const goToSubCategoryDetail = (subCategoryId, subCategoryName) => {
      router.push({
        path: '/subcategory',
        query: { 
          id: subCategoryId,
          name: subCategoryName,
          parentId: categoryId.value,
          parentName: categoryName.value
        }
      })
    }

    // 添加watch，监听路由变化重新加载数据
    watch(() => route.query.id, (newId) => {
      if (newId && newId !== categoryId.value) {
        categoryId.value = newId
        categoryName.value = route.query.name || '分类详情'
        fetchSubcategories()
      }
    })

    onMounted(() => {
      // 确保先处理categoryId
      categoryId.value = route.query.id
      categoryName.value = route.query.name || '分类详情'

      if (categoryId.value) {
        fetchSubcategories()
      } else {
        console.error('分类ID不存在')
      }
    })

    return {
      subcategories,
      loading,
      categoryName,
      goToHome,
      products,
      displayProducts,
      loadingProducts,
      currentPage,
      pageSize,
      totalPages,
      changePage,
      changePageSize,
      goToProductDetail,
      goToSubCategoryDetail
    }
  }
}
</script>

<style scoped>
.category-detail-container {
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

.page-title h1 {
  margin: 0;
  color: #6a4c93;
  font-size: 24px;
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

/* 子分类区域样式 */
.subcategories-section {
  margin: 30px 5%;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
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

.subcategory-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

.subcategory-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border-radius: 10px;
  background-color: #f8f9fe;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  cursor: pointer;
}

.subcategory-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.subcategory-icon {
  font-size: 36px;
  margin-bottom: 10px;
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.subcategory-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.subcategory-name {
  text-align: center;
  font-weight: bold;
  color: #333;
}

/* 加载中状态 */
.subcategory-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.subcategory-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ff69b4;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-subcategories {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 16px;
}

/* 商品区域样式 */
.products-section {
  margin: 30px 5%;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  grid-template-columns: repeat(4, 1fr); /* 固定每行4个商品 */
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

/* 添加响应式设计，在不同屏幕大小下调整每行商品数 */
@media (max-width: 1200px) {
  .product-list {
    grid-template-columns: repeat(3, 1fr); /* 中等屏幕每行3个 */
  }
}

@media (max-width: 768px) {
  .product-list {
    grid-template-columns: repeat(2, 1fr); /* 小屏幕每行2个 */
  }
}

@media (max-width: 480px) {
  .product-list {
    grid-template-columns: repeat(1, 1fr); /* 手机屏幕每行1个 */
  }
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
</style> 