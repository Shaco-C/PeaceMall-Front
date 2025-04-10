<template>
  <div class="product-detail-container">
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
      <p>商品信息加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="fetchProductDetails" class="retry-btn">重试</button>
      <button @click="goBack" class="back-to-list-btn">返回列表</button>
    </div>

    <!-- 商品详情 -->
    <div v-else-if="product" class="product-content">
      <!-- 商品基本信息区 -->
      <div class="product-basic-info">
        <!-- 商品图片轮播 -->
        <div class="product-gallery">
          <div class="main-image">
            <img :src="currentImage" :alt="product.name">
          </div>
          <div class="image-thumbnails" v-if="product.productImagesList && product.productImagesList.length > 0">
            <div 
              v-for="(image, index) in product.productImagesList" 
              :key="index"
              class="thumbnail"
              :class="{ active: currentImageIndex === index }"
              @click="setCurrentImage(index)"
            >
              <img :src="image.url" :alt="`${product.name} - 图片${index + 1}`">
            </div>
          </div>
        </div>

        <!-- 商品信息 -->
        <div class="product-info">
          <h1 class="product-name">{{ product.name }}</h1>
          <div class="product-brand">{{ product.brand }}</div>
          <div class="product-description">{{ product.description }}</div>
          
          <!-- 配置选择 -->
          <div class="product-configurations" v-if="product.productConfigurationsList && product.productConfigurationsList.length > 0">
            <div class="section-title">配置选择</div>
            <div class="configurations-list">
              <div 
                v-for="config in product.productConfigurationsList" 
                :key="config.configId"
                class="config-item"
                :class="{ active: selectedConfig === config.configId }"
                @click="selectConfig(config.configId)"
              >
                <div class="config-name">{{ config.configuration }}</div>
                <div class="config-price">¥{{ config.price.toFixed(2) }}</div>
              </div>
            </div>
          </div>
          
          <!-- 价格显示 -->
          <div class="price-actions">
            <div class="product-price">
              <span>¥</span>{{ formatPrice(getSelectedConfigPrice()) }}
            </div>
            <div class="action-buttons">
              <button class="add-to-cart" @click="openAddCartModal">加入购物车</button>
              <button class="buy-now" @click="buyNow">立即购买</button>
              <button class="favorite-btn" :class="{ 'favorited': isFavorite }" @click="toggleFavorite">
                <span v-if="!isFavorite">❤ 收藏</span>
                <span v-else>❤ 已收藏</span>
              </button>
            </div>
          </div>
          
          <!-- 库存显示 -->
          <div class="product-stock" v-if="getSelectedConfig()">
            <div class="stock-label">库存</div>
            <div class="stock-value">{{ getSelectedConfig().stock }} 件</div>
          </div>
        </div>
      </div>
      
      <!-- 店铺信息 -->
      <div class="shop-info">
        <div class="shop-header">
          <div class="shop-avatar">
            <img :src="product.shopAvatarUrl || 'https://peacemall.oss-cn-fuzhou.aliyuncs.com/10d8389c-466b-4477-bde6-f977ead8db3e.png'" alt="店铺头像">
          </div>
          <div class="shop-details">
            <div class="shop-name">{{ product.shopName }}</div>
            <div class="shop-description">{{ product.shopDescription }}</div>
          </div>
          <div class="visit-shop-btn">
            <button @click="goToShop">进入店铺</button>
          </div>
        </div>
      </div>

      <!-- 商品详情图文区域 -->
      <div class="product-details-section">
        <div class="section-header">
          <h2>商品详情</h2>
        </div>
        <div class="product-images">
          <div v-for="(image, index) in product.productImagesList" :key="`detail-${index}`" class="detail-image">
            <img :src="image.url" :alt="`${product.name} - 详情图${index + 1}`">
          </div>
        </div>
      </div>
    </div>

    <!-- 加入购物车弹窗 -->
    <div v-if="showAddCartModal" class="add-cart-modal">
      <div class="modal-content">
        <span class="close-btn" @click="closeAddCartModal">&times;</span>
        <h2>选择购买数量</h2>
        <div class="quantity-controls">
          <button @click="decreaseQuantity">-</button>
          <span>{{ quantity }}</span>
          <button @click="increaseQuantity">+</button>
        </div>
        <button @click="addToCartHandler" :disabled="isAddingToCart" class="add-to-cart-btn">添加到购物车</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getProductDetailsById } from '@/api/product'
