import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const brands = [
  {
    id: 'chabaidao', name: '茶百道', icon: '🐼',
    drinks: [
      ['yangzhi','🥭','杨枝甘露','芒果、西柚与椰香，酸甜清爽',18],
      ['douyu','🌾','豆乳玉麒麟','豆乳奶盖与茶香，口感绵密',16],
      ['xigua','🍉','西瓜啵啵','清甜西瓜搭配脆啵啵',17],
      ['fruit','🍊','超级杯水果茶','多种鲜果组合，适合分享',20],
      ['taro','🧋','招牌芋圆奶茶','软糯芋圆搭配醇香奶茶',16],
    ]
  },
  {
    id: 'chagee', name: '霸王茶姬', icon: '🏮',
    drinks: [
      ['boya','🌼','伯牙绝弦','茉莉雪芽鲜奶茶，清香柔和',17],
      ['guifu','🌿','桂馥兰香','桂香与茶香交织，回味清雅',18],
      ['xunxiang','🌺','寻香山茶','山茶花香调，鲜爽不腻',18],
      ['qingmo','🍃','青沫观音','铁观音茶底，茶感更明显',18],
      ['huatian','🌸','花田乌龙','乌龙茶香轻盈，适合慢慢喝',18],
    ]
  },
  {
    id: 'alittle', name: '一点点', icon: '🟢',
    drinks: [
      ['boba','🧋','波霸奶茶','经典大颗波霸，口感扎实',14],
      ['fourmilk','🌱','四季奶青','四季春茶底，清香顺口',14],
      ['icecreamtea','🍦','冰淇淋红茶','红茶加冰淇淋，经典搭配',15],
      ['macchiato','☁️','红茶玛奇朵','茶香与奶霜层次分明',15],
      ['a2milk','🥛','A2牛乳红茶','牛乳感更浓郁，口感柔顺',17],
    ]
  },
  {
    id: 'mixue', name: '蜜雪冰城', icon: '👑',
    drinks: [
      ['lemon','🍋','冰鲜柠檬水','酸甜清爽，简单直接',4],
      ['peach','🍑','蜜桃四季春','蜜桃果香搭配四季春茶',8],
      ['orange','🍊','棒打鲜橙','橙香饱满，冰爽解腻',8],
      ['pearlmilk','🧋','珍珠奶茶','经典奶茶搭配Q弹珍珠',8],
      ['sundae','🍨','雪王大圣代','冰淇淋甜品，适合加一份快乐',7],
    ]
  },
  {
    id: 'luckin', name: '瑞幸咖啡', icon: '🦌',
    drinks: [
      ['coconutlatte','🥥','生椰拿铁','椰香与咖啡融合，顺滑清爽',19],
      ['butteramericano','🧈','小黄油美式','烘焙奶香调，入口清爽',18],
      ['orangec','🍊','橙C美式','果香明亮，适合冰饮',18],
      ['velvet','☕','丝绒拿铁','奶感细腻，整体柔和顺口',20],
      ['americano','🫘','加浓美式','咖啡感更明显，适合提神',16],
    ]
  },
  {
    id: 'heytea', name: '喜茶', icon: '🫖',
    drinks: [
      ['grapeboom','🍇','多肉葡萄','葡萄果肉与茶底，清新多汁',19],
      ['mangogamo','🥭','芒芒甘露','芒果、西柚与椰香组合',18],
      ['greengrape','🍏','多肉青提','青提果香清脆，酸甜爽口',19],
      ['greenyan','🍵','纯绿妍茶后','清爽茶香，适合喜欢纯茶的人',12],
      ['brownbo','🧋','烤黑糖波波牛乳','黑糖香与牛乳搭配，甜感浓郁',18],
    ]
  },
  {
    id: 'lelecha', name: '乐乐茶', icon: '🐤',
    drinks: [
      ['dirty','🍫','经典脏脏茶','浓郁可可与鲜奶，甜香满足',20],
      ['ceylon','🫖','琥珀锡兰鲜奶茶','锡兰茶香醇厚，奶感柔顺',19],
      ['peachsoy','🍑','白桃豆乳茶','白桃果香搭配柔和豆乳',20],
      ['mangocheese','🥭','芒果酪酪','芒果果肉与乳酪风味组合',21],
      ['strawberrycheese','🍓','草莓酪酪','草莓酸甜搭配乳酪奶香',22],
    ]
  },
  {
    id: 'naixue', name: '奈雪的茶', icon: '🍃',
    drinks: [
      ['grape','🍇','霸气葡萄','葡萄果肉丰富，冰爽清甜',22],
      ['strawberry','🍓','霸气草莓','草莓果香浓郁，酸甜平衡',22],
      ['duckshit','🍂','鸭屎香轻乳茶','凤凰单丛茶香，清爽轻盈',19],
      ['goldmountain','🧋','金色山脉珍珠奶茶','蜜香茶汤搭配黑糖珍珠',21],
      ['jasmine','🌼','茉莉初雪轻乳茶','茉莉花香清雅，入口甘润',20],
    ]
  },
  {
    id: 'starbucks', name: '星巴克', icon: '⭐',
    drinks: [
      ['latte','☕','拿铁','浓缩咖啡与牛奶的经典组合',32],
      ['americano','🫘','美式咖啡','直接清爽，咖啡感明显',28],
      ['caramel','🍮','焦糖玛奇朵','香草、牛奶与焦糖风味融合',36],
      ['flatwhite','🤍','馥芮白','咖啡风味集中，奶感细腻',35],
      ['mochafrap','🍫','摩卡星冰乐','可可、咖啡与冰沙口感',38],
    ]
  },
].map(brand => ({
  ...brand,
  drinks: brand.drinks.map(([id, emoji, name, desc, price]) => ({ id, emoji, name, desc, price }))
}))

