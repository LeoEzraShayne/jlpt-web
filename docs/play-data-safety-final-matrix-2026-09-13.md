# Play Data safety 最终填写矩阵与缺证项

2026-09-13，F 独立只读审查。本文取代旧 `jlpt-api/docs/contracts/play-store-data-facts-2026-09-13.md` 中“删除入口不存在”“受众待定”“年卡不可见”“SSV 未配置”的过时结论；不更改功能、Console 或生产。它是可填写草稿依据，**不是表单已提交或 Android 已获准发布**。

## 固定证据与当前状态

| 范围 | 本次依据 |
| --- | --- |
| JLPT API | 指定 `86b3ee513c354d079b741577d54994b6134f3dbd`：schema、OAuth、AI 路由、支付/SSV、删除工具；以 `git show` 固定读取，未把并行新增提交混入 |
| JLPT Web | `04aac198bcc5e60bbb547161f705843124fdccc3`：双语 privacy/delete、18+ 门禁、Google 登录、学习与付款入口 |
| Android 新壳 | 指定 `f8d6a7b`：MainActivity、LegacyRecovery、RewardAds、构建依赖；后续 E 的未提交修改未计为已验收 |
| 旧功过格 Web 普通源码 | `merit-ledger-web` HEAD `cb466b91935c3602126fcd6cfee6a6ea2a9207fb`；不是本轮线上部署版本证明 |
| 旧功过格 API 普通源码 | `merit-ledger_backend` HEAD `5c78698495016ae7fb7bc8b3d961264767e30c45`；未读取 env、数据库、密钥或用户记录 |
| 旧 Android 普通源码 | `merit-ledger-android` HEAD `3133a24c389665dfed4c35aeddfb23fa051da150`；不能据此断言每个已发布 APK 的依赖一致 |

已确定：仅 **18+**；Web 标签页自我确认已上线，不能称年龄证明。公开隐私 URL 为 `https://jlpt.meritledger.org/privacy`；删除 URL 为 `https://jlpt.meritledger.org/delete-account`，根代理已在 Play 保存删除 URL 草稿。删除请求采用公开 `contact@meritledger.org` 邮箱、人工归属核验和逐表工具；不是一键 API，也未执行真实用户删除。

根代理发布记录确认删除 guard/API 与双语入口已上线；正式 SSV URL 验证和保存、CMP 发布已完成。原生正式广告/购买开关仍关闭，后续新隐私流程的实机验收正在进行。新壳 release 构建仍有阻断，不能把测试广告成功写成正式广告已对用户开放。

AI 当前代码仍支持 Gemini 免费优先及 DeepSeek fallback；本次未读运行凭据/配置，也未改变它。**全球首发统一 DeepSeek 还是调整 Gemini 可用范围，仍待用户决定**，不能提前写“只使用 DeepSeek”。专用 Google 审核账号也仍待准备和验证。

## 填写口径

Play 按同 package 当前分发版本汇总，并包含受开发者控制的网页与 SDK 处理。离设备传输属于收集；本机只读恢复不等于上传。伪名 ID 仍须考虑；必填/可选按所有用户能否选择确定，不能用“用户可以不用整个 App”代替。分享例外需有实际条件依据，本文不替开发者认定处理者或用户发起例外。[Play 官方填写规则](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)

表中：**是/必需/否** 是现代码能支持的草稿值；**待证** 表示不要猜选或提交。`非临时` 表示实际数据库/文件保留，不能选仅内存即时处理。用途列采用 Console 对应类别：应用功能、分析、广告或营销、防欺诈/安全/合规、个性化、账号管理、开发者通信。

## 总览字段

