<template>
  <div class="order-history-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>我的订单</h1>
      </div>
      <div class="back-btn" @click="goToHome">
        <span>返回首页</span>
      </div>
    </div>

    <!-- 订单内容 -->
    <div class="order-content">
      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载订单信息中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <p>{{ error }}</p>
        <button @click="fetchOrders" class="retry-btn">重试</button>
      </div>

      <!-- 无订单状态 -->
      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>您还没有任何订单</p>
        <button @click="goToHome" class="shop-now-btn">去逛逛</button>
      </div>

      <!-- 订单列表 -->
      <div v-else class="order-list">
        <div v-for="order in orders" :key="order.orderId" class="order-card">
          <div class="order-header">
            <div class="shop-info">
              <span class="shop-icon">🏪</span>
              <span class="shop-name">{{ order.shopName }}</span>
            </div>
            <div class="order-status" :class="getOrderStatusClass(order.status)">
              {{ formatOrderStatus(order.status) }}
              <div v-if="order.status === 'PENDING_PAYMENT'" class="order-countdown">
                {{ getCountdownTime(order) }}
              </div>
              <!-- 显示退货状态 -->
              <div v-if="order.returnStatus && order.returnStatus !== 'NOT_REQUESTED'" class="return-status-tag" :class="'return-' + order.returnStatus.toLowerCase()">
                {{ formatReturnStatus(order.returnStatus) }}
              </div>
            </div>
          </div>

          <div class="order-items">
            <div v-for="item in order.orderItemsList" :key="item.orderItemId" class="order-item">
              <div class="item-image">
                <img :src="item.url || 'https://via.placeholder.com/80'" :alt="item.name">
              </div>
              <div class="item-details">
                <div class="item-name" @click="goToProductDetail(item.productId)">{{ item.name }}</div>
                <div class="item-config">{{ item.configuration }}</div>
                <div class="item-brand">{{ item.brand }}</div>
              </div>
              <div class="item-price-qty">
                <div class="item-price">¥{{ formatPrice(item.price) }}</div>
                <div class="item-qty">x{{ item.quantity }}</div>
              </div>
            </div>
          </div>

          <div class="order-footer">
            <div class="order-info">
              <div class="order-id">订单号: {{ order.orderId }}</div>
              <div class="order-time">下单时间: {{ formatOrderTime(order.createdAt) }}</div>
            </div>
            <div class="order-total">
              <span>共 {{ getTotalQuantity(order) }} 件商品</span>
              <span class="total-amount">合计：<span class="price">¥{{ formatPrice(order.totalAmount) }}</span></span>
            </div>
            <div class="order-actions">
              <button v-if="canCancel(order)" @click="cancelOrder(order)" class="cancel-btn">取消订单</button>
              <button v-if="canPay(order)" @click="payOrder(order)" class="pay-btn">付款</button>
              <button v-if="canConfirm(order)" @click="confirmOrder(order)" class="confirm-btn">确认收货</button>
              <button v-if="canReview(order)" @click="reviewOrder(order)" class="review-btn">评价</button>
              <button @click="viewOrderDetail(order)" class="detail-btn">订单详情</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="orders.length > 0" class="pagination">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderHistoryList, cancelOrder as apiCancelOrder, payOrder as apiPayOrder, confirmReceipt as apiConfirmReceipt } from '@/api/orders'

