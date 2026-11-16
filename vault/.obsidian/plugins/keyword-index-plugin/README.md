## 0.1.24 · Antinet 抽屉分页

新增只读 getDrawerProjectionGeneration / getDrawerProjectionPage，供 SuperMemo 0.4.3 按需展开使用。保留旧投影接口；冷读分段、同源合并、权重缓存。分页不会写来源、重建EVA目录或改永久身份。

# Keyword Index Plugin

Standalone Obsidian plugin migration of `③关键词索引管理系统.md`.

## Current scope
- Opens a native ItemView.
- Reads legacy `data/keyword_index.json` without rewriting it, with a development fallback to `关键词并行总线改造/keyword_index.json`.
- Renders keyword capsules, nested drawers, and note links.
- Provides a vault scan preview for frontmatter `关键词管理` without saving.
- Supports guarded BUS note creation from YAML drawer scopes: preview, explicit confirmation, then create a new note only.

## Explicitly disabled
- Frontmatter reverse sync.
- Keyword mount writeback.
- Drag reorder persistence.
- Automatic index overwrite after scan.
- Rewriting existing notes during load, scan, render, or BUS creation.