import { addToCart } from '@/api/cart'
import { addToFavorites, checkIsFavorite } from '@/api/favorites'

export default {
  name: 'ProductDetailPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const product = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const currentImageIndex = ref(0)
    const selectedConfig = ref('')
    const quantity = ref(1) // 购买数量
    const showAddCartModal = ref(false) // 控制加入购物车弹窗显示
    const isAddingToCart = ref(false) // 加入购物车请求状态
    const isFavorite = ref(false) // 是否已收藏
    const isAddingFavorite = ref(false) // 添加收藏请求状态
    
    // 获取当前显示的图片
    const currentImage = computed(() => {
      if (!product.value || !product.value.productImagesList || product.value.productImagesList.length === 0) {
        return 'https://peacemall.oss-cn-fuzhou.aliyuncs.com/10d8389c-466b-4477-bde6-f977ead8db3e.png'
      }
      
      return product.value.productImagesList[currentImageIndex.value].url
    })
    
    // 设置当前图片
    const setCurrentImage = (index) => {
      currentImageIndex.value = index
    }
    
    // 选择配置
    const selectConfig = (configId) => {
      selectedConfig.value = configId
    }
    
    // 获取选中的配置
    const getSelectedConfig = () => {
      if (!product.value || !product.value.productConfigurationsList) return null
      
      if (!selectedConfig.value && product.value.productConfigurationsList.length > 0) {
        // 如果没有选中的配置，默认选择第一个
        selectedConfig.value = product.value.productConfigurationsList[0].configId
      }
      
      return product.value.productConfigurationsList.find(config => config.configId === selectedConfig.value)
    }
    
    // 获取选中的配置价格
    const getSelectedConfigPrice = () => {
      const config = getSelectedConfig()
      if (config) {
        return config.price
      } else if (product.value && product.value.price) {
        return product.value.price
      }
      return null
    }
    
    // 格式化价格
    const formatPrice = (price) => {
      if (price) {
        return price.toFixed(2)
      }
      return '价格未知'
    }
    
    // 增加购买数量
    const increaseQuantity = () => {
      const config = getSelectedConfig()
      if (config && quantity.value < config.stock) {
        quantity.value++
      } else if (!config && product.value && product.value.stock && quantity.value < product.value.stock) {
        quantity.value++
      }
    }
    
    // 减少购买数量
    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--
      }
    }
    
    // 打开加入购物车弹窗
    const openAddCartModal = () => {
      // 检查是否登录
      const token = localStorage.getItem('token')
      if (!token) {
        alert('请先登录')
        router.push('/login')
        return
      }
      
      // 检查是否选择了配置
      if (product.value && product.value.productConfigurationsList && product.value.productConfigurationsList.length > 0 && !selectedConfig.value) {
        alert('请选择商品配置')
        return
      }
      
      showAddCartModal.value = true
    }
    
    // 关闭加入购物车弹窗
    const closeAddCartModal = () => {
      showAddCartModal.value = false
    }
    
    // 添加到购物车
    const addToCartHandler = async () => {
      const config = getSelectedConfig()
      
      if (!product.value) {
        alert('商品信息不存在')
        return
      }
      
      if (config && config.stock < quantity.value) {
        alert('商品库存不足')
        return
      }
      
      isAddingToCart.value = true
      
      try {
        const cartItemDTO = {
          productId: product.value.productId,
          configId: config ? config.configId : null,
          quantity: quantity.value
        }
        
        const response = await addToCart(cartItemDTO)
        
        if (response && response.code === 200) {
          alert('添加购物车成功')
          closeAddCartModal()
        } else {
          alert('添加购物车失败：' + (response?.msg || '未知错误'))
        }
      } catch (error) {
        console.error('添加购物车出错:', error)
        alert('添加购物车失败，请稍后重试')
      } finally {
        isAddingToCart.value = false
      }
    }
    
    // 返回上一页
    const goBack = () => {
      router.back()
    }
    
    // 返回首页
    const goToHome = () => {
      router.push('/')
    }
    
    // 跳转到店铺页面
    const goToShop = () => {
      if (product.value && product.value.shopId) {
        router.push({
          path: '/shop',
          query: { id: product.value.shopId }
        })
      }
    }
    
    // 立即购买
    const buyNow = () => {
      // 检查是否登录
      const token = localStorage.getItem('token')
      if (!token) {
        alert('请先登录')
        router.push('/login')
        return
      }
      
      // 检查是否选择了配置
      if (product.value && product.value.productConfigurationsList && product.value.productConfigurationsList.length > 0 && !selectedConfig.value) {
        alert('请选择商品配置')
        return
      }

      const config = getSelectedConfig()
      
      if (!product.value) {
        alert('商品信息不存在')
        return
      }
      
      if (config && config.stock < 1) {
        alert('商品库存不足')
        return
      }

      // 构建购买商品数据
      const orderItem = {
        productId: product.value.productId,
        configId: config ? config.configId : null,
        name: product.value.name,
        configName: config ? config.configuration : '',
        price: config ? config.price : product.value.price,
        imageUrl: product.value.productImagesList && product.value.productImagesList.length > 0 
          ? product.value.productImagesList[0].url 
          : null,
        quantity: 1
      }

      // 将商品数据序列化为JSON字符串并传递给确认订单页面
      const orderItemsJson = JSON.stringify([orderItem])
      router.push({
        path: `/confirm-order/${encodeURIComponent(orderItemsJson)}`
      })
    }
    
    // 获取商品详情
    const fetchProductDetails = async () => {
      loading.value = true
      error.value = null
      
      try {
        const productId = route.query.id
        
        if (!productId) {
          error.value = '商品ID不存在'
          loading.value = false
          return
        }
        
        const response = await getProductDetailsById(productId)
        
        if (response.code === 200 && response.data) {
          product.value = response.data
          
          // 如果有配置，默认选择第一个
          if (product.value.productConfigurationsList && product.value.productConfigurationsList.length > 0) {
            selectedConfig.value = product.value.productConfigurationsList[0].configId
          }
          
          // 检查是否已收藏
          checkFavoriteStatus(productId)
        } else {
          error.value = response.msg || '获取商品详情失败'
        }
      } catch (err) {
        console.error('获取商品详情错误:', err)
        error.value = '获取商品详情失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }
    
    // 检查商品是否已收藏
    const checkFavoriteStatus = async (productId) => {
      // 检查是否登录
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }
      
      try {
        const response = await checkIsFavorite(productId)
        if (response && response.code === 200) {
          isFavorite.value = response.data === true
        }
      } catch (err) {
        console.error('检查收藏状态出错:', err)
      }
    }
    
    // 添加或取消收藏
    const toggleFavorite = async () => {
      // 检查是否登录
      const token = localStorage.getItem('token')
      if (!token) {
        alert('请先登录')
        router.push('/login')
        return
      }
      
      if (!product.value || !product.value.productId) {
        alert('商品信息不完整')
        return
      }
      
      isAddingFavorite.value = true
      
      try {
        if (!isFavorite.value) {
          // 添加收藏
          const response = await addToFavorites(product.value.productId)
          if (response && response.code === 200) {
            isFavorite.value = true
            alert('收藏成功')
          } else {
            alert(response?.msg || '收藏失败')
          }
        } else {
          // 目前API不支持直接取消收藏，只能在收藏列表中取消
          alert('请在我的收藏页面取消收藏')
        }
      } catch (err) {
        console.error('收藏操作出错:', err)
        alert('操作失败，请稍后重试')
      } finally {
        isAddingFavorite.value = false
      }
    }
    
    onMounted(() => {
      fetchProductDetails()
    })
    
    return {
      product,
      loading,
      error,
      currentImageIndex,
      currentImage,
      selectedConfig,
      quantity,
      showAddCartModal,
      isAddingToCart,
      isFavorite,
      isAddingFavorite,
      setCurrentImage,
      selectConfig,
      getSelectedConfig,
      getSelectedConfigPrice,
      formatPrice,
      increaseQuantity,
      decreaseQuantity,
      openAddCartModal,
      closeAddCartModal,
      addToCartHandler,
      goBack,
      goToHome,
      goToShop,
      buyNow,
      fetchProductDetails,
      toggleFavorite
    }
  }
}
</script>

