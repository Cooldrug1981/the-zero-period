# 第零节晚自习

开发预览版 0.3.0-alpha.1，制作中。作者：大阴希声@UglyNakedGuy。

[网页预览](https://cooldrug1981.github.io/the-zero-period/)

这是一部发生在虚构的 1997 年鹭原厂办中学的原创科幻悬疑图文小说。目录会标出尚未完成的章节，阅读到当前制作边界时会明确提示。现有内容仍是草稿，不能作为全集正式版。

本次预览构建的制作审计记录了 32/36 章、4/12 条支线和 6 份结局草稿。独立叙事汉字为 291,827/320,000；批准画面为 24/1,280，验收母图为 6/360。42 个内容文件尚待编辑审查。`node scripts/audit.mjs` 可重新生成本地审计报告。章节 33–36 和其后的结局目前无法从主线读到。

网页由 `node scripts/build.mjs` 生成到 `web/`，GitHub Pages 部署该目录。当前工作仅涉及 HTML 网页；Windows EXE、ZIP 与 Electron 打包测试暂停，现有本地文件保留且不会上传到普通仓库。构建与单元测试需要 Node.js；网页浏览器验收另需 Playwright Core 与本机 Chrome。

旧的第一章试玩版保留在独立目录，未纳入本仓库。创作与科学边界规则见 `docs/authoring-contract.md`。
