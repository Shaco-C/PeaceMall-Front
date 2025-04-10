import { createRouter, createWebHistory } from 'vue-router'

// 引入搜索结果页面
import SearchResult from '@/views/SearchResult.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/user',
    name: 'UserProfile',
    component: () => import('../views/UserProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/addresses',
    name: 'UserAddresses',
    component: () => import('../views/UserAddresses.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/orders',
    name: 'OrderHistory',
    component: () => import('../views/OrderHistory.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/orders/:id',
    name: 'OrderDetail',
    component: () => import('../views/OrderDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/wallet-logs',
    name: 'WalletLogs',
    component: () => import('../views/WalletLogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/withdraw-requests',
    name: 'WithdrawRequests',
    component: () => import('../views/WithdrawRequests.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/merchant-applications',
    name: 'MerchantApplications',
    component: () => import('../views/MerchantApplications.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/confirm-order/:items',
    name: 'OrderConfirm',
    component: () => import('../views/OrderConfirm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/category',
    name: 'CategoryDetail',
    component: () => import('../views/CategoryDetail.vue')
  },
  {
    path: '/product',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue')
  },
  {
    path: '/shop',
    name: 'ShopDetail',
    component: () => import('../views/ShopDetail.vue')
  },
  {
    path: '/subcategory',
    name: 'SubCategoryDetail',
    component: () => import('../views/SubCategoryDetail.vue')
  },
  {
    path: '/search',
    name: 'SearchResult',
    component: SearchResult
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart.vue')
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../views/Favorites.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查该路由是否需要登录权限
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查用户是否已登录
    const token = localStorage.getItem('token')
    if (!token) {
      // 未登录则跳转到登录页面
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router 