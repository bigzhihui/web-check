# 十三月网站检测

站点：<https://check.afeiii.com>。基于 [Web-Check](https://github.com/Lissy93/web-check) 2.3.6（上游提交 `3941128a568965e33fac558169570826fd9dbea6`）定制，保留 MIT License 与 Alicia Sykes 的署名。

## 本站配置

- 中文品牌首页、导航、使用说明、隐私说明与使用条款。
- `site-config.json` 是前后端共同使用的公开检测清单，当前提供 18 项基础检测，包括 IP、DNS、证书、响应头、跳转与 SEO 配置。
- 未开放端口扫描、路由跟踪、浏览器截图、第三方密钥增强检测及聚合 API；不接入上游统计脚本。
- 目标校验拒绝内网、保留地址、带账号密码的网址及自定义端口；容器出站策略再次限制实际网络目的地，覆盖跳转与后续 DNS 变化。
- 单个 HTTP 响应最多读取 2 MiB；检测结果页与 API 不供搜索索引。
- 主要界面中文化；协议字段及部分上游技术参考、分析建议保留原文。

## 开发与验证

使用 Node 24.16.0 与 Yarn 1.22.22。安装时设置 `PUPPETEER_SKIP_DOWNLOAD=true` 和 `NODE_CHROMIUM_SKIP_INSTALL=true`，跳过不需要的浏览器下载。

```sh
yarn install --frozen-lockfile
yarn test:public
yarn lint
SITE_URL=https://check.afeiii.com PLATFORM=node ENABLE_ANALYTICS=false yarn build
```

测试覆盖公网目标校验、数字和映射 IP、混合 DNS 结果，以及实际 HTTP 响应读取上限。

## 生产部署

源码与部署配置维护在本仓库。Dockerfile 使用固定摘要的 Node ARM64 兼容基础镜像，并在构建阶段运行测试、lint 与类型检查/构建。

```sh
docker build -f deploy/Dockerfile --build-arg REVISION="$(git rev-parse HEAD)" -t thirteen-month-web-check:COMMIT .
```

服务器目录为 `/opt/apps/web-check`；运行镜像通过仅含 `WEB_CHECK_IMAGE` 的 `.env` 指定。Compose 仅绑定 `127.0.0.1:3002`，由 Caddy 提供 HTTPS。容器限制为 1 CPU、1536 MiB 内存、128 进程、只读文件系统与 256 MiB 临时空间。

部署 `web-check-egress.sh`、`web-check-egress.service` 和 `web-check.service` 后，由 systemd 管理服务启动顺序；先加载专用 bridge 的出站限制，再启动应用。不要绕过 systemd 单独运行 Compose。该策略只维护 `AFEIII-WEBCHECK`、`AFEIII-WEBCHECK-HOST` 两条链及对应 bridge 入口，不改变其他服务的规则。

`deploy/Caddyfile` 是本站独立配置片段。当前按 DNS 直连服务器配置客户端 IP；将来启用 Cloudflare 代理前，应先配置可信代理与真实访客 IP 传递，再验收限流。

健康检查为 `/healthz`，需同时检查 `status=ok` 与 `ready=true`。发布后还应验证首页、真实检测、内网拒绝、robots.txt、sitemap-index.xml、桌面及手机布局，并接入现有监控。

## 更新与回退

生产镜像按提交固定，不自动跟随上游。更新先审查上游变更并运行验证，再构建新镜像。回退时将 `.env` 的 `WEB_CHECK_IMAGE` 指回上一版本，然后 `systemctl restart web-check`。服务不保存检测结果数据库。

问题反馈：<mailto:support@afeiii.com>。
