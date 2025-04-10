<template>
  <div class="register-container">
    <div class="register-form">
      <div class="anime-logo">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <h2>和平商城</h2>
      </div>
      <div class="form-item">
        <label>用户名：</label>
        <input v-model="registerForm.username" type="text" placeholder="请输入用户名">
      </div>
      <div class="form-item">
        <label>密码：</label>
        <input v-model="registerForm.password" type="password" placeholder="请输入密码">
      </div>
      <div class="form-item">
        <label>昵称：</label>
        <input v-model="registerForm.nickname" type="text" placeholder="请输入昵称">
      </div>
      <div class="form-item">
        <label>邮箱：</label>
        <input v-model="registerForm.email" type="email" placeholder="请输入邮箱">
      </div>
      <div class="form-item">
        <label>手机号：</label>
        <input v-model="registerForm.phoneNumber" type="text" placeholder="请输入手机号">
      </div>
      <div class="form-item">
        <label>个性签名：</label>
        <textarea v-model="registerForm.signature" placeholder="请输入个性签名"></textarea>
      </div>
      <div class="form-button">
        <button @click="handleRegister" class="register-btn" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </div>
      <div class="login-link">
        <router-link to="/login">已有账号？返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

export default {
  name: 'UserRegister',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    
    const registerForm = reactive({
      username: '',
      password: '',
      nickname: '',
      email: '',
      phoneNumber: '',
      signature: ''
    })

    const handleRegister = async () => {
      if (!registerForm.username || !registerForm.password || !registerForm.nickname || 
          !registerForm.email || !registerForm.phoneNumber) {
        alert('请填写完整注册信息')
        return
      }
      
      loading.value = true
      
      try {
        const response = await request({
          url: '/user/register',
          method: 'post',
          data: registerForm
        })
        
        if (response.code === 200) {
          alert(response.msg || '注册成功，请登录')
          router.push('/login')
        } else {
          alert(response.msg || '注册失败')
        }
      } catch (error) {
        console.error('注册出错：', error)
        alert('注册失败，请稍后再试')
      } finally {
        loading.value = false
      }
    }

    return {
      registerForm,
      loading,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register-container {
  width: 100%;
  min-height: 100vh;
  background-color: #d1e3ff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.register-form {
  width: 400px;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.anime-logo {
  text-align: center;
  margin-bottom: 25px;
}

.anime-logo img {
  width: 80px;
  margin-bottom: 10px;
}

.anime-logo h2 {
  color: #ff69b4;
  font-size: 24px;
  margin: 0;
  text-shadow: 0 0 2px #fff, 0 0 5px #ff69b4;
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  color: #6a4c93;
}

.form-item input, .form-item textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #d8bfd8;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-item textarea {
  height: 80px;
  resize: vertical;
}

.form-item input:focus, .form-item textarea:focus {
  outline: none;
  border-color: #ff69b4;
  box-shadow: 0 0 5px rgba(255, 105, 180, 0.5);
}

.form-button {
  margin-top: 25px;
}

.register-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #ff69b4, #6a4c93);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-btn:not(:disabled):hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
}

.login-link {
  margin-top: 20px;
  text-align: center;
}

.login-link a {
  color: #ff69b4;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}

.login-link a:hover {
  color: #6a4c93;
  text-decoration: underline;
}
</style> 