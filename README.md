# 淼淼今天吃什么了 ♡

两个人专属的可爱点单网页。她可以在自己的手机下单，男朋友可以在另一台手机实时查看并更新订单状态。

## 已实现

- 9 个品牌切换：茶百道、霸王茶姬、一点点、蜜雪冰城、瑞幸咖啡、喜茶、乐乐茶、奈雪的茶、星巴克
- 45 款代表性产品
- 甜度、冰量和留言
- 她的点单端
- 男朋友工作台
- 接单、已买好、已送达三段状态流转
- CloudBase 两台手机实时同步
- 断网时本地保存，恢复网络后自动补传
- 女生点单入口与男朋友独立入口
- 男朋友工作台四位暗号
- 新订单页面内提醒与订单复制
- 本地订单历史和累计参考金额
- 手机端响应式布局

## 使用入口

- 她的点单端：`https://774609260ken-droid.github.io/miaomiao-eat/?role=girl`
- 男朋友工作台：`https://774609260ken-droid.github.io/miaomiao-eat/?role=boy`
- 工作台暗号：`1021`

网页内的“去付款”会复制订单信息，实际付款仍在对应品牌的官方小程序或 App 中完成。

## 云端配置

默认使用项目现有的 CloudBase 环境与 `orders` 集合。CloudBase 控制台需要开启匿名登录，并允许匿名用户读取、新增和更新该集合。

可通过 Vite 环境变量替换默认配置：

```bash
VITE_CLOUDBASE_ENV_ID=your-env-id
VITE_CLOUDBASE_REGION=ap-shanghai
VITE_CLOUDBASE_COLLECTION=orders
VITE_CLOUDBASE_ROOM_ID=your-room-id
```

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

项目已包含 GitHub Pages 部署工作流。仓库开启 Pages 后，推送到 `main` 分支即可自动构建并发布。
