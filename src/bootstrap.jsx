import {
  initOrderCloud,
  fetchCloudOrders,
  createCloudOrder,
  updateCloudOrder,
  watchCloudOrders,
} from './cloudbase.js'

const ORDERS_KEY = 'miaomiaoOrders'
const ALERTS_KEY = 'miaomiaoAlerts'
const role = new URLSearchParams(window.location.search).get('role') === 'boy' ? 'boy' : 'girl'
const nativeSetItem = Storage.prototype.setItem
let cloudEnabled = false
let writingFromCloud = false
let knownIds = new Set()
let syncQueue = Promise.resolve()
let closeWatcher = null

function readOrders(raw = localStorage.getItem(ORDERS_KEY)) {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function canonical(orders) {
  return JSON.stringify([...orders].sort((a, b) => String(a.id).localeCompare(String(b.id))))
}

function writeOrdersFromCloud(orders) {
  writingFromCloud = true
  nativeSetItem.call(localStorage, ORDERS_KEY, JSON.stringify(orders))
  writingFromCloud = false
}

function queueDiff(oldOrders, nextOrders) {
  if (!cloudEnabled || writingFromCloud) return

  const oldMap = new Map(oldOrders.map(order => [order.id, order]))
  const nextMap = new Map(nextOrders.map(order => [order.id, order]))

  syncQueue = syncQueue.then(async () => {
    for (const order of nextOrders) {
      const previous = oldMap.get(order.id)
      if (!previous) {
        await createCloudOrder({
          ...order,
          createdAtMs: order.createdAtMs || Date.now(),
        })
      } else if (previous.status !== order.status) {
        await updateCloudOrder(order.id, order.status)
      }
    }

    for (const id of oldMap.keys()) {
      if (!nextMap.has(id)) {
        console.info('本地订单删除不会同步到云端:', id)
      }
    }
  }).catch(error => console.error('订单同步失败:', error))
}

Storage.prototype.setItem = function patchedSetItem(key, value) {
  const oldOrders = key === ORDERS_KEY && this === localStorage ? readOrders() : null
  const result = nativeSetItem.apply(this, arguments)
  if (key === ORDERS_KEY && this === localStorage && oldOrders) {
    queueDiff(oldOrders, readOrders(value))
  }
  return result
}

function playTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = window.__miaomiaoAudioContext || new AudioContext()
    window.__miaomiaoAudioContext = context
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = 760
    gain.gain.setValueAtTime(0.08, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.35)
  } catch {
  }
}

function notifyNewOrder(order) {
  if (role !== 'boy' || localStorage.getItem(ALERTS_KEY) !== 'true') return
  navigator.vibrate?.([160, 80, 160])
  playTone()
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('淼淼想喝东西啦 ♡', {
      body: `${order.brand} · ${order.drink} · ${order.sweetness} · ${order.ice}`,
    })
  }
}

function orderText(order) {
  return `${order.brand} · ${order.drink}\n${order.sweetness} · ${order.ice}\n参考金额：¥${order.price}${order.note ? `\n留言：${order.note}` : ''}`
}

function injectStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .mode-switch{display:none!important}
    .miaomiao-cloud-chip{width:fit-content;margin:-2px 0 12px auto;border:1px solid #f1dce2;border-radius:999px;padding:6px 10px;background:#fff;color:#987982;font-size:11px;font-weight:800}
    .miaomiao-cloud-chip.cloud{color:#38856a;background:#effaf5;border-color:#cdeadd}
    .miaomiao-cloud-chip.error{color:#b4596a;background:#fff0f3;border-color:#f4ccd6}
    .miaomiao-setup{margin:0 0 14px;padding:13px 14px;border:1px dashed #efc6d1;border-radius:18px;background:rgba(255,255,255,.75);color:#987983;font-size:12px;line-height:1.6}
    .miaomiao-alert{width:100%;margin:0 0 14px;border:1px solid #f1d5dd;border-radius:16px;padding:12px 14px;background:#fff;color:#8f7079;font-weight:800}
    .miaomiao-alert.enabled{background:#effaf5;border-color:#cdeadd;color:#38856a}
    .miaomiao-pay{width:100%;margin-top:8px;border:1px solid #f0d9df;border-radius:15px;padding:12px 10px;background:#fff;color:#8d6e77;font-weight:800}
  `
  document.head.appendChild(style)
}

function addChip(mode, error = '') {
  const topbar = document.querySelector('.topbar')
  if (!topbar) return
  const chip = document.createElement('div')
  chip.className = `miaomiao-cloud-chip ${mode}`
  chip.textContent = mode === 'cloud' ? '云端同步中' : mode === 'error' ? '云端连接失败' : '演示模式'
  topbar.insertAdjacentElement('afterend', chip)

  if (mode !== 'cloud') {
    const banner = document.createElement('div')
    banner.className = 'miaomiao-setup'
    banner.innerHTML = `当前先使用演示模式。两台手机实时同步需要配置 CloudBase 环境 ID 和 orders 集合。${error ? `<br><small>${error}</small>` : ''}`
    chip.insertAdjacentElement('afterend', banner)
  }
}

function addAlertButton() {
  if (role !== 'boy') return
  const hero = document.querySelector('.admin-hero')
  if (!hero) return
  const button = document.createElement('button')
  const refresh = () => {
    const enabled = localStorage.getItem(ALERTS_KEY) === 'true'
    button.className = `miaomiao-alert ${enabled ? 'enabled' : ''}`
    button.textContent = enabled ? '🔔 新订单提醒已开启' : '🔕 开启新订单提醒'
  }
  button.addEventListener('click', async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    localStorage.setItem(ALERTS_KEY, 'true')
    window.__miaomiaoAudioContext?.resume?.()
    playTone()
    navigator.vibrate?.(100)
    refresh()
  })
  refresh()
  hero.insertAdjacentElement('afterend', button)
}

function enhanceOrderCards() {
  if (role !== 'boy') return
  const cards = [...document.querySelectorAll('.order-card')]
  const orders = [...readOrders()].reverse()
  cards.forEach((card, index) => {
    if (card.querySelector('.miaomiao-pay')) return
    const order = orders[index]
    if (!order) return
    const button = document.createElement('button')
    button.className = 'miaomiao-pay'
    button.textContent = '复制订单，去付款'
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(orderText(order))
        button.textContent = '已复制，请去品牌官方小程序或 App 付款'
      } catch {
        button.textContent = orderText(order)
      }
    })
    card.appendChild(button)
  })
}

function applyRole() {
  const buttons = document.querySelectorAll('.mode-switch button')
  if (buttons.length >= 2) {
    buttons[role === 'boy' ? 1 : 0].click()
  }
  const title = document.querySelector('.topbar h1')
  const subtitle = document.querySelector('.topbar p')
  const avatar = document.querySelector('.avatar')
  if (role === 'boy') {
    if (title) title.textContent = '淼淼的订单工作台 ♡'
    if (subtitle) subtitle.textContent = '男朋友专属入口'
    if (avatar) avatar.textContent = '💌'
  }
}

let cloudMode = 'local'
let cloudError = ''

try {
  const result = await initOrderCloud()
  if (result.enabled) {
    cloudEnabled = true
    cloudMode = 'cloud'
    const orders = await fetchCloudOrders()
    writeOrdersFromCloud(orders)
    knownIds = new Set(orders.map(order => order.id))
  } else {
    knownIds = new Set(readOrders().map(order => order.id))
  }
} catch (error) {
  cloudMode = 'error'
  cloudError = error?.message || String(error)
  knownIds = new Set(readOrders().map(order => order.id))
  console.error('CloudBase 初始化失败:', error)
}

await import('./main.jsx')

injectStyles()
requestAnimationFrame(() => {
  applyRole()
  requestAnimationFrame(() => {
    addChip(cloudMode, cloudError)
    addAlertButton()
    enhanceOrderCards()
  })
})

if (cloudEnabled) {
  const handleCloudChange = orders => {
    const current = readOrders()
    const newOrders = orders.filter(order => !knownIds.has(order.id))
    knownIds = new Set(orders.map(order => order.id))
    if (newOrders.length) notifyNewOrder(newOrders[newOrders.length - 1])

    if (canonical(current) !== canonical(orders)) {
      writeOrdersFromCloud(orders)
      window.setTimeout(() => window.location.reload(), 350)
    }
  }

  try {
    closeWatcher = watchCloudOrders(handleCloudChange, error => {
      console.error('CloudBase 实时监听失败:', error)
    })
  } catch (error) {
    console.error('CloudBase 实时监听初始化失败:', error)
  }

  window.setInterval(async () => {
    try {
      handleCloudChange(await fetchCloudOrders())
    } catch (error) {
      console.error('CloudBase 轮询失败:', error)
    }
  }, 8000)
}

window.addEventListener('beforeunload', () => closeWatcher?.())