const sweetnessOptions = ['无糖', '三分糖', '五分糖', '七分糖', '正常糖']
const iceOptions = ['去冰', '少冰', '正常冰', '热饮']

const statusText = ['等他发现', '他接单啦', '已经买好', '投喂成功']
const nextActionText = ['这杯我请了 ♡', '我已经买好啦', '她已经喝到啦']

function readSaved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function App() {
  const [mode, setMode] = useState('girl')
  const [brandId, setBrandId] = useState(brands[0].id)
  const brand = brands.find(item => item.id === brandId) ?? brands[0]
  const [drinkId, setDrinkId] = useState(brands[0].drinks[0].id)
  const drink = brand.drinks.find(item => item.id === drinkId) ?? brand.drinks[0]
  const [sweetness, setSweetness] = useState('五分糖')
  const [ice, setIce] = useState('少冰')
  const [note, setNote] = useState('')
  const [orders, setOrders] = useState(() => readSaved('miaomiaoOrders', []))
  const [toast, setToast] = useState('')

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + order.price, 0),
    [orders]
  )

  function flash(message) {
    setToast(message)
    window.clearTimeout(window.__miaomiaoToastTimer)
    window.__miaomiaoToastTimer = window.setTimeout(() => setToast(''), 1800)
  }

  function chooseBrand(nextBrandId) {
    const nextBrand = brands.find(item => item.id === nextBrandId) ?? brands[0]
    setBrandId(nextBrand.id)
    setDrinkId(nextBrand.drinks[0].id)
  }

  function save(nextOrders) {
    setOrders(nextOrders)
    localStorage.setItem('miaomiaoOrders', JSON.stringify(nextOrders))
  }

  function submitOrder() {
    const nextOrder = {
      id: String(Date.now()),
      brand: brand.name,
      drink: drink.name,
      emoji: drink.emoji,
      price: drink.price,
      sweetness,
      ice,
      note: note.trim(),
      status: 0,
      time: new Date().toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      })
    }
    save([...orders, nextOrder])
    setNote('')
    flash('订单已经偷偷发给他啦 ♡')
  }

  function advanceOrder(id) {
    const nextOrders = orders.map(order => {
      if (order.id !== id || order.status >= 3) return order
      return { ...order, status: order.status + 1 }
    })
    const updated = nextOrders.find(order => order.id === id)
    save(nextOrders)
    const messages = ['', '你接下这杯啦 ♡', '已经标记为买好啦', '投喂成功，恋爱余额 +1']
    flash(messages[updated?.status] ?? '状态已更新')
  }

  return (
    <>
      <main className="app-shell">
        <header className="topbar">
          <div>
            <h1>淼淼今天吃什么了 ♡</h1>
            <p>只给我们两个人的小店</p>
          </div>
          <div className="avatar">🧋</div>
        </header>

        <nav className="mode-switch" aria-label="切换页面">
          <button className={mode === 'girl' ? 'active' : ''} onClick={() => setMode('girl')}>她的点单端</button>
          <button className={mode === 'boy' ? 'active' : ''} onClick={() => setMode('boy')}>男朋友工作台</button>
        </nav>

        {mode === 'girl' ? (
          <section>
            <div className="hero">
              <span>今日份小特权</span>
              <h2>今天也可以偷偷使唤男朋友。</h2>
              <p>挑一杯喜欢的，把想说的话一起塞进订单里。</p>
            </div>

            <SectionTitle title="先选一家店" meta="9 个品牌" />
            <div className="brand-scroll">
              {brands.map(item => (
                <button
                  key={item.id}
                  className={`brand-pill ${item.id === brandId ? 'active' : ''}`}
                  onClick={() => chooseBrand(item.id)}
                >
                  {item.icon} {item.name}
                </button>
              ))}
            </div>
            <p className="hint">菜单和价格会随城市、门店及活动变化，这里先作为你们两个人的点单参考。</p>

            <SectionTitle title={`${brand.name} · 选一杯`} meta="今天喝点喜欢的" />
            <div className="drink-grid">
              {brand.drinks.map(item => (
                <button
                  key={item.id}
                  className={`drink-card ${item.id === drink.id ? 'selected' : ''}`}
                  onClick={() => setDrinkId(item.id)}
                >
                  <span className="drink-emoji">{item.emoji}</span>
                  <strong>{item.name}</strong>
                  <small>{item.desc}</small>
                  <b>参考 ¥{item.price}</b>
                </button>
              ))}
            </div>

            <SectionTitle title="甜度" />
            <Pills options={sweetnessOptions} value={sweetness} onChange={setSweetness} />

            <SectionTitle title="冰量" />
            <Pills options={iceOptions} value={ice} onChange={setIce} />

            <SectionTitle title="给男朋友的话" meta="可以撒娇" />
            <textarea
              className="note"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="例如：今天有点累，想喝甜一点点 🥺"
            />

            <div className="summary-card">
              <SummaryRow label="品牌" value={`${brand.icon} ${brand.name}`} />
              <SummaryRow label="饮品" value={`${drink.emoji} ${drink.name}`} />
              <SummaryRow label="口味" value={`${sweetness} · ${ice}`} />
              <SummaryRow label="参考金额" value={`¥${drink.price}`} />
            </div>

            <button className="primary" onClick={submitOrder}>让他请我喝 ♡</button>

            <SectionTitle title="我的订单" />
            <OrderList orders={orders} admin={false} onAdvance={advanceOrder} />
          </section>
        ) : (
          <section>
            <div className="admin-hero">
              <div>
                <span>男朋友专属工作台</span>
                <h2>她想喝奶茶啦 ♡</h2>
                <p>你的任务很简单，负责发现、接单，然后投喂。</p>
              </div>
              <div className="stats">
                <div><b>{orders.length}</b><span>累计订单</span></div>
                <div><b>¥{totalSpent}</b><span>累计参考金额</span></div>
              </div>
            </div>
            <OrderList orders={orders} admin onAdvance={advanceOrder} />
            <p className="footer-note">每完成一单，恋爱余额 +1</p>
          </section>
        )}
      </main>
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  )
}