<style scoped>
.product-detail-container {
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

/* 商品内容区域 */
.product-content {
  padding: 30px 5%;
}

/* 商品基本信息区域 */
.product-basic-info {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 30px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

/* 商品图片区域 */
.product-gallery {
  flex: 1;
  min-width: 400px;
}

.main-image {
  width: 100%;
  height: 400px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f8f9fe;
}

.image-thumbnails {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 5px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.thumbnail:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

.thumbnail.active {
  border-color: #ff69b4;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f8f9fe;
}

/* 商品信息区域 */
.product-info {
  flex: 1;
  min-width: 400px;
}

.product-name {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.product-brand {
  font-size: 16px;
  color: #6a4c93;
  margin-bottom: 15px;
}

.product-description {
  font-size: 16px;
  color: #666;
  margin-bottom: 25px;
  line-height: 1.5;
}

/* 配置选择区域 */
.product-configurations {
  margin-bottom: 25px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.configurations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.config-item {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.config-item:hover {
  border-color: #ff69b4;
  transform: translateY(-2px);
}

.config-item.active {
  border-color: #ff69b4;
  background-color: #fff5f9;
}

.config-name {
  font-size: 14px;
  color: #333;
}

.config-price {
  font-size: 14px;
  color: #ff69b4;
  font-weight: bold;
  margin-top: 5px;
}

/* 价格和库存 */
.product-price, .product-stock {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.price-label, .stock-label {
  font-size: 16px;
  color: #666;
  width: 60px;
}

.price-value {
  font-size: 24px;
  color: #ff69b4;
  font-weight: bold;
}

.stock-value {
  font-size: 16px;
  color: #333;
}

/* 价格和操作按钮样式 */
.price-actions {
  margin: 20px 0;
}

.product-price {
  font-size: 24px;
  color: #ff69b4;
  font-weight: bold;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-buttons button {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.add-to-cart {
  background-color: #ff9800;
  color: white;
}

.add-to-cart:hover {
  background-color: #f57c00;
  transform: translateY(-2px);
}

.buy-now {
  background-color: #ff5722;
  color: white;
}

.buy-now:hover {
  background-color: #e64a19;
  transform: translateY(-2px);
}

.favorite-btn {
  background-color: #f5f5f5;
  color: #757575;
  border: 1px solid #e0e0e0 !important;
}

.favorite-btn:hover {
  background-color: #eeeeee;
  transform: translateY(-2px);
}

.favorite-btn.favorited {
  background-color: #ffebee;
  color: #e53935;
  border-color: #ffcdd2 !important;
}

.favorite-btn.favorited:hover {
  background-color: #ffcdd2;
  transform: translateY(-2px);
}

/* 店铺信息 */
.shop-info {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.shop-header {
  display: flex;
  align-items: center;
}

.shop-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
}

.shop-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f8f9fe;
}

.shop-details {
  flex: 1;
}

.shop-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.shop-description {
  font-size: 14px;
  color: #666;
}

.visit-shop-btn button {
  padding: 8px 15px;
  background-color: #f8f9fe;
  color: #6a4c93;
  border: 1px solid #6a4c93;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.visit-shop-btn button:hover {
  background-color: #6a4c93;
  color: white;
}

/* 商品详情区域 */
.product-details-section {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.section-header {
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  color: #6a4c93;
  margin: 0;
}

.product-images {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-image {
  width: 100%;
}

.detail-image img {
  width: 100%;
  border-radius: 5px;
  object-fit: contain;
  background-color: #f8f9fe;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-basic-info {
    flex-direction: column;
  }
  
  .product-gallery, .product-info {
    min-width: 100%;
  }
  
  .main-image {
    height: 300px;
  }
}

/* 加入购物车弹窗样式 */
.add-cart-modal {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  width: 350px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #333;
}

.quantity-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 25px 0;
}

.quantity-controls button {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.quantity-controls button:hover {
  background-color: #e0e0e0;
}

.quantity-controls span {
  margin: 0 15px;
  font-size: 18px;
  min-width: 30px;
  text-align: center;
}

.add-cart-modal h2 {
  color: #333;
  font-size: 18px;
  margin-bottom: 20px;
  font-weight: normal;
}

.add-cart-modal .add-to-cart-btn {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-cart-modal .add-to-cart-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.3);
}

.add-cart-modal .add-to-cart-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style> 