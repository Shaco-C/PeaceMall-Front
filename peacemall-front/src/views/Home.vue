<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="search-bar">
        <input type="text" v-model="searchKey" placeholder="请输入要搜索的商品" @keyup.enter="handleSearch">
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
      <div class="nav-items">
        <!-- 未登录状态显示登录和注册按钮 -->
        <template v-if="!isLoggedIn">
          <div class="nav-item auth-btn" @click="goToLogin">
            <span>登录</span>
          </div>
          <div class="nav-item auth-btn" @click="goToRegister">
            <span>注册</span>
          </div>
        </template>
        <!-- 登录状态显示购物车、订单和个人中心 -->
        <template v-else>
          <div class="nav-item" @click="goToCart">
            <i class="icon">🛒</i>
            <span>购物车</span>
          </div>
          <div class="nav-item" @click="goToOrders">
            <i class="icon">🎁</i>
            <span>我的订单</span>
          </div>
          <div class="nav-item" @click="goToFavorites">
            <i class="icon">❤️</i>
            <span>我的收藏</span>
          </div>
          <div class="nav-item" @click="goToProfile">
            <i class="icon">👤</i>
            <span>个人中心</span>
          </div>
          <div class="nav-item logout-btn" @click="handleLogout">
            <i class="icon">🚪</i>
            <span>退出登录</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 轮播图和分类组合区域 -->
    <div class="banner-categories-container">
      <!-- 左侧Banner图片，占16/23 -->
      <div class="banner-area">
        <div class="carousel">
          <div class="carousel-item active">
            <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/10d8389c-466b-4477-bde6-f977ead8db3e.png" alt="Banner">
          </div>
        </div>
      </div>
      
      <!-- 右侧分类导航，占6/23 -->
      <div class="categories-area">
        <div class="categories-title">全部分类</div>
        <div class="categories-grid">
          <div v-if="loading" class="categories-loading">
            <div class="categories-spinner"></div>
          </div>
          <template v-else-if="parentCategories && parentCategories.length > 0">
            <div 
              v-for="category in parentCategories" 
              :key="category.categoryId"
              class="category-block"
              @click="goToCategory(category.categoryId, category.categoryName)"
            >
              <div class="parent-category">
                <div class="category-icon" v-if="category.icon">
                  <img :src="category.icon" alt="分类图标" class="category-icon-img">
                </div>
                <div class="category-icon" v-else>📦</div>
                <span class="category-name">{{ category.categoryName }}</span>
              </div>
              <div class="sub-categories">
                <span 
                  v-for="(subCategory, index) in getSubCategories(category.categoryId)" 
                  :key="subCategory.categoryId"
                  class="sub-category-item"
                  @click.stop="goToCategory(subCategory.categoryId, subCategory.categoryName)"
                >
                  {{ subCategory.categoryName }}
                  <span v-if="index < getSubCategories(category.categoryId).length - 1" class="sub-category-separator">|</span>
                </span>
              </div>
            </div>
          </template>
          <div v-else class="no-categories">
            暂无分类信息
          </div>
        </div>
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="category-section">
      <div v-if="loading" class="category-loading">
        <div class="category-spinner"></div>
      </div>
      <template v-else-if="categories && categories.length > 0">
        <div 
          class="category-item" 
          v-for="category in categories" 
          :key="category.categoryId"
          @click="goToCategory(category.categoryId, category.categoryName)"
        >
          <div class="category-icon" v-if="category.icon">
            <img :src="category.icon" alt="分类图标" class="category-icon-img">
          </div>
          <div class="category-icon" v-else>📦</div>
          <span>{{ category.categoryName }}</span>
        </div>
      </template>
      <div v-else class="no-categories">
        暂无分类信息
      </div>
    </div>

    <!-- 热门商品 -->
    <div class="products-section">
      <div class="section-title">
        <h2>热门商品</h2>
        <span class="more" @click="seeMoreHotProducts">查看更多 ></span>
      </div>
      
      <div v-if="hotProductsLoading" class="products-loading">
        <div class="products-spinner"></div>
        <p>加载热门商品中...</p>
      </div>
      
      <div v-else-if="hotProducts.length === 0" class="no-products">
        暂无热门商品
      </div>
      
      <div v-else class="product-list">
        <div 
          class="product-card" 
          v-for="product in hotProducts" 
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
            <div class="product-price">¥{{ product.price ? product.price.toFixed(2) : '暂无价格' }}</div>
            <div class="product-sales">已售 {{ product.sales || 0 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新品上市 -->
    <div class="products-section">
      <div class="section-title">
        <h2>推荐商品</h2>
        <span v-if="!isLoadingMore && hasMoreProducts" class="more" @click="loadMoreProducts">加载更多</span>
        <span v-if="!hasMoreProducts && infiniteProducts.length > 0" class="no-more">已加载全部</span>
      </div>
      
      <div v-if="infiniteLoading && infiniteProducts.length === 0" class="products-loading">
        <div class="products-spinner"></div>
        <p>加载商品中...</p>
      </div>
      
      <div v-else-if="infiniteProducts.length === 0" class="no-products">
        暂无商品
      </div>
      
      <div v-else class="product-list">
        <div 
          class="product-card" 
          v-for="product in infiniteProducts" 
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
            <div class="product-price">¥{{ product.price ? product.price.toFixed(2) : '暂无价格' }}</div>
            <div class="product-sales">已售 {{ product.sales || 0 }}</div>
          </div>
        </div>
      </div>
      
      <!-- 滚动加载更多指示器 -->
      <div v-if="isLoadingMore" class="load-more-indicator">
        <div class="load-more-spinner"></div>
        <p>加载更多商品...</p>
      </div>
      
      <!-- 滚动检测元素 -->
      <div ref="loadMoreTrigger" class="load-more-trigger"></div>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>关于我们</h3>
          <p>和平商城是一家专注于二次元、动漫周边的电商平台</p>
        </div>
        <div class="footer-section">
          <h3>客户服务</h3>
          <p>联系客服</p>
          <p>常见问题</p>
          <p>售后政策</p>
        </div>
        <div class="footer-section">
          <h3>联系我们</h3>
          <p>邮箱: service@peacemall.com</p>
          <p>电话: 400-123-4567</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2023 和平商城 All Rights Reserved</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { getCategories } from '@/api/category'
import { getHotSales, getInfiniteProducts } from '@/api/product'

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter()
    const isLoggedIn = ref(false)
    const username = ref('')
    const categories = ref([])
    const loading = ref(true)
    const categoryData = ref({})
    const searchKey = ref('')
    const error = ref(null)
    const hotProducts = ref([])
    const hotProductsLoading = ref(false)
    const infiniteProducts = ref([])
    const infiniteLoading = ref(false)
    const isLoadingMore = ref(false)
    const hasMoreProducts = ref(true)
    const loadMoreTrigger = ref(null)
    
    // 计算得到父分类
    const parentCategories = computed(() => {
      return categories.value || []
    })

    // 检查用户是否已登录
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token')
      const storedUsername = localStorage.getItem('username')
      isLoggedIn.value = !!token
      if (storedUsername) {
        username.value = storedUsername
      }
    }

    // 跳转到登录页面
    const goToLogin = () => {
      router.push('/login')
    }

    // 跳转到注册页面
    const goToRegister = () => {
      router.push('/register')
    }

    // 跳转到个人中心页面
    const goToProfile = () => {
      router.push('/user')
    }

    // 跳转到购物车页面
    const goToCart = () => {
      router.push('/cart')
    }

    // 跳转到订单历史页面
    const goToOrders = () => {
      router.push('/user/orders')
    }

    // 跳转到收藏页面
    const goToFavorites = () => {
      router.push('/favorites')
    }

    // 退出登录
    const handleLogout = async () => {
      try {
        // 可以调用后端登出接口
        await request({
          url: '/user/logout',
          method: 'post'
        })
        
        // 清除本地存储中的用户信息
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('username')
        localStorage.removeItem('role')
        
        // 更新登录状态
        isLoggedIn.value = false
        username.value = ''
        
        alert('退出登录成功')
        
        // 可选：跳转到登录页面
        // router.push('/login')
      } catch (error) {
        console.error('登出出错：', error)
        // 即使后端调用失败，也清除本地信息
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('username')
        localStorage.removeItem('role')
        isLoggedIn.value = false
        username.value = ''
      }
    }

    // 获取分类信息
    const fetchCategories = async () => {
      loading.value = true
      try {
        const response = await getCategories()
        if (response.code === 200 && response.data) {
          if (response.data.parent) {
            categories.value = response.data.parent
          }
          
          // 保存所有分类数据，包括子分类
          categoryData.value = response.data
        } else {
          console.error('获取分类失败:', response.msg)
        }
      } catch (error) {
        console.error('获取分类出错:', error)
      } finally {
        loading.value = false
      }
    }

    // 根据父分类ID获取子分类
    const getSubCategories = (parentId) => {
      if (!categoryData.value || !categoryData.value[parentId]) {
        return []
      }
      return categoryData.value[parentId] || []
    }

    // 添加跳转到分类详情页的方法
    const goToCategory = (categoryId, categoryName) => {
      router.push({
        path: '/category',
        query: { 
          id: categoryId,
          name: categoryName
        }
      })
    }

    // 处理搜索
    const handleSearch = () => {
      if (!searchKey.value || searchKey.value.trim() === '') {
        alert('请输入搜索关键字')
        return
      }
      
      router.push({
        path: '/search',
        query: { 
          key: searchKey.value.trim(),
          pageNo: 1,
          pageSize: 20
        }
      })
    }

    // 获取热门商品
    const fetchHotProducts = async () => {
      hotProductsLoading.value = true
      try {
        const response = await getHotSales()
        if (response.code === 200 && response.data) {
          hotProducts.value = response.data
        } else {
          console.error('获取热门商品失败:', response.msg)
        }
      } catch (error) {
        console.error('获取热门商品出错:', error)
      } finally {
        hotProductsLoading.value = false
      }
    }

    // 获取首批无限滚动商品
    const fetchInfiniteProducts = async () => {
      infiniteLoading.value = true
      try {
        const response = await getInfiniteProducts()
        if (response.code === 200 && response.data) {
          infiniteProducts.value = response.data
          if (response.data.length < 18) {
            hasMoreProducts.value = false
          }
        } else {
          console.error('获取推荐商品失败:', response.msg)
        }
      } catch (error) {
        console.error('获取推荐商品出错:', error)
      } finally {
        infiniteLoading.value = false
      }
    }

    // 加载更多商品
    const loadMoreProducts = async () => {
      if (!hasMoreProducts.value || isLoadingMore.value) return
      
      isLoadingMore.value = true
      
      try {
        // 获取最后一个商品的ID
        const lastProductId = infiniteProducts.value.length > 0 
          ? infiniteProducts.value[infiniteProducts.value.length - 1].productId 
          : null
        
        const response = await getInfiniteProducts(18, lastProductId)
        
        if (response.code === 200 && response.data) {
          if (response.data.length > 0) {
            infiniteProducts.value = [...infiniteProducts.value, ...response.data]
          }
          
          // 如果返回的数据少于请求的数量，则没有更多数据了
          if (response.data.length < 18) {
            hasMoreProducts.value = false
          }
        } else {
          console.error('加载更多商品失败:', response.msg)
        }
      } catch (error) {
        console.error('加载更多商品出错:', error)
      } finally {
        isLoadingMore.value = false
      }
    }
    
    // 监听滚动事件，实现自动加载更多
    const handleScroll = () => {
      if (!loadMoreTrigger.value || !hasMoreProducts.value || isLoadingMore.value) return
      
      const triggerElement = loadMoreTrigger.value
      const rect = triggerElement.getBoundingClientRect()
      
      // 当触发元素进入视口时加载更多
      if (rect.top <= window.innerHeight) {
        loadMoreProducts()
      }
    }

    // 添加跳转到商品详情页的方法
    const goToProductDetail = (productId) => {
      router.push({
        path: '/product',
        query: { 
          id: productId
        }
      })
    }

    // 添加查看更多热门商品的方法
    const seeMoreHotProducts = () => {
      fetchHotProducts()
    }

    onMounted(() => {
      checkLoginStatus()
      fetchCategories()
      fetchHotProducts()
      fetchInfiniteProducts()
      
      // 添加滚动事件监听
      window.addEventListener('scroll', handleScroll)
    })
    
    // 移除滚动事件监听
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      isLoggedIn,
      username,
      goToLogin,
      goToRegister,
      goToProfile,
      goToCart,
      goToOrders,
      goToFavorites,
      handleLogout,
      categories,
      parentCategories,
      loading,
      goToCategory,
      getSubCategories,
      searchKey,
      handleSearch,
      error,
      hotProducts,
      hotProductsLoading,
      goToProductDetail,
      seeMoreHotProducts,
      infiniteProducts,
      infiniteLoading,
      isLoadingMore,
      hasMoreProducts,
      loadMoreProducts,
      loadMoreTrigger
    }
  }
}
</script>

