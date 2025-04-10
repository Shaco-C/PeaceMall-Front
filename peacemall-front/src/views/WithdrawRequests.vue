<template>
  <div class="withdraw-requests-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>提现申请记录</h1>
      </div>
      <div class="back-btn" @click="goBack">
        <span>返回个人中心</span>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-item">
        <label for="request-status">申请状态：</label>
        <select id="request-status" v-model="selectedStatus" @change="applyFilters">
          <option value="">全部状态</option>
          <option value="PENDING">待处理</option>
          <option value="APPROVED">已批准</option>
          <option value="REJECTED">已拒绝</option>
          <option value="CANCELED">已取消</option>
          <option value="COMPLETED">已完成</option>
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
      <p>加载提现申请记录中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="fetchWithdrawRequests" class="retry-btn">重试</button>
    </div>

    <!-- 空数据状态 -->
    <div v-else-if="withdrawRequests.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>暂无提现申请记录</p>
    </div>

    <!-- 提现申请记录列表 -->
    <div v-else class="requests-list">
      <div class="requests-header">
        <div class="request-item header">
          <div class="request-cell time">申请时间</div>
          <div class="request-cell amount">提现金额</div>
          <div class="request-cell method">提现方式</div>
          <div class="request-cell status">状态</div>
          <div class="request-cell reason">拒绝原因</div>
          <div class="request-cell account">账号信息</div>
          <div class="request-cell action">操作</div>
        </div>
      </div>
      <div class="requests-body">
        <div v-for="request in withdrawRequests" :key="request.requestId" class="request-item">
          <div class="request-cell time">{{ formatTime(request.createdAt) }}</div>
          <div class="request-cell amount">¥ {{ formatAmount(request.amount) }}</div>
          <div class="request-cell method">{{ formatPaymentMethod(request.paymentMethod) }}</div>
          <div :class="['request-cell', 'status', getStatusClass(request.status)]">
            {{ formatStatus(request.status) }}
          </div>
          <div class="request-cell reason">{{ request.reason || '-' }}</div>
          <div class="request-cell account">{{ request.accountInfo }}</div>
          <div class="request-cell action">
            <button 
              v-if="request.status === 'PENDING'" 
              @click="handleCancelRequest(request.requestId)"
              class="cancel-request-btn"
              :disabled="cancelingRequestId === request.requestId"
            >
              {{ cancelingRequestId === request.requestId ? '取消中...' : '取消申请' }}
            </button>
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
import { getUserWithdrawRequests, cancelWithdrawRequest } from '@/api/wallet'

export default {
  name: 'WithdrawRequestsPage',
  setup() {
    const router = useRouter()
    const withdrawRequests = ref([])
    const loading = ref(true)
    const error = ref(null)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalPages = ref(0)
    const totalRequests = ref(0)
    const selectedStatus = ref('')
    const cancelingRequestId = ref(null)

    // 获取提现申请记录
    const fetchWithdrawRequests = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await getUserWithdrawRequests(
          currentPage.value, 
          pageSize.value, 
          selectedStatus.value || null
        )
        
        if (response && response.code === 200 && response.data) {
          withdrawRequests.value = response.data.list || []
          totalPages.value = parseInt(response.data.pages) || 0
          totalRequests.value = parseInt(response.data.total) || 0
        } else {
          console.error('获取提现申请记录失败:', response?.msg || '未知错误')
          error.value = response?.msg || '获取提现申请记录失败'
        }
      } catch (err) {
        console.error('获取提现申请记录出错:', err)
        error.value = '获取提现申请记录失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    // 应用筛选条件
    const applyFilters = () => {
      currentPage.value = 1
      fetchWithdrawRequests()
    }

    // 切换页码
    const changePage = (page) => {
      if (page < 1 || page > totalPages.value) return
      
      currentPage.value = page
      fetchWithdrawRequests()
      
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // 格式化时间
    const formatTime = (timeString) => {
      if (!timeString) return '-'
      
      const date = new Date(timeString)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    // 格式化金额
    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return '-'
      return parseFloat(amount).toFixed(2)
    }

    // 格式化提现方式
    const formatPaymentMethod = (method) => {
      if (!method) return '-'
      
      const methodMap = {
        'Alipay': '支付宝余额',
        'WeChat': '微信余额',
        'BankCard': '银行卡',
      }
      return methodMap[method] || method
    }

    // 格式化状态
    const formatStatus = (status) => {
      if (!status) return '-'
      
      const statusMap = {
        'PENDING': '待处理',
        'APPROVED': '已批准',
        'REJECTED': '已拒绝',
        'CANCELED': '已取消',
        'COMPLETED': '已完成'
      }
      return statusMap[status] || status
    }

    // 获取状态对应的样式类
    const getStatusClass = (status) => {
      const statusClassMap = {
        'PENDING': 'status-pending',
        'APPROVED': 'status-approved',
        'REJECTED': 'status-rejected',
        'CANCELED': 'status-canceled',
        'COMPLETED': 'status-completed'
      }
      return statusClassMap[status] || ''
    }

    // 取消申请
    const handleCancelRequest = async (requestId) => {
      cancelingRequestId.value = requestId
      try {
        const response = await cancelWithdrawRequest(requestId)
        
        if (response && response.code === 200) {
          alert('提现申请已取消')
          // 刷新数据
          await fetchWithdrawRequests()
        } else {
          console.error('取消提现申请失败:', response?.msg || '未知错误')
          alert(response?.msg || '取消提现申请失败')
        }
      } catch (err) {
        console.error('取消提现申请出错:', err)
        alert('取消提现申请失败，请稍后重试')
      } finally {
        cancelingRequestId.value = null
      }
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
      fetchWithdrawRequests()
    })

    return {
      withdrawRequests,
      loading,
      error,
      currentPage,
      pageSize,
      totalPages,
      totalRequests,
      selectedStatus,
      cancelingRequestId,
      fetchWithdrawRequests,
      applyFilters,
      changePage,
      formatTime,
      formatAmount,
      formatPaymentMethod,
      formatStatus,
      getStatusClass,
      handleCancelRequest,
      goBack,
      goToHome
    }
  }
}
</script>

<style scoped>
.withdraw-requests-container {
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

/* 提现申请记录列表 */
.requests-list {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.requests-header {
  background-color: #f5f5f5;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.request-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.request-item:last-child {
  border-bottom: none;
}

.request-item.header {
  font-weight: bold;
  color: #6a4c93;
}

.request-cell {
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  width: 18%;
}

.amount {
  width: 10%;
}

.method {
  width: 12%;
}

.status {
  width: 10%;
}

.reason {
  width: 18%;
}

.account {
  width: 22%;
}

.action {
  width: 10%;
  text-align: center;
}

/* 取消申请按钮 */
.cancel-request-btn {
  padding: 6px 12px;
  background-color: #ff5252;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-request-btn:hover:not(:disabled) {
  background-color: #e53935;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(229, 57, 53, 0.3);
}

.cancel-request-btn:disabled {
  background-color: #ffcdd2;
  cursor: not-allowed;
}

/* 状态样式 */
.status-pending {
  color: #ff9800;
  font-weight: bold;
}

.status-approved {
  color: #2196f3;
  font-weight: bold;
}

.status-rejected {
  color: #f44336;
  font-weight: bold;
}

.status-canceled {
  color: #9e9e9e;
  font-weight: bold;
}

.status-completed {
  color: #4caf50;
  font-weight: bold;
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
  .request-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .request-cell {
    width: 100%;
    padding: 5px 0;
  }
  
  .request-item.header {
    display: none;
  }
}
</style> 