| Console 问题 | 当前可填写值 | 限制 |
| --- | --- | --- |
| 是否收集或分享所列用户数据 | **是** | JLPT 登录、学习、账务已经成立，不依赖广告启用 |
| 创建账号方式 | JLPT：**OAuth**；旧服务：邮箱 OTP 对应 **用户名和其他身份验证** | 旧普通 Web 同时有第三方登录；最终表单按真实可用旧版本补齐。源码存在 password_hash 不证明有密码注册入口，勿据此勾选密码 |
| 能否请求删除账号及数据 | **是：人工请求渠道** | 提供正式删除 URL；入口与可执行工具存在，不宣称自动、立即、无例外删除 |
| 不删除账号也可请求部分数据删除 | **待证** | 当前通用邮件可表达范围，但已验收 CLI 是整账号 tombstone 流程；不能当作已落实的独立部分删除功能 |
| 是否所有收集的数据传输均加密 | **新 JLPT 路径有 HTTPS/TLS 证据；全 package 答案待旧路径核验** | 旧 Web 接受绝对 http 媒体 URL；旧 API 用请求协议拼媒体 URL；旧 Android 有动态 API 配置及非 HTTPS 警告。不是已发现生产明文流量，但仅凭新 API HTTPS 不能勾全局“是” |
| 独立安全审核 / MASVS 徽章 | **否/未取得** | 本项目代理审计与自动测试不等于 Google 认可实验室评估 |
| 面向儿童 / Families | **不是此次受众：18+** | 不沿用被替代的 13+ / 全年龄方案；不声称自报年龄已证明所有访客成年 |

## 当前 Console 勾选与应改差异（根代理只读证据）

根代理本轮读取：已选 **名称、邮箱、用户 ID、交易记录、照片、语音或声音录音、设备 ID/其他 ID**。大致位置、用户付款信息、应用互动、应用内搜索、其他 UGC、崩溃日志、诊断均未选；精确位置、健康、信息、文件/文档、日历、通讯录、浏览记录也未选。根代理仅修改删除 URL 并保存草稿，以下不是已操作记录。

| 处理 | 类型 | 直接理由 / 分享目的 |
| --- | --- | --- |
| **保留现有已选** | 名称、邮箱、用户 ID、交易记录、照片、录音、设备 ID | 新旧服务并集；不能因新 JLPT 没图片上传就取消旧照片/录音。分别按表 A/B 审核用途、可选性及分享 |
| **新增** | 应用互动 | 真实学习任务、复习、内容曝光与旧服务活动；收集：应用功能、分析、个性化；广告 SDK 来源的分享：广告或营销、分析、防欺诈/安全/合规 |
| **新增** | 其他用户生成内容 | 造句、批改、个人表达、旧 note/todo/reflection；收集：应用功能、个性化；当前 Gemini 免费分享：应用功能、分析 |
| **新增** | 应用内搜索 | JLPT 搜索词送 API；收集：应用功能。未发现第三方搜索引擎，托管/日志是否属于分享须核验，不能预填广告目的 |
| **新增（按含广告 SDK 流量的分发版本）** | 大致位置、诊断 | 官方 SDK 披露明确；收集和分享：广告或营销、分析、防欺诈/安全/合规。新 release 开关关闭不能覆盖旧活动版本；先核对版本并集 |
| **补充旧上传增量** | 文件和文档 | 旧上传日志保存原文件名等文件资料；可选上传，收集目的：应用功能、分析。分享按托管/日志处理实际关系，未见广告用途 |
| **核实旧 Stripe 可达后新增** | 用户付款信息 | 旧 PaymentElement/Stripe SDK 直传支付数据；可选购买，应用功能、防欺诈/安全/合规；分享例外不得自行假定 |
| **暂不因名称相似新增** | 崩溃日志 | SDK 诊断并不自动等同崩溃栈；本地旧 crash logger 也不证明上传。确认远端 crash 数据后补 |
| **保留未选，但审最终包/旧流程** | 精确位置、健康、通讯录、短信、日历、浏览历史等 | 本次无证据支持采集，不从权限、功过内容或数据库缺表直接推出全局结论 |

## A. 账号、学习及交易矩阵

“分享待证”行已经确认有托管/服务传输，但**没有足够合同及配置证据判定 Play 分享例外**；不是“没有传输”。可先完成收集/用途字段，保留相关分享字段待核验。对明确的 Google 广告与 Gemini 免费独立改进用途，不能套用此待证状态掩盖分享。

