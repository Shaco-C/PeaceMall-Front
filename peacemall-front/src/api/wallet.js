import request from '@/utils/request'

/**
 * 获取用户钱包信息
 * @returns {Promise} - 返回钱包信息的Promise
 */
export function getUserWalletInfo() {
  return request({
    url: '/wallet/userGetSelfWalletInfo',
    method: 'get'
  })
}

/**
 * 用户充值钱包
 * @param {number} amount - 充值金额
 * @returns {Promise} - 返回充值结果的Promise
 */
export function rechargeWallet(amount) {
  return request({
    url: `/wallet/userRechargeWallet?amount=${amount}`,
    method: 'put'
  })
}

/**
 * 获取用户钱包流水日志
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} walletFlowType - 流水类型，可选参数
 * @returns {Promise} - 返回流水日志的Promise
 */
export function getUserWalletFlowLogs(page = 1, pageSize = 20, walletFlowType = null) {
  let url = `/flowLog/getUserFlowLog?page=${page}&pageSize=${pageSize}`;
  if (walletFlowType) {
    url += `&walletFlowType=${walletFlowType}`;
  }
  return request({
    url: url,
    method: 'get'
  })
}

/**
 * 用户申请提现
 * @param {number} amount - 提现金额
 * @param {string} payMethod - 提现方式
 * @param {string} accountInfo - 提现账号信息
 * @returns {Promise} - 返回提现申请结果的Promise
 */
export function userRequestWithdraw(amount, payMethod, accountInfo) {
  return request({
    url: '/withdraw/userRequestWithdraw',
    method: 'post',
    data: {
      amount,
      payMethod,
      accountInfo
    }
  })
}

/**
 * 获取用户提现申请记录
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} withDrawRequestStatus - 提现申请状态，可选参数
 * @returns {Promise} - 返回提现申请记录的Promise
 */
export function getUserWithdrawRequests(page = 1, pageSize = 10, withDrawRequestStatus = null) {
  let url = `/withdraw/userGetWithdrawRequest?page=${page}&pageSize=${pageSize}`;
  if (withDrawRequestStatus) {
    url += `&withDrawRequestStatus=${withDrawRequestStatus}`;
  }
  return request({
    url: url,
    method: 'get'
  })
}

/**
 * 用户取消提现申请
 * @param {string} withdrawRequestId - 提现申请ID
 * @returns {Promise} - 返回取消结果的Promise
 */
export function cancelWithdrawRequest(withdrawRequestId) {
  return request({
    url: `/withdraw/userCancelWithdrawRequest?withdrawRequestId=${withdrawRequestId}`,
    method: 'put'
  })
} 