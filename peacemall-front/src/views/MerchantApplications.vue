<template>
  <div class="merchant-applications-container">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>商家申请记录</h1>
      </div>
      <div class="back-btn" @click="goBack">
        <span>返回个人中心</span>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载申请记录中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="fetchApplications" class="retry-btn">重试</button>
    </div>

    <!-- 空数据状态 -->
    <div v-else-if="applications.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>暂无商家申请记录</p>
      <button @click="goToApply" class="apply-btn">去申请成为商家</button>
    </div>

    <!-- 申请记录列表 -->
    <div v-else class="applications-list">
      <div class="application-item" v-for="app in applications" :key="app.applicationId">
        <div class="application-header">
          <div class="application-status" :class="getStatusClass(app.status)">
            {{ formatStatus(app.status) }}
          </div>
          <div class="application-time">
            申请时间: {{ formatTime(app.createdAt) }}
          </div>
        </div>
        
        <div class="application-content">
          <div class="shop-avatar">
            <img :src="app.shopAvatarUrl" alt="商店头像">
          </div>
          
          <div class="application-details">
            <div class="shop-name">{{ app.shopName }}</div>
            <div class="shop-description">{{ app.shopDescription }}</div>
            
            <div v-if="app.reason" class="rejection-reason">
              <span class="reason-label">拒绝原因: </span>
              <span class="reason-content">{{ app.reason }}</span>
            </div>
            
            <div class="application-update-time" v-if="app.updatedAt !== app.createdAt">
              最后更新: {{ formatTime(app.updatedAt) }}
            </div>
          </div>
        </div>
        
        <div class="application-actions" v-if="app.status === 'PENDING'">
          <button 
            @click="confirmCancel(app.applicationId)" 
            class="cancel-application-btn"
            :disabled="cancellingId === app.applicationId"
          >
            {{ cancellingId === app.applicationId ? '取消中...' : '取消申请' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMerchantApplications, cancelMerchantApplication } from '@/api/user'

export default {
  name: 'MerchantApplicationsPage',
  setup() {
    const router = useRouter()
    const applications = ref([])
    const loading = ref(true)
    const error = ref(null)
    const cancellingId = ref(null)

    // 获取申请记录
    const fetchApplications = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await getMerchantApplications()
        
        if (response && response.code === 200) {
          applications.value = response.data || []
        } else {
          console.error('获取商家申请记录失败:', response?.msg || '未知错误')
          error.value = response?.msg || '获取商家申请记录失败'
        }
      } catch (err) {
        console.error('获取商家申请记录出错:', err)
        error.value = '获取商家申请记录失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    // 格式化状态
    const formatStatus = (status) => {
      if (!status) return '-'
      
      const statusMap = {
        'PENDING': '待审核',
        'APPROVED': '已批准',
        'REJECTED': '已拒绝',
        'CANCELED': '已取消'
      }
      return statusMap[status] || status
    }

    // 获取状态对应的样式类
    const getStatusClass = (status) => {
      const statusClassMap = {
        'PENDING': 'status-pending',
        'APPROVED': 'status-approved',
        'REJECTED': 'status-rejected',
        'CANCELED': 'status-canceled'
      }
      return statusClassMap[status] || ''
    }

    // 格式化时间
    const formatTime = (timeString) => {
      if (!timeString) return '-'
      
      const date = new Date(timeString)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }

    // 取消申请
    const confirmCancel = (applicationId) => {
      if (confirm('确定要取消此商家申请吗？此操作不可撤销。')) {
        cancelApplication(applicationId)
      }
    }
    
    const cancelApplication = async (applicationId) => {
      try {
        cancellingId.value = applicationId
        const response = await cancelMerchantApplication(applicationId)
        
        if (response && response.code === 200) {
          await fetchApplications()
          alert('商家申请已取消')
        } else {
          console.error('取消商家申请失败:', response?.msg || '未知错误')
          error.value = response?.msg || '取消商家申请失败'
        }
      } catch (err) {
        console.error('取消商家申请出错:', err)
        error.value = '取消商家申请失败，请稍后重试'
      } finally {
        cancellingId.value = null
      }
    }

    // 去申请成为商家
    const goToApply = () => {
      router.push('/user')
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
      fetchApplications()
    })

    return {
      applications,
      loading,
      error,
      fetchApplications,
      formatStatus,
      getStatusClass,
      formatTime,
      confirmCancel,
      cancelApplication,
      goToApply,
      goBack,
      goToHome,
      cancellingId
    }
  }
}
</script>

<style scoped>
.merchant-applications-container {
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
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 20px;
}

.apply-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.apply-btn:hover {
  background-color: #388e3c;
  transform: translateY(-2px);
}

/* 申请记录列表 */
.applications-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.application-item {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.application-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.application-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.application-status {
  font-weight: bold;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 14px;
}

.status-pending {
  background-color: #fff8e1;
  color: #ff9800;
}

.status-approved {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-rejected {
  background-color: #ffebee;
  color: #f44336;
}

.status-canceled {
  background-color: #f5f5f5;
  color: #9e9e9e;
}

.application-time {
  font-size: 14px;
  color: #777;
}

.application-content {
  display: flex;
  padding: 20px;
  gap: 20px;
}

.shop-avatar {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.shop-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.application-details {
  flex: 1;
}

.shop-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.shop-description {
  color: #555;
  line-height: 1.5;
  margin-bottom: 15px;
}

.rejection-reason {
  background-color: #ffebee;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.reason-label {
  font-weight: bold;
  color: #f44336;
}

.reason-content {
  color: #d32f2f;
}

.application-update-time {
  font-size: 12px;
  color: #777;
  margin-top: 10px;
}

.application-actions {
  padding: 0 20px 20px;
  display: flex;
  justify-content: flex-end;
}

.cancel-application-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-application-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(211, 47, 47, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .application-content {
    flex-direction: column;
    align-items: center;
  }
  
  .shop-avatar {
    margin-bottom: 15px;
  }
  
  .application-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .application-actions {
    justify-content: center;
  }
}
</style> 