| Console 分类 / 类型 | 收集 | 分享 | 临时性；可选性 | 收集目的；分享目的（有分享时） | 实际内容与代码依据 |
| --- | --- | --- | --- | --- | --- |
| 个人信息 / 姓名 | **是** | 托管处理例外**待证**，未见将姓名放入 JLPT AI/SSV 参数 | 非临时；**必需**（JLPT OAuth 自动接收，未提供单项拒绝） | 应用功能、账号管理 | `User.displayName`；旧 `User.name` 可手动编辑。昵称不等于匿名 |
| 个人信息 / 邮箱地址 | **是** | 托管/邮件服务例外**待证**；付款表单如另发邮箱须并入 | 非临时；**必需** | 应用功能、账号管理；客服申请另有开发者通信 | Google profile email；旧邮箱 OTP、绑定邮箱；申请邮件由用户主动发送，非程序自动发信 |
| 个人信息 / 用户 ID | **是** | **是**（已启用相应 SDK/购买/广告传输时）；仅托管的部分另审例外 | 非临时；**必需** | 应用功能、账号管理、防欺诈/安全/合规；广告行的 ID 另加广告/分析 | JLPT id、Google subject、native/session 关联；Stripe metadata/userId；Play 随机账户关联；SSV 票据随机 ssvUserId。随机/哈希不等于无法关联 |
| 照片和视频 / 照片 | **是**（旧云图片/头像；JLPT 保存 Google 头像 URL） | 普通云存储/托管例外**待证**；未见自动发给 JLPT AI | 非临时；旧上传**可选**；类型整体可选性**待证** | 应用功能、账号管理（头像） | 旧 `/user/avatar`、`/upload/image` 和记录 images；Google 头像是否可由所有人拒绝后仍用 JLPT 未有证据，不因字段可空即标全局可选 |
| 应用活动 / 其他用户生成内容 | **是** | **是：当前 Gemini 免费调用的输入/输出**；DeepSeek 例外及用途见 AI 表 | 非临时；**必需**（造句为核心功能）；旧随笔/待办具体输入自愿 | 应用功能、个性化；Gemini 自有改进用途计入分析 | 句子、改写、词汇答案、个人表达、导入文字；旧功过记录 note、todo/reflection text。没有扫描用户邮箱或短信 |
| 应用活动 / 应用互动 | **是** | **是：广告 SDK**；无广告部分的托管例外待证 | 非临时；**必需** | 应用功能、分析、个性化；广告来源另加广告/营销、防欺诈 | 学习会话、提交、复习评分、内容曝光、活动时长/统计；旧 metrics_events 和功能操作；SDK 见表 B |
| 应用活动 / 应用内搜索记录 | **是：搜索词离设备传给 API** | 托管/日志接收者例外**待证**，未发现发给 AI 搜索引擎 | **可选**；是否仅临时**待日志核验，勿选临时** | 应用功能；若运维确实使用搜索日志另加分析 | JLPT grammar/vocabulary/expressions 查询；业务无独立历史表不证明代理访问日志没有 query string |
| 财务信息 / 购买记录 | **是** | 支付处理者例外**待证**；存在 Google/Stripe 双向核验 | 非临时；**可选**（用户选择购买） | 应用功能、防欺诈/安全/合规；会员关联可加账号管理 | order/payment/product ID、金额币种、退款、购买 token、权益；旧 payment/subscription 独立，不声称自动迁移 |
| 财务信息 / 用户付款信息 | **是：保留旧 Stripe PaymentElement / 原生 Stripe 付款路径时** | **待支付功能及例外核验**，不直接填否 | 非临时性由支付方核实，不能据本机无卡号选临时；**可选** | 应用功能、防欺诈/安全/合规 | 旧 Web `StripePaymentForm` 使用 PaymentElement；原生旧依赖 Stripe。JLPT 自己不保存卡号，不代表 SDK 直传不收集；新原生仅 Play 不足以排除旧路径 |
| 音频文件 / 语音或录音 | **是：旧云上传** | 托管处理例外**待证**；新恢复页面未自动上传 | 非临时；**可选** | 应用功能 | 旧 `/upload/audio` 接收文件、转码并存储，记录 audioUrl/duration；新 `LegacyRecovery` 仅读取本地支持录音并主动导出 |
| 音频文件 / 其他音频、音乐 | **待最终旧上传格式/实际用途确认** | 同上 | 可选；不据 `audio/*` 自动声称只接受语音 | 应用功能 | 旧 Web file input 允许 audio/*；不能把纯录音描述当作对任意用户文件的强制限制 |
| 文件和文档 | **是：旧上传日志包含原文件名**；新 JLPT 导入如只发解析文字归上方 UGC | 托管/日志接收者例外**待证**；主动本地导出是否例外另核实 | 非临时；上传**可选** | 应用功能、分析（上传故障日志） | `uploadService.js` 记录 originalName、storedName、size、URL。本地 SAF 导出不等于 App 上传；用户选云盘可产生其自行同步副本 |

JLPT 不请求 Google 邮箱内容权限；Google OAuth `email/profile` 并非“邮件”数据类型。用户主动给客服发删除邮件与读取邮箱是不同操作。不要因为自由文本可能写到病症或信仰，就自动认定应用在结构化收集健康/宗教字段；若真实流程引导填写这些信息，应重新分类。

## B. 广告、诊断和设备标识

NextGen 官方披露明确自动收集并分享 IP/大致位置、产品互动、诊断、设备及适用的账号标识，用于广告、分析、防欺诈，传输 TLS。删除广告 ID 不代表所有其他 ID/诊断均关闭。[NextGen 官方披露](https://developers.google.com/admob/android/next-gen/privacy/play-data-disclosure)

新壳锁定依赖 NextGen 1.4.0、UMP 4.0.0。新 `RewardAds` 只在 COMMERCE_TEST + TEST_ADS_ENABLED 下可用，广告展示前检查 UMP、会员/票据资格；正式 release 未启用。**SDK 存在与实际自动收集不同；最终包/初始化路径仍须核验。**

旧 Android 普通源码的 `MeritLedgerApplication.onCreate()` 直接初始化 NextGen 与 Unity，依赖 NextGen `0.22.0-beta04`、Unity `4.16.0`、Stripe Android `21.29.0`。旧源码不能代替已发布包取证，但足以阻止未经核实删除广告声明或标所有广告数据可选。

| Console 类型 | 可填写草稿 | 必需/可选与临时性 | 用途 |
| --- | --- | --- | --- |
| 位置 / 大致位置 | 广告收集**是、分享是**（有 SDK 流量的版本） | 旧启动自动初始化路径下**必需**；不能以新用户可不看激励广告改成全局可选；勿认定临时 | 广告或营销、分析、防欺诈/安全/合规 |
| 设备或其他 ID | 广告收集**是、分享是**；支付/会话 ID 另并入 | 类型整体可选性按旧活动版核验；仅广告 ID 可重置不够；非临时 | 广告或营销、分析、防欺诈/安全/合规；绑定/支付来源有应用功能 |
| 应用信息和性能 / 诊断 | **是、分享是**（广告 SDK）；API 自有延迟/错误另为收集 | 旧自动路径下**必需**；非临时 | 分析、防欺诈/安全/合规、广告或营销；SDK 实际目的为准 |
| 应用信息和性能 / 崩溃日志 | **待证，不能将“诊断”一律当崩溃** | 本地 crash handler 不证明离设备；后端错误日志/SDK 如上传堆栈则是 | 有该流量时选分析、应用功能/安全的实际目的 |
| 应用活动 / 其他操作 | Unity Acquire Optimization 等功能**待 Console/已发布包确认** | 不因 Unity 依赖就猜该可选产品已开 | 按实际广告分析用途 |
| 个人信息 / 用户 ID | Google SDK 适用的账号标识与 SSV 关联见表 A | 不将随机 SSV user_id 写成匿名数据例外 | SSV 应用功能、防欺诈；SDK 广告/分析另计 |

本轮找到 Unity 官方披露说明自动位置/ID/互动/诊断等类别及部分产品条件，但检索结果入口当前跳到 iOS 文档，Android 对应页返回 404。因此仅用来列**需核对 4.16.0 Android 的缺证项**，不直接将 iOS/latest 清单认证为旧 Android 精确行为。[Unity 官方披露入口](https://docs.unity.com/en-us/ads-ios/4.18.0/privacy/developer-consent/google-data-safety)

Stripe 官方说明支付 SDK/Stripe.js 会传设备与活动防欺诈信号，某些配置的关闭也不取消 Stripe 托管付款页全部处理；用途不应写成广告。旧付款入口若保留，须把相关 ID/互动及表单实际字段计入，不能以服务器没保存卡号为由遗漏。[Stripe 官方防欺诈说明](https://docs.stripe.com/disputes/prevention/advanced-fraud-detection)

## C. AI 当前/待定填写分支

| 实际配置 | 数据与表单影响 | 不能作出的承诺 |
| --- | --- | --- |
| 当前已实现：Gemini + DeepSeek 路由 | 必要句子、语法、词汇、场景上下文出站；服务端保存批改和 AI 计量。Gemini 免费内容及结果可作提供商自身改进，UGC 分享选**是**，应用功能并体现分析用途 | 不能称“零分享”“不保存输入”“所有 AI 只是只按指示处理者” |
| 用户若选择全球 DeepSeek 并实际部署/验收 | 去掉将来请求的 Gemini 出站描述；DeepSeek 开放平台 3.3/5.5 要求开发者对终端用户披露并响应权利请求。按实际委托约定核验 Play service-provider 例外后，才能决定 UGC 的分享勾选 | 不能自动从“使用付费 API”推定 no-training、零保留或分享例外；旧已发生的传输也不能倒写不存在 |
| 用户若保留 Gemini 并调整范围 | 18+ 与可用地区、EEA/UK/CH paid-only 条件必须在真实产品范围/路由体现；当前代码无地区分流判定 | 不能只改 Console 地区就声称独立全球 Web 已受限制，亦不能宣称单全球 client 按请求分流已获官方认可 |

Gemini 免费服务允许输入/输出用于改进及人工审阅；Paid Services 定义取决于关联有效 Cloud Billing 的项目。条款同时限制可能由未成年人访问的 client，及向 EEA/瑞士/英国提供 client 的付费条件。[Gemini 条款](https://ai.google.dev/gemini-api/terms)

DeepSeek 开放平台要求下游开发者明确披露处理并处理终端用户权利请求；其平台账号隐私政策不能直接当作下游用户的完整处理规则。本文未发现可据以宣称此项目 API 请求零保留/绝不用来改进的已核验约定。[DeepSeek 开放平台条款](https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html)

## D. 旧入口具体增加什么，不能增加什么

1. 新壳 `LegacyRecovery` 支持旧 pending_record/pending_todo/pending_reflection、m4a 录音只读展示/播放/系统位置导出，不自动携带内容或登录凭据去旧网站。本地恢复本身不新增云收集；未知格式保留并可导出，不声称全部旧数据已迁移。
2. 固定 `https://web.meritledger.org` 是自己控制的旧服务，不能仅因打开浏览器就一律作为“开放 Web 浏览”排除。普通 Web 源码包含独立 OTP/Google 登录、昵称头像、记录图片/音频上传、任务反思、历史统计、Stripe PaymentElement 与旧订阅管理。上面矩阵已列增量；实际部署版本及最终 Android 的可达性仍需根代理验证。
3. 旧 AudioRecorder 的“录制”按钮源码仅切计时状态；真正已确认的出站是用户选择文件后 uploadAudio。不能把本轮源码审阅写成麦克风录制功能已验收；原旧 Android 另有本地录音功能，需按已发布包核对。
4. 旧 backend 存在出生时间推演端点；当前已读旧 Web 调用函数传固定占位日期，未找到把真实生日从此 UI 输入的证据。因此不直接勾“其他个人信息/生日”，列为旧实际入口核验项。18+ sessionStorage 布尔确认本身也不是上传出生日期。
5. 尚无已核实的精确位置、通讯录、短信、设备已安装应用清单、浏览器全站历史、视频采集。权限/SDK或旧版若有实际传输需补证；不以“没在 JLPT schema 看到”断言全 package 永不收集。

## E. 删除、保留与运营证据

可直接填的 URL 与简述：

> https://jlpt.meritledger.org/delete-account
>
> 用户可通过公开页面的邮箱申请删除 JLPT 日语学习账号、旧功过格账号或两者。申请经账号归属核验后人工处理；部分必要交易记录可能保留，具体范围在回复中说明。退出登录、解除设备绑定和发送申请本身不会完成删除。

代码已实现 JLPT 不可登录 tombstone、认证/原生会话撤销、学习/额度/队列删除、账务最小化、AI 计量去关联，以及迟到 Google/Stripe/SSV 不复活权益；默认 dry-run CLI 与 synthetic-only 演练已通过，根代理已部署数据库 guard。旧服务 `/user/me DELETE` 是另一套实现，不删除新 JLPT DB。

不能填已删除真实账号、固定完成时限、备份立即全清、所有远端 AI 副本已删、没有任何记录保留。逐申请的留存依据/复查时间、邮件工单履行、日志/备份和提供商删除协作仍由操作员核实；工具对 LAUNCH_GIFT/共享导入等特殊范围会拒绝自动处理，应转人工，不向用户声称已完成。不存在通过公开按钮直接运行 CLI 的后台后门。

公开删除方式可用客服渠道，但必须实际履行，保留例外需透明说明；入口可访问不等于已完成每笔申请。[Google 账号删除要求](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)

## 提交前最短缺证清单

| 谁处理 | 必须补的具体证据 | 当前是否需要新用户决定 |
| --- | --- | --- |
| 根代理 / E | Play 当前所有分发 artifact 的版本、SDK、是否还包含旧 Unity/Stripe/自动初始化；最终新 AAB 依赖/权限与真实广告配置 | 技术核验，不先问用户回忆 |
| 根代理 | 旧 `web.meritledger.org` 实际部署版本、可达登录/上传/付款路径；HTTPS API、媒体、重定向/动态配置不降级。用于“全部加密”及照片/音频/支付增量最终答案 | 技术核验；不改旧服务或调用用户数据 |
| 根代理 / E | 新 UMP 全地区选择、初始化前后实际 SDK 出站和拒绝/撤回；同 package 旧自动收集是否仍分发。决定广告类别能否称全局可选 | 技术核验；CMP 已发布不等于此项通过 |
| 业务负责人 | AI 全球 DeepSeek 或保留 Gemini 范围选择；选后由代理部署/验证和同步隐私/矩阵 | **已发问题，等待原问题回答，不重复问** |
| 根代理 / 业务责任人 | 对拟使用分享例外的托管、邮件、支付、DeepSeek 的实际关系/用途依据；真实保留与删除请求履行者/第三方协作 | 不猜豁免或年限；代码可核实部分由代理处理 |
| 根代理 / 用户 | 正规 Google 专用审核账号；旧账号若另受限需独立验证。新 Google OAuth 不能沿用旧 OTP 说明 | 原问题待答；凭据只放受保护渠道 |

本轮只写文档。未做网络抓包、最终 APK/AAB 审计、真实账户/支付/删除操作或平台保存；本地普通源码与官方文档用于事实矩阵，执行状态只引用根代理已记录的上线/Console 证据。

## 复核用普通源码索引

- API：`src/auth/google.strategy.ts`；`prisma/schema.prisma`；`src/ai/ai-routing.ts`；`src/billing/billing.service.ts`；`src/android-commerce/admob-reward.service.ts`；`scripts/deletion/table-plan.ts`、`operator.ts`；`docs/operations/production-activation-2026-09-13.md`。
- Web：`src/components/public/privacy-view.tsx`、`delete-account-view.tsx`；`src/components/profile/profile-settings.tsx`；`docs/play-review-adult-access-2026-09-13.md`。
- 新 Android：`app/src/main/java/com/meritledger/app/RewardAds.kt`、`LegacyRecovery.kt`、`MainActivity.kt`；`app/build.gradle.kts`。
- 旧 Web：`src/api/endpoints.ts`、`types.ts`、`client.ts`；`src/app/App.tsx`；`src/features/pages/AccountPage.tsx`、`StripePaymentForm.tsx`；`src/features/record/AudioRecorder.tsx`。
- 旧 API：`src/models/User.js`；`src/db/postgresTables.js`、`todoReflectionTables.js`、`metricsTable.js`；`src/services/uploadService.js`、`reportFate.js`、`metricsService.js`；`src/app.js`。
- 旧 Android：`app/src/main/java/com/meritledger/app/MeritLedgerApplication.kt`、`ad/UnityAdProvider.kt`；`gradle/libs.versions.toml`、`app/build.gradle.kts`。没有读取旧签名规则、密码目录、env 或用户记录。

验证仅为逐段来源核对与 `git diff --check`；纯文档改动未重跑已通过的应用测试。
