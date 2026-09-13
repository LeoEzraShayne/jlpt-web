# 18+ Web 确认与 Google Play 审核访问准备

状态：独立 Web 候选，未部署；未创建外部账号、读取或传递审核凭据、操作 Console。用户最终选择 **18+**，此前 13+ / 全年龄方案已被替代。

## 已有正规入口与不能混用的账号

| 入口 | 当前实现 | 审核准备 |
| --- | --- | --- |
| 日语学习 | Android `Continue learning` 打开固定 JLPT 网站；Web `/login` 通过后台 `/auth/google` 使用 Google OAuth | 提供独立、普通权限的正规 Google 测试账号及英文说明；不能要求审核员用其个人账号自行注册 |
| 原生会员与奖励 | `Open membership` → `Link learning account` → Web 确认 → 经过 PKCE 的回调和 exchange | 复用同一 JLPT Google 身份；仅在最终版本实际启用、验收后加入提交说明 |
| 旧功过格 | `Merit Ledger and saved local items` → `Open Merit Ledger website`，固定 `https://web.meritledger.org`；本地支持格式的草稿/录音可查看与导出 | 原服务账号、云数据和订阅独立，不得声称 JLPT Google 登录可解锁旧云服务；全新安装可没有旧本地资料 |

旧 Console 说明曾以 `Use email OTP login.` 开头（根执行代理先前只读证据），不适用于新 JLPT Google OAuth。此轮没有重新登录旧云服务；旧服务的现有审核账号能否避免临时 OTP、完整访问功能仍需正规实测，不应直接复制旧说明当作通过。

