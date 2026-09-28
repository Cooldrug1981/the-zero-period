# 全集制作规范 v1

本次按完整总纲制作，不缩成梗概版。署名：大阴希声@UglyNakedGuy。人物语气基线是 reference/ch01-humanized.js 中的 v0.2 台词。

## 文本格式

每章一个 UTF-8 JSON：content/chapters/ch01.json 至 ch36.json。

结构：

```json
{
  "id": 2,
  "part": 1,
  "title": "铃声中间的人",
  "date": "1997-10-20",
  "pov": "沈岑",
  "status": "draft",
  "scenes": [
    {
      "id": "clockroom",
      "title": "走廊里的表",
      "time": "20:48",
      "location": "北楼二层",
      "paragraphs": [
        {"speaker": "旁白", "text": "此处是真正写好的正文。"}
      ],
      "art": [
        {"id": "ch02-clockroom-01", "shot": "独立构图的中文分镜说明，明确人物、动作、光线与必要的物证细节。"},
        {"id": "ch02-clockroom-02", "shot": "第二幅不同事件或构图。"},
        {"id": "ch02-clockroom-03", "shot": "第三幅。"},
        {"id": "ch02-clockroom-04", "shot": "第四幅。"}
      ],
      "choice": {
        "key": "ch02_clock_method",
        "prompt": "人物面前的具体问题。",
        "options": [
          {"id": "a", "label": "自然说得出口的一句话", "detail": "玩家能预期的动作", "set": {"clock_note": "raw"}, "reply": [{"speaker": "沈岑", "text": "此选择专属且实际发生的情节。"}]},
          {"id": "b", "label": "另一种实际行动", "detail": "说明后果范围", "set": {"clock_note": "witness"}, "reply": [{"speaker": "许照", "text": "不同的回应和后续。"}]}
        ]
      },
      "evidence": [{"id": "clock_dependence", "title": "共用授时源", "type": "观察", "text": "本场结束时已经知道的内容。", "uncertain": "尚待查明的具体部分。"}],
      "set": {"observed_clock_fault": true}
    }
  ]
}
```

choice/evidence/set 可省略；每章通常 6 个完整场景、24 个有实际差异的主线画面。正文汉字目标每章 6,100 至 7,200，不含代码、分镜说明、标题及重复引用。每段约 80 至 190 汉字，少量完整短对白可更短；不要把每句都拆成一页。不得为了计数复制同一段。

分支 reply 每项通常 400 至 900 汉字，以多段表达。共用主干在所有选项后继续。场景或段落可有 when: {"flag": value}，全部键相等才显示；分支后共有场景不得假定另一条线才发生的事。

支线文件 content/side-stories/s01.json 至 s12.json：与 chapter 相同 scenes 结构，另含 id（s01）、title、afterChapter（数字）、offer（一句邀请）、status。每条 3,000 至 4,000 汉字、3 场景12幅画面。进入支线要由玩家主动选择，跳过不破坏主线理解。支线影响具体证据或合作资源，不加隐藏理性分。

结局文件 content/endings/A.json 至 F.json：id/title/status/paragraphs/art，约 5,000 汉字每个、16幅独立结局画面。不要将六结局仅各写一段总结。可以用段落 when 条件表现准备带来的差异。

研究档案 content/research/*.json：id/title/unlockChapter/dateScope（1997 或 modern）、paragraphs、sources（真实URL和说明）。档案中正式科学事实需官方/原论文核对，小说前提明确标记。不能冒充角色已知的未来论文。

## 语气与人称

第二人称沈岑主视角；切换顾屿等视角要在场景 pov 明示，否则只能通过证词呈现。人各有私心，也会失言、回避、后悔。按 v0.2 的熟人语气写长场景，避免每个结尾都落一个道理。科学限制可以通过具体实验说明，不让所有人轮流背方法论。年代是1997，不使用当代网络腔。

## 固定物理与人数

仅经典数据逆传，单通道净载荷<=128字节，两通道，同通道稳定发送间隔>=704秒，接收比发送早704秒。声音取自本地素材；32×32一位位图恰好128字节，不能额外夹带姓名音频。校验不保证命令真实。接力不能越过1997本次启动边界，1985装置已停机。已收到的可靠原始字节必须在所有可达结局中有后续发送；不能靠悖论爆炸收尾。

人员：43名高三一班+58名演出学生+12临时技术人员+16教职工+8家属=137；系统只计101学生+16教职工=117，遗漏20。人物未归与未知不等于死亡。

第1章接收点名20:28:16，对应20:40:00汇总发送；现场点名20:39:40完成后才汇总，因果一致。纸条20:40:16接收，对应20:52:00位置登记。第1章末新纸20:47属于第二通道；第2章可确认为维护图像回执，关联20:58:44北楼门口维修工，不凭低清图认脸。第3章10月21日上午、第4章10月21日夜：20:54:16接收21:06:00女工跌倒记录。

总纲第10章“星期天”与旧分部日期有冲突：保留章名，明确10月26日星期日。第9章10月24日；第10章26日上午；第11章26日下午；第12章26日夜；第13章27日；14至16章27至28日；17至20章29至30日；21至24章30至31日；25至28章11月1日；29至36章11月2日及尾声。需要其他调整先报 root。

## 跨组旗标与结局

避免用抽象分数替代事实。选项 set 可自定义局部 chNN_* 键。跨组固定键：

- original_custody: self/shared/teacher（第1章）
- independent_clock: true/false（第5章）；blind_trials: true（第6章已核实后）；audio_index: true（第8章）。
- xu_confession: honest/hidden（第3章，可在后续坦白修复）；sister_index_shared: true/false（第8章，19章必须回收）。
- director_access: copies/originals/refused（第13章）。gu_repair: keys/copies/none（第14/27章，可修复）。
- origins_verified: true（第20章完成）；evidence_outside: true/false（第26/28章）。
- roster_workers: true/false，roster_families: true/false（第25/29章）；群组覆盖必须对应已实际核对的人，不虚报已救出。
- external_contact: both/radio/teacher/none（第26章）；work_delegated: true/false（第25/31章）。
- departure: leave/stay（第28章；leave进入E，后面不得假装仍在现场）。
- ground_response: true/false（第31/33章按现场危险处理还是只等机器）。
- device_policy: shutdown/watch/obey（第35章）；obligations_sent: true（兑现账本后，所有非提前终局必须通过）。

root 将校验每种结局可达和条件可解释。结局A需要已兑现发送、两组20人覆盖、可靠外部联系、有效分工和现场救援、证据外送、停止试点。拒绝继续但准备不足进入C；继续守机进入D；顺从顾维安系统进入B；漏人又拖延现场救援导致F；离镇进入E。重大选择前明确提示实际欠缺，不把某一件隐藏物品作为死亡开关。允许合理的合作替代，局部关系不必刷满。

## 验收

交付自己负责的真实 JSON 与统计。status先写draft，经 root 复读和数据测试后再改为reviewed。图片仅写分镜需求，不把未生成画面记作完成。文字不足继续撰写，不以计划代替成品。不要编辑根目录发布脚本、他人章节或已交付demo。
