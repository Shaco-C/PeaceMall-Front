<template>
  <div class="addresses-container">
    <div class="navbar">
      <div class="logo" @click="goToHome">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <span>和平商城</span>
      </div>
      <div class="page-title">
        <h1>地址管理</h1>
      </div>
      <div class="back-btn" @click="goToProfile">
        <span>返回个人中心</span>
      </div>
    </div>

    <div class="addresses-content" v-if="addresses && addresses.length > 0">
      <div class="address-card" v-for="address in addresses" :key="address.addressId">
        <div class="address-info">
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
        <div class="address-actions">
          <button class="edit-btn" @click="openEditForm(address)">编辑</button>
          <button class="delete-btn" @click="confirmDeleteAddress(address.addressId)">删除</button>
          <button v-if="!address.isDefault" class="default-btn" @click="handleSetDefault(address.addressId)">设为默认</button>
        </div>
      </div>
      
      <div class="add-address">
        <button class="add-address-btn" @click="showAddAddressForm = true">
          <span class="add-icon">+</span>
          添加新地址
        </button>
      </div>
    </div>
    
    <!-- 空地址状态 -->
    <div class="empty-state" v-else-if="addresses && addresses.length === 0">
      <div class="empty-icon">📭</div>
      <p>您还没有添加任何收货地址</p>
      <button class="add-address-btn" @click="showAddAddressForm = true">
        <span class="add-icon">+</span>
        添加新地址
      </button>
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
      <button @click="fetchAddresses" class="retry-btn">重试</button>
    </div>
    
    <!-- 添加地址表单 -->
    <div class="modal-overlay" v-if="showAddAddressForm" @click.self="showAddAddressForm = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加新地址</h3>
          <span class="close-btn" @click="showAddAddressForm = false">&times;</span>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitNewAddress">
            <div class="form-group">
              <label for="consignee">收货人姓名：</label>
              <input 
                id="consignee" 
                type="text" 
                v-model="newAddress.consignee" 
                placeholder="请输入收货人姓名"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="phone">手机号码：</label>
              <input 
                id="phone" 
                type="text" 
                v-model="newAddress.phone" 
                placeholder="请输入手机号码"
                class="form-input"
                required
              >
              <div class="form-error" v-if="newAddress.phone && !/^1[3-9]\d{9}$/.test(newAddress.phone)">
                请输入有效的11位手机号
              </div>
            </div>
            <div class="form-group">
              <label for="country">国家：</label>
              <input 
                id="country" 
                type="text" 
                v-model="newAddress.country" 
                placeholder="请输入国家"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="province">省份：</label>
              <input 
                id="province" 
                type="text" 
                v-model="newAddress.province" 
                placeholder="请输入省份"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="city">城市：</label>
              <input 
                id="city" 
                type="text" 
                v-model="newAddress.city" 
                placeholder="请输入城市"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="district">区县：</label>
              <input 
                id="district" 
                type="text" 
                v-model="newAddress.district" 
                placeholder="请输入区县"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="street">详细地址：</label>
              <input 
                id="street" 
                type="text" 
                v-model="newAddress.street" 
                placeholder="请输入详细地址（街道、门牌号等）"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="addressTag">地址标签：</label>
              <select 
                id="addressTag" 
                v-model="newAddress.addressTag" 
                class="form-input"
                required
              >
                <option value="HOME">家庭</option>
                <option value="COMPANY">公司</option>
                <option value="SCHOOL">学校</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="newAddress.isDefault"
                >
                <span>设为默认地址</span>
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-form-btn" @click="showAddAddressForm = false">取消</button>
              <button 
                type="submit" 
                class="submit-form-btn" 
                :disabled="!isFormValid || submitting"
              >
                {{ submitting ? '保存中...' : '保存地址' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 编辑地址表单 -->
    <div class="modal-overlay" v-if="showEditAddressForm" @click.self="showEditAddressForm = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑地址</h3>
          <span class="close-btn" @click="showEditAddressForm = false">&times;</span>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitEditAddress">
            <div class="form-group">
              <label for="edit-consignee">收货人姓名：</label>
              <input 
                id="edit-consignee" 
                type="text" 
                v-model="editAddress.consignee" 
                placeholder="请输入收货人姓名"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="edit-phone">手机号码：</label>
              <input 
                id="edit-phone" 
                type="text" 
                v-model="editAddress.phone" 
                placeholder="请输入手机号码"
                class="form-input"
                required
              >
              <div class="form-error" v-if="editAddress.phone && !/^1[3-9]\d{9}$/.test(editAddress.phone)">
                请输入有效的11位手机号
              </div>
            </div>
            <div class="form-group">
              <label for="edit-country">国家：</label>
              <input 
                id="edit-country" 
                type="text" 
                v-model="editAddress.country" 
                placeholder="请输入国家"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="edit-province">省份：</label>
              <input 
                id="edit-province" 
                type="text" 
                v-model="editAddress.province" 
                placeholder="请输入省份"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="edit-city">城市：</label>
              <input 
                id="edit-city" 
                type="text" 
                v-model="editAddress.city" 
                placeholder="请输入城市"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="edit-district">区县：</label>
              <input 
                id="edit-district" 
                type="text" 
                v-model="editAddress.district" 
                placeholder="请输入区县"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="edit-street">详细地址：</label>
              <input 
                id="edit-street" 
                type="text" 
                v-model="editAddress.street" 
                placeholder="请输入详细地址（街道、门牌号等）"
                class="form-input"
                required
              >
            </div>
            <div class="form-group">
              <label for="edit-addressTag">地址标签：</label>
              <select 
                id="edit-addressTag" 
                v-model="editAddress.addressTag" 
                class="form-input"
                required
              >
                <option value="HOME">家庭</option>
                <option value="COMPANY">公司</option>
                <option value="SCHOOL">学校</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="editAddress.isDefault"
                >
                <span>设为默认地址</span>
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-form-btn" @click="showEditAddressForm = false">取消</button>
              <button 
                type="submit" 
                class="submit-form-btn" 
                :disabled="!isEditFormValid || submittingEdit"
              >
                {{ submittingEdit ? '保存中...' : '保存修改' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click.self="showDeleteConfirm = false">
      <div class="modal-content delete-modal">
        <div class="modal-header delete-header">
          <h3>删除确认</h3>
          <span class="close-btn" @click="showDeleteConfirm = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <div class="warning-icon">⚠️</div>
            <p>确定要删除这个地址吗？删除后将无法恢复。</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-modal-btn" @click="showDeleteConfirm = false">取消</button>
          <button 
            class="confirm-modal-btn delete-btn-confirm" 
            :disabled="deleting"
            @click="handleDeleteAddress"
          >
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getUserAddresses, addUserAddress, updateUserAddress, setDefaultAddress, deleteAddresses } from '@/api/address'

export default {
  name: 'UserAddressesPage',
  setup() {
    const router = useRouter()
    const addresses = ref(null)
    const loading = ref(true)
    const error = ref(null)
    const showAddAddressForm = ref(false)
    const submitting = ref(false)
    const showEditAddressForm = ref(false)
    const submittingEdit = ref(false)
    const showDeleteConfirm = ref(false)
    const deletingAddressId = ref(null)
    const deleting = ref(false)
    
    const newAddress = reactive({
      consignee: '',
      phone: '',
      country: '中国',
      province: '',
      city: '',
      district: '',
      street: '',
      isDefault: false,
      addressTag: 'HOME',
      status: 1
    })
    
    const editAddress = reactive({
      addressId: null,
      consignee: '',
      phone: '',
      country: '',
      province: '',
      city: '',
      district: '',
      street: '',
      isDefault: false,
      addressTag: '',
      status: 1
    })
    
    // 表单验证
    const isFormValid = computed(() => {
      const phoneRegex = /^1[3-9]\d{9}$/
      return newAddress.consignee && 
             newAddress.phone && 
             phoneRegex.test(newAddress.phone) &&
             newAddress.country &&
             newAddress.province &&
             newAddress.city &&
             newAddress.district &&
             newAddress.street &&
             newAddress.addressTag
    })
    
    // 编辑表单验证
    const isEditFormValid = computed(() => {
      const phoneRegex = /^1[3-9]\d{9}$/
      return editAddress.addressId && 
             editAddress.consignee && 
             editAddress.phone && 
             phoneRegex.test(editAddress.phone) &&
             editAddress.country &&
             editAddress.province &&
             editAddress.city &&
             editAddress.district &&
             editAddress.street &&
             editAddress.addressTag
    })
    
    const fetchAddresses = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await getUserAddresses()
        if (response.code === 200) {
          addresses.value = response.data
        } else {
          error.value = response.msg || '获取地址信息失败'
        }
      } catch (err) {
        console.error('获取地址信息出错：', err)
        error.value = '获取地址信息失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }
    
    // 提交新地址
    const submitNewAddress = async () => {
      if (!isFormValid.value) {
        if (!newAddress.consignee) {
          alert('请输入收货人姓名')
        } else if (!newAddress.phone) {
          alert('请输入手机号码')
        } else if (!/^1[3-9]\d{9}$/.test(newAddress.phone)) {
          alert('请输入有效的11位手机号')
        } else {
          alert('请填写完整的地址信息')
        }
        return
      }
      
      submitting.value = true
      
      try {
        const response = await addUserAddress(newAddress)
        
        if (response.code === 200) {
          alert('添加地址成功')
          showAddAddressForm.value = false
          
          // 重置表单
          Object.assign(newAddress, {
            consignee: '',
            phone: '',
            country: '中国',
            province: '',
            city: '',
            district: '',
            street: '',
            isDefault: false,
            addressTag: 'HOME',
            status: 1
          })
          
          // 重新获取地址列表
          await fetchAddresses()
        } else {
          alert(response.msg || '添加地址失败')
        }
      } catch (error) {
        console.error('添加地址出错:', error)
        alert('添加地址失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    }
    
    // 打开编辑表单
    const openEditForm = (address) => {
      Object.assign(editAddress, { 
        addressId: String(address.addressId),
        consignee: address.consignee,
        phone: address.phone,
        country: address.country,
        province: address.province,
        city: address.city,
        district: address.district,
        street: address.street,
        isDefault: address.isDefault,
        addressTag: address.addressTag,
        status: address.status || 1
      })
      showEditAddressForm.value = true
    }
    
    // 提交编辑地址
    const submitEditAddress = async () => {
      if (!isEditFormValid.value) {
        if (!editAddress.consignee) {
          alert('请输入收货人姓名')
        } else if (!editAddress.phone) {
          alert('请输入手机号码')
        } else if (!/^1[3-9]\d{9}$/.test(editAddress.phone)) {
          alert('请输入有效的11位手机号')
        } else {
          alert('请填写完整的地址信息')
        }
        return
      }
      
      submittingEdit.value = true
      
      try {
        const response = await updateUserAddress(editAddress)
        
        if (response.code === 200) {
          alert('修改地址成功')
          showEditAddressForm.value = false
          
          // 重新获取地址列表
          await fetchAddresses()
        } else {
          alert(response.msg || '修改地址失败')
        }
      } catch (error) {
        console.error('修改地址出错:', error)
        alert('修改地址失败，请稍后重试')
      } finally {
        submittingEdit.value = false
      }
    }
    
    // 添加设为默认地址的处理函数
    const handleSetDefault = async (addressId) => {
      try {
        const response = await setDefaultAddress(String(addressId))
        
        if (response.code === 200) {
          alert('设置默认地址成功')
          // 重新获取地址列表
          await fetchAddresses()
        } else {
          alert(response.msg || '设置默认地址失败')
        }
      } catch (error) {
        console.error('设置默认地址出错:', error)
        alert('设置默认地址失败，请稍后重试')
      }
    }
    
    // 确认删除地址
    const confirmDeleteAddress = (addressId) => {
      deletingAddressId.value = addressId
      showDeleteConfirm.value = true
    }
    
    // 处理删除地址
    const handleDeleteAddress = async () => {
      if (!deletingAddressId.value) return
      
      deleting.value = true
      
      try {
        const response = await deleteAddresses([deletingAddressId.value])
        
        if (response.code === 200) {
          alert('删除地址成功')
          showDeleteConfirm.value = false
          
          // 重新获取地址列表
          await fetchAddresses()
        } else {
          alert(response.msg || '删除地址失败')
        }
      } catch (error) {
        console.error('删除地址出错:', error)
        alert('删除地址失败，请稍后重试')
      } finally {
        deleting.value = false
        deletingAddressId.value = null
      }
    }
    
    const goToHome = () => {
      router.push('/')
    }
    
    const goToProfile = () => {
      router.push('/user')
    }
    
    const formatAddressTag = (tag) => {
      const tagMap = {
        'HOME': '家庭',
        'COMPANY': '公司',
        'SCHOOL': '学校',
        'OTHER': '其他'
      }
      return tagMap[tag] || tag
    }
    
    const formatPhone = (phone) => {
      if (!phone) return ''
      if (phone.length !== 11) return phone
      
      return phone.substring(0, 3) + '****' + phone.substring(7)
    }
    
    const formatAddress = (address) => {
      return `${address.country} ${address.province} ${address.city} ${address.district} ${address.street}`
    }
    
    onMounted(() => {
      fetchAddresses()
    })
    
    return {
      addresses,
      loading,
      error,
      showAddAddressForm,
      submitting,
      newAddress,
      isFormValid,
      goToHome,
      goToProfile,
      fetchAddresses,
      submitNewAddress,
      formatAddressTag,
      formatPhone,
      formatAddress,
      showEditAddressForm,
      submittingEdit,
      editAddress,
      isEditFormValid,
      openEditForm,
      submitEditAddress,
      handleSetDefault,
      showDeleteConfirm,
      deletingAddressId,
      deleting,
      confirmDeleteAddress,
      handleDeleteAddress
    }
  }
}
</script>

<style scoped>
.user-addresses-container {
  width: 100%;
  min-height: 100vh;
  background-color: #d1e3ff;
  font-family: 'Noto Sans SC', sans-serif;
  padding: 30px 5%;
}

.addresses-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  background-color: #f8f9fe;
  min-height: 100vh;
}

.navbar {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #ff69b4;
  color: white;
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
}

.page-title {
  flex: 1;
  text-align: center;
}

.back-btn {
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.addresses-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.address-card {
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.address-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.address-info {
  flex: 1;
}

.address-tag {
  display: inline-block;
  padding: 4px 10px;
  background-color: #d8bfd8;
  color: #6a4c93;
  border-radius: 15px;
  font-size: 12px;
  margin-bottom: 10px;
}

.default-tag {
  background-color: #ff69b4;
  color: white;
}

.default-label {
  margin-left: 5px;
  font-size: 12px;
  font-weight: bold;
}

.consignee-info {
  margin-bottom: 10px;
}

.consignee-name {
  font-weight: bold;
  font-size: 16px;
  margin-right: 10px;
}

.consignee-phone {
  color: #777;
}

.address-detail {
  color: #333;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn, .default-btn {
  padding: 6px 12px;
  border-radius: 15px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-btn {
  background-color: #6a4c93;
  color: white;
}

.delete-btn {
  background-color: #f0f0f0;
  color: #555;
}

.default-btn {
  background-color: #ff69b4;
  color: white;
}

.edit-btn:hover, .delete-btn:hover, .default-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.add-address {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.add-address-btn {
  padding: 10px 20px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}

.add-icon {
  font-size: 20px;
  margin-right: 8px;
  font-weight: bold;
}

.add-address-btn:hover {
  background-color: #ff5ba7;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.3);
}

/* 空状态 */
.empty-state {
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

.empty-icon {
  font-size: 50px;
  margin-bottom: 20px;
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

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #ff69b4;
  color: white;
  border-radius: 15px 15px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  cursor: pointer;
  font-size: 24px;
  color: white;
}

.modal-body {
  padding: 20px;
}

/* 表单样式 */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
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
  border-color: #ff69b4;
  box-shadow: 0 0 5px rgba(255, 105, 180, 0.3);
}

.form-error {
  color: #ff3a3a;
  font-size: 12px;
  margin-top: 5px;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input {
  margin-right: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-form-btn, .submit-form-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-form-btn {
  background-color: #f0f0f0;
  color: #555;
}

.submit-form-btn {
  background-color: #ff69b4;
  color: white;
}

.cancel-form-btn:hover {
  background-color: #e0e0e0;
}

.submit-form-btn:not(:disabled):hover {
  background-color: #ff5ba7;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 105, 180, 0.3);
}

.submit-form-btn:disabled {
  background-color: #ffb6d9;
  cursor: not-allowed;
}

/* 删除确认对话框样式 */
.delete-modal {
  max-width: 450px;
}

.delete-header {
  background-color: #ff5050;
}

.delete-warning {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #fff8f8;
  border-radius: 8px;
  margin-bottom: 10px;
}

.warning-icon {
  font-size: 24px;
  margin-right: 15px;
}

.delete-btn-confirm {
  background-color: #ff5050;
}

.delete-btn-confirm:not(:disabled):hover {
  background-color: #ff3333;
}
</style> 