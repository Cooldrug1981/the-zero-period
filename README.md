# 第零节晚自习

开发预览版 0.3.0-alpha.1，制作中。作者：大阴希声@UglyNakedGuy。

[网页预览](https://cooldrug1981.github.io/the-zero-period/) · [Windows 预发布下载](https://github.com/Cooldrug1981/the-zero-period/releases/tag/v0.3.0-alpha.1)

这是一部发生在虚构的 1997 年鹭原厂办中学的原创科幻悬疑图文小说。目录会标出尚未完成的章节，阅读到当前制作边界时会明确提示。现有内容仍是草稿，不能作为全集正式版。

本次预览构建的制作审计记录了 18/36 章、3/12 条支线和 6 份结局草稿。独立叙事汉字为 182,558/320,000；批准画面为 4/1,280，验收母图为 1/360。27 个内容文件尚待编辑审查。`node scripts/audit.mjs` 可重新生成本地审计报告。

网页由 `node scripts/build.mjs` 生成到 `web/`，GitHub Pages 直接部署该目录。Windows EXE 和 ZIP 仅作为预发布 Release 附件提供，不进入 Git 源码历史。构建与测试需要 Node.js；先运行 `npm install` 安装 `package.json` 声明的开发依赖。若依赖已安装在其他目录，可设置 `ZERO_PERIOD_NODE_MODULES` 指向该目录。

旧的第一章试玩版保留在独立目录，未纳入本仓库。创作与科学边界规则见 `docs/authoring-contract.md`。
