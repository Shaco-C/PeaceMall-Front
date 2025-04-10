<template>
  <div class="favorites-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>我的收藏</h1>
      </div>
      <div class="back-btn" @click="goToHome">
        <span>返回首页</span>
      </div>
    </div>

    <!-- 收藏内容 -->
    <div class="favorites-content">
      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载收藏商品中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <p>{{ error }}</p>
        <button @click="fetchFavorites" class="retry-btn">重试</button>
      </div>

      <!-- 无收藏状态 -->
      <div v-else-if="favorites.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>您还没有收藏任何商品</p>
        <button @click="goToHome" class="shop-now-btn">去逛逛</button>
      </div>

      <!-- 收藏列表 -->
      <div v-else class="favorites-list">
        <div v-for="item in favorites" :key="item.favoritesId" class="favorite-card">
          <div class="favorite-image" @click="goToProductDetail(item.productId)">
            <img :src="item.imageUrl || 'https://via.placeholder.com/200'" :alt="item.name">
          </div>
          <div class="favorite-info">
            <div class="favorite-name" @click="goToProductDetail(item.productId)">{{ item.name }}</div>
            <div class="favorite-meta">
              <span class="favorite-brand">{{ item.brand }}</span>
              <span class="favorite-category">{{ item.categoryName }}</span>
            </div>
            <div class="favorite-shop" @click="goToShop(item.shopId)">
              <i class="shop-icon">🏪</i>
              <span>{{ item.shopName }}</span>
            </div>
            <div class="favorite-description">{{ item.description }}</div>
            <div class="favorite-price">¥{{ formatPrice(item.price) }}</div>
          </div>
          <div class="favorite-actions">
            <button class="view-btn" @click="goToProductDetail(item.productId)">查看详情</button>
            <button class="remove-btn" @click="removeFavorite(item.favoritesId)">取消收藏</button>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="favorites.length > 0" class="pagination">
        <button 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)" 
          class="page-btn prev-btn"
        >
          上一页
        </button>
        <div class="page-number">
          <span class="current-page">{{ currentPage }}</span> / <span class="total-pages">{{ totalPages }}</span>
        </div>
        <button 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)" 
          class="page-btn next-btn"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserFavorites, removeFromFavorites } from '@/api/favorites'

export default {
  name: 'FavoritesPage',
  setup() {
    const router = useRouter()
    const favorites = ref([])
    const loading = ref(true)
    const error = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalPages = ref(1)
    const totalFavorites = ref(0)

    // 获取收藏列表
    const fetchFavorites = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await getUserFavorites(currentPage.value, pageSize.value)
        
        if (response && response.code === 200 && response.data) {
          favorites.value = response.data.list || []
          totalPages.value = parseInt(response.data.pages) || 1
          totalFavorites.value = parseInt(response.data.total) || 0
        } else {
          console.error('获取收藏列表失败:', response?.msg || '未知错误')
          favorites.value = []
          error.value = response?.msg || '获取收藏数据失败'
        }
      } catch (err) {
        console.error('获取收藏列表出错：', err)
        favorites.value = []
        error.value = '获取收藏列表失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    // 切换页码
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return
      
      currentPage.value = page
      fetchFavorites()
      
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 格式化价格
    const formatPrice = (price) => {
      if (price === undefined || price === null) return '0.00'
      return parseFloat(price).toFixed(2)
    }

    // 移除收藏
    const removeFavorite = async (favoriteId) => {
      if (!confirm('确定要取消收藏此商品吗？')) {
        return
      }

      try {
        loading.value = true
        const response = await removeFromFavorites(favoriteId)
        
        if (response && response.code === 200) {
          alert('取消收藏成功')
          // 刷新收藏列表
          await fetchFavorites()
        } else {
          alert(response?.msg || '取消收藏失败')
        }
      } catch (err) {
        console.error('取消收藏出错：', err)
        alert('取消收藏失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 跳转到商品详情
    const goToProductDetail = (productId) => {
      router.push({
        path: '/product',
        query: { id: productId }
      })
    }

    // 跳转到店铺详情
    const goToShop = (shopId) => {
      router.push({
        path: '/shop',
        query: { id: shopId }
      })
    }

    // 跳转到首页
    const goToHome = () => {
      router.push('/')
    }

    onMounted(() => {
      fetchFavorites()
    })

    return {
      favorites,
      loading,
      error,
      currentPage,
      totalPages,
      totalFavorites,
      fetchFavorites,
      changePage,
      formatPrice,
      removeFavorite,
      goToProductDetail,
      goToShop,
      goToHome
    }
  }
}
</script>

<style scoped>
.favorites-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  background-color: #f8f9fe;
  min-height: 100vh;
}

.navbar {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
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
  font-size: 18px;
  font-weight: bold;
  color: #6a4c93;
}

.page-title {
  flex: 1;
  text-align: center;
}

.page-title h1 {
  margin: 0;
  font-size: 28px;
  color: #6a4c93;
}

.back-btn {
  cursor: pointer;
  color: #ff69b4;
  font-weight: bold;
  transition: all 0.3s;
}

.back-btn:hover {
  color: #ff5ba7;
  transform: translateX(-5px);
}

/* 加载中状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff69b4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-2px);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.shop-now-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.shop-now-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-2px);
}

/* 收藏列表 */
.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.favorite-card {
  display: flex;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.favorite-image {
  width: 180px;
  height: 180px;
  overflow: hidden;
  border-radius: 8px;
  margin-right: 20px;
  cursor: pointer;
}

.favorite-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.favorite-image img:hover {
  transform: scale(1.05);
}

.favorite-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.favorite-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  cursor: pointer;
  transition: color 0.3s;
}

.favorite-name:hover {
  color: #ff69b4;
}

.favorite-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.favorite-brand {
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 14px;
}

.favorite-category {
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 14px;
}

.favorite-shop {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
  transition: color 0.3s;
}

.favorite-shop:hover {
  color: #ff69b4;
}

.shop-icon {
  margin-right: 5px;
}

.favorite-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-price {
  font-size: 24px;
  font-weight: bold;
  color: #ff69b4;
  margin-top: auto;
}

.favorite-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-left: 20px;
  justify-content: center;
  width: 120px;
}

.favorite-actions button {
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.view-btn {
  background-color: #6a4c93;
  color: white;
}

.view-btn:hover {
  background-color: #5a3d83;
  transform: translateY(-2px);
}

.remove-btn {
  background-color: #f44336;
  color: white;
}

.remove-btn:hover {
  background-color: #e53935;
  transform: translateY(-2px);
}

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  gap: 20px;
}

.page-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  background-color: #ff69b4;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background-color: #ff5ba7;
  transform: translateY(-2px);
}

.page-btn:disabled {
  background-color: #f1f1f1;
  color: #999;
  cursor: not-allowed;
}

.page-number {
  font-size: 16px;
  color: #666;
}

.current-page {
  font-weight: bold;
  color: #ff69b4;
}
</style> 