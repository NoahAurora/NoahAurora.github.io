# 张方舟的个人学术与工程主页

这是一个基于 [zzaiyan/zzaiyan.github.io](https://github.com/zzaiyan/zzaiyan.github.io) 二次开发的 Jekyll 个人主页，用于展示科研成果、工程项目、教育经历、荣誉、技术博客和简历。项目保留原仓库的 MIT 许可证与必要署名。

## 当前功能

- 中英文切换，语言偏好保存在浏览器本地。
- 深色/浅色模式，支持系统主题并可手动切换。
- 响应式单页布局，适配桌面端和移动端。
- Research 与 Engineering Projects 独立展示。
- 论文引用信息由结构化数据自动生成。
- GitHub Pages Actions 构建与部署流程。

## 内容维护

主要内容均通过配置或数据文件维护：

| 内容 | 文件 |
| --- | --- |
| 个人简介与网站设置 | `_config.yml`、`_pages/about.md` |
| 导航 | `_data/navigation.yml` |
| 动态 | `_data/news.json` |
| 论文 | `_data/publications.json` |
| 工程项目 | `_data/engineering_projects.json` |
| 教育经历 | `_data/education.json` |
| 荣誉奖项 | `_data/honors.json` |

没有真实链接的项目入口会显示 `TBD`，不会跳转到虚构地址。LLM Serving Lab 被明确标记为 `In Progress`，目前不包含未经验证的性能结果。

## 本地运行

推荐版本：Node.js 24、Ruby 3.3、Bundler 2.5+。

```powershell
npm ci
bundle install
npm run data:build
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

浏览器访问 <http://127.0.0.1:4000/>。

服务运行时可执行真实浏览器验收：

```powershell
npm run qa:browser
```

该脚本使用隔离的 Chrome 配置验证 390 px 移动视口、中英文切换、深色模式、关键栏目与横向溢出，不读取日常浏览器资料。

### 当前 Windows 环境

本机使用的便携 Ruby 位于 `D:\Projects\.tools\ruby-3.3.12\rubyinstaller-3.3.12-1-x64`，Gem 安装在项目的 `vendor/bundle`；npm 缓存位于 `D:\Projects\.npm-cache`。这些依赖目录已被 Git 忽略，不会提交或部署。

若 PowerShell 尚未识别便携 Ruby，可在当前终端临时执行：

```powershell
$rubyRoot = "D:\Projects\.tools\ruby-3.3.12\rubyinstaller-3.3.12-1-x64"
$env:Path = "$rubyRoot\bin;$rubyRoot\msys64\ucrt64\bin;$rubyRoot\msys64\usr\bin;$env:Path"
```

这只影响当前终端，不修改系统 PATH。

## 修改论文数据

编辑 `_data/publications.json` 后运行：

```powershell
npm run data:build
npm run citations:check
```

生成结果保存在 `_data/generated/citations.json`。PhaseConeGNN 当前按“审稿中稿件”展示，不应在录用前改成已发表论文。

## 部署到 GitHub Pages

部署前需要确认 GitHub 用户名和仓库名，然后完成以下步骤：

1. 在 `_config.yml` 填写 `url` 与 `repository`。
2. 若仓库名是 `<username>.github.io`，保持 `baseurl: ""`；其他仓库由 Actions 自动传入 Pages base path。
3. 在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**。
4. 将本地 `main` 分支推送到本人仓库。

当前尚未执行 GitHub 登录、创建远程仓库、推送或公开发布；这些操作需要网站所有者确认后再进行。

## 待补充信息

- 公开邮箱。
- GitHub 用户名及项目仓库链接。
- 最终公开版 CV/PDF。
- PhaseConeGNN 的公开 Paper / Code 链接（仅在真实可用后添加）。
- LLM Serving Lab 的 GitHub、Demo 与 Benchmark 链接及经验证结果。

## 许可证与署名

本项目继承原项目的 [MIT License](LICENSE)。页面页脚保留了对原开源主页的署名。