function SectionTitle({ title, meta }) {
  return (
    <div className="section-title">
      <h3>{title}</h3>
      {meta ? <span>{meta}</span> : null}
    </div>
  )
}

function Pills({ options, value, onChange }) {
  return (
    <div className="pill-group">
      {options.map(option => (
        <button
          key={option}
          className={`pill ${value === option ? 'active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

function OrderList({ orders, admin, onAdvance }) {
  if (!orders.length) {
    return (
      <div className="empty">
        <div>{admin ? '💭' : '🫧'}</div>
        <p>{admin ? '她今天还没点单。' : '还没有订单，今天要不要点一杯？'}</p>
      </div>
    )
  }

  return (
    <div>
      {[...orders].reverse().map(order => (
        <article className="order-card" key={order.id}>
          <div className="order-head">
            <div>
              <h3>{order.emoji} {order.drink}</h3>
              <p>{order.brand} · {order.sweetness} · {order.ice}</p>
              <p>参考 ¥{order.price} · {order.time}</p>
            </div>
            <span className="badge">{statusText[order.status]}</span>
          </div>

          {order.note ? <blockquote>“{order.note}”</blockquote> : null}

          <div className="timeline" aria-label={`订单进度：${statusText[order.status]}`}>
            {[0, 1, 2, 3].map((step, index) => (
              <React.Fragment key={step}>
                <i className={step <= order.status ? 'active' : ''} />
                {index < 3 ? <em /> : null}
              </React.Fragment>
            ))}
          </div>

          {admin && order.status < 3 ? (
            <button className="secondary" onClick={() => onAdvance(order.id)}>
              {nextActionText[order.status]}
            </button>
          ) : null}
        </article>
      ))}
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
