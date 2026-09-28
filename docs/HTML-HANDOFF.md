# HTML / GitHub 接手说明

2026-09-28 用户最新要求：专注全面完成 HTML 与 GitHub 公开线上版；节省 token；暂停 EXE。原 EXE、桌面脚本及依赖只保留，不继续诊断、测试或打包。

## 已有内容，不要重新从头创作

最终交接检查：ch01–32 共32章、s01/s05/s06/s09 共4支线、A–F 六结局，均为 draft。审计291,827独立叙事汉字（含所有分支及笔记，不等于单次通关字数）。实际以重新运行 scripts/audit.mjs 为准。

未完：ch33–36，s02–04、s07–08、s10–12，真实科学阅读附录及事实核查，逐章统一审校，大部分美术和完整回归测试。既定32万字/1280独立有效画面/360母图目标没有被用户取消；不能通过重复段落、裁切复用或分镜文字来凑数。要改变规模需用户另行确认。

写作遵守 humanizer。先读各分工的短交接记录，再按需读具体章节，避免反复把全集加载进上下文：

- early-authoring-handoff.md：ch01–12、s01 与剩余早段支线。
- middle-authoring-progress.md：ch13–24、s05–06 与剩余中段内容。
- late-authoring-handoff.md：ch25–32、六结局、s09 与晚段收束。伤亡确认须来自可靠现场信息，不能让学生全知判断；第33章可以先演伤害，后续确认后再设置死亡旗标。
- authoring-contract.md、continuity-decisions.md：数据格式、人物口气、分支状态与因果边界。
- outline-v01.md：完整总纲，需要时按章节查看。

## 网页工程

运行 `node scripts/build.mjs` 从 content 编译到 web；`web/index.html` 可通过本地文件直接打开，无后端与外部字体依赖。不要拿此前编译快照当作最新全集。

src/compile.mjs 编译条件段落、支线、章节与结局；src/model.mjs 回放存档重建状态，支持 scene.effects（场末执行，在该场 choice 之前）及 ending.epilogueChoice。离镇 E 在第28章直接分流；第36章入口先解析 endingId。

F条件要求缺人、没有外援、ground_response非true、ch31_waited和ch33_waited均true，且此前现场已经设置 ch33_loss_worker='ma' 或 ch33_loss_family='child'。不得在路由中凭空补死亡。luo_leg_injury默认false，伤情只能由前文具体现场设置。第31章已使用条件effects。需要测试全部实际路线可达性，不只测试人为构造flag。

网页支持自动存档、6手动槽、导出/导入、回看、证据本、目录和设置。首轮3种视口测试通过，但测试时仅前2章连续可读；需更新qa-web.mjs中原有500步及“制作边界”断言以适配完整剧情。键盘、移动端、分支、无网、存档版本和缺资源必须再测。

build.mjs当前硬编码alpha标签及releaseReady=false。只有真实内容/美术/QA达标后才能改正式状态，不能靠改布尔值通过交付。章节目前整包JS，图片按场景加载；若需要优化先测真实体积，避免无谓重构。

可用测试：`node --test tests/*.test.mjs`、`node scripts/qa-causality.mjs`、`node scripts/audit.mjs`、`node scripts/qa-web.mjs`。沙盒spawn EPERM是权限问题，按工具要求申请授权，不改测试来伪造通过。

## 美术现状

已验收入库2母图/8画面，在 art/catalog.json；旧封面已在 web/assets/cover.webp。其他分镜说明不算已生成图片。

三组已生成画面返修结果与原版存于 art/pending/；精确提示词/来源/状态见 art/pending-review.json。优先检查v2，不要重复生成。尚未验收，不计approved。第一章teacher_rollcall一组尚未生成。

已知返修点：paper_at_door原版多出梁弥顾屿；paper_custody原版把抄录画成建筑画、走廊画成教室、锁门画成开门；locked_room原版多出旁人和教室桌椅。v2须逐项核验。人物额角伤口保持同一侧，文本已避免多余左右限定。

使用内置image_gen，按imagegen技能操作；无用户明确授权不要切API付费脚本。scripts/encode-art.py仅做原尺寸WebP格式编码；scripts/ingest-art.mjs只能在人工视觉验收并保存提示词之后登记。检查每幅图是否匹配正文，必要时给段落指定图，不能只按段数均分导致场景提前出现。原始母图/待审图不要发布到Pages。

## 因果与科学

唯一虚构前提为有限反向经典信息通信，不是真实现有技术。偏移704秒，双通道，净载荷128字节，同通道发送间隔至少704秒；不能跨连续运行起点，更不能跨回1985。

early/middle-causality-ledger.json为台本账本，qa-causality脚本会标准化时区与ASCII并检查字节数。初次277条记录校验通过（含256跳长链）。失败实验必须保留为失败，不算有效接收。src/causality中的initialPackets是早期测试夹具，和作者账本载荷表述不同，正式UI应选作者账本为单一事实源，避免重复计同一包。

跨日链：10/31 20:00首收，256×704秒，11/02 22:03:44末发；payload为 DEMO|REGISTERED=117|REMAINING=0|ALL_SAFE。117登记人员不覆盖137现场人员，未知误成0不等于全员安全。所有路线都兑现已收到的字节。

后段待写方案（须复读前文确认）：第32章22:00在通道B接“沈岑未归”，含义为旧班级集合点字段，人已在人工记录的安全联络点；22:11:44按原字节发回。第33章至22:03:20，第34章实际演出22:03:44跨日链末发，第35章至22:11:44履约后再停机。新包须补late账本并检验通道冲突。

## GitHub交付

用户已授权公开独立仓库 Cooldrug1981/the-zero-period，禁止修改TLS仓库。当前未验证新仓库已创建，也未上线。此会话GitHub连接能识别账号，但缺创建仓库工具；本机credential helper无可用非交互登录，浏览器连接超时。接手桌面版可用昨天成功的登录环境，不要反复盲试同一个失败接口，更不要索要聊天明文token。

先确认仓库是否存在及账号权限，创建/使用指定仓库。部署产物为web目录，创建正确GitHub Pages工作流，提交前排除.env/凭据、qa浏览器profile、node_modules、reference、art/masters、art/pending、release和desktop产物。线上未完成时仅标开发预览，不宣称全集正式版。EXE和ZIP本轮完全不上传。

上线验收：Actions成功、真实HTTPS页面200、所有被引用资源200与本地哈希一致、浏览器无报错、手机排版及存档实测。最终报告真实URL、发布commit、版本、完成内容与未完成项；构建成功不等于上线成功。

## token节省

默认单个执行流程，必要时才分工独立文件。一次读取短交接+审计摘要，按需读取正文；先搜索后读整文件；复用既有引擎、测试、美术和提示词；只修明确问题；不反复生成大计划或重复跑与网页无关的测试。交接时三个写作代理已被要求保存有效JSON后停写，避免跨会话并发改文件。