export default {
  name: 'OrderHistoryPage',
  setup() {
    const router = useRouter()
    const orders = ref([])
    const loading = ref(true)
    const error = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(5)
    const totalPages = ref(1)
    const totalOrders = ref(0)

    // 存储所有订单的倒计时
    const countdownTimers = ref({})

    // 清除所有定时器
    const clearAllTimers = () => {
      Object.values(countdownTimers.value).forEach(timer => {
        if (timer) clearInterval(timer)
      })
      countdownTimers.value = {}
    }

    // 组件卸载时清除所有定时器
    onUnmounted(() => {
      clearAllTimers()
    })

    // 获取订单的倒计时时间
    const getCountdownTime = (order) => {
      if (order.status !== 'PENDING_PAYMENT') return ''
      
      const orderId = order.orderId
      const timerKey = `countdown_${orderId}`
      
      // 如果没有这个订单的状态存储，初始化它
      if (!order._countdownSeconds) {
        // 获取订单创建时间
        const createdAt = new Date(order.createdAt)
        // 计算截止时间（创建时间+10分钟）
        const expiryTime = new Date(createdAt.getTime() + 10 * 60 * 1000)
        // 计算当前时间到截止时间的剩余秒数
        const now = new Date()
        const remainingTime = Math.max(0, Math.floor((expiryTime - now) / 1000))
        
        // 如果已经过期，不需要显示倒计时
        if (remainingTime <= 0) return '已过期'
        
        // 初始化倒计时秒数
        order._countdownSeconds = remainingTime
        
        // 设置定时器，每秒减少一秒
        if (!countdownTimers.value[timerKey]) {
          countdownTimers.value[timerKey] = setInterval(() => {
            order._countdownSeconds--
            
            // 如果倒计时结束
            if (order._countdownSeconds <= 0) {
              // 清除定时器
              clearInterval(countdownTimers.value[timerKey])
              countdownTimers.value[timerKey] = null
              
              // 重新获取订单列表
              fetchOrders()
            }
          }, 1000)
        }
      }
      
      // 格式化倒计时时间
      const minutes = Math.floor(order._countdownSeconds / 60)
      const seconds = order._countdownSeconds % 60
      return `${minutes}分${seconds}秒后自动取消`
    }

    // 获取订单历史
    const fetchOrders = async () => {
      loading.value = true
      error.value = null
      // 清除旧的定时器
      clearAllTimers()
      
      try {
        const response = await getOrderHistoryList(currentPage.value, pageSize.value)
        
        if (response && response.code === 200 && response.data) {
          orders.value = response.data.list || []
          totalPages.value = parseInt(response.data.pages) || 1
          totalOrders.value = parseInt(response.data.total) || 0
        } else {
          console.error('获取订单列表失败:', response?.msg || '未知错误')
          orders.value = []
          error.value = response?.msg || '获取订单数据失败'
        }
      } catch (err) {
        console.error('获取订单历史出错：', err)
        orders.value = []
        error.value = '获取订单历史失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    // 切换页码
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return
      
      currentPage.value = page
      fetchOrders()
      
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 格式化价格
    const formatPrice = (price) => {
      if (price === undefined || price === null) return '0.00'
      return parseFloat(price).toFixed(2)
    }

    // 格式化订单状态
    const formatOrderStatus = (status) => {
      const statusMap = {
        'PENDING_PAYMENT': '待支付',
        'PENDING': '待发货',
        'SHIPPED': '已发货',
        'IN_TRANSIT': '运输中',
        'DELIVERED': '已送达',
        'RECEIVED': '已收货',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || status
    }

    // 获取订单状态对应的CSS类
    const getOrderStatusClass = (status) => {
      const classMap = {
        'PENDING_PAYMENT': 'status-pending-payment',
        'PENDING': 'status-pending',
        'SHIPPED': 'status-shipped',
        'IN_TRANSIT': 'status-in-transit',
        'DELIVERED': 'status-delivered',
        'RECEIVED': 'status-received',
        'CANCELLED': 'status-cancelled'
      }
      return classMap[status] || ''
    }

    // 格式化订单时间
    const formatOrderTime = (timestamp) => {
      if (!timestamp) return '未知时间'
      
      // 已经是格式化后的时间字符串，如 "2025-03-28 22:42:05.0"
      if (typeof timestamp === 'string' && timestamp.includes('-')) {
        // 清除可能存在的毫秒部分
        return timestamp.split('.')[0]
      }
      
      // 如果是时间戳，转换为日期格式
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    // 格式化退货状态
    const formatReturnStatus = (status) => {
      const statusMap = {
        'NOT_REQUESTED': '未申请退货',
        'REQUESTED': '退货申请中',
        'APPROVED': '退货已批准',
        'REJECTED': '退货已拒绝',
        'RETURNED': '已退货',
        'RECEIVED': '商家已收货'
      }
      return statusMap[status] || status
    }

    // 获取订单总商品数量
    const getTotalQuantity = (order) => {
      if (!order.orderItemsList) return 0
      
      return order.orderItemsList.reduce((total, item) => total + item.quantity, 0)
    }

    // 判断是否可以取消订单
    const canCancel = (order) => {
      return ['PENDING_PAYMENT', 'PENDING'].includes(order.status)
    }

    // 判断是否可以付款
    const canPay = (order) => {
      return order.status === 'PENDING_PAYMENT'
    }

    // 判断是否可以确认收货
    const canConfirm = (order) => {
      return ['DELIVERED', 'IN_TRANSIT'].includes(order.status)
    }

    // 判断是否可以评价
    const canReview = (order) => {
      return order.status === 'RECEIVED'
    }

    // 取消订单
    const cancelOrder = async (order) => {
      if (!confirm(`确定要取消订单 ${order.orderId} 吗？`)) {
        return
      }

      try {
        loading.value = true
        const response = await apiCancelOrder(order.orderId)
        
        if (response.code === 200) {
          alert('订单取消成功')
          // 刷新订单列表
          fetchOrders()
        } else {
          alert(response.msg || '取消订单失败')
        }
      } catch (err) {
        console.error('取消订单出错：', err)
        alert('取消订单失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 付款
    const payOrder = async (order) => {
      if (!confirm(`确定要支付订单 ${order.orderId} 吗？\n支付金额: ¥${formatPrice(order.totalAmount)}`)) {
        return
      }

      try {
        loading.value = true
        const response = await apiPayOrder(order.orderId)
        
        if (response.code === 200) {
          alert('订单支付成功')
          // 刷新订单列表
          fetchOrders()
        } else {
          alert(response.msg || '支付订单失败')
        }
      } catch (err) {
        console.error('支付订单出错：', err)
        alert('支付订单失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 确认收货
    const confirmOrder = async (order) => {
      if (!confirm(`确定要确认收货吗？订单号: ${order.orderId}`)) {
        return
      }

      try {
        loading.value = true
        const response = await apiConfirmReceipt(order.orderId)
        
        if (response.code === 200) {
          alert('确认收货成功')
          // 刷新订单列表
          fetchOrders()
        } else {
          alert(response.msg || '确认收货失败')
        }
      } catch (err) {
        console.error('确认收货出错：', err)
        alert('确认收货失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 评价
    const reviewOrder = (order) => {
      alert(`评价功能开发中，订单商品数: ${getTotalQuantity(order)}`)
    }

    // 查看订单详情
    const viewOrderDetail = (order) => {
      router.push({
        path: `/user/orders/${order.orderId}`
      })
    }

    // 跳转到首页
    const goToHome = () => {
      router.push('/')
    }

    // 跳转到商品详情
    const goToProductDetail = (productId) => {
      router.push({
        path: '/product',
        query: { id: productId }
      })
    }

    onMounted(() => {
      fetchOrders()
    })

    return {
      orders,
      loading,
      error,
      currentPage,
      totalPages,
      totalOrders,
      fetchOrders,
      changePage,
      formatPrice,
      formatOrderStatus,
      getOrderStatusClass,
      formatOrderTime,
      getTotalQuantity,
      canCancel,
      canPay,
      canConfirm,
      canReview,
      cancelOrder,
      payOrder,
      confirmOrder,
      reviewOrder,
      viewOrderDetail,
      goToHome,
      goToProductDetail,
      getCountdownTime,
      formatReturnStatus
    }
  }
}
</script>

<style scoped>
.order-history-container {
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

/* 订单列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #f8f9fe;
  border-bottom: 1px solid #eaeaea;
}

.shop-info {
  display: flex;
  align-items: center;
}

.shop-icon {
  margin-right: 8px;
}

.shop-name {
  font-weight: bold;
}

.order-status {
  padding: 4px 10px;
  border-radius: 15px;
  font-weight: bold;
  font-size: 14px;
}

.status-pending-payment {
  background-color: #fff3e0;
  color: #ff9800;
}

.status-pending {
  background-color: #e3f2fd;
  color: #2196f3;
}

.status-shipped {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-in-transit {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-delivered {
  background-color: #e0f2f1;
  color: #009688;
}

.status-received {
  background-color: #e0f2f1;
  color: #009688;
}

.status-cancelled {
  background-color: #f5f5f5;
  color: #9e9e9e;
}

.order-items {
  padding: 15px 20px;
}

.order-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px dashed #eaeaea;
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  margin-right: 15px;
  border-radius: 5px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  cursor: pointer;
  transition: color 0.3s;
}

.item-name:hover {
  color: #ff69b4;
}

.item-config {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.item-brand {
  color: #999;
  font-size: 12px;
}

.item-price-qty {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  width: 120px;
}

.item-price {
  font-weight: bold;
  color: #ff69b4;
  margin-bottom: 5px;
}

.item-qty {
  color: #666;
  font-size: 14px;
}

.order-footer {
  padding: 15px 20px;
  border-top: 1px solid #eaeaea;
  background-color: #fafafa;
}

.order-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 10px 0;
  font-size: 14px;
}

.total-amount {
  margin-left: 20px;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #ff69b4;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.order-actions button {
  padding: 8px 15px;
  border-radius: 20px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background-color: #eeeeee;
}

.pay-btn {
  background-color: #ff9800;
  color: white;
}

.pay-btn:hover {
  background-color: #f57c00;
  transform: translateY(-2px);
}

.confirm-btn {
  background-color: #4caf50;
  color: white;
}

.confirm-btn:hover {
  background-color: #43a047;
  transform: translateY(-2px);
}

.review-btn {
  background-color: #ff69b4;
  color: white;
}

.review-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-2px);
}

.detail-btn {
  background-color: #eeeeee;
  color: #333;
}

.detail-btn:hover {
  background-color: #e0e0e0;
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

/* 订单倒计时样式 */
.order-countdown {
  font-size: 12px;
  margin-top: 5px;
  color: #ff5722;
  font-weight: normal;
}

.status-pending-payment .order-countdown {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* 退货状态标签 */
.return-status-tag {
  display: inline-block;
  margin-top: 5px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: normal;
}

.return-requested {
  background-color: #fff8e1;
  color: #ffa000;
}

.return-approved {
  background-color: #e8f5e9;
  color: #43a047;
}

.return-rejected {
  background-color: #ffebee;
  color: #e53935;
}

.return-returned {
  background-color: #e3f2fd;
  color: #1976d2;
}

.return-received {
  background-color: #f3e5f5;
  color: #8e24aa;
}
</style> 