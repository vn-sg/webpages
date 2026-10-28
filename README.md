# webpages

用于整理与分享个人投资分析、公司研究及其他主题笔记的静态网站。

## 目录

- `index.html`：研究首页与文章目录
- `uber/index.html`：UBER 投资研究简报
- `netlify.toml`：静态托管配置，发布目录为仓库根目录

无需构建步骤或外部资源。用浏览器打开 HTML 文件即可预览。

## GitHub Pages 自动发布

目标仓库为公开仓库 `vn-sg/webpages`。在 GitHub 仓库 Settings → Pages 中选择 Deploy from a branch，将 `main` 分支的根目录 `/ (root)` 作为来源。首次启用需要仓库管理权限。

配置后，每次向 `main` 分支推送提交，GitHub Pages 会自动更新网站；仅本地 commit 不会触发发布。根目录 `.nojekyll` 用于直接发布静态文件。发布是否成功可在仓库 Actions / Pages 中检查。

预期站点路径为 `https://vn-sg.github.io/webpages/`，UBER 文章为 `/webpages/uber/`。这些是预期地址，需启用 Pages 并核验后才可视为已上线。

新增研究时，为主题创建独立目录与 `index.html`，再在首页添加文章链接。每篇注明数据日期、原始出处、分析假设及局限，并区分个人样本和公开统计。

## UBER 当前版本

公开资料核验版，核验日期为 2026-10-28，财务快照为 Q2 2026。关联对话接口未返回原简报正文，因此亲测报价、地区 TAM 数字及内部人交易记录尚未复现。

- [Uber Q2 2026 业绩公告](https://investor.uber.com/news-events/news/press-release-details/2026/Uber-Announces-Results-for-Second-Quarter-2026/default.aspx)
- [SEC Exhibit 99.1](https://www.sec.gov/Archives/edgar/data/1543151/000154315126000027/uberq226earningspressrelea.htm)

两者为同一份公司披露的交叉核对，不构成独立审计。详细口径与研究局限见文章。

仅供信息参考，不构成投资建议。
