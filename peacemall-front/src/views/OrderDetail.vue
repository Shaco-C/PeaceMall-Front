<template>
  <div class="order-detail-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>订单详情</h1>
      </div>
      <div class="back-btn" @click="goBack">
        <span>返回订单列表</span>
      </div>
    </div>

    <!-- 订单内容 -->
    <div class="order-content">
      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载订单详情中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <p>{{ error }}</p>
        <button @click="fetchOrderDetails" class="retry-btn">重试</button>
      </div>

      <!-- 订单详情 -->
      <div v-else-if="orderDetails" class="order-detail">
        <!-- 订单状态卡片 -->
        <div class="status-card">
          <div class="status-header">
            <h2>订单状态</h2>
            <div class="order-status" :class="getOrderStatusClass(orderDetails.status)">
              {{ formatOrderStatus(orderDetails.status) }}
            </div>
          </div>
          
          <!-- 待支付订单的倒计时 -->
          <div v-if="orderDetails.status === 'PENDING_PAYMENT'" class="countdown-section">
            <div class="countdown-label">支付倒计时：</div>
            <div class="countdown-timer" :class="{'countdown-warning': remainingSeconds < 300}">
              {{ formatCountdown }}
            </div>
            <div class="countdown-tip">订单将在倒计时结束后自动取消</div>
          </div>

          <div v-if="orderDetails.returnStatus && orderDetails.returnStatus !== 'NOT_REQUESTED'" class="return-status-info">
            <div class="return-status-label">退货状态：</div>
            <div class="return-status-value" :class="'return-' + orderDetails.returnStatus.toLowerCase()">
              {{ formatReturnStatus(orderDetails.returnStatus) }}
            </div>
          </div>
          
          <div class="status-timeline">
            <div class="timeline-item" :class="{ active: isStatusActive('PENDING_PAYMENT') }">
              <div class="timeline-icon">1</div>
              <div class="timeline-text">待支付</div>
            </div>
            <div class="timeline-line" :class="{ active: isStatusActive('PENDING') }"></div>
            <div class="timeline-item" :class="{ active: isStatusActive('PENDING') }">
              <div class="timeline-icon">2</div>
              <div class="timeline-text">待发货</div>
            </div>
            <div class="timeline-line" :class="{ active: isStatusActive('SHIPPED') }"></div>
            <div class="timeline-item" :class="{ active: isStatusActive('SHIPPED') }">
              <div class="timeline-icon">3</div>
              <div class="timeline-text">已发货</div>
            </div>
            <div class="timeline-line" :class="{ active: isStatusActive('IN_TRANSIT') }"></div>
            <div class="timeline-item" :class="{ active: isStatusActive('IN_TRANSIT') }">
              <div class="timeline-icon">4</div>
              <div class="timeline-text">运输中</div>
            </div>
            <div class="timeline-line" :class="{ active: isStatusActive('DELIVERED') }"></div>
            <div class="timeline-item" :class="{ active: isStatusActive('DELIVERED') }">
              <div class="timeline-icon">5</div>
              <div class="timeline-text">已送达</div>
            </div>
            <div class="timeline-line" :class="{ active: isStatusActive('RECEIVED') }"></div>
            <div class="timeline-item" :class="{ active: isStatusActive('RECEIVED') }">
              <div class="timeline-icon">6</div>
              <div class="timeline-text">已收货</div>
            </div>
          </div>
          
          <div class="status-actions">
            <button v-if="canCancel(orderDetails)" @click="cancelOrder(orderDetails)" class="cancel-btn">取消订单</button>
            <button v-if="canPay(orderDetails)" @click="payOrder(orderDetails)" class="pay-btn">立即付款</button>
            <button v-if="canConfirm(orderDetails)" @click="confirmOrder(orderDetails)" class="confirm-btn">确认收货</button>
            <button v-if="canReview(orderDetails)" @click="reviewOrder(orderDetails)" class="review-btn">评价</button>
            <button v-if="canReturn(orderDetails)" @click="returnOrder(orderDetails)" class="return-btn">申请退货</button>
          </div>
        </div>

        <!-- 收货信息卡片 -->
        <div class="info-card">
          <h2>收货信息</h2>
          <div class="info-content" v-if="orderDetails.userAddressDTO">
            <div class="info-item">
              <div class="info-label">收货人：</div>
              <div class="info-value">{{ orderDetails.userAddressDTO.consignee }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">联系电话：</div>
              <div class="info-value">{{ formatPhone(orderDetails.userAddressDTO.phone) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">收货地址：</div>
              <div class="info-value">
                {{ formatAddress(orderDetails.userAddressDTO) }}
              </div>
            </div>
          </div>
          <div class="info-empty" v-else>
            暂无收货信息
          </div>
        </div>

        <!-- 商品信息卡片 -->
        <div class="info-card">
          <h2>商品信息</h2>
          <div class="shop-header">
            <div class="shop-info">
              <span class="shop-icon">🏪</span>
              <span class="shop-name">{{ orderDetails.shopName }}</span>
            </div>
          </div>
          
          <div class="product-list">
            <div v-for="item in orderDetails.orderItemsList" :key="item.orderItemId" class="product-item">
              <div class="product-image">
                <img :src="item.url || 'https://via.placeholder.com/100'" :alt="item.name">
              </div>
              <div class="product-details">
                <div class="product-name" @click="goToProductDetail(item.productId)">{{ item.name }}</div>
                <div class="product-config">{{ item.configuration }}</div>
                <div class="product-brand">{{ item.brand }}</div>
              </div>
              <div class="product-price-qty">
                <div class="product-price">¥{{ formatPrice(item.price) }}</div>
                <div class="product-qty">x{{ item.quantity }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 物流信息卡片 -->
        <div class="info-card">
          <h2>物流信息</h2>
          <div class="info-content" v-if="orderDetails.logisticsNumber && orderDetails.logisticsCom">
            <div class="info-item">
              <div class="info-label">物流公司：</div>
              <div class="info-value">{{ orderDetails.logisticsCom }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">物流单号：</div>
              <div class="info-value">{{ orderDetails.logisticsNumber }}</div>
            </div>
            <div class="info-item" v-if="orderDetails.consignTime">
              <div class="info-label">发货时间：</div>
              <div class="info-value">{{ formatOrderTime(orderDetails.consignTime) }}</div>
            </div>
          </div>
          <div class="info-empty" v-else>
            暂无物流信息
          </div>
        </div>

        <!-- 订单信息卡片 -->
        <div class="info-card">
          <h2>订单信息</h2>
          <div class="info-content">
            <div class="info-item">
              <div class="info-label">订单编号：</div>
              <div class="info-value">{{ orderDetails.orderId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">下单时间：</div>
              <div class="info-value">{{ formatOrderTime(orderDetails.createdAt) }}</div>
            </div>
            <div class="info-item" v-if="orderDetails.paymentType">
              <div class="info-label">支付方式：</div>
              <div class="info-value">{{ formatPaymentType(orderDetails.paymentType) }}</div>
            </div>
            <div class="info-item" v-if="orderDetails.endTime">
              <div class="info-label">完成时间：</div>
              <div class="info-value">{{ formatOrderTime(orderDetails.endTime) }}</div>
            </div>
          </div>
        </div>

        <!-- 价格信息卡片 -->
        <div class="price-card">
          <div class="price-item">
            <div class="price-label">商品总价：</div>
            <div class="price-value">¥{{ formatPrice(orderDetails.originalAmount) }}</div>
          </div>
          <div class="price-item" v-if="orderDetails.originalAmount !== orderDetails.totalAmount">
            <div class="price-label">优惠金额：</div>
            <div class="price-value">-¥{{ formatPrice(orderDetails.originalAmount - orderDetails.totalAmount) }}</div>
          </div>
          <div class="price-item">
            <div class="price-label">实付金额：</div>
            <div class="price-value total-price">¥{{ formatPrice(orderDetails.totalAmount) }}</div>
          </div>
          <div class="price-item" v-if="orderDetails.status === 'PENDING_PAYMENT'">
            <div class="price-label">待付金额：</div>
            <div class="price-value pending-price">¥{{ formatPrice(orderDetails.pendingAmount || orderDetails.totalAmount) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getOrderDetails, cancelOrder as apiCancelOrder, payOrder as apiPayOrder, applyForReturn as apiApplyForReturn, confirmReceipt as apiConfirmReceipt } from '@/api/orders'

export default {
  name: 'OrderDetailPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const orderDetails = ref(null)
    const loading = ref(true)
    const error = ref(null)

    // 计算订单倒计时剩余时间
    const remainingSeconds = ref(0)
    const countdownTimer = ref(null)
    const formatCountdown = computed(() => {
      const minutes = Math.floor(remainingSeconds.value / 60)
      const seconds = remainingSeconds.value % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    })

    // 计算剩余支付时间
    const calculateRemainingTime = () => {
      if (!orderDetails.value || orderDetails.value.status !== 'PENDING_PAYMENT') return 0
      
      // 获取订单创建时间
      const createdAt = new Date(orderDetails.value.createdAt)
      // 计算截止时间（创建时间+10分钟）
      const expiryTime = new Date(createdAt.getTime() + 10 * 60 * 1000)
      // 计算当前时间到截止时间的剩余秒数
      const now = new Date()
      const remainingTime = Math.max(0, Math.floor((expiryTime - now) / 1000))
      
      return remainingTime
    }

    // 开始倒计时
    const startCountdown = () => {
      // 先清除可能存在的旧定时器
      stopCountdown()
      
      // 计算初始剩余时间
      remainingSeconds.value = calculateRemainingTime()
      
      // 如果剩余时间为0，无需启动倒计时
      if (remainingSeconds.value <= 0) return
      
      // 每秒更新倒计时
      countdownTimer.value = setInterval(() => {
        remainingSeconds.value -= 1
        
        // 如果倒计时结束
        if (remainingSeconds.value <= 0) {
          stopCountdown()
          // 提示用户订单已过期
          alert('订单支付时间已过期，订单已自动取消')
          // 重新获取订单详情
          fetchOrderDetails()
        }
      }, 1000)
    }

    // 停止倒计时
    const stopCountdown = () => {
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
        countdownTimer.value = null
      }
    }

    // 获取订单详情
    const fetchOrderDetails = async () => {
      loading.value = true
      error.value = null

      // 获取路由参数中的订单ID
      const orderId = route.params.id

      if (!orderId) {
        error.value = '订单ID不能为空'
        loading.value = false
        return
      }

      try {
        const response = await getOrderDetails(orderId)
        
        if (response.code === 200) {
          orderDetails.value = response.data
          
          // 如果是待支付订单，启动倒计时
          if (orderDetails.value.status === 'PENDING_PAYMENT') {
            startCountdown()
          }
        } else {
          error.value = response.msg || '获取订单详情失败'
        }
      } catch (err) {
        console.error('获取订单详情出错：', err)
        error.value = '获取订单详情失败，请稍后重试'
      } finally {
        loading.value = false
      }
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

    // 检查状态是否激活（用于时间轴）
    const isStatusActive = (status) => {
      if (!orderDetails.value) return false
      
      const statusOrder = ['PENDING_PAYMENT', 'PENDING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RECEIVED']
      
      // 如果当前状态是已取消，则只激活到当前状态为止
      if (orderDetails.value.status === 'CANCELLED') {
        return orderDetails.value.status === status
      }
      
      const currentIndex = statusOrder.indexOf(orderDetails.value.status)
      const targetIndex = statusOrder.indexOf(status)
      
      if (currentIndex === -1 || targetIndex === -1) return false
      
      return targetIndex <= currentIndex
    }

    // 格式化手机号（隐藏中间4位）
    const formatPhone = (phone) => {
      if (!phone) return ''
      if (phone.length !== 11) return phone
      
      return phone.substring(0, 3) + '****' + phone.substring(7)
    }

    // 格式化地址
    const formatAddress = (address) => {
      if (!address) return ''
      
      const parts = [
        address.country,
        address.province,
        address.city,
        address.district,
        address.street
      ].filter(Boolean)
      
      return parts.join(' ')
    }

    // 格式化订单时间
    const formatOrderTime = (timestamp) => {
      if (!timestamp) return '未知时间'
      
      // 处理ISO格式的时间字符串
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp)
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
      
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    // 格式化支付方式
    const formatPaymentType = (type) => {
      const typeMap = {
        0: '未支付',
        1: '钱包支付',
        2: '支付宝',
        3: '微信支付',
        4: '银行卡'
      }
      return typeMap[type] || '未知支付方式'
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

    // 判断是否可以申请退货
    const canReturn = (order) => {
      return ['PENDING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RECEIVED'].includes(order.status) && 
             order.returnStatus === 'NOT_REQUESTED'
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
          // 重新获取订单详情
          fetchOrderDetails()
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
          // 重新获取订单详情
          fetchOrderDetails()
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
          // 重新获取订单详情
          fetchOrderDetails()
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
      alert(`评价功能开发中，订单商品数: ${order.orderItemsList.length}`)
    }

    // 申请退货
    const returnOrder = async (order) => {
      if (!confirm(`确定要申请退货吗？订单号: ${order.orderId}`)) {
        return
      }

      try {
        loading.value = true
        const response = await apiApplyForReturn(order.orderId)
        
        if (response.code === 200) {
          alert('申请退货成功')
          // 重新获取订单详情
          fetchOrderDetails()
        } else {
          alert(response.msg || '申请退货失败')
        }
      } catch (err) {
        console.error('申请退货出错：', err)
        alert('申请退货失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }

    // 跳转到首页
    const goToHome = () => {
      router.push('/')
    }

    // 返回订单列表
    const goBack = () => {
      router.back()
    }

    // 跳转到商品详情
    const goToProductDetail = (productId) => {
      router.push({
        path: '/product',
        query: { id: productId }
      })
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

    // 组件卸载时停止倒计时
    onUnmounted(() => {
      stopCountdown()
    })

    // 组件挂载时获取订单详情
    onMounted(() => {
      fetchOrderDetails()
    })

    return {
      orderDetails,
      loading,
      error,
      fetchOrderDetails,
      formatPrice,
      formatOrderStatus,
      getOrderStatusClass,
      isStatusActive,
      formatPhone,
      formatAddress,
      formatOrderTime,
      formatPaymentType,
      canCancel,
      canPay,
      canConfirm,
      canReview,
      canReturn,
      cancelOrder,
      payOrder,
      confirmOrder,
      reviewOrder,
      returnOrder,
      goToHome,
      goBack,
      goToProductDetail,
      formatReturnStatus,
      remainingSeconds,
      formatCountdown
    }
  }
}
</script>

<style scoped>
.order-detail-container {
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

/* 订单详情样式 */
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-card,
.info-card,
.price-card {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-card h2,
.info-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #6a4c93;
  font-size: 18px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-header h2 {
  margin: 0;
  border: none;
  padding: 0;
}

.order-status {
  padding: 4px 15px;
  border-radius: 15px;
  font-weight: bold;
  font-size: 14px;
}

.status-pending {
  background-color: #fff3e0;
  color: #ff9800;
}

.status-paid {
  background-color: #e3f2fd;
  color: #2196f3;
}

.status-shipped {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-completed {
  background-color: #e0f2f1;
  color: #009688;
}

.status-cancelled {
  background-color: #f5f5f5;
  color: #9e9e9e;
}

.status-returning {
  background-color: #fce4ec;
  color: #e91e63;
}

.status-returned {
  background-color: #ede7f6;
  color: #673ab7;
}

/* 状态时间轴 */
.status-timeline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 30px 0;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 70px;
}

.timeline-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 10px;
  position: relative;
  z-index: 2;
}

.timeline-text {
  font-size: 14px;
  color: #999;
}

.timeline-line {
  flex: 1;
  height: 2px;
  background-color: #f0f0f0;
  position: relative;
  z-index: 1;
}

.timeline-item.active .timeline-icon {
  background-color: #ff69b4;
  color: white;
}

.timeline-item.active .timeline-text {
  color: #ff69b4;
  font-weight: bold;
}

.timeline-line.active {
  background-color: #ff69b4;
}

/* 状态操作按钮 */
.status-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.status-actions button {
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

.return-btn {
  background-color: #f44336;
  color: white;
}

.return-btn:hover {
  background-color: #e53935;
  transform: translateY(-2px);
}

/* 信息内容 */
.info-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
}

.info-label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: #333;
}

.info-empty {
  color: #999;
  font-style: italic;
}

/* 商品列表 */
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
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

.product-list {
  margin-top: 15px;
}

.product-item {
  display: flex;
  padding: 15px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 100px;
  height: 100px;
  border-radius: 5px;
  overflow: hidden;
  margin-right: 15px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-weight: bold;
  margin-bottom: 5px;
  cursor: pointer;
  transition: color 0.3s;
}

.product-name:hover {
  color: #ff69b4;
}

.product-config {
  color: #666;
  font-size: 14px;
  margin-bottom: 5px;
}

.product-brand {
  color: #999;
  font-size: 13px;
}

.product-price-qty {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  width: 120px;
}

.product-price {
  font-weight: bold;
  color: #ff69b4;
  margin-bottom: 5px;
}

.product-qty {
  color: #666;
  font-size: 14px;
}

/* 价格卡片 */
.price-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15px;
}

.price-item {
  display: flex;
  align-items: center;
}

.price-label {
  color: #666;
  margin-right: 15px;
}

.price-value {
  color: #333;
  min-width: 100px;
  text-align: right;
}

.total-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff69b4;
}

.pending-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff8f00;
}

/* 退货状态样式 */
.return-status-info {
  display: flex;
  align-items: center;
  margin: 10px 0;
  padding: 8px 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
}

.return-status-label {
  font-weight: bold;
  margin-right: 10px;
  color: #666;
}

.return-status-value {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: bold;
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

/* 添加新的状态样式 */
.status-pending-payment {
  background-color: #ffecb3;
  color: #ff8f00;
}

.status-in-transit {
  background-color: #bbdefb;
  color: #1565c0;
}

.status-delivered {
  background-color: #c8e6c9;
  color: #2e7d32;
}

.status-received {
  background-color: #d7ccc8;
  color: #4e342e;
}

/* 倒计时样式 */
.countdown-section {
  background-color: #fff9f9;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  border-left: 4px solid #ff9800;
}

.countdown-label {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.countdown-timer {
  font-size: 24px;
  font-weight: bold;
  color: #ff9800;
  margin-bottom: 5px;
}

.countdown-timer.countdown-warning {
  color: #f44336;
  animation: pulse 1s infinite;
}

.countdown-tip {
  font-size: 12px;
  color: #666;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
</style> 