# webpages

用于整理与分享个人投资分析、公司研究及其他主题笔记的静态网站。

## 目录

- `index.html`：研究首页与文章目录
- `uber/index.html`：UBER 投资研究简报
- `nvda/index.html`：英伟达独立研究、现金流桥接与五年估值
- `semiconductor/index.html`：四家半导体公司的机会成本、财报趋势与动态估值\n- `netlify.toml`：静态托管配置，发布目录为仓库根目录

无需构建步骤。半导体页面通过相对路径加载季度数据，预览时用本地静态 HTTP 服务。GitHub Pages 提供收盘快照、手动估值和 TradingView 行情；部署到 Netlify 时，计算器也可通过 `/.netlify/functions/semiconductor-quotes` 获取 Yahoo Finance 最新常规时段报价。报价可能延迟，服务不可用时保留带日期的价格。

## GitHub Pages 自动发布

目标仓库为公开仓库 `vn-sg/webpages`。在 GitHub 仓库 Settings → Pages 中选择 Deploy from a branch，将 `main` 分支的根目录 `/ (root)` 作为来源。首次启用需要仓库管理权限。

配置后，每次向 `main` 分支推送提交，GitHub Pages 会自动更新网站；仅本地 commit 不会触发发布。根目录 `.nojekyll` 用于直接发布静态文件。发布是否成功可在仓库 Actions / Pages 中检查。

预期站点路径为 `https://vn-sg.github.io/webpages/`，UBER 文章为 `/webpages/uber/`。这些是预期地址，需启用 Pages 并核验后才可视为已上线。

新增研究时，为主题创建独立目录与 `index.html`，再在首页添加文章链接。每篇注明数据日期、原始出处、分析假设及局限，并区分个人样本和公开统计。

## UBER 当前版本

财务快照截至 2026 Q3。展示近 12 季利润率、管理层指引与营收共识、股东收益桥接及保险浮存情景。估值计算器默认采用 2026-11-09 研究记录的 $68.59，支持手动调整股价、折现率与永续增速。

- [Uber 2026 Q3 10-Q](https://www.sec.gov/Archives/edgar/data/1543151/000154315126000041/uber-20260930.htm)
- [Uber 2026 Q3 业绩与指引](https://www.sec.gov/Archives/edgar/data/1543151/000154315126000039/uberq326earningspressrelea.htm)

仅供信息参考，不构成投资建议。
