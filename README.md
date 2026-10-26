# 大千 · 协作实验版

完整 Obsidian 库位于 `vault/`，包括隐藏配置、插件及依赖、插件数据、笔记、附件。使用 Obsidian 打开 `vault/`，不是仓库根目录。

## 恢复和校验

需要 Python 3。建议禁用 Git 自动换行与过滤器后检出：

```powershell
git clone --no-checkout https://github.com/halcyonablid/invisible-myriad.git invisible-myriad
cd invisible-myriad
git config core.autocrlf false
git config core.longpaths true
python -c "from pathlib import Path; Path('.git/info/attributes').write_text('* -text -filter -ident -working-tree-encoding\n')"
git checkout main
python restore_vault.py verify
python restore_vault.py restore ../大千-恢复副本
```

恢复目录必须不存在；恢复工具验证全部文件 SHA-256，重建清单中的空目录。本仓库保存文件内容，不包含 NTFS 权限、时间戳及 Obsidian 应用安装程序。首次打开还原副本前，请检查同步类插件设置以免写入其他库。

本次为用户明确授权的公开整库备份。常见令牌、非空 JSON 凭据字段和敏感文件名扫描无命中；扫描不能保证发现所有类型的隐私信息。原库没有被修改。
