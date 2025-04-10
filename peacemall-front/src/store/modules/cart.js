import { updateCartItemQuantity } from '@/api/cart'

const state = {
  pendingUpdates: new Map(), // 存储待更新的商品数量
  updateTimer: null, // 定时器ID
  isUpdating: false // 是否正在更新
}

const mutations = {
  // 添加待更新的商品
  ADD_PENDING_UPDATE(state, { cartItemId, productId, configId, quantity }) {
    state.pendingUpdates.set(cartItemId, {
      productId,
      configId,
      quantity
    })
  },
  
  // 清除待更新的商品
  CLEAR_PENDING_UPDATES(state) {
    state.pendingUpdates.clear()
  },
  
  // 设置更新状态
  SET_UPDATING(state, status) {
    state.isUpdating = status
  },
  
  // 设置定时器ID
  SET_UPDATE_TIMER(state, timerId) {
    state.updateTimer = timerId
  }
}

const actions = {
  // 添加待更新的商品
  addPendingUpdate({ commit, dispatch }, { cartItemId, productId, configId, quantity }) {
    commit('ADD_PENDING_UPDATE', { cartItemId, productId, configId, quantity })
    dispatch('scheduleUpdate')
  },
  
  // 安排更新
  scheduleUpdate({ commit, dispatch, state }) {
    // 清除现有的定时器
    if (state.updateTimer) {
      clearTimeout(state.updateTimer)
    }
    
    // 设置新的定时器，3秒后执行更新
    const timerId = setTimeout(() => {
      dispatch('updateCartItems')
    }, 3000)
    
    commit('SET_UPDATE_TIMER', timerId)
  },
  
  // 更新购物车商品
  async updateCartItems({ commit, state }) {
    if (state.isUpdating || state.pendingUpdates.size === 0) return
    
    commit('SET_UPDATING', true)
    
    try {
      const cartItemDTOList = Array.from(state.pendingUpdates.values())
      const response = await updateCartItemQuantity(cartItemDTOList)
      
      if (response.code === 200) {
        commit('CLEAR_PENDING_UPDATES')
      } else {
        console.error('更新购物车商品数量失败:', response.msg)
      }
    } catch (error) {
      console.error('更新购物车商品数量出错:', error)
    } finally {
      commit('SET_UPDATING', false)
    }
  },
  
  // 立即更新购物车商品
  updateCartItemsImmediately({ dispatch }) {
    dispatch('updateCartItems')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
} 