<style scoped>
.home-container {
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
  transition: all 0.3s;
}

.search-btn:hover {
  background-color: #ff5ba7;
}

.nav-items {
  display: flex;
  gap: 20px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.icon {
  font-size: 20px;
  margin-bottom: 5px;
}

/* 轮播图和分类组合区域 */
.banner-categories-container {
  display: flex;
  margin: 20px 0;
  padding: 0 5%;
  width: 100%;
  /* 设置23:9的宽高比例 */
  aspect-ratio: 23/9;
  overflow: hidden;
}

.banner-area {
  /* 左侧占16/23 */
  flex: 0 0 calc(16/23 * 100%);
  margin-right: calc(1/23 * 100%); /* 间隔占1/23 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-area .carousel {
  height: 100%;
  width: 100%;
  overflow: hidden;
  /* 移除边框和阴影 */
}

.banner-area .carousel-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.banner-area .carousel-item img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  /* 保留背景色使图片更易区分 */
  background-color: transparent;
}

.categories-area {
  /* 右侧占6/23 */
  flex: 0 0 calc(6/23 * 100%);
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.categories-title {
  font-size: 18px;
  font-weight: bold;
  color: #6a4c93;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.categories-grid {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
}

.categories-grid::-webkit-scrollbar {
  width: 4px;
}

.categories-grid::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 4px;
}

