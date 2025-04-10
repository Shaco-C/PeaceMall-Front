<template>
  <div class="cart-container">
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
      <div class="nav-right">
        <div class="user-info" v-if="isLoggedIn">
          <span>{{ username }}</span>
        </div>
        <div class="nav-item" @click="goToHome">
          <i class="icon">🏠</i>
          <span>回到首页</span>
        </div>
        <div class="nav-item" @click="goToOrders">
          <i class="icon">🎁</i>
          <span>我的订单</span>
        </div>
        <div class="nav-item" @click="goToFavorites">
          <i class="icon">❤️</i>
          <span>我的收藏</span>
        </div>
      </div>
    </div>

    <div class="cart-content">
      <h1 class="cart-title">我的购物车</h1>

      <!-- 购物车为空的情况 -->
      <div v-if="!loading && (!cartItems || cartItems.length === 0)" class="empty-cart">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/10d8389c-466b-4477-bde6-f977ead8db3e.png" alt="空购物车" class="empty-cart-img">
        <p>购物车还是空的哦</p>
        <button class="go-shopping-btn" @click="goToHome">去购物</button>
      </div>

      <!-- 加载中状态 -->
      <div v-else-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载购物车中...</p>
      </div>

      <!-- 购物车商品列表 -->
      <div v-else class="cart-list">
        <!-- 购物车表头 -->
        <div class="cart-header">
          <div class="checkbox-col">
            <input 
              type="checkbox" 
              :checked="allSelected" 
              @change="toggleSelectAll"
              class="checkbox"
            >
          </div>
          <div class="product-col">商品信息</div>
          <div class="config-col">规格</div>
          <div class="price-col">单价</div>
          <div class="quantity-col">数量</div>
          <div class="amount-col">金额</div>
          <div class="action-col">操作</div>
        </div>

        <!-- 按店铺分组 -->
        <div 
          v-for="(group, shopId) in groupedCartItems" 
          :key="shopId" 
          class="shop-group"
        >
          <div class="shop-header">
            <div class="checkbox-col">
              <input 
                type="checkbox" 
                :checked="isShopSelected(shopId)" 
                @change="toggleSelectShop(shopId)"
                class="checkbox"
              >
            </div>
            <div class="shop-info">
              <i class="shop-icon">🏪</i>
              <span class="shop-name">{{ group.shopName }}</span>
            </div>
          </div>

          <!-- 购物车商品 -->
          <div 
            v-for="item in group.items" 
            :key="item.cartItemId" 
            class="cart-item"
          >
            <div class="checkbox-col">
              <input 
                type="checkbox" 
                v-model="selectedItems[item.cartItemId]" 
                class="checkbox"
              >
            </div>
            <div class="product-col">
              <div class="product-info" @click="goToProductDetail(item.productId)">
                <img :src="item.url" :alt="item.productName" class="product-img">
                <div class="product-details">
                  <div class="product-name">{{ item.productName }}</div>
                  <div class="product-brand">{{ item.brand }}</div>
                </div>
              </div>
            </div>
            <div class="config-col">{{ item.configuration }}</div>
            <div class="price-col">¥{{ item.price.toFixed(2) }}</div>
            <div class="quantity-col">
              <div class="quantity-control">
                <button class="quantity-btn minus" @click="decreaseQuantity(item)">-</button>
                <input 
                  type="number" 
                  min="1" 
                  class="quantity-input" 
                  v-model.number="item.quantity"
                  @change="updateQuantity(item)"
                >
                <button class="quantity-btn plus" @click="increaseQuantity(item)">+</button>
              </div>
            </div>
            <div class="amount-col">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
            <div class="action-col">
              <button class="remove-btn" @click="removeCartItem(item.cartItemId)">删除</button>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div class="pagination" v-if="totalPages > 1">
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

        <!-- 底部结算栏 -->
        <div class="cart-footer">
          <div class="select-all">
            <input 
              type="checkbox" 
              :checked="allSelected" 
              @change="toggleSelectAll"
              class="checkbox"
            >
            <span>全选</span>
          </div>
          <div class="remove-selected">
            <button class="remove-selected-btn" @click="removeSelectedItems">删除选中商品</button>
          </div>
          <div class="total-info">
            <div class="selected-count">已选 <span>{{ selectedCount }}</span> 件商品</div>
            <div class="total-price">合计：<span>¥{{ totalPrice.toFixed(2) }}</span></div>
          </div>
          <div class="checkout">
            <button class="checkout-btn" @click="checkout" :disabled="selectedCount === 0">去结算</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { getCartItems, deleteCartItems } from '@/api/cart'