Google 要求审核访问随时可用、可重复、跨地区有效，并以英文提供说明；Google 等第三方登录也须给出账号资料与明确步骤，受付费限制的功能需让审核人员完整免费访问。[官方审核登录要求](https://support.google.com/googleplay/android-developer/answer/15748846?hl=en)

## 最小审核方案

1. 根执行代理先确认是否已有可复用的**专用测试 Google 身份**，仅放合成学习资料，权限为 USER；不使用用户的日常邮箱、管理员、支付或 Cloud 运维身份。不在仓库、普通文档或截图中放凭据。
2. 通过普通 Google 登录创建/访问真实 JLPT 账号，设置可重复查看的学习计划与合成历史。对付费部分，通过已核准的常规业务途径提供审核访问，具体授权途径由根执行代理确认；不得伪造支付成功。若奖励只向免费用户显示，须另行说明/准备真实可用的免费测试身份。
3. 用全新浏览器配置及最终 Play 安装候选实测：登录不依赖操作员临时接验证码、手机确认或地区限制。若 Google 风控仍要求挑战，这个账号尚不能作为可靠审核入口；不要关闭用户主账号安全保护，不增加 URL 密钥、固定 OTP 或通用免登录接口。
4. 在 Play 专用私密字段填写已核验的账号资料。旧云服务如仍需登录，应提供独立一组说明及其正式可复用账号；暂不能提供时明确作为提交阻断，而不是声称旧本地导出等同旧云功能。
5. 根执行代理完成最终按钮、会员/广告开关与访问权益核对后再提交。未完成的原生功能不能先写成已上线。

以下英文可以在对应功能和账号实测通过后使用；它不是已填写或已获审核通过的声明：

> JLPT Sentence Lab is intended for adults aged 18 and over. Select “Continue learning”, confirm the age acknowledgement, and select “Continue with Google”. Use the dedicated Google account provided in the private sign-in fields. The app uses standard Google sign-in; it does not have a separate JLPT password or email OTP login. After sign-in, open the learning plan and review the available practice and history screens.
>
> The legacy service is separate. On the Android home screen, select “Merit Ledger and saved local items”. Supported local drafts and recordings can be viewed or exported if present; a fresh installation may have none. “Open Merit Ledger website” opens the original service. Its account and cloud data are independent of the JLPT learning account; consult the separate legacy-service sign-in instructions.

原生绑定段仅在最终候选验证后追加：`Select “Open membership”, then “Link learning account”. In the browser, sign in with the same Google account, check the displayed identity, and confirm the link to return to the app.` 不写尚未验证的购买/广告完成步骤。

## 本次实际 Web 改动与边界

- 登录和 `AuthGate` 共用一个 18+ 确认组件，复用当前标签页状态；登录返回与 Android 绑定不各加一套确认。checkbox 不预选，必须点击确认后才挂载其下的登录或受保护内容；旧登录会话也经过此 UI。
- 确认保存于带版本键的 `sessionStorage`，退出登录清除；存储不可用时仅保留当前页面内存状态。没有收集出生日期、身份证件，也没有声称 Google 已验证年龄。
- 双语隐私说明及公开页脚明确 18+，隐私与删除申请仍无需确认或登录。登录页原先“仅将账号用于保存进度”的说明改为准确链接隐私说明。
- **这只是客户端明确告知与自我确认，不是年龄证明、账户级授权或 API 保障。** 标签页状态可能被修改，直接 API 请求不受其约束；既有 native session 也没有新增服务端限制。公开布局原有 `/me` 请求仍可能发生，不能声称确认前零数据请求。

Google OAuth 目前仅请求 `email` / `profile`，没有年龄结果。Play 的 18+ 分发限制不覆盖独立 Web 访问，也不能单独证明应用不太可能被未成年人访问。Gemini Developer API 年龄条件仍需靠真实成人定位和访问措施落实；本轮 **不排除 Gemini、不改 provider 配置**。EEA、英国、瑞士的官方条件写的是向这些地区用户提供 API Client 时仅可用 Paid Services，不是只按服务器所在地判断；条款也未明确给出单一全球客户端按请求分流的豁免。当前共同路由没有地区决策。将这些地区导向 DeepSeek 可作为待确认的最小方案，但不能宣称此方案已经得到 Google 认可；如需消除该合同解释不确定性，全局 DeepSeek 或 Gemini 全部使用符合定义的 Paid Services 是较清楚的路径，须由根执行代理决定，本文不改配置。该条款不推出必须 KYC。[Gemini 官方条款](https://ai.google.dev/gemini-api/terms)

## 后续若接账户级 API，只需一个共同确认契约

建议统一由 `/me` 返回成人声明版本/状态，新增一个须真实 session、合法 Origin 的确认端点；存版本与确认时间即可，不把 browser storage 当依据，不默认替既有用户确认。组件继续只保留一套，改读服务器状态，并在确认后刷新 `/me`。

按当前 controller 核验，路径均带 `/api/v1` 前缀，最小接入位置如下：

| 位置 | 后续账户级确认接入 |
| --- | --- |
| `GET /me`，拟新增 `POST /me/adult-acknowledgement` | 共同状态来源与唯一确认入口；后者是提案，当前不存在 |
| `POST /sentence-reviews`、`POST /sentence-reviews/:id/retry` | 创建/重试语法 AI 任务前检查 |
| `POST /vocabulary-practices`、`POST /vocabulary-practices/:id/answer`、`POST /vocabulary-practices/:id/retry` | 创建/重试词汇生成或批改前检查 |
| `AiWorkerService.process`、`VocabularyPracticeWorker.process` | 已入队任务实际发出 provider 请求前重新查账户状态，不能只拦 controller |
| `POST /study-sessions`、`POST /sentence-attempts/:id/practice-again` | 如果成人限制覆盖全部学习服务而不只是 AI，此处同样检查，复用共同 guard |
| `POST /android/auth/bindings/:id/approve`、`POST /android/auth/exchange` | 绑定确认及兑换时检查真正关联的账户；既有 native session 还须在功能端点读共同状态 |

检查必须使用真实 session 所属 userId，不能信任请求体中的 userId 或成人布尔值。状态未确认不应发模型请求、扣成功额度或使计量失去对应关系。

公共隐私/删除说明、退出登录、历史账务支持和已存在付款的迟到回调应保持可达；年龄声明不应丢弃合法账务事件或重写历史权益。此 API 方案尚未实施，需单独验收已登录旧账户、跨设备、队列在途和原生会话，不能把这次 Web 测试当作其通过证据。

## 验证范围

本地 build、lint、typecheck 与单元回归；Browser plugin/对应 skill 未提供，按前端测试技能使用仓库 Playwright。新增浏览器回归覆盖中英确认、未预选、直接受保护页以及公共隐私/删除页。已有学习 E2E 使用明确的“已确认成人”测试 fixture，专用门禁测试使用原始 fixture，避免掩盖门禁行为。浏览器 UI 测试拦截 API，不调用生产或 Google OAuth；正规审核账号和最终 Android 安装仍待根执行代理实测。

实测结果：`npm run build`、`npm run lint`、`npm run typecheck`、`npm test`（20 文件 / 94 项）、`npm run check:lines`（170 文件）与 `git diff --check` 通过。专用 18+ 浏览器测试在 desktop 和 mobile-320 均通过；截图已目视确认无横向溢出，测试捕获的页面及 console 错误为空。

额外抽跑旧 `app.spec.ts` 的 `today task opens the focused study flow and enforces score 59 revision`：补齐其既有 `/me/entitlements` mock，并将 `预计 8 分钟` 改为仍严格验证 8 分钟的空白容忍正则后，两种 viewport 均走过 59 分反馈、必须修改、修正句及读音检查。随后第 280 行期待修改时输入框清空，但实际保留原句；现有 `StudyWorkspace.revise()` 在本次修改前就没有清空句子。此处尚需核对既有业务预期，不以修改断言掩盖语义差异。未运行全部 E2E 或真实 Google 登录，不能报告全套端到端通过。
