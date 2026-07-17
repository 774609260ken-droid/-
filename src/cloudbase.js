const CLOUD_CONFIG = {
  env: import.meta.env.VITE_CLOUDBASE_ENV_ID || 'ken1370838788-d9gyeeebwdbba971e',
  region: import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai',
  collection: import.meta.env.VITE_CLOUDBASE_COLLECTION || 'orders',
  roomId: import.meta.env.VITE_CLOUDBASE_ROOM_ID || 'miaomiao-ken',
}

let app = null
let ordersCollection = null
let initPromise = null

export function getCloudConfig() {
  return {
    ...CLOUD_CONFIG,
    enabled: Boolean(CLOUD_CONFIG.env && !CLOUD_CONFIG.env.startsWith('YOUR_')),
  }
}

function toMillis(value) {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Date.parse(value) || 0
  if (typeof value === 'object') {
    if ('$date' in value) return new Date(value.$date).getTime()
    if ('seconds' in value) return Number(value.seconds) * 1000
  }
  return 0
}

function normalizeOrder(doc) {
  return {
    id: String(doc.orderId || doc.id || doc._id),
    brand: doc.brand || '',
    drink: doc.drink || '',
    emoji: doc.emoji || '🧋',
    price: Number(doc.price) || 0,
    sweetness: doc.sweetness || '五分糖',
    ice: doc.ice || '少冰',
    note: doc.note || '',
    status: Math.max(0, Math.min(3, Number(doc.status) || 0)),
    time: doc.time || '',
    createdAtMs: Number(doc.createdAtMs) || toMillis(doc.createdAt) || Date.now(),
    updatedAtMs: Number(doc.updatedAtMs) || toMillis(doc.updatedAt) || 0,
  }
}

function normalizeOrders(documents) {
  const orders = new Map()
  documents.map(normalizeOrder).forEach(order => {
    const existing = orders.get(order.id)
    if (!existing || order.updatedAtMs >= existing.updatedAtMs) orders.set(order.id, order)
  })
  return [...orders.values()].sort((a, b) => a.createdAtMs - b.createdAtMs)
}

function orderDocument(order) {
  const now = Date.now()
  return {
    orderId: String(order.id),
    roomId: CLOUD_CONFIG.roomId,
    brand: order.brand,
    drink: order.drink,
    emoji: order.emoji,
    price: Number(order.price) || 0,
    sweetness: order.sweetness,
    ice: order.ice,
    note: order.note || '',
    status: Math.max(0, Math.min(3, Number(order.status) || 0)),
    time: order.time,
    createdAtMs: Number(order.createdAtMs) || now,
    updatedAtMs: now,
  }
}

export async function initOrderCloud() {
  const config = getCloudConfig()
  if (!config.enabled) return { enabled: false }
  if (ordersCollection) return { enabled: true }
  if (initPromise) return initPromise

  initPromise = (async () => {
    const { default: cloudbase } = await import('@cloudbase/js-sdk')
    app = cloudbase.init({ env: config.env, region: config.region })
    const auth = app.auth({ persistence: 'local' })
    const loginResult = await auth.signInAnonymously()
    if (loginResult?.error) throw loginResult.error

    ordersCollection = app.database().collection(config.collection)
    return { enabled: true }
  })()

  try {
    return await initPromise
  } catch (error) {
    initPromise = null
    ordersCollection = null
    throw error
  }
}

function collection() {
  if (!ordersCollection) throw new Error('CloudBase 尚未初始化')
  return ordersCollection
}

export async function fetchCloudOrders() {
  const result = await collection()
    .where({ roomId: CLOUD_CONFIG.roomId })
    .limit(100)
    .get()

  return normalizeOrders(result?.data || [])
}

export async function createCloudOrder(order) {
  const data = orderDocument(order)
  return collection().doc(data.orderId).set(data)
}

export async function updateCloudOrder(orderId, status) {
  const data = {
    status: Math.max(0, Math.min(3, Number(status) || 0)),
    updatedAtMs: Date.now(),
  }

  try {
    return await collection().doc(String(orderId)).update(data)
  } catch {
    return collection()
      .where({ roomId: CLOUD_CONFIG.roomId, orderId: String(orderId) })
      .update(data)
  }
}

export function watchCloudOrders(onChange, onError) {
  const watcher = collection()
    .where({ roomId: CLOUD_CONFIG.roomId })
    .watch({
      onChange(snapshot) {
        onChange(normalizeOrders(snapshot?.docs || []))
      },
      onError,
    })

  return () => watcher?.close?.()
}