export default {
  name: 'CartPage',
  setup() {
    const router = useRouter()
    const store = useStore()
    const isLoggedIn = ref(false)
    const username = ref('')
    const searchKey = ref('')
    const loading = ref(true)
    const cartItems = ref([])
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalItems = ref(0)
    const totalPages = ref(0)
    const selectedItems = ref({})

    // 检查用户是否已登录
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token')
      const storedUsername = localStorage.getItem('username')
      isLoggedIn.value = !!token
      if (storedUsername) {
        username.value = storedUsername
      }
      
      // 如果未登录，跳转到登录页面
      if (!isLoggedIn.value) {
        router.push('/login')
      }
    }

    // 获取购物车商品
    const fetchCartItems = async () => {
      loading.value = true
      try {
        const response = await getCartItems(currentPage.value, pageSize.value)
        if (response.code === 200 && response.data) {
          cartItems.value = response.data.list || []
          // 不再需要添加默认数量，使用后端返回的quantity
          totalItems.value = Number(response.data.total) || 0
          totalPages.value = Number(response.data.pages) || 0
          
          // 初始化选中状态
          const newSelectedItems = {}
          cartItems.value.forEach(item => {
            newSelectedItems[item.cartItemId] = selectedItems.value[item.cartItemId] || false
          })
          selectedItems.value = newSelectedItems
        } else {
          console.error('获取购物车商品失败:', response.msg)
        }
      } catch (error) {
        console.error('获取购物车商品出错:', error)
      } finally {
        loading.value = false
      }
    }

    // 按店铺分组购物车商品
    const groupedCartItems = computed(() => {
      const groups = {}
      cartItems.value.forEach(item => {
        if (!groups[item.shopId]) {
          groups[item.shopId] = {
            shopId: item.shopId,
            shopName: item.shopName,
            items: []
          }
        }
        groups[item.shopId].items.push(item)
      })
      return groups
    })

    // 是否已选中某个店铺的所有商品
    const isShopSelected = (shopId) => {
      const items = groupedCartItems.value[shopId].items
      return items.every(item => selectedItems.value[item.cartItemId])
    }

    // 选中/取消选中店铺的所有商品
    const toggleSelectShop = (shopId) => {
      const newState = !isShopSelected(shopId)
      const items = groupedCartItems.value[shopId].items
      items.forEach(item => {
        selectedItems.value[item.cartItemId] = newState
      })
    }

    // 是否已全选
    const allSelected = computed(() => {
      if (cartItems.value.length === 0) return false
      return cartItems.value.every(item => selectedItems.value[item.cartItemId])
    })

    // 全选/取消全选
    const toggleSelectAll = () => {
      const newState = !allSelected.value
      cartItems.value.forEach(item => {
        selectedItems.value[item.cartItemId] = newState
      })
    }

    // 已选商品数量
    const selectedCount = computed(() => {
      return cartItems.value.filter(item => selectedItems.value[item.cartItemId]).length
    })

    // 已选商品总价
    const totalPrice = computed(() => {
      return cartItems.value
        .filter(item => selectedItems.value[item.cartItemId])
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
    })

    // 增加商品数量
    const increaseQuantity = (item) => {
      item.quantity++
      updateQuantity(item)
    }

    // 减少商品数量
    const decreaseQuantity = (item) => {
      if (item.quantity > 1) {
        item.quantity--
        updateQuantity(item)
      }
    }

    // 更新商品数量
    const updateQuantity = (item) => {
      // 确保数量至少为1
      if (item.quantity < 1) {
        item.quantity = 1
      }
      
      // 将更新添加到Vuex中
      store.dispatch('cart/addPendingUpdate', {
        cartItemId: item.cartItemId,
        productId: item.productId,
        configId: item.configId,
        quantity: item.quantity
      })
    }

    // 删除购物车商品
    const removeCartItem = async (cartItemId) => {
      if (confirm('确定要删除该商品吗？')) {
        try {
          // 调用删除API，即使只删除一个商品也需要使用数组
          const response = await deleteCartItems([cartItemId])
          
          if (response && response.code === 200) {
            // 删除成功，更新本地数据
            cartItems.value = cartItems.value.filter(item => item.cartItemId !== cartItemId)
            delete selectedItems.value[cartItemId]
            alert('删除成功')
          } else {
            alert('删除失败：' + (response?.msg || '未知错误'))
          }
        } catch (error) {
          console.error('删除购物车商品出错:', error)
          alert('删除失败，请稍后重试')
        }
      }
    }

    // 删除选中的商品
    const removeSelectedItems = async () => {
      const selectedIds = cartItems.value
        .filter(item => selectedItems.value[item.cartItemId])
        .map(item => item.cartItemId)
      
      if (selectedIds.length === 0) {
        alert('请先选择要删除的商品')
        return
      }
      
      if (confirm(`确定要删除选中的 ${selectedIds.length} 件商品吗？`)) {
        try {
          // 调用批量删除API
          const response = await deleteCartItems(selectedIds)
          
          if (response && response.code === 200) {
            // 删除成功，更新本地数据
            cartItems.value = cartItems.value.filter(item => !selectedItems.value[item.cartItemId])
            // 清除已删除商品的选中状态
            selectedIds.forEach(id => {
              delete selectedItems.value[id]
            })
            alert('批量删除成功')
          } else {
            alert('批量删除失败：' + (response?.msg || '未知错误'))
          }
        } catch (error) {
          console.error('批量删除购物车商品出错:', error)
          alert('批量删除失败，请稍后重试')
        }
      }
    }

    // 切换页码
    const changePage = (page) => {
      currentPage.value = page
      fetchCartItems()
    }

    // 跳转到首页
    const goToHome = () => {
      router.push('/')
    }

    // 跳转到订单页面
    const goToOrders = () => {
      router.push('/user/orders')
    }

    // 跳转到收藏页面
    const goToFavorites = () => {
      router.push('/favorites')
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

    // 去结算
    const checkout = () => {
      const selectedItemIds = cartItems.value
        .filter(item => selectedItems.value[item.cartItemId])
        .map(item => item.cartItemId)
      
      if (selectedItemIds.length === 0) {
        alert('请先选择要结算的商品')
        return
      }
      
      // 在进入结算页面前，立即更新购物车商品数量
      store.dispatch('cart/updateCartItemsImmediately')
      
      // 构建订单商品列表
      const selectedCartItems = cartItems.value.filter(item => 
        selectedItems.value[item.cartItemId]
      )
      
      // 转换为订单需要的格式
      const orderItems = selectedCartItems.map(item => ({
        productId: item.productId,
        configId: item.configId,
        name: item.productName || item.name,
        configName: item.configuration || item.configName,
        price: item.price,
        imageUrl: item.url || item.imgUrl,
        quantity: item.quantity
      }))
      
      // 将商品数据序列化为JSON字符串并传递给确认订单页面
      const orderItemsJson = JSON.stringify(orderItems)
      router.push({
        path: `/confirm-order/${encodeURIComponent(orderItemsJson)}`
      })
    }

    // 跳转到商品详情页面
    const goToProductDetail = (productId) => {
      router.push({
        path: '/product',
        query: { id: productId }
      })
    }

    // 组件卸载前更新购物车商品数量
    onBeforeUnmount(() => {
      store.dispatch('cart/updateCartItemsImmediately')
    })

    onMounted(() => {
      checkLoginStatus()
      fetchCartItems()
    })

    return {
      isLoggedIn,
      username,
      searchKey,
      loading,
      cartItems,
      currentPage,
      totalPages,
      selectedItems,
      groupedCartItems,
      allSelected,
      selectedCount,
      totalPrice,
      isShopSelected,
      toggleSelectShop,
      toggleSelectAll,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      removeCartItem,
      removeSelectedItems,
      changePage,
      goToHome,
      goToOrders,
      goToFavorites,
      handleSearch,
      checkout,
      goToProductDetail
    }
  }
}
</script>

