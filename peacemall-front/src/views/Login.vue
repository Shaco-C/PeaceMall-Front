<template>
  <div class="login-container">
    <div class="login-form">
      <div class="anime-logo">
        <img src="https://peacemall.oss-cn-fuzhou.aliyuncs.com/7c0ecb24-8825-459a-94d5-c6d396e72ff1.png" alt="Logo">
        <h2>和平商城</h2>
      </div>
      <div class="form-item">
        <label>用户名：</label>
        <input v-model="loginForm.username" type="text" placeholder="请输入用户名">
      </div>
      <div class="form-item">
        <label>密码：</label>
        <input v-model="loginForm.password" type="password" placeholder="请输入密码">
      </div>
      <div class="form-button">
        <button @click="handleLogin" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
      <div class="register-link">
        <router-link to="/register">还没有账号？点击注册</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    
    const loginForm = reactive({
      username: '',
      password: ''
    })

    const handleLogin = async () => {
      if (!loginForm.username || !loginForm.password) {
        alert('请输入用户名和密码')
        return
      }
      
      loading.value = true
      
      try {
        const response = await request({
          url: '/user/login',
          method: 'post',
          data: {
            username: loginForm.username,
            password: loginForm.password
          }
        })
        
        if (response.code === 200) {
          // 保存token到本地存储
          localStorage.setItem('token', response.data.token)
          // 可选：保存其他用户信息
          localStorage.setItem('userId', response.data.userId)
          localStorage.setItem('username', response.data.username)
          localStorage.setItem('role', response.data.role)
          
          alert('登录成功')
          router.push('/')
        } else {
          alert(response.msg || '登录失败')
        }
      } catch (error) {
        console.error('登录出错：', error)
        alert('登录失败，请稍后再试')
      } finally {
        loading.value = false
      }
    }

    return {
      loginForm,
      loading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  background-color: #d1e3ff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.login-form {
  width: 380px;
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
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #6a4c93;
}

.form-item input {
  width: 100%;
  padding: 12px;
  border: 2px solid #d8bfd8;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-item input:focus {
  outline: none;
  border-color: #ff69b4;
  box-shadow: 0 0 5px rgba(255, 105, 180, 0.5);
}

.form-button {
  margin-top: 30px;
}

.login-btn {
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

.login-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
}

.register-link {
  margin-top: 20px;
  text-align: center;
}

.register-link a {
  color: #ff69b4;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}

.register-link a:hover {
  color: #6a4c93;
  text-decoration: underline;
}
</style> 