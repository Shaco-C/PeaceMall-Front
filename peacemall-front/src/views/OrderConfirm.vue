<template>
  <div class="order-confirm-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>确认订单</h1>
      </div>
      <div class="back-btn" @click="goBack">
        <span>返回</span>
      </div>
    </div>

    <!-- 订单内容 -->
    <div class="order-content">
      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 订单确认表单 -->
      <div v-else class="order-form">
        <!-- 收货地址部分 -->
        <div class="section-card">
          <div class="section-header">
            <h2>收货地址</h2>
            <button class="manage-addresses-btn" @click="goToAddressManagement">管理收货地址</button>
          </div>

          <div v-if="addresses.length === 0" class="no-address">
            <p>您还没有添加收货地址，请先添加一个地址</p>
            <button class="add-address-btn" @click="goToAddressManagement">添加地址</button>
          </div>

          <div v-else class="address-list">
            <div 
              v-for="address in addresses" 
              :key="address.addressId" 
              class="address-item"
              :class="{ 'selected': selectedAddressId === address.addressId }"
              @click="selectAddress(address.addressId)"
            >
              <div class="address-radio">
                <div class="radio-circle" :class="{ 'checked': selectedAddressId === address.addressId }"></div>
              </div>
              <div class="address-content">
                <div class="address-tag" :class="{ 'default-tag': address.isDefault }">
                  {{ formatAddressTag(address.addressTag) }}
                  <span v-if="address.isDefault" class="default-label">默认</span>
                </div>
                <div class="consignee-info">
                  <span class="consignee-name">{{ address.consignee }}</span>
                  <span class="consignee-phone">{{ formatPhone(address.phone) }}</span>
                </div>
                <div class="address-detail">
                  {{ formatAddress(address) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 商品信息部分 -->
        <div class="section-card">
          <div class="section-header">
            <h2>商品信息</h2>
          </div>

          <div class="product-list">
            <div v-for="(item, index) in orderItems" :key="index" class="product-item">
              <div class="product-image">
                <img :src="item.imageUrl || 'https://via.placeholder.com/100'" :alt="item.name">
              </div>
              <div class="product-details">
                <div class="product-name">{{ item.name }}</div>
                <div v-if="item.configName" class="product-config">{{ item.configName }}</div>
              </div>
              <div class="product-price-qty">
                <div class="product-price">¥{{ formatPrice(item.price) }}</div>
                <div class="product-qty">x{{ item.quantity }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 价格信息部分 -->
        <div class="section-card price-section">
          <div class="price-item">
            <div class="price-label">商品总价：</div>
            <div class="price-value">¥{{ formatPrice(getTotalPrice()) }}</div>
          </div>
          <div class="price-item">
            <div class="price-label">运费：</div>
            <div class="price-value">¥0.00</div>
          </div>
          <div class="price-item total-price-item">
            <div class="price-label">实付金额：</div>
            <div class="price-value total-price">¥{{ formatPrice(getTotalPrice()) }}</div>
          </div>
        </div>

        <!-- 提交订单按钮 -->
        <div class="submit-section">
          <div class="submit-info">
            <div class="total-info">
              共 {{ getTotalQuantity() }} 件商品，总计：
              <span class="total-amount">¥{{ formatPrice(getTotalPrice()) }}</span>
            </div>
          </div>
          <button 
            class="submit-order-btn" 
            :disabled="!canSubmitOrder || submitting" 
            @click="submitOrder"
          >
            {{ submitting ? '提交中...' : '提交订单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getUserAddresses } from '@/api/address'
import { createOrder } from '@/api/orders'
import { getUserInfo } from '@/api/user'

export default {
  name: 'OrderConfirmPage',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(true)
    const submitting = ref(false)
    const addresses = ref([])
    const selectedAddressId = ref('')
    const orderItems = ref([])
    const userId = ref('')

    // 检查是否可以提交订单
    const canSubmitOrder = computed(() => {
      return selectedAddressId.value && orderItems.value.length > 0
    })

    // 初始化页面数据
    const initPageData = async () => {
      loading.value = true

      try {
        // 解析路由参数中的商品信息
        parseOrderItems()
        
        // 获取用户信息
        const userResponse = await getUserInfo()
        if (userResponse.code === 200 && userResponse.data) {
          userId.value = userResponse.data.userId
        }

        // 获取用户地址列表
        const addressResponse = await getUserAddresses()
        if (addressResponse.code === 200 && addressResponse.data) {
          addresses.value = addressResponse.data

          // 如果有默认地址，选择默认地址
          const defaultAddress = addresses.value.find(addr => addr.isDefault)
          if (defaultAddress) {
            selectedAddressId.value = defaultAddress.addressId
          } else if (addresses.value.length > 0) {
            // 如果没有默认地址，选择第一个地址
            selectedAddressId.value = addresses.value[0].addressId
          }
        }
      } catch (err) {
        console.error('初始化页面数据出错：', err)
      } finally {
        loading.value = false
      }
    }

    // 解析路由参数中的商品信息
    const parseOrderItems = () => {
      // 从路由参数中获取商品信息
      const items = route.params.items
      if (items) {
        try {
          orderItems.value = JSON.parse(items)
        } catch (e) {
          console.error('解析商品信息失败：', e)
          router.push({ path: '/' })
        }
      } else {
        // 如果没有商品信息，返回首页
        router.push({ path: '/' })
      }
    }

    // 选择地址
    const selectAddress = (addressId) => {
      selectedAddressId.value = addressId
    }

    // 获取总价
    const getTotalPrice = () => {
      return orderItems.value.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    }

    // 获取总数量
    const getTotalQuantity = () => {
      return orderItems.value.reduce((total, item) => {
        return total + item.quantity
      }, 0)
    }

    // 格式化地址标签
    const formatAddressTag = (tag) => {
      const tagMap = {
        'HOME': '家庭',
        'COMPANY': '公司',
        'SCHOOL': '学校',
        'OTHER': '其他'
      }
      return tagMap[tag] || '其他'
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

    // 格式化价格
    const formatPrice = (price) => {
      if (price === undefined || price === null) return '0.00'
      return parseFloat(price).toFixed(2)
    }

    // 提交订单
    const submitOrder = async () => {
      if (!canSubmitOrder.value || submitting.value) return

      submitting.value = true

      try {
        // 构建订单数据
        const orderData = {
          userId: userId.value,
          addressId: selectedAddressId.value,
          items: orderItems.value.map(item => ({
            productId: item.productId,
            configId: item.configId,
            quantity: item.quantity
          }))
        }

        // 调用创建订单API
        const response = await createOrder(orderData)
        
        if (response.code === 200 && response.data) {
          alert('订单创建成功')
          // 跳转到订单列表页
          router.push({ path: '/user/orders' })
        } else {
          alert(response.msg || '创建订单失败')
        }
      } catch (err) {
        console.error('创建订单出错：', err)
        alert('创建订单失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    }

    // 跳转到地址管理页面
    const goToAddressManagement = () => {
      router.push({ path: '/user/addresses' })
    }

    // 返回上一页
    const goBack = () => {
      router.back()
    }

    // 跳转到首页
    const goToHome = () => {
      router.push({ path: '/' })
    }

    onMounted(() => {
      initPageData()
    })

    return {
      loading,
      submitting,
      addresses,
      selectedAddressId,
      orderItems,
      canSubmitOrder,
      selectAddress,
      getTotalPrice,
      getTotalQuantity,
      formatAddressTag,
      formatPhone,
      formatAddress,
      formatPrice,
      submitOrder,
      goToAddressManagement,
      goBack,
      goToHome
    }
  }
}
</script>

<style scoped>
.order-confirm-container {
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

/* 订单表单样式 */
.order-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #6a4c93;
}

.manage-addresses-btn {
  background-color: transparent;
  color: #ff69b4;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.manage-addresses-btn:hover {
  color: #ff5ba7;
  text-decoration: underline;
}

/* 地址列表样式 */
.no-address {
  text-align: center;
  padding: 20px;
  color: #999;
}

.add-address-btn {
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  margin-top: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-address-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-2px);
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.address-item {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.address-item:hover {
  border-color: #ff69b4;
  transform: translateY(-2px);
}

.address-item.selected {
  border-color: #ff69b4;
  background-color: #fff9fb;
}

.address-radio {
  margin-right: 15px;
  padding-top: 5px;
}

.radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  position: relative;
}

.radio-circle.checked {
  border-color: #ff69b4;
}

.radio-circle.checked::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: #ff69b4;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.address-content {
  flex: 1;
}

.address-tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f0f0f0;
  color: #666;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

.default-tag {
  background-color: #fff3e0;
  color: #ff9800;
}

.default-label {
  margin-left: 5px;
  font-weight: bold;
}

.consignee-info {
  margin-bottom: 8px;
}

.consignee-name {
  font-weight: bold;
  margin-right: 10px;
}

.consignee-phone {
  color: #666;
}

.address-detail {
  color: #333;
  line-height: 1.5;
}

/* 商品列表样式 */
.product-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  width: 80px;
  height: 80px;
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
  justify-content: center;
}

.product-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.product-config {
  color: #666;
  font-size: 14px;
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

/* 价格信息样式 */
.price-section {
  padding-bottom: 0;
}

.price-item {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
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

.total-price-item {
  border-top: 1px dashed #f0f0f0;
  padding-top: 15px;
}

.total-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff69b4;
}

/* 提交订单部分 */
.submit-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.submit-info {
  margin-right: 20px;
}

.total-info {
  font-size: 16px;
  color: #333;
}

.total-amount {
  font-weight: bold;
  color: #ff69b4;
  font-size: 20px;
}

.submit-order-btn {
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 12px 30px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-order-btn:hover:not(:disabled) {
  background-color: #ff5ba7;
  transform: translateY(-2px);
}

.submit-order-btn:disabled {
  background-color: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}
</style> 