<style scoped>
.cart-container {
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

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  color: #333;
  font-weight: bold;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.nav-item:hover {
  color: #ff69b4;
}

.icon {
  font-size: 20px;
  margin-bottom: 5px;
}

/* 购物车内容样式 */
.cart-content {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cart-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* 购物车为空的样式 */
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.empty-cart-img {
  width: 200px;
  height: 200px;
  margin-bottom: 20px;
}

.go-shopping-btn {
  margin-top: 20px;
  padding: 10px 30px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.go-shopping-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
}

/* 加载中状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
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

/* 购物车商品列表样式 */
.cart-list {
  width: 100%;
}

.cart-header {
  display: flex;
  align-items: center;
  padding: 15px 0;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
  font-weight: bold;
}

.checkbox-col {
  width: 5%;
  text-align: center;
}

.product-col {
  width: 40%;
  padding: 0 10px;
}

.config-col {
  width: 15%;
  text-align: center;
}

.price-col {
  width: 10%;
  text-align: center;
}

.quantity-col {
  width: 10%;
  text-align: center;
}

.amount-col {
  width: 10%;
  text-align: center;
  color: #ff69b4;
  font-weight: bold;
}

.action-col {
  width: 10%;
  text-align: center;
}

/* 店铺分组样式 */
.shop-group {
  margin-bottom: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.shop-header {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.shop-info {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.shop-icon {
  font-size: 20px;
  margin-right: 10px;
}

.shop-name {
  font-weight: bold;
}

/* 购物车单个商品样式 */
.cart-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.cart-item:last-child {
  border-bottom: none;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.product-info {
  display: flex;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  transition: all 0.3s;
}

.product-info:hover {
  background-color: #f0f8ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

.product-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 15px;
}

.product-details {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.product-brand {
  color: #666;
  font-size: 14px;
}

.quantity-control {
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  background-color: #f8f9fa;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.quantity-btn:hover {
  background-color: #eee;
}

.quantity-btn.minus {
  border-radius: 4px 0 0 4px;
}

.quantity-btn.plus {
  border-radius: 0 4px 4px 0;
}

.quantity-input {
  width: 40px;
  height: 28px;
  border: 1px solid #ddd;
  border-left: none;
  border-right: none;
  text-align: center;
  font-size: 14px;
}

.quantity-input::-webkit-inner-spin-button, 
.quantity-input::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}

.remove-btn {
  padding: 5px 10px;
  background-color: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background-color: #ff4757;
  color: white;
  border-color: #ff4757;
}

/* 分页控件样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
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

/* 底部结算栏样式 */
.cart-footer {
  display: flex;
  align-items: center;
  padding: 15px 0;
  margin-top: 20px;
  border-top: 1px solid #eee;
}

.select-all {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.select-all span {
  margin-left: 8px;
}

.remove-selected {
  margin-right: 20px;
}

.remove-selected-btn {
  padding: 5px 10px;
  background-color: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-selected-btn:hover {
  background-color: #ff4757;
  color: white;
  border-color: #ff4757;
}

.total-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.selected-count {
  margin-bottom: 5px;
}

.selected-count span {
  color: #ff69b4;
  font-weight: bold;
}

.total-price {
  font-size: 18px;
}

.total-price span {
  color: #ff69b4;
  font-weight: bold;
}

.checkout {
  margin-left: 20px;
}

.checkout-btn {
  padding: 10px 30px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.checkout-btn:hover:not(:disabled) {
  background-color: #ff5ba7;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
}

.checkout-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style> 