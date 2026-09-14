# eval_puls — Langfuse 中文增强版（DeepEval × Langfuse 智能体测评栈）

基于 [langfuse/langfuse](https://github.com/langfuse/langfuse) **v3.225.4** 的增强 fork（上游原 README 见 [UPSTREAM_README.md](./UPSTREAM_README.md)）：

- 🇨🇳 **Web 界面中英文切换**（原版仅英文）：侧边栏导航、页面标题、
  标签页、面包屑、全部分析表格的列头、筛选工具栏均已汉化，
  未覆盖文案自动回退英文，不影响功能。
- 🔗 **DeepEval 集成**（`integrations/deepeval-langfuse/`）：DeepEval 出指标、
  Langfuse 出轨迹与看板，组合开源替代 Confident AI。

> Confident AI（Langfuse 官方云平台）的仪表盘/轨迹回放/团队协作是闭源 SaaS；
> 本项目走「Langfuse 自托管 + 中文化 + DeepEval 指标引擎」的私有化路线。

## 一、中文界面构建与部署

### 构建镜像

```bash
git clone https://github.com/990505-a/eval_puls.git
cd eval_puls
docker build -f web/Dockerfile -t langfuse/langfuse:3.225.4-zh \
  --build-arg http_proxy= --build-arg https_proxy= \
  --build-arg HTTP_PROXY= --build-arg HTTPS_PROXY= .
```

> `--build-arg xxx=` 用于清空 Docker Desktop 注入的本地代理，
> 无代理环境可去掉；Apple Silicon 原生 arm64 构建即可。

### 替换现有部署（docker-compose）

以 eval-platform 的 compose 为例，只换 web 镜像，其余组件（worker /
postgres / clickhouse / minio / redis）与数据卷完全不动：

```yaml
langfuse-web:
  image: langfuse/langfuse:3.225.4-zh   # 原为 docker.io/langfuse/langfuse:3
  # 其余配置保持不变
```

```bash
docker compose --profile langfuse up -d langfuse-web
```

### 切换语言

登录后点左下角**头像 → Language（语言）→ 中 / EN**。
选择存于浏览器 localStorage，刷新后保持；首次访问按浏览器语言自动选择。

## 二、i18n 实现说明（二次开发必读）

设计原则：**英文原文即 key，中文走字典，未翻译自动回退英文。**

| 文件 | 作用 |
|---|---|
| `web/src/i18n/config.ts` | locale 定义、存储 key |
| `web/src/i18n/provider.tsx` | `I18nProvider`（挂载于 `pages/_app.tsx` 最外层）、`useI18n()` |
| `web/src/i18n/zh-CN.ts` | 中文词典（英文原文 → 中文） |
| `web/src/components/nav/language-toggle.tsx` | 用户菜单里的语言切换器 |

翻译注入点是少量「咽喉」组件，改动面小、上游合并成本低：

- `components/nav/nav-main.tsx` — 整个侧边栏（含分组标题）
- `components/layouts/page-header.tsx` / `page-tabs.tsx` / `breadcrumb.tsx` /
  `mobile-page-title.tsx` — 所有页面的标题、标签、面包屑
- `components/table/data-table.tsx` — **全部表格的字符串列头**
- `components/table/data-table-controls.tsx` — 筛选侧栏工具栏

### 补充翻译

1. 在 `zh-CN.ts` 加一行 `"English text": "中文"`；
2. 若该文案尚未经过 `t()`，把渲染处包上 `{t("English text")}`
   （组件内先 `const { t } = useI18n();`）；
3. 新增语言：建 `xx-YY.ts` 词典，在 `provider.tsx` 的
   `DICTIONARIES` 与 `config.ts` 的 `LOCALES`/`LOCALE_LABELS` 注册。

### 同步上游

```bash
git remote add upstream https://github.com/langfuse/langfuse.git
git fetch upstream --tags
git merge upstream/main   # 冲突一般只在上述咽喉文件，量很小
```

## 三、DeepEval × Langfuse 评估集成

见 [`integrations/deepeval-langfuse/README.md`](./integrations/deepeval-langfuse/README.md)。
核心流程：被测 agent 用 `@observe` 打轨迹 → DeepEval 指标（相关性/
忠实度/GEval 自定义）→ 分数与评判理由写回同一条轨迹，在 Langfuse UI
的轨迹详情页直接查看，等价于 Confident AI 的「轨迹 + 评估」体验。

## 四、版本对应

| 组件 | 版本 |
|---|---|
| 上游基线 | langfuse v3.225.4（`ed58b88e`） |
| worker 等其余组件 | 官方镜像 `langfuse/langfuse-worker:3` 不变即可 |

## License

上游 Apache 2.0，本 fork 保持一致。
