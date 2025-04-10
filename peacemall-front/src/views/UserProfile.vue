<template>
  <div class="profile-container">
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>个人中心</h1>
      </div>
      <div class="back-btn" @click="goToHome">
        <span>返回首页</span>
      </div>
    </div>

    <div class="profile-content" v-if="userInfo">
      <div class="avatar-section">
        <div class="avatar">
          <img :src="editMode ? previewAvatar : userInfo.avatarUrl || 'https://via.placeholder.com/150'" alt="用户头像">
        </div>
        <div v-if="editMode" class="avatar-upload">
          <div class="upload-btn-wrapper">
            <button class="upload-btn">选择新头像</button>
            <input type="file" @change="handleAvatarChange" accept="image/*">
          </div>
          <div class="upload-status" v-if="uploading">上传中...</div>
          <div class="upload-success" v-if="avatarUploaded">上传成功</div>
        </div>
        <div class="signature">
          <p v-if="!editMode">"{{ userInfo.signature || '这个人很懒，什么都没留下...' }}"</p>
          <textarea v-else v-model="editForm.signature" placeholder="请输入个性签名" class="signature-edit"></textarea>
        </div>
        
        <!-- 用户功能按钮区域 -->
        <div class="user-actions">
          <button @click="goToAddresses" class="action-button address-btn">
            <span class="action-icon">📍</span>
            <span class="action-text">我的地址</span>
          </button>
        </div>
        
        <!-- 钱包模块 -->
        <div class="wallet-section">
          <h3 class="wallet-title">我的钱包</h3>
          <div v-if="walletLoading" class="wallet-loading">
            <div class="loading-spinner"></div>
            <p>加载中...</p>
          </div>
          <div v-else-if="walletError" class="wallet-error">
            <div class="error-message">{{ walletError }}</div>
            <button @click="fetchWalletInfo" class="retry-btn">重试</button>
          </div>
          <div v-else-if="walletInfo" class="wallet-info">
            <div class="wallet-item total-balance">
              <div class="wallet-label">总余额：</div>
              <div class="wallet-value">¥ {{ formatMoney(walletInfo.totalBalance) }}</div>
            </div>
            <div class="wallet-item available-balance">
              <div class="wallet-label">可用余额：</div>
              <div class="wallet-value">¥ {{ formatMoney(walletInfo.availableBalance) }}</div>
            </div>
            <div class="wallet-item pending-balance">
              <div class="wallet-label">待结算：</div>
              <div class="wallet-value">¥ {{ formatMoney(walletInfo.pendingBalance) }}</div>
            </div>
            <div class="wallet-action">
              <button @click="showRechargeModal = true" class="recharge-btn">充值钱包</button>
              <button @click="showWithdrawModal = true" class="withdraw-btn">申请提现</button>
            </div>
          </div>
          <div v-else class="wallet-empty">
            <p>暂无钱包信息</p>
          </div>
        </div>
        
        <!-- 查看钱包流水按钮 -->
        <button @click="goToWalletLogs" class="wallet-logs-btn">查看钱包流水</button>
        
        <!-- 查看提现申请按钮 -->
        <button @click="goToWithdrawRequests" class="withdraw-requests-btn">查看提现申请</button>
      </div>

      <div class="info-section">
        <div class="info-card">
          <div class="card-header">
            <h2>个人资料</h2>
            <button v-if="!editMode" @click="startEdit" class="edit-btn">编辑</button>
            <div v-else class="edit-actions">
              <button @click="cancelEdit" class="cancel-btn">取消</button>
              <button @click="saveChanges" class="save-btn" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
          
          <!-- 只读模式 -->
          <div v-if="!editMode">
            <div class="info-item">
              <div class="label">用户ID：</div>
              <div class="value">{{ userInfo.userId }}</div>
            </div>
            <div class="info-item">
              <div class="label">用户名：</div>
              <div class="value">{{ userInfo.username }}</div>
            </div>
            <div class="info-item">
              <div class="label">昵称：</div>
              <div class="value">{{ userInfo.nickname }}</div>
            </div>
            <div class="info-item">
              <div class="label">邮箱：</div>
              <div class="value">{{ formatEmail(userInfo.email) }}</div>
              <div class="action">
                <button @click="showUpdateEmailModal = true" class="action-btn">修改</button>
              </div>
            </div>
            <div class="info-item">
              <div class="label">手机号：</div>
              <div class="value">{{ formatPhone(userInfo.phoneNumber) }}</div>
              <div class="action">
                <button @click="showUpdatePhoneModal = true" class="action-btn">修改</button>
              </div>
            </div>
            <div class="info-item">
              <div class="label">角色：</div>
              <div class="value">{{ formatRole(userInfo.role) }}</div>
            </div>
            <div class="info-item">
              <div class="label">状态：</div>
              <div class="value">{{ formatStatus(userInfo.status) }}</div>
            </div>
            <div class="account-actions">
              <button @click="showUpdatePasswordModal = true" class="update-password-btn">修改密码</button>
            </div>
          </div>
          
          <!-- 编辑模式 -->
          <div v-else>
            <div class="info-item">
              <div class="label">用户ID：</div>
              <div class="value">{{ userInfo.userId }}</div>
            </div>
            <div class="info-item">
              <div class="label">用户名：</div>
              <div class="value">{{ userInfo.username }}</div>
            </div>
            <div class="info-item">
              <div class="label">昵称：</div>
              <div class="value">
                <input type="text" v-model="editForm.nickname" class="edit-input" />
              </div>
            </div>
            <div class="info-item">
              <div class="label">邮箱：</div>
              <div class="value">{{ userInfo.email }}</div>
            </div>
            <div class="info-item">
              <div class="label">手机号：</div>
              <div class="value">{{ userInfo.phoneNumber }}</div>
            </div>
            <div class="info-item">
              <div class="label">角色：</div>
              <div class="value">{{ formatRole(userInfo.role) }}</div>
            </div>
            <div class="info-item">
              <div class="label">状态：</div>
              <div class="value">{{ formatStatus(userInfo.status) }}</div>
            </div>
          </div>
        </div>
        
        <!-- 账号注销区域 -->
        <div class="close-account-section">
          <div class="account-options-container">
            <div class="account-option">
              <h4 class="option-title">账号注销</h4>
              <button @click="showCloseAccountConfirm = true" class="close-account-btn">注销账号</button>
              <p class="option-notice">注意：账号注销后将无法恢复，请谨慎操作。</p>
            </div>
            
            <div class="account-option">
              <h4 class="option-title">成为商家</h4>
              <button 
                @click="handleApplyMerchant" 
                class="become-merchant-btn"
                :disabled="applyingMerchant || userInfo.role === 'MERCHANT'"
              >
                {{ applyingMerchant ? '申请中...' : userInfo.role === 'MERCHANT' ? '已是商家' : '申请成为商家' }}
              </button>
              <p class="option-notice">成为商家后可以在平台上发布商品并进行销售。</p>
              <div class="view-application-link" @click="goToMerchantApplications">
                <span>查看申请记录</span>
                <span class="arrow-icon">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div class="loading-state" v-else-if="loading">
      <div class="loading-spinner"></div>
      <p>加载中，请稍候...</p>
    </div>

    <!-- 错误状态 -->
    <div class="error-state" v-else-if="error">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="fetchUserInfo" class="retry-btn">重试</button>
    </div>

    <!-- 注销账号确认对话框 -->
    <div class="modal-overlay" v-if="showCloseAccountConfirm" @click.self="showCloseAccountConfirm = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>确认注销账号</h3>
          <span class="close-btn" @click="showCloseAccountConfirm = false">&times;</span>
        </div>
        <div class="modal-body">
          <p class="warning-text">警告：账号注销后将无法恢复，您的所有数据将被删除。</p>
          <div class="password-input">
            <label for="confirm-password">请输入您的密码进行确认：</label>
            <input 
              id="confirm-password" 
              type="password" 
              v-model="confirmPassword" 
              placeholder="请输入密码"
              class="password-field"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="showCloseAccountConfirm = false">取消</button>
          <button 
            class="confirm-modal-btn" 
            :disabled="!confirmPassword || closeAccountLoading" 
            @click="handleCloseAccount"
          >
            {{ closeAccountLoading ? '处理中...' : '确认注销' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <div class="modal-overlay" v-if="showUpdatePasswordModal" @click.self="showUpdatePasswordModal = false">
      <div class="modal-content update-modal">
        <div class="modal-header update-header">
          <h3>修改密码</h3>
          <span class="close-btn" @click="showUpdatePasswordModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="current-password">当前密码：</label>
            <input 
              id="current-password" 
              type="password" 
              v-model="passwordForm.currentPassword" 
              placeholder="请输入当前密码"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="new-password">新密码：</label>
            <input 
              id="new-password" 
              type="password" 
              v-model="passwordForm.newPassword" 
              placeholder="请输入新密码（至少6位）"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="confirm-new-password">确认新密码：</label>
            <input 
              id="confirm-new-password" 
              type="password" 
              v-model="passwordForm.confirmPassword" 
              placeholder="请再次输入新密码"
              class="form-input"
            >
            <div class="form-error" v-if="passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword">
              两次输入的密码不一致
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="showUpdatePasswordModal = false">取消</button>
          <button 
            class="confirm-modal-btn update-btn" 
            :disabled="!isPasswordFormValid || updatePasswordLoading" 
            @click="handleUpdatePassword"
          >
            {{ updatePasswordLoading ? '更新中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改手机号对话框 -->
    <div class="modal-overlay" v-if="showUpdatePhoneModal" @click.self="showUpdatePhoneModal = false">
      <div class="modal-content update-modal">
        <div class="modal-header update-header">
          <h3>修改手机号</h3>
          <span class="close-btn" @click="showUpdatePhoneModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="current-phone">当前手机号：</label>
            <input 
              id="current-phone" 
              type="text" 
              v-model="phoneForm.currentPhone" 
              placeholder="请输入当前手机号"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="new-phone">新手机号：</label>
            <input 
              id="new-phone" 
              type="text" 
              v-model="phoneForm.newPhone" 
              placeholder="请输入新手机号（11位数字）"
              class="form-input"
            >
            <div class="form-error" v-if="phoneForm.newPhone && !/^1[3-9]\d{9}$/.test(phoneForm.newPhone)">
              请输入有效的11位手机号
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="showUpdatePhoneModal = false">取消</button>
          <button 
            class="confirm-modal-btn update-btn" 
            :disabled="!isPhoneFormValid || updatePhoneLoading" 
            @click="handleUpdatePhone"
          >
            {{ updatePhoneLoading ? '更新中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改邮箱对话框 -->
    <div class="modal-overlay" v-if="showUpdateEmailModal" @click.self="showUpdateEmailModal = false">
      <div class="modal-content update-modal">
        <div class="modal-header update-header">
          <h3>修改邮箱</h3>
          <span class="close-btn" @click="showUpdateEmailModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="current-email">当前邮箱：</label>
            <input 
              id="current-email" 
              type="email" 
              v-model="emailForm.currentEmail" 
              placeholder="请输入当前邮箱"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="new-email">新邮箱：</label>
            <input 
              id="new-email" 
              type="email" 
              v-model="emailForm.newEmail" 
              placeholder="请输入新邮箱"
              class="form-input"
            >
            <div class="form-error" v-if="emailForm.newEmail && !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(emailForm.newEmail)">
              请输入有效的邮箱地址
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="showUpdateEmailModal = false">取消</button>
          <button 
            class="confirm-modal-btn update-btn" 
            :disabled="!isEmailFormValid || updateEmailLoading" 
            @click="handleUpdateEmail"
          >
            {{ updateEmailLoading ? '更新中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 充值钱包对话框 -->
    <div class="modal-overlay" v-if="showRechargeModal" @click.self="showRechargeModal = false">
      <div class="modal-content wallet-modal">
        <div class="modal-header wallet-header">
          <h3>钱包充值</h3>
          <span class="close-btn" @click="showRechargeModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="recharge-amount">充值金额：</label>
            <div class="amount-input-wrapper">
              <span class="currency-symbol">¥</span>
              <input 
                id="recharge-amount" 
                type="number" 
                v-model="rechargeAmount" 
                placeholder="请输入充值金额"
                min="1"
                step="1"
                class="form-input amount-input"
              >
            </div>
            <div class="form-error" v-if="rechargeAmount && rechargeAmount <= 0">
              充值金额必须大于0
            </div>
          </div>
          <div class="quick-amount">
            <span>快速充值：</span>
            <div class="amount-buttons">
              <button @click="setAmount(50)" class="quick-amount-btn">¥50</button>
              <button @click="setAmount(100)" class="quick-amount-btn">¥100</button>
              <button @click="setAmount(500)" class="quick-amount-btn">¥500</button>
              <button @click="setAmount(1000)" class="quick-amount-btn">¥1000</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="showRechargeModal = false">取消</button>
          <button 
            class="confirm-modal-btn recharge-confirm-btn" 
            :disabled="!isRechargeAmountValid || rechargingLoading" 
            @click="handleRechargeWallet"
          >
            {{ rechargingLoading ? '充值中...' : '确认充值' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 提现申请对话框 -->
    <div class="modal-overlay" v-if="showWithdrawModal" @click.self="showWithdrawModal = false">
      <div class="modal-content wallet-modal">
        <div class="modal-header withdraw-header">
          <h3>申请提现</h3>
          <span class="close-btn" @click="showWithdrawModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="withdraw-amount">提现金额：</label>
            <div class="amount-input-wrapper">
              <span class="currency-symbol">¥</span>
              <input 
                id="withdraw-amount" 
                type="number" 
                v-model="withdrawForm.amount" 
                placeholder="请输入提现金额"
                min="1"
                step="1"
                class="form-input amount-input"
              >
            </div>
            <div class="form-error" v-if="withdrawAmountError">
              {{ withdrawAmountError }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="pay-method">提现方式：</label>
            <div class="method-selection">
              <select 
                id="pay-method"
                v-model="withdrawForm.payMethod"
                class="form-input method-select"
              >
                <option value="">请选择提现方式</option>
                <option value="Alipay">支付宝余额</option>
                <option value="WeChat">微信余额</option>
                <option value="BankCard">银行卡</option>
                <option value="Other">其他方式</option>
              </select>
              <input 
                v-if="withdrawForm.payMethod === 'Other'" 
                type="text" 
                v-model="withdrawForm.customPayMethod" 
                placeholder="请输入提现方式"
                class="form-input custom-method"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="account-info">账号信息：</label>
            <input 
              id="account-info" 
              type="text" 
              v-model="withdrawForm.accountInfo" 
              placeholder="请输入提现账号"
              class="form-input"
            >
            <div class="account-tip">
              <div v-if="withdrawForm.payMethod === 'Alipay'" class="tip-content">
                请输入您的支付宝账号（通常是手机号或邮箱）
              </div>
              <div v-else-if="withdrawForm.payMethod === 'WeChat'" class="tip-content">
                请输入您的微信账号
              </div>
              <div v-else-if="withdrawForm.payMethod === 'BankCard'" class="tip-content">
                请输入您的银行卡号和开户行，格式：卡号-开户行
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="showWithdrawModal = false">取消</button>
          <button 
            class="confirm-modal-btn withdraw-confirm-btn" 
            :disabled="!isWithdrawFormValid || withdrawLoading" 
            @click="handleWithdrawRequest"
          >
            {{ withdrawLoading ? '提交中...' : '确认提现' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 申请成为商家对话框 -->
    <div class="modal-overlay" v-if="showMerchantApplicationModal" @click.self="showMerchantApplicationModal = false">
      <div class="modal-content wallet-modal">
        <div class="modal-header merchant-header">
          <h3>申请成为商家</h3>
          <span class="close-btn" @click="showMerchantApplicationModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="shop-name">商店名称：</label>
            <input 
              id="shop-name" 
              type="text" 
              v-model="merchantForm.shopName" 
              placeholder="请输入商店名称"
              class="form-input"
            >
            <div class="form-error" v-if="merchantForm.shopName && merchantForm.shopName.length < 2">
              商店名称至少需要2个字符
            </div>
          </div>
          
          <div class="form-group">
            <label for="shop-avatar">商店头像URL：</label>
            <input 
              id="shop-avatar" 
              type="text" 
              v-model="merchantForm.shopAvatarUrl" 
              placeholder="请输入商店头像URL或上传头像"
              class="form-input"
            >
            <div class="avatar-upload-section">
              <div class="upload-btn-wrapper">
                <button class="upload-btn shop-avatar-btn">上传商店头像</button>
                <input type="file" @change="handleShopAvatarChange" accept="image/*">
              </div>
              <div class="upload-status" v-if="shopAvatarUploading">上传中...</div>
              <div class="upload-success" v-if="shopAvatarUploaded">上传成功</div>
            </div>
            <div class="shop-avatar-preview" v-if="merchantForm.shopAvatarUrl">
              <img :src="merchantForm.shopAvatarUrl" alt="商店头像预览">
            </div>
          </div>
          
          <div class="form-group">
            <label for="shop-description">商店描述：</label>
            <textarea 
              id="shop-description" 
              v-model="merchantForm.shopDescription" 
              placeholder="请输入商店描述"
              class="form-input shop-description"
              rows="4"
            ></textarea>
            <div class="form-error" v-if="merchantForm.shopDescription && merchantForm.shopDescription.length < 5">
              商店描述至少需要5个字符
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="showMerchantApplicationModal = false">取消</button>
          <button 
            class="confirm-modal-btn merchant-confirm-btn" 
            :disabled="!isMerchantFormValid || applyingMerchant" 
            @click="submitMerchantApplication"
          >
            {{ applyingMerchant ? '提交中...' : '确认申请' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  getUserInfo, 
  updateUserInfo, 
  uploadFileToAliOSS, 
  closeAccount,
  updatePassword,
  updatePhoneNumber,
  updateEmail,
  applyBecomeMerchant
} from '@/api/user'
import { getUserWalletInfo, rechargeWallet, userRequestWithdraw } from '@/api/wallet'

export default {
  name: 'UserProfilePage',
  setup() {
    const router = useRouter()
    const userInfo = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const editMode = ref(false)
    const saving = ref(false)
    const uploading = ref(false)
    const avatarUploaded = ref(false)
    const previewAvatar = ref('')
    
    // 注销账号相关
    const showCloseAccountConfirm = ref(false)
    const confirmPassword = ref('')
    const closeAccountLoading = ref(false)
    
    // 修改密码相关
    const showUpdatePasswordModal = ref(false)
    const updatePasswordLoading = ref(false)
    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    // 修改手机号相关
    const showUpdatePhoneModal = ref(false)
    const updatePhoneLoading = ref(false)
    const phoneForm = reactive({
      currentPhone: '',
      newPhone: ''
    })
    
    // 修改邮箱相关
    const showUpdateEmailModal = ref(false)
    const updateEmailLoading = ref(false)
    const emailForm = reactive({
      currentEmail: '',
      newEmail: ''
    })
    
    // 编辑表单
    const editForm = reactive({
      nickname: '',
      signature: '',
      avatarUrl: ''
    })

    // 钱包相关状态
    const walletInfo = ref(null)
    const walletLoading = ref(false)
    const walletError = ref(null)

    // 充值钱包相关
    const showRechargeModal = ref(false)
    const rechargeAmount = ref('')
    const rechargingLoading = ref(false)
    
    // 提现相关
    const showWithdrawModal = ref(false)
    const withdrawLoading = ref(false)
    const withdrawAmountError = ref('')
    const withdrawForm = reactive({
      amount: '',
      payMethod: '',
      customPayMethod: '',
      accountInfo: ''
    })
    
    // 申请成为商家相关
    const applyingMerchant = ref(false)
    
    // 表单验证
    const isPasswordFormValid = computed(() => {
      // 密码至少6位
      return passwordForm.currentPassword && 
             passwordForm.newPassword && 
             passwordForm.confirmPassword && 
             passwordForm.newPassword === passwordForm.confirmPassword && 
             passwordForm.newPassword.length >= 6
    })
    
    const isPhoneFormValid = computed(() => {
      // 使用中国手机号格式验证：1开头的11位数字
      const phoneRegex = /^1[3-9]\d{9}$/
      return phoneForm.currentPhone && 
             phoneForm.newPhone && 
             phoneRegex.test(phoneForm.newPhone)
    })
    
    const isEmailFormValid = computed(() => {
      // 邮箱格式验证
      const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/
      return emailForm.currentEmail && 
             emailForm.newEmail && 
             emailRegex.test(emailForm.newEmail)
    })

    // 充值金额验证
    const isRechargeAmountValid = computed(() => {
      const amount = Number(rechargeAmount.value)
      return amount > 0 && !isNaN(amount)
    })
    
    // 提现金额验证和错误信息设置
    const validateWithdrawAmount = () => {
      const amount = Number(withdrawForm.amount)
      
      // 验证金额
      if (isNaN(amount) || amount <= 0) {
        withdrawAmountError.value = '提现金额必须大于0'
        return false
      }
      
      // 验证金额是否超过可用余额
      if (walletInfo.value && amount > walletInfo.value.availableBalance) {
        withdrawAmountError.value = '提现金额不能超过可用余额'
        return false
      } else {
        withdrawAmountError.value = ''
      }
      
      return true
    }
    
    // 提现表单验证
    const isWithdrawFormValid = computed(() => {
      // 验证金额
      if (!validateWithdrawAmount()) {
        return false
      }
      
      // 验证提现方式
      if (!withdrawForm.payMethod) {
        return false
      }
      
      // 如果选择其他方式，验证自定义方式是否填写
      if (withdrawForm.payMethod === 'Other' && !withdrawForm.customPayMethod) {
        return false
      }
      
      // 验证账号信息
      if (!withdrawForm.accountInfo) {
        return false
      }
      
      return true
    })
    
    // 快速设置金额
    const setAmount = (amount) => {
      rechargeAmount.value = amount
    }
    
    // 处理提现申请
    const handleWithdrawRequest = async () => {
      if (!isWithdrawFormValid.value) {
        return
      }
      
      withdrawLoading.value = true
      
      try {
        // 准备提现参数
        const withdrawData = {
          amount: Number(withdrawForm.amount),
          payMethod: withdrawForm.payMethod === 'Other' ? withdrawForm.customPayMethod : withdrawForm.payMethod,
          accountInfo: withdrawForm.accountInfo
        }
        
        const response = await userRequestWithdraw(
          withdrawData.amount,
          withdrawData.payMethod,
          withdrawData.accountInfo
        )
        
        if (response && response.code === 200) {
          alert('提现申请提交成功')
          showWithdrawModal.value = false
          
          // 重置表单
          withdrawForm.amount = ''
          withdrawForm.payMethod = ''
          withdrawForm.customPayMethod = ''
          withdrawForm.accountInfo = ''
          
          // 刷新钱包信息
          await fetchWalletInfo()
        } else {
          alert(response?.msg || '提现申请失败，请稍后重试')
        }
      } catch (error) {
        console.error('提现申请出错:', error)
        alert('提现申请失败，请稍后重试')
      } finally {
        withdrawLoading.value = false
      }
    }

    const fetchUserInfo = async () => {
      loading.value = true
      error.value = null

      try {
        const response = await getUserInfo()
        if (response.code === 200) {
          userInfo.value = response.data
        } else {
          error.value = response.msg || '获取用户信息失败'
        }
      } catch (err) {
        console.error('获取用户信息出错：', err)
        error.value = '获取用户信息失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    // 开始编辑
    const startEdit = () => {
      editForm.nickname = userInfo.value.nickname || ''
      editForm.signature = userInfo.value.signature || ''
      editForm.avatarUrl = userInfo.value.avatarUrl || ''
      previewAvatar.value = userInfo.value.avatarUrl || ''
      avatarUploaded.value = false
      editMode.value = true
    }

    // 取消编辑
    const cancelEdit = () => {
      editMode.value = false
    }

    // 处理头像更改
    const handleAvatarChange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      // 验证文件类型
      if (!file.type.includes('image/')) {
        alert('请上传图片文件')
        return
      }
      
      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }
      
      // 创建本地预览
      const reader = new FileReader()
      reader.onload = (event) => {
        previewAvatar.value = event.target.result
      }
      reader.readAsDataURL(file)
      
      // 上传头像
      uploading.value = true
      avatarUploaded.value = false
      
      try {
        const response = await uploadFileToAliOSS(file)
        console.log('上传响应:', response)
        
        if (response.code === 200) {
          // 直接使用data字段作为URL，而不是data.url
          editForm.avatarUrl = response.data
          avatarUploaded.value = true
          console.log('头像上传成功, URL:', response.data)
        } else {
          alert(response.msg || '头像上传失败')
        }
      } catch (error) {
        console.error('头像上传错误:', error)
        alert('头像上传失败，请稍后重试')
      } finally {
        uploading.value = false
      }
    }

    // 保存更改
    const saveChanges = async () => {
      saving.value = true
      
      try {
        const updateData = {
          nickname: editForm.nickname,
          signature: editForm.signature
        }
        
        // 如果有头像URL且与原来不同，则添加到更新数据中
        if (editForm.avatarUrl && editForm.avatarUrl !== userInfo.value.avatarUrl) {
          updateData.avatarUrl = editForm.avatarUrl
          console.log('更新头像URL:', editForm.avatarUrl)
        }
        
        const response = await updateUserInfo(updateData)
        
        if (response.code === 200) {
          alert('个人信息更新成功')
          editMode.value = false
          // 重新获取用户信息
          await fetchUserInfo()
        } else {
          alert(response.msg || '更新失败')
        }
      } catch (error) {
        console.error('更新用户信息出错:', error)
        alert('更新失败，请稍后重试')
      } finally {
        saving.value = false
      }
    }

    // 处理修改密码
    const handleUpdatePassword = async () => {
      if (!isPasswordFormValid.value) {
        if (!passwordForm.currentPassword) {
          alert('请输入当前密码')
        } else if (!passwordForm.newPassword) {
          alert('请输入新密码') 
        } else if (passwordForm.newPassword.length < 6) {
          alert('新密码长度至少为6位')
        } else if (!passwordForm.confirmPassword) {
          alert('请确认新密码')
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          alert('两次输入的密码不一致')
        }
        return
      }
      
      updatePasswordLoading.value = true
      
      try {
        const response = await updatePassword(
          passwordForm.currentPassword,
          passwordForm.newPassword
        )
        
        if (response.code === 200) {
          alert('密码修改成功')
          showUpdatePasswordModal.value = false
          // 清空表单
          passwordForm.currentPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''
        } else {
          alert(response.msg || '密码修改失败，请检查当前密码是否正确')
        }
      } catch (error) {
        console.error('修改密码出错:', error)
        alert('密码修改失败，请稍后重试')
      } finally {
        updatePasswordLoading.value = false
      }
    }
    
    // 处理修改手机号
    const handleUpdatePhone = async () => {
      if (!isPhoneFormValid.value) {
        if (!phoneForm.currentPhone) {
          alert('请输入当前手机号')
        } else if (!phoneForm.newPhone) {
          alert('请输入新手机号')
        } else if (!/^1[3-9]\d{9}$/.test(phoneForm.newPhone)) {
          alert('请输入有效的11位手机号')
        }
        return
      }
      
      updatePhoneLoading.value = true
      
      try {
        const response = await updatePhoneNumber(
          phoneForm.currentPhone,
          phoneForm.newPhone
        )
        
        if (response.code === 200) {
          alert('手机号修改成功')
          showUpdatePhoneModal.value = false
          // 清空表单
          phoneForm.currentPhone = ''
          phoneForm.newPhone = ''
          // 重新获取用户信息
          await fetchUserInfo()
        } else {
          alert(response.msg || '手机号修改失败，请检查当前手机号是否正确')
        }
      } catch (error) {
        console.error('修改手机号出错:', error)
        alert('手机号修改失败，请稍后重试')
      } finally {
        updatePhoneLoading.value = false
      }
    }
    
    // 处理修改邮箱
    const handleUpdateEmail = async () => {
      if (!isEmailFormValid.value) {
        if (!emailForm.currentEmail) {
          alert('请输入当前邮箱')
        } else if (!emailForm.newEmail) {
          alert('请输入新邮箱')
        } else if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(emailForm.newEmail)) {
          alert('请输入有效的邮箱地址')
        }
        return
      }
      
      updateEmailLoading.value = true
      
      try {
        // 使用专门的updateEmail方法
        const response = await updateEmail(
          emailForm.currentEmail,
          emailForm.newEmail
        )
        
        if (response.code === 200) {
          alert('邮箱修改成功')
          showUpdateEmailModal.value = false
          // 清空表单
          emailForm.currentEmail = ''
          emailForm.newEmail = ''
          // 重新获取用户信息
          await fetchUserInfo()
        } else {
          alert(response.msg || '邮箱修改失败，请检查当前邮箱是否正确')
        }
      } catch (error) {
        console.error('修改邮箱出错:', error)
        alert('邮箱修改失败，请稍后重试')
      } finally {
        updateEmailLoading.value = false
      }
    }

    // 处理注销账号
    const handleCloseAccount = async () => {
      if (!confirmPassword.value) {
        alert('请输入密码')
        return
      }
      
      closeAccountLoading.value = true
      
      try {
        const response = await closeAccount(confirmPassword.value)
        
        if (response.code === 200) {
          alert('账号已成功注销')
          
          // 清除本地存储的用户信息
          localStorage.removeItem('token')
          localStorage.removeItem('userId')
          localStorage.removeItem('username')
          localStorage.removeItem('role')
          
          // 跳转到登录页面
          router.push('/login')
        } else {
          alert(response.msg || '注销失败，请检查密码是否正确')
        }
      } catch (error) {
        console.error('注销账号出错:', error)
        alert('注销失败，请稍后重试')
      } finally {
        closeAccountLoading.value = false
        showCloseAccountConfirm.value = false
        confirmPassword.value = ''
      }
    }

    // 获取钱包信息
    const fetchWalletInfo = async () => {
      walletLoading.value = true
      walletError.value = null

      try {
        const response = await getUserWalletInfo()
        if (response.code === 200) {
          walletInfo.value = response.data
        } else {
          walletError.value = response.msg || '获取钱包信息失败'
        }
      } catch (err) {
        console.error('获取钱包信息出错：', err)
        walletError.value = '获取钱包信息失败，请稍后重试'
      } finally {
        walletLoading.value = false
      }
    }

    // 处理钱包充值
    const handleRechargeWallet = async () => {
      if (!isRechargeAmountValid.value) {
        alert('请输入有效的充值金额')
        return
      }
      
      rechargingLoading.value = true
      
      try {
        const response = await rechargeWallet(Number(rechargeAmount.value))
        
        if (response.code === 200) {
          alert('充值成功')
          showRechargeModal.value = false
          rechargeAmount.value = ''
          // 刷新钱包信息
          await fetchWalletInfo()
        } else {
          alert(response.msg || '充值失败，请稍后重试')
        }
      } catch (error) {
        console.error('充值钱包出错:', error)
        alert('充值失败，请稍后重试')
      } finally {
        rechargingLoading.value = false
      }
    }

    const goToHome = () => {
      router.push('/')
    }

    const formatRole = (role) => {
      const roleMap = {
        'USER': '普通用户',
        'ADMIN': '管理员',
        'SELLER': '商家'
      }
      return roleMap[role] || role
    }

    const formatStatus = (status) => {
      const statusMap = {
        'ACTIVE': '正常',
        'INACTIVE': '未激活',
        'LOCKED': '已锁定',
        'DELETED': '已删除'
      }
      return statusMap[status] || status
    }

    const formatEmail = (email) => {
      if (!email) return ''
      const parts = email.split('@')
      if (parts.length !== 2) return email
      
      const username = parts[0]
      const domain = parts[1]
      
      // 如果用户名长度小于等于3，则只显示第一个字符
      if (username.length <= 3) {
        return username.charAt(0) + '***@' + domain
      }
      
      // 否则显示第一个和最后一个字符
      return username.charAt(0) + '***' + username.charAt(username.length - 1) + '@' + domain
    }

    const formatPhone = (phone) => {
      if (!phone) return ''
      if (phone.length !== 11) return phone
      
      return phone.substring(0, 3) + '****' + phone.substring(7)
    }

    const goToAddresses = () => {
      router.push('/user/addresses')
    }

    // 格式化金额，保留两位小数
    const formatMoney = (amount) => {
      if (amount === undefined || amount === null) return '0.00'
      return parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    const goToWalletLogs = () => {
      router.push('/user/wallet-logs')
    }

    const goToWithdrawRequests = () => {
      router.push('/user/withdraw-requests')
    }

    const handleApplyMerchant = async () => {
      if (userInfo.value.role === 'MERCHANT') {
        alert('您已经是商家，无需再次申请')
        return
      }
      
      // 显示申请对话框
      showMerchantApplicationModal.value = true
    }

    // 新增的表单和逻辑
    const showMerchantApplicationModal = ref(false)
    const merchantForm = reactive({
      shopName: '',
      shopAvatarUrl: '',
      shopDescription: ''
    })
    const shopAvatarUploading = ref(false)
    const shopAvatarUploaded = ref(false)

    const handleShopAvatarChange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      // 验证文件类型
      if (!file.type.includes('image/')) {
        alert('请上传图片文件')
        return
      }
      
      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }
      
      // 上传头像
      shopAvatarUploading.value = true
      shopAvatarUploaded.value = false
      
      try {
        const response = await uploadFileToAliOSS(file)
        console.log('上传响应:', response)
        
        if (response.code === 200) {
          // 直接使用data字段作为URL，而不是data.url
          merchantForm.shopAvatarUrl = response.data
          shopAvatarUploaded.value = true
          console.log('商店头像上传成功, URL:', response.data)
        } else {
          alert(response.msg || '商店头像上传失败')
        }
      } catch (error) {
        console.error('商店头像上传错误:', error)
        alert('商店头像上传失败，请稍后重试')
      } finally {
        shopAvatarUploading.value = false
      }
    }

    const isMerchantFormValid = computed(() => {
      return merchantForm.shopName && 
             merchantForm.shopName.length >= 2 && 
             merchantForm.shopAvatarUrl && 
             merchantForm.shopDescription && 
             merchantForm.shopDescription.length >= 5
    })
    
    const submitMerchantApplication = async () => {
      if (!isMerchantFormValid.value) {
        return
      }
      
      applyingMerchant.value = true
      
      try {
        const merchantData = {
          shopName: merchantForm.shopName,
          shopAvatarUrl: merchantForm.shopAvatarUrl,
          shopDescription: merchantForm.shopDescription
        }
        
        const response = await applyBecomeMerchant(merchantData)
        
        if (response && response.code === 200) {
          alert('商家申请提交成功，请等待管理员审核')
          showMerchantApplicationModal.value = false
          // 重置表单
          merchantForm.shopName = ''
          merchantForm.shopAvatarUrl = ''
          merchantForm.shopDescription = ''
          // 更新用户信息
          await fetchUserInfo()
        } else {
          alert(response?.msg || '商家申请提交失败，请稍后重试')
        }
      } catch (error) {
        console.error('商家申请出错:', error)
        alert('商家申请失败，请稍后重试')
      } finally {
        applyingMerchant.value = false
      }
    }

    const goToMerchantApplications = () => {
      router.push('/user/merchant-applications')
    }

    onMounted(() => {
      fetchUserInfo()
      fetchWalletInfo()
    })

    return {
      userInfo,
      loading,
      error,
      editMode,
      editForm,
      saving,
      uploading,
      avatarUploaded,
      previewAvatar,
      showCloseAccountConfirm,
      confirmPassword,
      closeAccountLoading,
      showUpdatePasswordModal,
      passwordForm,
      updatePasswordLoading,
      isPasswordFormValid,
      showUpdatePhoneModal,
      phoneForm,
      updatePhoneLoading,
      isPhoneFormValid,
      showUpdateEmailModal,
      emailForm,
      updateEmailLoading,
      isEmailFormValid,
      fetchUserInfo,
      startEdit,
      cancelEdit,
      handleAvatarChange,
      saveChanges,
      handleUpdatePassword,
      handleUpdatePhone,
      handleUpdateEmail,
      handleCloseAccount,
      goToHome,
      formatRole,
      formatStatus,
      formatEmail,
      formatPhone,
      goToAddresses,
      walletInfo,
      walletLoading,
      walletError,
      fetchWalletInfo,
      formatMoney,
      showRechargeModal,
      rechargeAmount,
      rechargingLoading,
      isRechargeAmountValid,
      setAmount,
      handleRechargeWallet,
      goToWalletLogs,
      showWithdrawModal,
      withdrawLoading,
      withdrawAmountError,
      withdrawForm,
      isWithdrawFormValid,
      handleWithdrawRequest,
      goToWithdrawRequests,
      handleApplyMerchant,
      applyingMerchant,
      showMerchantApplicationModal,
      merchantForm,
      shopAvatarUploading,
      shopAvatarUploaded,
      handleShopAvatarChange,
      submitMerchantApplication,
      isMerchantFormValid,
      goToMerchantApplications
    }
  }
}
</script>

<style scoped>
.user-profile-container {
  width: 100%;
  min-height: 100vh;
  background-color: #d1e3ff;
  font-family: 'Noto Sans SC', sans-serif;
  padding: 30px 5%;
}

.profile-container {
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

.profile-content {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.avatar-section {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 20px;
  border: 5px solid #ff69b4;
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-btn-wrapper {
  position: relative;
  overflow: hidden;
  display: inline-block;
  margin-bottom: 10px;
}

.upload-btn {
  padding: 8px 15px;
  background: linear-gradient(45deg, #ff69b4, #6a4c93);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.3);
}

.upload-btn-wrapper input[type=file] {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.upload-status {
  font-size: 12px;
  color: #ff69b4;
  font-weight: bold;
  margin-top: 5px;
}

.upload-success {
  font-size: 12px;
  color: #4caf50;
  font-weight: bold;
  margin-top: 5px;
}

.signature {
  text-align: center;
  color: #777;
  font-style: italic;
  line-height: 1.5;
  width: 100%;
}

.signature-edit {
  width: 100%;
  height: 80px;
  padding: 10px;
  border: 2px solid #d8bfd8;
  border-radius: 8px;
  resize: vertical;
  font-size: 14px;
  margin-top: 10px;
}

.signature-edit:focus {
  outline: none;
  border-color: #ff69b4;
  box-shadow: 0 0 5px rgba(255, 105, 180, 0.5);
}

.info-section {
  flex: 1;
  min-width: 300px;
}

.info-card {
  background-color: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.card-header h2 {
  color: #6a4c93;
  margin: 0;
}

.edit-btn, .save-btn, .cancel-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-btn {
  background-color: #ff69b4;
  color: white;
}

.save-btn {
  background-color: #4caf50;
  color: white;
  margin-left: 10px;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #555;
}

.edit-btn:hover, .save-btn:hover, .cancel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.edit-actions {
  display: flex;
}

.info-item {
  display: flex;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.label {
  width: 100px;
  font-weight: bold;
  color: #555;
}

.value {
  flex: 1;
  color: #333;
}

.edit-input {
  width: 100%;
  padding: 8px 10px;
  border: 2px solid #d8bfd8;
  border-radius: 8px;
  font-size: 14px;
}

.edit-input:focus {
  outline: none;
  border-color: #ff69b4;
  box-shadow: 0 0 5px rgba(255, 105, 180, 0.5);
}

/* 加载状态 */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #ff69b4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 40px;
  margin-bottom: 20px;
  color: #ff5050;
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
}

/* 账号注销区域 */
.close-account-section {
  margin-top: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.account-options-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.account-option {
  flex: 1;
  min-width: 200px;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  background-color: #f8f9fe;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.account-option:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-title {
  font-size: 18px;
  font-weight: bold;
  color: #6a4c93;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #d8bfd8;
}

.option-notice {
  color: #777;
  font-size: 14px;
  margin-top: 15px;
  line-height: 1.5;
}

.close-account-btn {
  padding: 10px 20px;
  background-color: #ff3a3a;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  width: 70%;
}

.close-account-btn:hover {
  background-color: #e62424;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(230, 36, 36, 0.3);
}

/* 模态对话框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 450px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  background-color: #ff3a3a;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  line-height: 1;
}

.close-btn:hover {
  transform: scale(1.2);
}

.modal-body {
  padding: 20px;
}

.warning-text {
  color: #ff3a3a;
  font-weight: bold;
  margin-bottom: 20px;
}

.password-input {
  margin-bottom: 20px;
}

.password-input label {
  display: block;
  margin-bottom: 10px;
  color: #555;
}

.password-field {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.password-field:focus {
  outline: none;
  border-color: #ff3a3a;
  box-shadow: 0 0 5px rgba(255, 58, 58, 0.3);
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-modal-btn, .confirm-modal-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-modal-btn {
  background-color: #f0f0f0;
  color: #555;
}

.confirm-modal-btn {
  background-color: #ff3a3a;
  color: white;
}

.confirm-modal-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-modal-btn:hover, .confirm-modal-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.confirm-modal-btn:not(:disabled):hover {
  background-color: #e62424;
}

/* 账号操作按钮 */
.account-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-start;
}

.update-password-btn {
  padding: 8px 16px;
  background-color: #6a4c93;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.update-password-btn:hover {
  background-color: #5a3d83;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(106, 76, 147, 0.3);
}

/* 信息项中的操作按钮 */
.info-item {
  display: flex;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.info-item .action {
  margin-left: 10px;
}

.action-btn {
  padding: 4px 10px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(255, 105, 180, 0.3);
}

/* 更新弹窗样式 */
.update-modal {
  max-width: 450px;
}

.update-header {
  background-color: #6a4c93;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: bold;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 2px solid #d8bfd8;
  border-radius: 8px;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: #6a4c93;
  box-shadow: 0 0 5px rgba(106, 76, 147, 0.3);
}

.current-info {
  padding: 10px;
  background-color: #f8f9fe;
  border-radius: 8px;
  color: #666;
}

.update-btn {
  background-color: #6a4c93;
}

.update-btn:not(:disabled):hover {
  background-color: #5a3d83;
}

/* 表单错误提示样式 */
.form-error {
  color: #ff3a3a;
  font-size: 12px;
  margin-top: 5px;
}

/* 用户功能按钮区域 */
.user-actions {
  margin-top: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 25px;
  background-color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  cursor: pointer;
}

.action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.address-btn {
  background: linear-gradient(45deg, #ff69b4, #6a4c93);
  color: white;
}

.action-icon {
  font-size: 18px;
  margin-right: 8px;
}

.action-text {
  font-weight: bold;
}

/* 钱包样式 */
.wallet-section {
  width: 100%;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fe;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.wallet-title {
  color: #6a4c93;
  font-size: 18px;
  text-align: center;
  margin-bottom: 15px;
  border-bottom: 2px solid #ff69b4;
  padding-bottom: 8px;
}

.wallet-loading, .wallet-error, .wallet-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
}

.wallet-info {
  padding: 5px;
}

.wallet-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.wallet-item:hover {
  background-color: #f0f4ff;
}

.wallet-label {
  width: 40%;
  font-weight: bold;
  color: #555;
  font-size: 14px;
}

.wallet-value {
  width: 60%;
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.total-balance {
  background-color: #f8f8ff;
}

.total-balance .wallet-value {
  color: #ff69b4;
  font-weight: bold;
  font-size: 16px;
}

.available-balance {
  background-color: #f0fff4;
}

.available-balance .wallet-value {
  color: #4caf50;
  font-weight: bold;
}

.pending-balance {
  background-color: #fffaf0;
}

.pending-balance .wallet-value {
  color: #ff9800;
}

.retry-btn {
  margin-top: 10px;
  padding: 5px 15px;
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

.error-message {
  color: #f44336;
  font-size: 14px;
}

/* 钱包充值按钮 */
.wallet-action {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.recharge-btn, .withdraw-btn {
  padding: 8px 16px;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.recharge-btn {
  background: linear-gradient(45deg, #ff69b4, #6a4c93);
  margin-right: 10px;
}

.withdraw-btn {
  background: linear-gradient(45deg, #6a4c93, #ff69b4);
}

.recharge-btn:hover, .withdraw-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(106, 76, 147, 0.3);
}

/* 钱包充值对话框 */
.wallet-modal {
  max-width: 400px;
}

.wallet-header {
  background: linear-gradient(45deg, #ff69b4, #6a4c93);
}

.amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 10px;
  font-size: 16px;
  color: #666;
}

.amount-input {
  padding-left: 25px;
}

.quick-amount {
  margin-top: 20px;
}

.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.quick-amount-btn {
  padding: 8px 15px;
  background-color: #f0f4ff;
  border: 1px solid #d8e0f3;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-amount-btn:hover {
  background-color: #e0e8ff;
  transform: translateY(-2px);
}

.recharge-confirm-btn {
  background: linear-gradient(45deg, #ff69b4, #6a4c93);
}

.recharge-confirm-btn:not(:disabled):hover {
  background: linear-gradient(45deg, #ff5ba7, #5a3d83);
}

.wallet-logs-btn, .withdraw-requests-btn {
  display: block;
  width: 100%;
  padding: 12px 20px;
  margin-top: 15px;
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  box-shadow: 0 4px 10px rgba(106, 76, 147, 0.2);
}

.wallet-logs-btn {
  background: linear-gradient(45deg, #6a4c93, #ff69b4);
}

.withdraw-requests-btn {
  background: linear-gradient(45deg, #ff69b4, #6a4c93);
}

.wallet-logs-btn:hover, .withdraw-requests-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(106, 76, 147, 0.3);
}

.wallet-logs-btn:hover {
  background: linear-gradient(45deg, #5a3d83, #ff5ba7);
}

.withdraw-requests-btn:hover {
  background: linear-gradient(45deg, #ff5ba7, #5a3d83);
}

/* 提现申请对话框 */
.withdraw-header {
  background-color: #6a4c93;
}

.method-selection {
  display: flex;
  align-items: center;
}

.method-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #d8bfd8;
  border-radius: 8px;
  margin-right: 10px;
}

.custom-method {
  width: 100%;
  padding: 10px;
  border: 2px solid #d8bfd8;
  border-radius: 8px;
}

.account-tip {
  margin-top: 10px;
  color: #777;
  font-size: 12px;
}

.withdraw-confirm-btn {
  background: linear-gradient(45deg, #ff69b4, #6a4c93);
}

.withdraw-confirm-btn:not(:disabled):hover {
  background: linear-gradient(45deg, #ff5ba7, #5a3d83);
}

.become-merchant-btn {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  width: 70%;
}

.become-merchant-btn:hover {
  background-color: #388e3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(56, 142, 60, 0.3);
}

.become-merchant-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 新增的样式 */
.avatar-upload-section {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.shop-avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-top: 10px;
  margin-bottom: 10px;
}

.shop-avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.merchant-header {
  background-color: #6a4c93;
}

.view-application-link {
  display: flex;
  align-items: center;
  color: #6a4c93;
  cursor: pointer;
  transition: all 0.3s;
}

.view-application-link:hover {
  color: #5a3d83;
  transform: translateX(5px);
}

.arrow-icon {
  margin-left: 5px;
  font-size: 16px;
}
</style> 