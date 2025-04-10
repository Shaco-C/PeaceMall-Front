<template>
  <div class="wallet-logs-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>钱包流水记录</h1>
      </div>
      <div class="back-btn" @click="goBack">
        <span>返回个人中心</span>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-item">
        <label for="flow-type">流水类型：</label>
        <select id="flow-type" v-model="selectedFlowType" @change="applyFilters">
          <option value="">全部类型</option>
          <option value="RECHARGE">充值</option>
          <option value="WITHDRAWAL">提现</option>
          <option value="EXPENSE">消费</option>
          <option value="PENDING_CONFIRM">待确认金额确认</option>
          <option value="REFUND">退款</option>
        </select>
      </div>
      <div class="filter-item">
        <label for="page-size">每页显示：</label>
        <select id="page-size" v-model="pageSize" @change="applyFilters">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="30">30条/页</option>
          <option :value="50">50条/页</option>
        </select>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载流水记录中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="fetchWalletLogs" class="retry-btn">重试</button>
    </div>

    <!-- 空数据状态 -->
    <div v-else-if="walletLogs.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>暂无流水记录</p>
    </div>

    <!-- 流水记录列表 -->
    <div v-else class="logs-list">
      <div class="logs-header">
        <div class="log-item header">
          <div class="log-cell time">时间</div>
          <div class="log-cell type">类型</div>
          <div class="log-cell change">金额变动</div>
          <div class="log-cell balance">余额</div>
          <div class="log-cell order">关联订单</div>
        </div>
      </div>
      <div class="logs-body">
        <div v-for="log in walletLogs" :key="log.walletLogsId" class="log-item">
          <div class="log-cell time">{{ formatTime(log.createdAt) }}</div>
          <div class="log-cell type">{{ formatFlowType(log.flowType) }}</div>
          <div :class="['log-cell', 'change', log.balanceChange >= 0 ? 'positive' : 'negative']">
            {{ formatAmount(log.balanceChange) }}
          </div>
          <div class="log-cell balance">{{ formatAmount(log.balanceAfter) }}</div>
          <div class="log-cell order">
            <span v-if="log.relatedOrder" class="order-link" @click="viewOrderDetail(log.relatedOrder)">
              {{ log.relatedOrder }}
            </span>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页控件 -->
    <div v-if="totalPages > 0" class="pagination">
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
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserWalletFlowLogs } from '@/api/wallet'

export default {
  name: 'WalletLogsPage',
  setup() {
    const router = useRouter()
    const walletLogs = ref([])
    const loading = ref(true)
    const error = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(20)
    const totalPages = ref(0)
    const totalLogs = ref(0)
    const selectedFlowType = ref('')

    // 获取钱包流水记录
    const fetchWalletLogs = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await getUserWalletFlowLogs(
          currentPage.value, 
          pageSize.value, 
          selectedFlowType.value || null
        )
        
        if (response && response.code === 200 && response.data) {
          walletLogs.value = response.data.list || []
          totalPages.value = parseInt(response.data.pages) || 0
          totalLogs.value = parseInt(response.data.total) || 0
        } else {
          console.error('获取钱包流水失败:', response?.msg || '未知错误')
          error.value = response?.msg || '获取钱包流水失败'
        }
      } catch (err) {
        console.error('获取钱包流水出错:', err)
        error.value = '获取钱包流水失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    // 应用筛选条件
    const applyFilters = () => {
      currentPage.value = 1
      fetchWalletLogs()
    }

    // 切换页码
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return
      
      currentPage.value = page
      fetchWalletLogs()
      
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 格式化时间
    const formatTime = (timeString) => {
      if (!timeString) return '-'
      
      const date = new Date(timeString)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    // 格式化流水类型
    const formatFlowType = (type) => {
      const typeMap = {
        'RECHARGE': '充值',
        'WITHDRAWAL': '提现',
        'EXPENSE': '消费',
        'PENDING_CONFIRM': '待确认金额确认',
        'REFUND': '退款'
      }
      return typeMap[type] || type
    }

    // 格式化金额
    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return '-'
      
      const prefix = amount >= 0 ? '+ ' : ''
      return `${prefix}¥ ${Math.abs(amount).toFixed(2)}`
    }

    // 查看订单详情
    const viewOrderDetail = (orderId) => {
      router.push(`/user/orders/${orderId}`)
    }

    // 返回个人中心
    const goBack = () => {
      router.push('/user')
    }

    // 返回首页
    const goToHome = () => {
      router.push('/')
    }

    onMounted(() => {
      fetchWalletLogs()
    })

    return {
      walletLogs,
      loading,
      error,
      currentPage,
      pageSize,
      totalPages,
      totalLogs,
      selectedFlowType,
      fetchWalletLogs,
      applyFilters,
      changePage,
      formatTime,
      formatFlowType,
      formatAmount,
      viewOrderDetail,
      goBack,
      goToHome
    }
  }
}
</script>

<style scoped>
.wallet-logs-container {
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

/* 筛选区域 */
.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-item label {
  font-weight: bold;
  color: #6a4c93;
}

.filter-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-item select:hover, .filter-item select:focus {
  border-color: #ff69b4;
  outline: none;
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
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 20px;
}

/* 流水记录列表 */
.logs-list {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.logs-header {
  background-color: #f5f5f5;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.header {
  font-weight: bold;
  color: #6a4c93;
}

.log-cell {
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  width: 20%;
}

.type {
  width: 15%;
}

.change {
  width: 15%;
}

.balance {
  width: 15%;
}

.order {
  width: 35%;
}

.positive {
  color: #4caf50;
}

.negative {
  color: #f44336;
}

.order-link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.order-link:hover {
  color: #0d47a1;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .log-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .log-cell {
    width: 100%;
    padding: 5px 0;
  }
  
  .log-item.header {
    display: none;
  }
}
</style> 