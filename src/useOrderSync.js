import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createCloudOrder,
  fetchCloudOrders,
  initOrderCloud,
  updateCloudOrder,
  watchCloudOrders,
} from './cloudbase.js'

const ORDERS_KEY = 'miaomiaoOrders'
const OUTBOX_KEY = 'miaomiaoOrderOutbox'

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

function readLocalOrders() {
  const value = readJson(ORDERS_KEY, [])
  return Array.isArray(value) ? value : []
}

function readOutbox() {
  const value = readJson(OUTBOX_KEY, [])
  return Array.isArray(value) ? value : []
}

function writeOutbox(operations) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(operations))
}

function queueOperation(operation) {
  const operations = readOutbox().filter(item => {
    if (operation.type === 'create') return !(item.type === 'create' && item.order.id === operation.order.id)
    return !(item.type === 'update' && item.id === operation.id)
  })
  operations.push(operation)
  writeOutbox(operations)
}

function applyOutbox(remoteOrders, operations) {
  const map = new Map(remoteOrders.map(order => [order.id, order]))

  operations.forEach(operation => {
    if (operation.type === 'create') {
      map.set(operation.order.id, operation.order)
      return
    }

    const order = map.get(operation.id)
    if (order) map.set(operation.id, { ...order, status: operation.status })
  })

  return [...map.values()].sort((a, b) => a.createdAtMs - b.createdAtMs)
}

function errorText(error) {
  const message = error?.message || String(error || '')
  if (/permission|unauthorized|auth|login/i.test(message)) return '云端权限尚未开启'
  if (/network|fetch|socket|timeout|offline/i.test(message)) return '网络暂时不可用'
  return '云端连接失败'
}

export function useOrderSync() {
  const [orders, setOrdersState] = useState(() => {
    return readLocalOrders()
  })
  const [syncState, setSyncState] = useState({ mode: 'connecting', message: '正在连接两个人的小店' })
  const mountedRef = useRef(false)
  const syncingRef = useRef(null)
  const closeWatcherRef = useRef(null)

  const commitOrders = useCallback(nextOrders => {
    setOrdersState(nextOrders)
    saveOrders(nextOrders)
  }, [])

  const flushOutbox = useCallback(async () => {
    const operations = readOutbox()
    if (!operations.length) return

    const remaining = [...operations]
    for (const operation of operations) {
      if (operation.type === 'create') {
        await createCloudOrder(operation.order)
      } else {
        await updateCloudOrder(operation.id, operation.status)
      }
      remaining.shift()
      writeOutbox(remaining)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return syncingRef.current

    const task = (async () => {
      try {
        const result = await initOrderCloud()
        if (!result.enabled) {
          if (mountedRef.current) setSyncState({ mode: 'offline', message: '订单会先保存在这台手机' })
          return
        }

        await flushOutbox()
        let remoteOrders = await fetchCloudOrders()
        const remoteIds = new Set(remoteOrders.map(order => order.id))
        const localOnlyOrders = readLocalOrders().filter(order => !remoteIds.has(order.id))

        for (const order of localOnlyOrders) await createCloudOrder(order)
        if (localOnlyOrders.length) remoteOrders = await fetchCloudOrders()

        const merged = applyOutbox(remoteOrders, readOutbox())
        if (mountedRef.current) {
          commitOrders(merged)
          setSyncState({ mode: 'online', message: '两台手机已同步' })
        }

        if (!closeWatcherRef.current) {
          closeWatcherRef.current = watchCloudOrders(
            nextOrders => {
              if (!mountedRef.current) return
              commitOrders(applyOutbox(nextOrders, readOutbox()))
              setSyncState({ mode: 'online', message: '两台手机已同步' })
            },
            error => {
              if (!mountedRef.current) return
              setSyncState({ mode: 'offline', message: errorText(error) })
            },
          )
        }
      } catch (error) {
        if (mountedRef.current) setSyncState({ mode: 'offline', message: errorText(error) })
        console.error('订单同步失败:', error)
      }
    })()

    syncingRef.current = task
    try {
      await task
    } finally {
      syncingRef.current = null
    }
  }, [commitOrders, flushOutbox])

  useEffect(() => {
    mountedRef.current = true
    syncNow()

    const interval = window.setInterval(syncNow, 12000)
    window.addEventListener('online', syncNow)

    return () => {
      mountedRef.current = false
      window.clearInterval(interval)
      window.removeEventListener('online', syncNow)
      closeWatcherRef.current?.()
      closeWatcherRef.current = null
    }
  }, [syncNow])

  const addOrder = useCallback(order => {
    const nextOrders = [...readLocalOrders(), order]
    commitOrders(nextOrders)
    queueOperation({ type: 'create', order })
    syncNow()
  }, [commitOrders, syncNow])

  const advanceOrder = useCallback(id => {
    const current = readLocalOrders()
    const existing = current.find(order => order.id === id)
    if (!existing || existing.status >= 3) return existing

    const status = existing.status + 1
    const nextOrders = current.map(order => order.id === id ? { ...order, status } : order)
    commitOrders(nextOrders)
    queueOperation({ type: 'update', id, status })
    syncNow()
    return { ...existing, status }
  }, [commitOrders, syncNow])

  return { orders, syncState, addOrder, advanceOrder, syncNow }
}