.category-block {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #f0f0f0;
}

.parent-category {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
}

.parent-category:hover .category-name {
  color: #ff69b4;
}

.parent-category .category-icon {
  font-size: 20px;
  margin-right: 8px;
}

.parent-category .category-name {
  font-weight: bold;
  color: #333;
  transition: color 0.3s;
}

.sub-categories {
  padding-left: 28px;
  display: flex;
  flex-wrap: wrap;
}

.sub-category-item {
  color: #666;
  font-size: 13px;
  margin-bottom: 5px;
  cursor: pointer;
  transition: color 0.3s;
}

.sub-category-item:hover {
  color: #ff69b4;
}

.sub-category-separator {
  color: #ddd;
  margin: 0 5px;
}

.categories-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.categories-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #ff69b4;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 分类导航样式 */
.category-section {
  display: flex;
  justify-content: space-around;
  margin: 30px 5%;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s;
}

.category-item:hover {
  transform: translateY(-5px);
}

.category-icon {
  font-size: 30px;
  margin-bottom: 10px;
}

.category-icon-img {
  width: 30px;
  height: 30px;
}

/* 商品区域样式 */
.products-section {
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

.more {
  color: #ff69b4;
  cursor: pointer;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.product-card {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.product-image img {
  width: 100%;
  height: 200px;
  object-fit: contain;
  background-color: white;
}

.product-info {
  padding: 12px;
}

.product-name {
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}

.product-brand {
  font-size: 12px;
  color: #999;
}

.product-price {
  color: #ff69b4;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.product-sales, .product-tag {
  font-size: 12px;
  color: #999;
}

.product-tag {
  display: inline-block;
  background-color: #ff69b4;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 页脚样式 */
.footer {
  background-color: #333;
  color: #fff;
  padding: 40px 5% 20px;
  margin-top: 30px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.footer-section {
  width: 30%;
  min-width: 200px;
  margin-bottom: 20px;
}

.footer-section h3 {
  margin-bottom: 15px;
  color: #ff69b4;
}

.footer-section p {
  margin: 5px 0;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #444;
}

.auth-btn {
  padding: 8px 15px;
  background-color: #ff69b4;
  color: white;
  border-radius: 20px;
  transition: all 0.3s;
  font-weight: bold;
}

.auth-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.3);
}

.logout-btn {
  color: #ff5050;
  transition: all 0.3s;
}

.logout-btn:hover {
  transform: translateY(-2px);
  color: #ff3333;
}

.category-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.category-spinner {
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

.no-categories {
  text-align: center;
  padding: 20px;
  color: #999;
}

.products-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.products-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ff69b4;
  border-top: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.no-products {
  text-align: center;
  padding: 50px 0;
  color: #999;
  font-size: 16px;
}

.load-more-indicator {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.load-more-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #ff69b4;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.load-more-trigger {
  height: 20px;
  margin-top: 20px;
  width: 100%;
  visibility: hidden;
}

.no-more {
  color: #999;
  font-size: 14px;
}
</style> 