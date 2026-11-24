# 小孩数学空间

给孩子攒数学、编程知识卡的卡片墙：平时看到好的知识总结就做成一张卡片存进来，按分类贴好标签，孩子随时能翻出来看。

这个仓库里有两种形态：

| 形态 | 在哪用 | 能做什么 |
| --- | --- | --- |
| 全栈空间版 | Muse 应用内的「小孩数学空间」 | 能加卡、改卡、删卡、管理分类，数据存在平台里 |
| 静态网页版 | `docs/` 目录，已发布到 GitHub Pages | 只能看：搜索、按分类筛选、点图全屏看；不能改 |

现在共有 68 张卡片，7 个分类：几何 20、方程 16、数与计算 12、应用题 8、编程 6、乘法公式 4、因式分解 2。

## 入口清单

- **静态网页（打开就能看）**：https://bullshitai52.github.io/kids-math-space/
- **仓库地址**：https://github.com/bullshitAI52/kids-math-space
- **全栈空间版**：Muse 应用内打开「小孩数学空间」（侧边栏），它的源码就是本仓库根目录的 `client/`、`server/` 等文件。
- **静态版文件入口**：`docs/index.html`，同目录的 `docs/data.js` 是卡片数据，`docs/images/` 是配图。

## 目录结构

```
kids-math-space/
├─ docs/            静态网页版（GitHub Pages 就发这个目录）
│  ├─ index.html    页面本体
│  ├─ data.js       68 张卡的数据（标题、分类、要点、图片路径）
│  └─ images/       网页版配图，card-01 … card-68，图片是齐的
├─ client/          全栈空间版前端源码
├─ server/          全栈空间版后端源码
├─ drizzle/         全栈空间版数据库迁移 SQL
├─ package.json     全栈空间版依赖与脚本
└─ README.md        本文件
```

注意：全栈空间版的种子卡配图原图在源码的 `server/assets/` 里，是 PNG 二进制文件，推送源码时没有入仓（推送通道只收文本文件）。网页版不受影响——`docs/images/` 里的 68 张图是完整的。如果以后要从本仓库重建全栈空间版，这批种子图需要从本机或 R2 备份补回。

## GitHub Pages 部署说明

静态版已经通过 GitHub Pages 发布，设置如下（在仓库页面操作）：

1. 打开仓库的 **Settings → Pages**。
2. **Build and deployment** 的 Source 选 **Deploy from a branch**。
3. Branch 选 **main**，文件夹选 **/docs**，保存。

之后只要 `docs/` 里的文件有改动并推送到 `main` 分支，Pages 会自动重新发布，稍等一两分钟刷新网页就是新版。仓库必须是公开的（免费账户的 Pages 只支持公开仓库），本仓库已经设为公开。

## VPS 部署教程（静态版）

想把这个静态网页放到自己的 VPS 上用，照下面做就行。

### 前提

- 一台 Linux VPS，已经装好 Nginx；
- 一个域名（可选）：有域名就把域名的 A 记录解析到 VPS 的公网 IP；没有域名也能先用 IP 访问。

### 第 1 步：把仓库拉到服务器

```bash
sudo git clone https://github.com/bullshitAI52/kids-math-space.git /var/www/kids-math-space
```

### 第 2 步：写 Nginx 配置

新建文件 `/etc/nginx/sites-available/kids-math-space`，内容如下（`server_name` 换成你自己的域名，没有域名就写 `_` 或服务器 IP）：

```nginx
server {
    listen 80;
    server_name math.example.com;

    root /var/www/kids-math-space/docs;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /images/ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

说明：`root` 直接指向仓库里的 `docs` 目录，不用再拷文件；`/images/` 给了 7 天缓存，重复打开会快一些。

### 第 3 步：启用配置并重载 Nginx

```bash
sudo ln -s /etc/nginx/sites-available/kids-math-space /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` 显示 successful 再 reload；报错就先别 reload，按提示改配置。

### 第 4 步：验证

```bash
curl -I http://你的域名/
curl -I http://你的域名/images/card-01.jpg
```

两个都返回 `HTTP/1.1 200 OK` 就通了：第一个确认首页能打开，第二个确认图片能加载。再用浏览器打开网址翻一遍卡片，就正式能用了。

### 第 5 步（可选）：上 HTTPS

用 acme.sh 或 certbot 给域名签一张免费证书，配好后把 Nginx 的 80 端口跳转到 443 即可，两个工具的官方文档都有现成的 Nginx 示例，照着抄即可。以后换域名时，可以配合另一个项目 [domain-migration-manager](https://github.com/bullshitAI52/domain-migration-manager) 走「预览 → 执行 → 验证」的流程，先预览再动手，出错能本地回滚。

## 更新流程

- **加新卡**：先在 Muse 应用的「小孩数学空间」里加卡（全栈版），然后重新导出静态版：更新 `docs/data.js` 和新增的卡片图片到 `docs/images/`（`docs/index.html` 一般不用动），提交推送到 `main` 分支。
- **GitHub Pages 版**：推送后自动重新发布，不用做别的。
- **VPS 版**：在服务器上执行一次拉取即可：

```bash
cd /var/www/kids-math-space && sudo git pull
```

静态文件不用重启 Nginx，拉完刷新网页就是新版。

## 配置与密钥说明

- 静态版**零配置**：没有配置文件、没有环境变量、没有任何密钥，`docs/` 里的三样东西（`index.html`、`data.js`、`images/`）拷到任何静态托管上都能跑。
- **不要把任何密钥、令牌、密码写进 `docs/`**——Pages 和 VPS 上的静态文件是公开可下载的，写进去等于公开。
- 全栈空间版的运行依赖 Muse 平台，相关凭据由平台侧管理，同样不要写进本仓库的任何文件。
