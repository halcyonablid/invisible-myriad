// ============================================================
// 🔗 新版背后连接线程序 (融合增强版 v2.0)
// 功能：Templater触发，悬浮窗口显示当前打开文件的引用关系图
// 特性：
//   - 完整数据源（EVA_Notes.json + EVA_Links.json）
//   - 所属图配色分组
//   - Pan & Zoom 平移缩放
//   - DOM 后处理点击（避免 Mermaid click 语法报错）
// ============================================================

module.exports = async function runReferenceGraphWidgetEngine(context = {}) {
    const app = context.app;
    const collective = context.collective;
    const session = context.session;
    const startedAt = Date.now();
    let buildHealthy = true, backgroundBuild = false;
    const timing = (phase, extra={}) => console.info('[ReferenceGraphWidget][timing]', {phase,elapsedMs:Date.now()-startedAt,...extra});
    const Notice = context.Notice;
    const activeFileFromContext = context.activeFile;
    const pluginSettings = context.settings || {};
    const document = context.document || globalThis.document;
    const window = context.window || globalThis.window;
    if (!app || !Notice || !document || !window) {
        throw new Error('Reference graph engine requires app, Notice, document, and window in context');
    }
// --- 0. Toggle 机制 ---
    const WIDGET_ID = "reference-graph-widget";
    const existing = document.getElementById(WIDGET_ID);
    if (existing) {
        const runtime = window.__referenceGraphWidgetRuntime;
        if (runtime && typeof runtime.close === "function") runtime.close();
        else {
            existing.remove();
            if (window.__referenceGraphWidgetRuntime) delete window.__referenceGraphWidgetRuntime;
        }
        return;
    }
// --- 1. 配置 ---
    const CONFIG = {
        maxDepth: 7,           // 最大展开层数
        layout: "LR",          // 图布局方向: LR(左到右), TB(上到下), RL, BT
        groupByLevel: true,    // 是否按 ATOM 编号脉络子图分组
        showStats: true,       // 是否显示统计信息
        nodeMaxLength: 1000,   // 节点名称最大长度（几乎不限制）
        cacheEnabled: true     // 是否启用缓存
    };
    Object.assign(CONFIG, {
        maxDepth: Number.isFinite(Number(pluginSettings.maxDepth)) ? Number(pluginSettings.maxDepth) : CONFIG.maxDepth,
        layout: String(pluginSettings.layout || CONFIG.layout),
        groupByLevel: pluginSettings.groupByLevel !== false,
        showStats: pluginSettings.showStats !== false,
        nodeMaxLength: Number.isFinite(Number(pluginSettings.nodeMaxLength)) ? Number(pluginSettings.nodeMaxLength) : CONFIG.nodeMaxLength,
    });

    // --- 2. JSON文件名配置 ---
    const JSON_CONFIG = {
        NOTES_JSON: String(pluginSettings.notesJsonName || 'EVA_Notes.json'),
        LINKS_JSON: String(pluginSettings.linksJsonName || 'EVA_Links.json')
    };

    // --- 3. 加载EVA JSON数据（自动全库搜索JSON文件） ---
    function resolveVaultFileByLinkpath(linkpath, sourcePath = "") {
        const raw = String(linkpath || "").trim();
        if (!raw) return null;
        const direct = app.vault.getAbstractFileByPath(raw);
        if (direct) return direct;
        return app.metadataCache.getFirstLinkpathDest(raw.replace(/\.(md|json|excalidraw)$/i, ""), sourcePath)
            || app.metadataCache.getFirstLinkpathDest(raw, sourcePath)
            || null;
    }

    async function loadEvaJson() {
        let sourcesPresent=false;
        try {
            const notesFile = resolveVaultFileByLinkpath(JSON_CONFIG.NOTES_JSON);
            if (!notesFile) {
                throw new Error(`全库未找到 ${JSON_CONFIG.NOTES_JSON}，请先运行 EVA JSON Builder`);
            }

            const linksFile = resolveVaultFileByLinkpath(JSON_CONFIG.LINKS_JSON);
            if (!linksFile) {
                throw new Error(`全库未找到 ${JSON_CONFIG.LINKS_JSON}，请先运行 EVA JSON Builder`);
            }

            sourcesPresent=true;
            const readJson = file => session ? session.parsed(file, 'json', JSON.parse, context.forceRefresh) : app.vault.read(file).then(JSON.parse);
            const [notes, links] = await Promise.all([readJson(notesFile), readJson(linksFile)]);
            return {notes, links};
        } catch (err) {
            if(sourcesPresent)buildHealthy=false;
            if (!backgroundBuild) new Notice(`❌ 无法加载EVA JSON文件: ${err.message}`, 5000);
            throw new Error(`JSON加载失败: ${err.message}`);
        }
    }

    // --- 4. 从JSON获取节点信息 ---
    function getNodeInfoFromJson(nodeId, notesJson) {
        const note = notesJson.notes[nodeId];
        if (note) {
            return {
                id: note.id,
                name: note.title,
                suoshutu: note.yaml?.上级条目 || note.yaml?.parent_atom || "",
                filePath: note.file_path
            };
        }
        return {
            id: nodeId,
            name: nodeId,
            suoshutu: "",
            filePath: ""
        };
    }

    // --- 5. 安全化ID（增强版，支持更多特殊字符） ---
    function safeId(id) {
        // 替换所有非字母数字字符为下划线，并确保以字母开头
        let safe = id.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
        // 如果以数字开头，添加前缀
        if (/^[0-9]/.test(safe)) {
            safe = 'n_' + safe;
        }
        return safe;
    }

    // --- 6. 文件类型过滤（只允许 .md 和 .excalidraw） ---
    function isAllowedFileType(fileNameOrPath) {
        if (!fileNameOrPath) return false;
        const lower = fileNameOrPath.toLowerCase();
        // 允许 .md 文件和 .excalidraw 文件（包括 .excalidraw.md）
        return lower.endsWith('.md') || lower.endsWith('.excalidraw');
    }

    function getEvaRelationsApi() {
        const api = window.evaCrossViewRelations;
        return api && typeof api === "object" ? api : null;
    }

    function parseAtomInfoFromName(name) {
        const raw = String(name || "").replace(/\.(md|excalidraw)$/i, "");
        const match = raw.match(/^ATOM@(.+?)-\s*(.*)$/i);
        if (!match) return null;
        const code = String(match[1] || "").trim();
        if (!code) return null;
        return {
            code,
            title: String(match[2] || raw).trim() || raw,
            depth: code.split(".").filter(Boolean).length,
        };
    }

    function parentCodeOf(code) {
        const parts = String(code || "").split(".").filter(Boolean);
        if (parts.length <= 1) return "";
        return parts.slice(0, -1).join(".");
    }

    function sortCodeKey(code) {
        return String(code || "").split(/(\d+)/).map(part => (/^\d+$/.test(part) ? Number(part) : part));
    }

    function compareAtomCodes(a, b) {
        const left = sortCodeKey(a);
        const right = sortCodeKey(b);
        const length = Math.max(left.length, right.length);
        for (let index = 0; index < length; index += 1) {
            if (left[index] == null) return -1;
            if (right[index] == null) return 1;
            if (left[index] === right[index]) continue;
            return left[index] < right[index] ? -1 : 1;
        }
        return 0;
    }

    function compareGraphNodes(left, right) {
        if (left.atomCode && right.atomCode) {
            const byCode = compareAtomCodes(left.atomCode, right.atomCode);
            if (byCode !== 0) return byCode;
        }
        if (left.atomCode && !right.atomCode) return -1;
        if (!left.atomCode && right.atomCode) return 1;
        return String(left.name || left.id).localeCompare(String(right.name || right.id), "zh-Hans-CN");
    }

    function getBasenameFromPath(path) {
        return String(path || "").split(/[\\/]/).pop()?.replace(/\.(md|excalidraw)$/i, "") || "";
    }

    function resolveAtomInfoForNode(node) {
        return parseAtomInfoFromName(node?.id)
            || parseAtomInfoFromName(node?.name)
            || parseAtomInfoFromName(getBasenameFromPath(node?.filePath));
    }

    function normalizeGraphByAtomAddress(graph, targetNodeId) {
        const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
        const referenceEdges = [];
        const evaEdges = [];
        for (const edge of Array.isArray(graph?.edges) ? graph.edges : []) {
            if (edge?.type === "eva-relation") evaEdges.push(edge);
            else referenceEdges.push({ ...edge, type: "reference" });
        }

        for (const node of nodes) {
            const atom = resolveAtomInfoForNode(node);
            node.atomCode = atom?.code || "";
            node.atomDepth = atom?.depth || 0;
            node.level = atom?.depth ? atom.depth - 1 : 0;
            node.isTarget = node.id === targetNodeId;
        }

        nodes.sort(compareGraphNodes);
        const atomNodeByCode = new Map();
        for (const node of nodes) {
            if (node.atomCode && !atomNodeByCode.has(node.atomCode)) atomNodeByCode.set(node.atomCode, node);
        }

        const treeEdges = [];
        const treeEdgeKeys = new Set();
        for (const node of nodes) {
            if (!node.atomCode) continue;
            let cursor = parentCodeOf(node.atomCode);
            while (cursor) {
                const parent = atomNodeByCode.get(cursor);
                if (parent) {
                    const key = `${parent.id}|${node.id}|address-tree`;
                    if (!treeEdgeKeys.has(key)) {
                        treeEdgeKeys.add(key);
                        treeEdges.push({ from: parent.id, to: node.id, type: "address-tree" });
                    }
                    break;
                }
                cursor = parentCodeOf(cursor);
            }
        }

        const orderById = new Map(nodes.map((node, index) => [node.id, index]));
        const compareEdges = (left, right) => {
            const leftFrom = orderById.get(left.from) ?? Number.MAX_SAFE_INTEGER;
            const rightFrom = orderById.get(right.from) ?? Number.MAX_SAFE_INTEGER;
            if (leftFrom !== rightFrom) return leftFrom - rightFrom;
            const leftTo = orderById.get(left.to) ?? Number.MAX_SAFE_INTEGER;
            const rightTo = orderById.get(right.to) ?? Number.MAX_SAFE_INTEGER;
            if (leftTo !== rightTo) return leftTo - rightTo;
            return String(left.type || "").localeCompare(String(right.type || ""));
        };
        referenceEdges.sort(compareEdges);
        evaEdges.sort(compareEdges);

        graph.edges = [...treeEdges, ...referenceEdges, ...evaEdges];
        graph.stats.maxLevel = nodes.reduce((max, node) => Math.max(max, Number(node.level) || 0), 0);
        graph.stats.totalNodes = nodes.length;
        graph.stats.totalEdges = graph.edges.length;
        graph.stats.addressTreeEdges = treeEdges.length;
        graph.stats.referenceEdges = referenceEdges.length;
        return graph;
    }

    function buildAtomLineageForest(nodes) {
        const codeToNodes = new Map();
        const looseNodes = [];
        const nonAtomNodes = [];

        for (const node of nodes) {
            if (!node.atomCode) {
                nonAtomNodes.push(node);
                looseNodes.push(node);
                continue;
            }
            if (!codeToNodes.has(node.atomCode)) codeToNodes.set(node.atomCode, []);
            codeToNodes.get(node.atomCode).push(node);
        }

        if (nonAtomNodes.length) {
            console.warn("[ReferenceGraphWidget][lineage-non-atom-loose-nodes]", {
                count: nonAtomNodes.length,
                nodes: nonAtomNodes.map(node => node.id)
            });
        }

        const entryByCode = new Map();
        for (const [code, codeNodes] of codeToNodes.entries()) {
            if (codeNodes.length !== 1) {
                console.warn("[ReferenceGraphWidget][lineage-duplicate-atom-code]", {
                    code,
                    nodes: codeNodes.map(node => node.id)
                });
                looseNodes.push(...codeNodes);
                continue;
            }
            entryByCode.set(code, { code, node: codeNodes[0], children: [] });
        }

        const roots = [];
        for (const entry of entryByCode.values()) {
            let cursor = parentCodeOf(entry.code);
            let parentEntry = null;
            while (cursor) {
                parentEntry = entryByCode.get(cursor);
                if (parentEntry) break;
                cursor = parentCodeOf(cursor);
            }
            if (parentEntry) parentEntry.children.push(entry);
            else roots.push(entry);
        }

        const sortEntries = entries => {
            entries.sort((left, right) => compareGraphNodes(left.node, right.node));
            for (const entry of entries) sortEntries(entry.children);
        };
        sortEntries(roots);
        looseNodes.sort(compareGraphNodes);

        return { roots, looseNodes };
    }

    function getMetaFieldValue(record, key) {
        const target = String(key || "").trim().toLowerCase();
        const fields = Array.isArray(record?.metaFields) ? record.metaFields : [];
        const found = fields.find(field => String(field?.key || field?.label || field?.name || "").trim().toLowerCase() === target);
        return String(found?.value || "").trim();
    }

    function getRecordFilePath(record) {
        return getMetaFieldValue(record, "path") || String(record?.pathLabel || "").trim();
    }

    function buildActiveEvaNoteNodeKey(activeFile) {
        const api = getEvaRelationsApi();
        if (!api || typeof api.buildJumpNodeKey !== "function" || !activeFile?.stat?.ctime) return "";
        return api.buildJumpNodeKey({
            viewType: "eva-note",
            notePath: "__vault_atom_notes__",
            scopeType: "note",
            scopeId: `ctime:${activeFile.stat.ctime}`,
            itemId: "file"
        });
    }

    function getValidatedActiveEvaNote(activeFile) {
        const api = getEvaRelationsApi();
        const nodeKey = buildActiveEvaNoteNodeKey(activeFile);
        if (!api || !nodeKey || typeof api.getNodeRecord !== "function") return null;
        const record = api.getNodeRecord(nodeKey);
        if (!record) return null;
        const recordPath = getRecordFilePath(record);
        const recordCtime = Number(getMetaFieldValue(record, "ctime"));
        const activeCtime = Number(activeFile?.stat?.ctime);
        if (!recordPath || !Number.isFinite(recordCtime) || !Number.isFinite(activeCtime)) return null;
        if (recordPath !== activeFile.path) return null;
        if (recordCtime !== activeCtime) return null;
        return { nodeKey, record };
    }

    function normalizeEvaDisplayLabel(value, fallback = "") {
        const normalized = String(value == null ? "" : value).trim();
        if (!normalized) return String(fallback || "");
        if (/^Unsupported markdown:/i.test(normalized)) return String(fallback || "");
        return normalized;
    }

    function createEvaNodeFromRecord(nodeKey, record, level) {
        const filePath = getRecordFilePath(record);
        const file = filePath ? app.vault.getAbstractFileByPath(filePath) : null;
        const fallbackLabel = file?.basename || String(filePath || nodeKey || "");
        const label = normalizeEvaDisplayLabel(record?.label, fallbackLabel) || fallbackLabel || nodeKey;
        return {
            id: nodeKey,
            name: label,
            suoshutu: String(record?.viewLabel || record?.viewType || "EVA"),
            filePath: file && isAllowedFileType(file.path) ? file.path : filePath,
            nodeKey,
            level,
            isTarget: false,
            isEvaRelationNode: true
        };
    }

    function mergeGraphNode(graph, nodeMap, node) {
        if (!node?.id) return null;
        const existing = nodeMap.get(node.id);
        if (existing) {
            if (node.nodeKey && !existing.nodeKey) existing.nodeKey = node.nodeKey;
            if (node.filePath && !existing.filePath) existing.filePath = node.filePath;
            if (node.isEvaRelationNode) existing.isEvaRelationNode = true;
            return existing;
        }
        nodeMap.set(node.id, node);
        graph.nodes.push(node);
        return node;
    }

    async function addEvaRelationLayer(graph, nodeMap, targetNodeId, targetFile) {
        const api = getEvaRelationsApi();
        if (!api || typeof api.getNodeRelationSnapshot !== "function") return { addedNodes: 0, addedEdges: 0, reason: "api-unavailable" };
        const activeEvaNote = getValidatedActiveEvaNote(targetFile);
        if (!activeEvaNote?.nodeKey) {
            if (typeof api.refreshAdapter === "function") {
                try {
                    await api.refreshAdapter("eva-note::atom-notes");
                } catch (error) {
                    console.warn("[ReferenceGraphWidget][eva-relation-refresh-failed]", error);
                }
            }
        }
        const retryActiveEvaNote = activeEvaNote?.nodeKey ? activeEvaNote : getValidatedActiveEvaNote(targetFile);
        if (!retryActiveEvaNote?.nodeKey) return { addedNodes: 0, addedEdges: 0, reason: "active-note-not-indexed" };
        const targetNode = nodeMap.get(targetNodeId);
        if (targetNode) {
            targetNode.nodeKey = retryActiveEvaNote.nodeKey;
            targetNode.isEvaRelationNode = true;
        }
        const snapshot = api.getNodeRelationSnapshot(retryActiveEvaNote.nodeKey) || {};
        let addedNodes = 0;
        let addedEdges = 0;
        const ensureEndpoint = (nodeKey, record, fallbackLevel) => {
            if (!nodeKey) return null;
            if (nodeKey === retryActiveEvaNote.nodeKey) return targetNodeId;
            const node = createEvaNodeFromRecord(nodeKey, record || api.getNodeRecord?.(nodeKey) || {}, fallbackLevel);
            const before = nodeMap.has(node.id);
            mergeGraphNode(graph, nodeMap, node);
            if (!before) addedNodes += 1;
            return node.id;
        };
        (Array.isArray(snapshot.outgoing) ? snapshot.outgoing : []).forEach((relation) => {
            const toId = ensureEndpoint(relation.targetNodeKey, relation.target, 1);
            if (!toId) return;
            graph.edges.push({
                from: targetNodeId,
                to: toId,
                type: "eva-relation",
                relationType: relation.relationType || relation.type || "关联",
                relationId: relation.id || ""
            });
            addedEdges += 1;
        });
        (Array.isArray(snapshot.incoming) ? snapshot.incoming : []).forEach((relation) => {
            const fromId = ensureEndpoint(relation.sourceNodeKey, relation.source, 1);
            if (!fromId) return;
            graph.edges.push({
                from: fromId,
                to: targetNodeId,
                type: "eva-relation",
                relationType: relation.relationType || relation.type || "关联",
                relationId: relation.id || ""
            });
            addedEdges += 1;
        });
        if (addedNodes > 0 && graph.stats.maxLevel < 1) graph.stats.maxLevel = 1;
        return { addedNodes, addedEdges, reason: "ok" };
    }

    function sanitizeMermaidLabel(value, fallback = "EVA") {
        const normalized = String(value == null ? "" : value)
            .replace(/[\r\n]+/g, " ")
            .replace(/[|<>{}\[\]`"]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        return normalized || fallback;
    }

    // --- 7. 构建引用图（基于EVA JSON + 实时扫描） ---
    async function buildReferenceGraph(targetNodeId, maxDepth, targetFile, activeNodeId = targetNodeId, activeFile = targetFile, canonicalPass = false, sharedBodyLinkCache = null) {
        if (!backgroundBuild) new Notice("⚡️ 加载引用数据...", 2000);

        let evaData = null;
        let notesJson = { notes: {} };
        let linksJson = { adjacency: {} };

        try {
            evaData = await loadEvaJson();
            notesJson = evaData.notes;
            linksJson = evaData.links;
        } catch (e) {
            if (!backgroundBuild) new Notice("⚠️ EVA JSON未找到，将实时扫描链接", 2000);
        }

        const adjacency = linksJson.adjacency || {};
        // 解析正文中的wikilinks，并缓存结果（严格排除yaml frontmatter）
        const bodyLinkCache = sharedBodyLinkCache || new Map();
        const graph = {
            nodes: [],
            edges: [],
            stats: { totalNodes: 0, totalEdges: 0, maxLevel: 0 }
        };
        const visited = new Set();
        const nodeMap = new Map();

        function stripYamlFrontmatter(rawContent) {
            if (!rawContent) return "";

            // 处理可能存在的 BOM
            let content = rawContent.replace(/^\uFEFF/, "");

            // 仅在文件起始处存在 frontmatter 分隔符时尝试剥离
            if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
                return content;
            }

            // 匹配标准 YAML frontmatter（--- ... --- 或 --- ... ...）
            const fmMatch = content.match(/^---\s*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)\s*(?:\r?\n|$)/);
            if (!fmMatch) return content;

            return content.slice(fmMatch[0].length);
        }

        async function getBodyLinks(filePath) {
            if (bodyLinkCache.has(filePath)) {
                return bodyLinkCache.get(filePath);
            }

            const emptyResult = {
                outgoingIds: new Set(),
                outgoingPaths: new Set()
            };

            try {
                const file = app.vault.getAbstractFileByPath(filePath);
                if (!file) {
                    bodyLinkCache.set(filePath, emptyResult);
                    return emptyResult;
                }

                const readBody = () => context.forceRefresh || !app.vault.cachedRead ? app.vault.read(file) : app.vault.cachedRead(file);
                const parsedBody = collective ? (session ? await session.parsed(file, 'body', collective.parseBody, context.forceRefresh) : collective.parseBody(await readBody())) : null;
                const content = parsedBody ? '' : stripYamlFrontmatter(await readBody());

                const outgoingIds = new Set();
                const outgoingPaths = new Set();
                const wikiRegex = /\[\[([^\]]+)\]\]/g;
                let match;

                const parsedTargets = parsedBody ? parsedBody.links.map(link => [null, link.target]) : Array.from(content.matchAll(wikiRegex));
                for (const match of parsedTargets) {
                    let target = match[1].trim();
                    const pipeIdx = target.indexOf('|');
                    if (pipeIdx > -1) target = target.substring(0, pipeIdx).trim();
                    const hashIdx = target.indexOf('#');
                    if (hashIdx > -1) target = target.substring(0, hashIdx).trim();

                    const linkedFile = app.metadataCache.getFirstLinkpathDest(target, filePath);

                    // 过滤：只允许 .md 和 .excalidraw 文件
                    if (linkedFile && !isAllowedFileType(linkedFile.path)) {
                        continue;
                    }

                    if (linkedFile) {
                        outgoingIds.add(linkedFile.basename);
                        outgoingPaths.add(linkedFile.path);
                    } else {
                        outgoingIds.add(target.replace(/\.md$/i, '').replace(/\.excalidraw$/i, ''));
                    }
                }

                const annotations = (parsedBody?.annotations || []).map(a => {
                    const destination = app.metadataCache.getFirstLinkpathDest(a.target, filePath);
                    return { ...a, targetId: destination?.basename || a.target.replace(/\.(md|excalidraw)$/i, ""), targetPath: destination?.path || "" };
                });
                const result = { outgoingIds, outgoingPaths, annotations, warnings: parsedBody?.warnings || [] };
                bodyLinkCache.set(filePath, result);
                return result;
            } catch (e) {
                buildHealthy = false;
                console.error("解析正文链接错误:", e);
                bodyLinkCache.set(filePath, emptyResult);
                return emptyResult;
            }
        }

        // 实时扫描文件链接的辅助函数（只扫描正文，不扫描yaml）
        async function scanFileLinks(filePath) {
            const outgoing = [];
            const incoming = [];

            try {
                const file = app.vault.getAbstractFileByPath(filePath);
                if (!file) return { outgoing, incoming };
                const parsed = await getBodyLinks(filePath);
                parsed.outgoingIds.forEach(id => outgoing.push(id));

                // 查找反向链接（哪些文件链接到当前文件）
                // Incoming links come from Obsidian backlinks; do not walk the whole resolved links table.
                const backlinks = app.metadataCache.getBacklinksForFile?.(file);
                const backlinkEntries = backlinks?.data instanceof Map
                    ? Array.from(backlinks.data.keys())
                    : Object.keys(backlinks?.data || {});
                for (const sourcePath of backlinkEntries) {
                    if (true) {
                        // 过滤：只允许 .md 和 .excalidraw 文件作为来源
                        if (!isAllowedFileType(sourcePath)) {
                            continue;
                        }

                        const sourceFile = app.vault.getAbstractFileByPath(sourcePath);
                        if (sourceFile) {
                            // 二次校验：仅当来源文件正文确实链接到当前文件，才计为入链
                            const sourceParsed = await getBodyLinks(sourcePath);
                            if (sourceParsed.outgoingPaths.has(filePath) || sourceParsed.outgoingIds.has(file.basename)) {
                                incoming.push(sourceFile.basename);
                                // 统一使用文件基础名作为ID（不区分是否带ATOM编号）
                                incoming.push(sourceFile.basename);
                            }
                        }
                    }
                }
            } catch (e) {
                buildHealthy = false;
                console.error("扫描文件链接错误:", e);
            }

            return { outgoing: [...new Set(outgoing)], incoming: [...new Set(incoming)] };
        }

        // BFS遍历
        const queue = [{ id: targetNodeId, level: 0, filePath: targetFile?.path }];
        visited.add(targetNodeId);

        while (queue.length > 0) {
            const { id, level, filePath } = queue.shift();

            if (level > maxDepth) continue;

            // 获取节点信息：优先从JSON，否则从文件系统
            let nodeInfo = getNodeInfoFromJson(id, notesJson);
            let currentFilePath = nodeInfo.filePath || filePath;

            // 如果JSON中没有该节点，尝试从文件系统获取信息
            if (!nodeInfo.filePath && !filePath) {
                // 尝试根据ID找到文件（包括 .md 和 .excalidraw）
                // ID统一是文件基础名，直接匹配即可
                const matchedFile = resolveVaultFileByLinkpath(id, activeFile?.path || targetFile?.path || "");
                if (matchedFile) {
                    currentFilePath = matchedFile.path;
                    nodeInfo = {
                        id: id,
                        name: id,  // 直接使用ID
                        suoshutu: "",
                        filePath: matchedFile.path
                    };
                }
            }

            // 过滤：如果找到的文件不是允许的类型，跳过该节点
            if (currentFilePath && !isAllowedFileType(currentFilePath)) {
                continue;
            }

            const node = {
                id: id,
                name: id,  // 直接使用ID作为名称（包含ATOM编号如有）
                suoshutu: nodeInfo.suoshutu,
                filePath: currentFilePath,
                level: level,
                isTarget: id === activeNodeId
            };

            if (!nodeMap.has(id)) {
                nodeMap.set(id, node);
                graph.nodes.push(node);
            }

            if (level > graph.stats.maxLevel) {
                graph.stats.maxLevel = level;
            }

            // 获取链接：有文件路径时强制实时扫描正文（排除yaml）；仅在无文件路径时回退JSON
            let outgoingIds = [];
            let incomingIds = [];

            if (currentFilePath) {
                const scanned = await scanFileLinks(currentFilePath);
                outgoingIds = scanned.outgoing;
                incomingIds = scanned.incoming;
            } else {
                outgoingIds = adjacency[id]?.outgoing || [];
                incomingIds = adjacency[id]?.incoming || [];
            }

            // 出链
            for (const targetId of outgoingIds) {
                if (!visited.has(targetId) && level < maxDepth) {
                    visited.add(targetId);
                    queue.push({ id: targetId, level: level + 1, filePath: null });
                }
                graph.edges.push({ from: id, to: targetId, type: 'outgoing' });
            }

            // 入链
            for (const sourceId of incomingIds) {
                if (!visited.has(sourceId) && level < maxDepth) {
                    visited.add(sourceId);
                    queue.push({ id: sourceId, level: level + 1, filePath: null });
                }
                graph.edges.push({ from: sourceId, to: id, type: 'incoming' });
            }
        }

        if (!canonicalPass) {
            const canonicalSeed = graph.nodes
                .map(node => ({ node, atom: resolveAtomInfoForNode(node) }))
                .filter(entry => entry.atom?.code)
                .sort((left, right) => {
                    const byCode = compareAtomCodes(left.atom.code, right.atom.code);
                    if (byCode !== 0) return byCode;
                    return compareGraphNodes(left.node, right.node);
                })[0]?.node || null;

            if (canonicalSeed && canonicalSeed.id !== targetNodeId) {
                const canonicalFile = canonicalSeed.filePath ? app.vault.getAbstractFileByPath(canonicalSeed.filePath) : null;
                const canonicalGraph = await buildReferenceGraph(
                    canonicalSeed.id,
                    maxDepth,
                    canonicalFile,
                    activeNodeId,
                    activeFile,
                    true,
                    bodyLinkCache
                );
                if (canonicalGraph.nodes.some(node => node.id === activeNodeId)) {
                    console.info("[ReferenceGraphWidget][canonical-seed]", {
                        targetNodeId: activeNodeId,
                        canonicalSeedId: canonicalSeed.id,
                        mode: "local-neighborhood"
                    });
                    return canonicalGraph;
                }
                console.info("[ReferenceGraphWidget][canonical-seed-fallback]", {
                    targetNodeId: activeNodeId,
                    canonicalSeedId: canonicalSeed.id,
                    reason: "target-not-in-canonical-neighborhood"
                });
            }
        }

        const evaRelationLayer = await addEvaRelationLayer(graph, nodeMap, activeNodeId, activeFile);
        graph.evaRelationLayer = evaRelationLayer;
        console.info("[ReferenceGraphWidget][eva-relation-layer]", {
            targetNodeId: activeNodeId,
            targetPath: activeFile?.path || "",
            reason: evaRelationLayer.reason,
            addedNodes: evaRelationLayer.addedNodes,
            addedEdges: evaRelationLayer.addedEdges
        });

        // 去重边
        const edgeSet = new Set();
        graph.edges = graph.edges.filter(edge => {
            const key = `${edge.from}|${edge.to}|${edge.type || ""}|${edge.relationType || ""}|${edge.relationId || ""}`;
            if (edgeSet.has(key)) return false;
            edgeSet.add(key);
            return true;
        });

        normalizeGraphByAtomAddress(graph, activeNodeId);
        if (collective) {
            const actualPaths = new Map();
            for (const n of graph.nodes) actualPaths.set(n.id, new Set(n.filePath ? [n.filePath] : []));
            for (const cached of bodyLinkCache.values()) for (const path of cached.outgoingPaths || []) {
                const file = app.vault.getAbstractFileByPath(path);
                if (file && actualPaths.has(file.basename)) actualPaths.get(file.basename).add(path);
            }
            for (const cached of bodyLinkCache.values()) for (const a of cached.annotations || []) {
                if (a.targetPath && actualPaths.has(a.targetId)) actualPaths.get(a.targetId).add(a.targetPath);
            }
            const ambiguous = new Set([...actualPaths].filter(([, paths]) => paths.size > 1).map(([id]) => id));
            graph.annotationAmbiguous = ambiguous.size > 0;
            for (const [path, cached] of bodyLinkCache) {
                cached.annotations = (cached.annotations || []).filter(a => !ambiguous.has(a.targetId));
                if (ambiguous.size) cached.warnings = [...(cached.warnings || []), { line: 0, reason: "存在同名不同路径条目，相关说明不自动归属；约束图缓存已停用" }];
            }
            collective.enrich(graph, bodyLinkCache);
        }
        graph.stats.totalNodes = graph.nodes.length;
        graph.stats.totalEdges = graph.edges.length;

        return graph;
    }

    // --- 7. 生成Mermaid代码（不含click语法，后续用DOM绑定） ---
    function generateMermaidCode(graph) {
        let code = `flowchart ${CONFIG.layout}\n`;

        // 样式定义
        code += "  classDef level0 fill:#e3f2fd,stroke:#1976d2\n";
        code += "  classDef level1 fill:#f3e5f5,stroke:#7b1fa2\n";
        code += "  classDef level2 fill:#e8f5e9,stroke:#388e3c\n";
        code += "  classDef level3 fill:#fff3e0,stroke:#f57c00\n";
        code += "  classDef level4 fill:#fce4ec,stroke:#c2185b\n";
        code += "  classDef level5 fill:#e0f2f1,stroke:#00796b\n";
        code += "  classDef evaRelationNode fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,stroke-dasharray:4 3\n";

        // 所属图配色
        const suoshutuColors = [
            "fill:#e1f5fe,stroke:#0288d1",
            "fill:#fce4ec,stroke:#c2185b",
            "fill:#f1f8e9,stroke:#689f38",
            "fill:#fff8e1,stroke:#ffa000",
            "fill:#ede7f6,stroke:#512da8",
            "fill:#e0f2f1,stroke:#00796b",
            "fill:#fff3e0,stroke:#e65100",
            "fill:#f3e5f5,stroke:#6a1b9a"
        ];

        const suoshutuList = [...new Set(graph.nodes.map(n => n.suoshutu).filter(s => s))];
        const suoshutu2Class = {};
        suoshutuList.forEach((s, i) => {
            const className = `suoshutu${i}`;
            code += `  classDef ${className} ${suoshutuColors[i % suoshutuColors.length]}\n`;
            suoshutu2Class[s] = className;
        });

        // 截断名称
        function truncateName(name) {
            if (!name) return "未命名";
            // 统一清洗 Mermaid 不稳定的 markdown/标点语法，避免渲染出 Unsupported markdown 前缀
            let clean = sanitizeMermaidLabel(normalizeEvaDisplayLabel(name, "未命名"), "未命名").replace(/"/g, "'");
            if (clean.length > CONFIG.nodeMaxLength) {
                return clean.substring(0, CONFIG.nodeMaxLength) + "...";
            }
            return clean;
        }

        // 构建 safeId -> filePath 映射（用于后续DOM绑定点击）
        const nodeDataMap = {};
        const emittedNodeIds = new Set();
        const usedSubgraphIds = new Set();
        const indent = depth => "  ".repeat(Math.max(1, depth));
        const emitNode = (node, depth) => {
            if (emittedNodeIds.has(node.id)) return;
            const sid = safeId(node.id);
            emittedNodeIds.add(node.id);
            nodeDataMap[sid] = { filePath: node.filePath, name: node.name, id: node.id, nodeKey: node.nodeKey || "", isTarget: node.isTarget === true, comments: node.comments || [] };
            const displayName = truncateName(node.name);
            code += `${indent(depth)}${sid}("${displayName}")\n`;
        };
        const uniqueSubgraphId = codeValue => {
            const base = safeId(`rg_lineage_cluster_${codeValue || "root"}`);
            let candidate = base;
            let index = 2;
            while (usedSubgraphIds.has(candidate) || graph.nodes.some(node => safeId(node.id) === candidate)) {
                candidate = `${base}_${index}`;
                index += 1;
            }
            usedSubgraphIds.add(candidate);
            return candidate;
        };
        const renderLineageEntry = (entry, depth) => {
            const subgraphId = uniqueSubgraphId(entry.code);
            const label = sanitizeMermaidLabel(`ATOM ${entry.code}`);
            code += `${indent(depth)}subgraph ${subgraphId}["${label}"]\n`;
            emitNode(entry.node, depth + 1);
            for (const child of entry.children) renderLineageEntry(child, depth + 1);
            code += `${indent(depth)}end\n`;
        };

        if (CONFIG.groupByLevel) {
            const lineage = buildAtomLineageForest(graph.nodes);
            for (const root of lineage.roots) renderLineageEntry(root, 1);
            for (const node of lineage.looseNodes) emitNode(node, 1);
        } else {
            for (const node of graph.nodes) emitNode(node, 1);
        }

        for (const edge of graph.edges) {
            const fromSid = safeId(edge.from);
            const toSid = safeId(edge.to);
            const fromExists = graph.nodes.some(n => n.id === edge.from);
            const toExists = graph.nodes.some(n => n.id === edge.to);
            if (fromExists && toExists) {
                if (edge.type === "eva-relation") {
                    const label = sanitizeMermaidLabel(edge.relationType || edge.type || "EVA");
                    code += `  ${fromSid} -. ${label} .-> ${toSid}\n`;
                } else if (edge.type === "address-tree") {
                    continue;
                } else if (edge.type === "reference") {
                    const label = sanitizeMermaidLabel((edge.labels || []).join(" / "), "");
                    code += label ? `  ${fromSid} -. "${label}" .-> ${toSid}\n` : `  ${fromSid} -.-> ${toSid}\n`;
                } else {
                    code += `  ${fromSid} --> ${toSid}\n`;
                }
            }
        }

        // 应用样式
        for (const node of graph.nodes) {
            const sid = safeId(node.id);
            if (node.isEvaRelationNode) {
                code += `  class ${sid} evaRelationNode\n`;
            } else if (node.suoshutu && suoshutu2Class[node.suoshutu]) {
                code += `  class ${sid} ${suoshutu2Class[node.suoshutu]}\n`;
            } else {
                const levelClass = `level${Math.min(node.level, 5)}`;
                code += `  class ${sid} ${levelClass}\n`;
            }
        }

        return { code, nodeDataMap };
    }

    // --- 8. 获取当前打开的文件 ---
    const activeFile = activeFileFromContext || app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("❌ 请先打开一个文件！", 3000);
        return;
    }

    // 提取节点ID：统一使用文件基础名（不带扩展名）作为ID，不区分是否有ATOM编号

    async function openFileInLeaf(filePath) {
        const normalizedPath = String(filePath || '').trim();
        if (!normalizedPath) return false;
        const leaves = app.workspace.getLeavesOfType('markdown');
        const existing = leaves.find((leaf) => leaf?.view?.file?.path === normalizedPath);
        if (existing) {
            app.workspace.revealLeaf(existing);
            return true;
        }
        const targetFile = app.vault.getAbstractFileByPath(normalizedPath);
        if (targetFile) {
            const leaf = app.workspace.getLeaf('tab');
            await leaf.openFile(targetFile, { active: true });
            app.workspace.revealLeaf(leaf);
            return true;
        }
        await app.workspace.openLinkText(normalizedPath, '', false);
        return true;
    }

    function getProjectOverviewPlugin() {
        return app?.plugins?.plugins?.["project-execution-overview"] || null;
    }

    function getEvaJumpViewType(nodeKey) {
        const key = String(nodeKey || "").trim();
        if (!key.startsWith("jump:v1:")) return "";
        const rest = key.slice("jump:v1:".length);
        return decodeURIComponent(rest.split("|")[0] || "").trim();
    }

    function shouldRevealInProjectOverview(nodeKey) {
        const viewType = getEvaJumpViewType(nodeKey);
        return !!viewType && viewType !== "eva-note";
    }

    async function revealNodeInProjectOverviewWorkspace(nodeKey) {
        const normalizedNodeKey = String(nodeKey || "").trim();
        if (!normalizedNodeKey || !shouldRevealInProjectOverview(normalizedNodeKey)) return false;
        const projectPlugin = getProjectOverviewPlugin();
        if (projectPlugin && typeof projectPlugin.revealItemNode === "function") {
            const ok = await projectPlugin.revealItemNode(normalizedNodeKey, {
                groupingMode: "workspace",
                source: "reference-graph-widget",
            });
            if (ok) return true;
        }
        const api = window.__projectExecutionOverviewPluginApi;
        if (api && typeof api.revealItemNode === "function") {
            const ok = await api.revealItemNode(normalizedNodeKey, {
                groupingMode: "workspace",
                source: "reference-graph-widget-api",
            });
            if (ok) return true;
        }
        return false;
    }

    function extractNodeId(file) {
        // 直接返回文件基础名（包含ATOM编号如有）
        return file.basename;
    }

    const targetNodeId = extractNodeId(activeFile);

    // File title is available immediately; do not block snapshot display on EVA JSON reads.
    const targetNodeName = activeFile.basename;
    if(context.isCurrent && !context.isCurrent())return;

    async function openEvaRelationEditorForActive() {
        const api = getEvaRelationsApi();
        if (!api || typeof api.openRelationEditor !== "function") {
            new Notice("⚠️ EVA Cross View Relations 尚未加载，无法打开关联编辑器", 3000);
            return false;
        }
        const activeEvaNote = getValidatedActiveEvaNote(activeFile);
        if (!activeEvaNote?.nodeKey) {
            new Notice("⚠️ 当前 note 尚未进入 EVA note 索引，无法作为关联源", 3500);
            return false;
        }
        try {
            await api.openRelationEditor(activeEvaNote.nodeKey);
            return true;
        } catch (error) {
            console.warn("[ReferenceGraphWidget][eva-relation-editor-failed]", error);
            new Notice(`⚠️ EVA 关联编辑器打开失败：${error?.message || String(error)}`, 4000);
            return false;
        }
    }

    // --- 9. 构建Widget ---
    const widget = document.createElement("div");
    widget.id = WIDGET_ID;
    widget.style.cssText = `
        position: fixed;
        top: 8px;
        right: 8px;
        box-sizing: border-box;
        width: calc(100vw - 16px);
        height: calc(100vh - 16px);
        max-height: calc(100vh - 16px);
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        border-radius: 12px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: var(--font-text);
        animation: fadeIn 0.3s ease;
    `;

    const styleTag = document.createElement("style");
    styleTag.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        #${WIDGET_ID} .ref-header {
            padding: 12px 16px;
            background: var(--background-secondary);
            border-bottom: 1px solid var(--background-modifier-border);
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            flex-shrink: 0;
            z-index: 10;
        }

        #${WIDGET_ID} .ref-header-title {
            font-weight: 600;
            font-size: 14px;
        }

        #${WIDGET_ID} .ref-header-btns {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        #${WIDGET_ID} .ref-btn {
            padding: 4px 10px;
            background: var(--interactive-accent);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        #${WIDGET_ID} .ref-btn:hover {
            filter: brightness(1.1);
        }

        #${WIDGET_ID} .ref-close {
            cursor: pointer;
            padding: 0 8px;
            color: var(--text-muted);
            font-size: 18px;
            font-weight: bold;
        }

        #${WIDGET_ID} .ref-close:hover {
            color: var(--text-error) !important;
        }

        #${WIDGET_ID} .ref-stats {
            padding: 8px 16px;
            background: var(--background-primary-alt);
            border-bottom: 1px solid var(--background-modifier-border);
            font-size: 12px;
            color: var(--text-muted);
            flex-shrink: 0;
        }

        #${WIDGET_ID} .ref-content {
            flex: 1;
            overflow: hidden;
            position: relative;
            background: var(--background-primary);
            cursor: grab;
        }

        #${WIDGET_ID} .ref-content:active {
            cursor: grabbing;
        }

        #${WIDGET_ID} .ref-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-muted);
        }

        #${WIDGET_ID} .mermaid {
            width: 100%;
            height: 100%;
        }

        #${WIDGET_ID} .mermaid svg {
            width: 100%;
            height: 100%;
        }

        #${WIDGET_ID} .zoom-controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 5px;
            z-index: 10;
        }

        #${WIDGET_ID} .zoom-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1px solid var(--background-modifier-border);
            background: var(--background-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            color: var(--text-normal);
        }

        #${WIDGET_ID} .zoom-btn:hover {
            background: var(--background-modifier-hover);
        }

        /* 强制节点可点击样式 */
        #${WIDGET_ID} .node {
            cursor: pointer !important;
        }

        #${WIDGET_ID} .node:hover {
            filter: brightness(0.9);
        }
    `;
    widget.appendChild(styleTag);

    // Header
    const header = document.createElement("div");
    header.className = "ref-header";

    const headerTitle = document.createElement("span");
    headerTitle.className = "ref-header-title";
    headerTitle.textContent = `🔗 引用关系图: ${targetNodeName}`;
    header.appendChild(headerTitle);

    const headerBtns = document.createElement("div");
    headerBtns.className = "ref-header-btns";

    const relationBtn = document.createElement("button");
    relationBtn.className = "ref-btn";
    relationBtn.textContent = "+ EVA关联";
    relationBtn.onclick = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await openEvaRelationEditorForActive();
    };
    headerBtns.appendChild(relationBtn);

    const refreshBtn = document.createElement("button");
    refreshBtn.className = "ref-btn";
    refreshBtn.textContent = "🔄 刷新";
    refreshBtn.onclick = async () => {
        const runtime = window.__referenceGraphWidgetRuntime;
        if (runtime && typeof runtime.refresh === "function") {
            await runtime.refresh();
        } else {
            widget.remove();
        }
    };
    headerBtns.appendChild(refreshBtn);

    const closeBtn = document.createElement("div");
    closeBtn.className = "ref-close";
    closeBtn.innerHTML = "✕";
    closeBtn.onclick = () => {
        const runtime = window.__referenceGraphWidgetRuntime;
        if (runtime && typeof runtime.close === "function") runtime.close();
        else {
            widget.remove();
            if (window.__referenceGraphWidgetRuntime) delete window.__referenceGraphWidgetRuntime;
        }
    };
    headerBtns.appendChild(closeBtn);

    header.appendChild(headerBtns);
    widget.appendChild(header);

    // Stats区域
    const statsDiv = document.createElement("div");
    statsDiv.className = "ref-stats";
    statsDiv.innerHTML = `<span>目标节点: <b>${targetNodeId}</b> | 最大深度: ${CONFIG.maxDepth} | 布局: ${CONFIG.layout} | <i>滚轮缩放 / 拖拽平移 / 点击跳转</i></span>`;
    widget.appendChild(statsDiv);

    // 内容区域
    const contentDiv = document.createElement("div");
    contentDiv.className = "ref-content";
    contentDiv.innerHTML = '<div class="ref-loading">⏳ 正在构建引用关系图...</div>';
    widget.appendChild(contentDiv);

    // 缩放控件
    const zoomControls = document.createElement("div");
    zoomControls.className = "zoom-controls";
    zoomControls.innerHTML = `
        <div class="zoom-btn" id="z-out">−</div>
        <div class="zoom-btn" id="z-reset">R</div>
        <div class="zoom-btn" id="z-in">+</div>
    `;
    widget.appendChild(zoomControls);

    // 窗口拖拽功能
    let isDragging = false, dragX = 0, dragY = 0;
    header.onmousedown = (e) => {
        if (e.target === closeBtn || e.target.closest("button")) return;
        isDragging = true;
        const rect = widget.getBoundingClientRect();
        dragX = e.clientX - rect.left;
        dragY = e.clientY - rect.top;
        widget.style.right = "auto";
        widget.style.left = rect.left + "px";
        widget.style.top = rect.top + "px";
        document.addEventListener('mousemove', onWidgetMove);
        document.addEventListener('mouseup', onWidgetUp);
        e.preventDefault();
    };

    const onWidgetMove = (e) => {
        if (!isDragging) return;
        widget.style.left = (e.clientX - dragX) + "px";
        widget.style.top = (e.clientY - dragY) + "px";
    };

    const onWidgetUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onWidgetMove);
        document.removeEventListener('mouseup', onWidgetUp);
    };

    // 添加到页面
    document.body.appendChild(widget);
    let collectiveView = null;
    let evaRelationRefreshTimer = null;
    let widgetClosed = false;
    let refreshToken = 0;
    let revalidationTimer = null, unsubscribeSession = null, scheduleRevalidate = () => {}, cancelPendingRender = null;
    const freshness = document.createElement('span');freshness.style.cssText='font-size:12px;max-width:220px;white-space:normal';headerBtns.prepend(freshness);
    const teardownRuntime = (permanent = true) => {
        if (permanent) {
            widgetClosed = true;
            refreshToken += 1;
        }
        cancelPendingRender?.();cancelPendingRender=null;
        unsubscribeSession?.();unsubscribeSession=null;
        if(revalidationTimer)window.clearTimeout(revalidationTimer);
        revalidationTimer=null;
        collectiveView?.dispose();
        collectiveView = null;
        if (evaRelationRefreshTimer) {
            window.clearTimeout(evaRelationRefreshTimer);
            evaRelationRefreshTimer = null;
        }
        window.removeEventListener?.("eva-cross-view-relations:changed", handleEvaRelationsChanged);
        try { widget.remove(); } finally {
            if (window.__referenceGraphWidgetRuntime?.widget === widget) delete window.__referenceGraphWidgetRuntime;
        }
    };
    const refreshRuntime = async () => {
        if (widgetClosed) return;
        const currentToken = ++refreshToken;
        teardownRuntime(false);
        if (widgetClosed || currentToken !== refreshToken) return;
        session?.invalidate("refresh");
        await runReferenceGraphWidgetEngine({...context,forceRefresh:true});
    };
    const handleEvaRelationsChanged = () => {
        if (widgetClosed) return;
        if (session) { scheduleRevalidate(); return; }
        if (evaRelationRefreshTimer) window.clearTimeout(evaRelationRefreshTimer);
        evaRelationRefreshTimer = window.setTimeout(() => {
            evaRelationRefreshTimer = null;
            void refreshRuntime();
        }, 280);
    };
    window.addEventListener?.("eva-cross-view-relations:changed", handleEvaRelationsChanged);
    window.__referenceGraphWidgetRuntime = {
        widget,
        close: () => teardownRuntime(true),
        refresh: refreshRuntime
    };

    // --- 10. 异步构建图 ---
    try {
        const querySettings = JSON.stringify([CONFIG,JSON_CONFIG]);
        const signatureOf = value => JSON.stringify([collective?.projection(value,CONFIG.groupByLevel)||value,!!value.annotationAmbiguous]);
        const initialEpoch=session?.epoch;
        const cached=!context.forceRefresh && collective && session?.find(activeFile.path,querySettings);
        let graph=cached?.graph || await buildReferenceGraph(targetNodeId, CONFIG.maxDepth, activeFile);
        if(widgetClosed||!widget.isConnected)return;
        graph.nodes.forEach(n=>n.isTarget=n.id===targetNodeId);
        let graphSignature=signatureOf(graph),snapshotId=cached?.id || (buildHealthy?session?.put(activeFile.path,querySettings,graph,graphSignature,initialEpoch):null);
        let needsValidation=!!session&&(!cached?.fresh||initialEpoch!==session.epoch)&&!!cached;
        if(session&&initialEpoch!==session.epoch)needsValidation=true;
        freshness.textContent=cached?(cached.fresh?'已恢复 · 无变化':'已恢复 · 正在核验'):'';
        timing(cached?'snapshot-ready':'graph-built',{fresh:!!cached?.fresh,reads:session?.counters.reads,parses:session?.counters.parses});
        const updateStats=()=>{statsDiv.innerHTML = `
            <span>目标: <b>${targetNodeId}</b></span> |
            <span>节点: <b>${graph.stats.totalNodes}</b></span> |
            <span>边: <b>${graph.stats.totalEdges}</b></span> |
            <span>EVA关系: <b>${graph.evaRelationLayer?.addedEdges || 0}</b></span> |
            <span>层数: <b>${graph.stats.maxLevel + 1}</b></span> |
            <i style="color:var(--text-faint)">滚轮缩放 / 拖拽平移 / 点击跳转</i>
        `;};updateStats();

        if (graph.nodes.length === 0) {
            contentDiv.innerHTML = '<div class="ref-loading">⚠️ 未找到相关引用关系（孤岛节点）</div>';
            return;
        }

        if (widgetClosed || !widget.isConnected) return;
        const renderOriginal = async (contentDiv) => {
        // 生成Mermaid代码
        const { code, nodeDataMap } = generateMermaidCode(graph);

        // 清空加载提示
        contentDiv.innerHTML = '';

        // 渲染Mermaid
        const mermaidDiv = document.createElement("div");
        mermaidDiv.className = "mermaid";
        mermaidDiv.textContent = code;
        contentDiv.appendChild(mermaidDiv);

        // 兼容多版本 Mermaid API
        const mermaidAPI = window.mermaid;
        if (mermaidAPI) {
            try {
                // Mermaid v10+ 使用 run() 方法
                if (typeof mermaidAPI.run === 'function') {
                    await mermaidAPI.run({ nodes: [mermaidDiv] });
                }
                // Mermaid v9.x 及更早版本使用 init()
                else if (typeof mermaidAPI.init === 'function') {
                    await mermaidAPI.init(undefined, mermaidDiv);
                }
                // 备用：尝试 render() 方法
                else if (typeof mermaidAPI.render === 'function') {
                    const uniqueId = 'mermaid-' + Date.now();
                    const { svg } = await mermaidAPI.render(uniqueId, code);
                    mermaidDiv.innerHTML = svg;
                }
            } catch (mermaidErr) {
                if (widgetClosed || !widget.isConnected) return;
                console.error("Mermaid 渲染错误:", mermaidErr);
                // 如果渲染失败，尝试重新初始化
                try {
                    mermaidAPI.initialize({ startOnLoad: false, securityLevel: 'loose' });
                    if (typeof mermaidAPI.run === 'function') {
                        await mermaidAPI.run({ nodes: [mermaidDiv] });
                    } else if (typeof mermaidAPI.init === 'function') {
                        await mermaidAPI.init(undefined, mermaidDiv);
                    }
                } catch (retryErr) {
                    if (widgetClosed || !widget.isConnected) return;
                    console.error("Mermaid 重试失败:", retryErr);
                    throw retryErr;
                }
            }

            // 等待一小段时间确保渲染完成
            if (!mermaidDiv.querySelector("svg")) await new Promise(resolve => setTimeout(resolve, 100));
            if (widgetClosed || !widget.isConnected) return;

            const svg = mermaidDiv.querySelector("svg");
            if (!svg) {
                // SVG未生成，显示诊断信息
                console.warn("Mermaid 调用成功但未生成 SVG");
                new Notice("⚠️ Mermaid 渲染异常，未生成图形", 3000);
                mermaidDiv.innerHTML = `
                    <div style="padding:10px;background:rgba(255,100,0,0.1);border-radius:4px;margin-bottom:10px;">
                        <p style="margin:0;color:var(--text-error);">⚠️ Mermaid 渲染异常</p>
                        <p style="margin:5px 0 0;font-size:11px;color:var(--text-muted);">Mermaid API 已调用但未生成 SVG。可能是语法错误或版本不兼容。</p>
                    </div>
                    <pre style="font-size:11px;overflow:auto;padding:10px;background:var(--background-secondary);border-radius:4px;max-height:400px;">${code}</pre>
                `;
                return;
            }

            // SVG 渲染成功，设置样式
            svg.style.width = "100%";
            svg.style.height = "100%";
            svg.removeAttribute("maxWidth");

            // --- Pan & Zoom 实现 ---
            let scale = 1, pX = 0, pY = 0;
            const g = svg.querySelector("g");

            const updateTransform = () => {
                if (!g) return;
                g.style.transform = `translate(${pX}px, ${pY}px) scale(${scale})`;
                g.style.transformOrigin = "0 0";
                g.style.transition = "transform 0.1s ease-out";
            };

            // 滚轮缩放
            contentDiv.onwheel = (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                scale *= delta;
                scale = Math.min(Math.max(0.1, scale), 10);
                updateTransform();
            };

            // 拖拽平移
            let isPan = false, startX = 0, startY = 0;
            contentDiv.onmousedown = (e) => {
                if (e.button !== 0) return;
                isPan = true;
                startX = e.clientX - pX;
                startY = e.clientY - pY;
                contentDiv.style.cursor = "grabbing";
            };
            contentDiv.onmousemove = (e) => {
                if (!isPan) return;
                pX = e.clientX - startX;
                pY = e.clientY - startY;
                if (g) {
                    g.style.transition = "none";
                    g.style.transform = `translate(${pX}px, ${pY}px) scale(${scale})`;
                }
            };
            contentDiv.onmouseup = () => { isPan = false; contentDiv.style.cursor = "grab"; };
            contentDiv.onmouseleave = () => { isPan = false; };

            // 缩放按钮
            widget.querySelector("#z-in").onclick = () => { scale *= 1.2; updateTransform(); };
            widget.querySelector("#z-out").onclick = () => { scale /= 1.2; updateTransform(); };
            widget.querySelector("#z-reset").onclick = () => { scale = 1; pX = 0; pY = 0; updateTransform(); };

            // --- DOM 后处理：绑定节点点击事件 ---
            const nodes = svg.querySelectorAll(".node");
            nodes.forEach(node => {
                // Mermaid 生成的节点 id 格式如 "flowchart-ATOM_121_001-123"
                // 我们需要从中匹配出 safeId
                const nodeId = node.id;

                // 遍历 nodeDataMap 找匹配的 safeId
                let matchedData = null;
                for (const [sid, data] of Object.entries(nodeDataMap)) {
                    // 检查节点id是否包含我们的safeId
                    if (nodeId.includes(sid + "-") || nodeId.includes("-" + sid + "-") || nodeId.endsWith("-" + sid)) {
                        matchedData = data;
                        break;
                    }
                    // 更宽松的匹配：检查是否包含safeId
                    if (nodeId.includes(sid)) {
                        matchedData = data;
                        break;
                    }
                }

                if (matchedData && (matchedData.nodeKey || matchedData.filePath)) {
                    node.style.cursor = "pointer";
                    if (matchedData.isTarget) {
                        node.classList.add("reference-graph-current-node");
                        const shape = node.querySelector("rect, polygon, path, circle, ellipse");
                        if (shape) {
                            shape.style.fill = "#ffeb3b";
                            shape.style.stroke = "#f57f17";
                            shape.style.strokeWidth = "3px";
                        }
                    }

                    node.onclick = async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (matchedData.nodeKey) {
                            const projectOk = await revealNodeInProjectOverviewWorkspace(matchedData.nodeKey);
                            if (projectOk) {
                                new Notice(`📌 项目执行定位: ${matchedData.name}`, 2000);
                                return;
                            }
                            const api = getEvaRelationsApi();
                            if (api && typeof api.openNode === "function") {
                                const ok = await api.openNode(matchedData.nodeKey);
                                if (ok) {
                                    new Notice(`🔗 跳转: ${matchedData.name}`, 2000);
                                    return;
                                }
                            }
                        }
                        if (matchedData.filePath) await openFileInLeaf(matchedData.filePath);
                        new Notice(`📄 打开: ${matchedData.name}`, 2000);
                    };

                    // 添加悬停提示
                    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
                    title.textContent = `点击打开: ${matchedData.name}\n${matchedData.filePath || matchedData.nodeKey}\n${matchedData.comments.map(c => '自指：' + c.text).join('\n')}`;
                    node.appendChild(title);
                }
            });
        } else {
            // 降级：显示代码 + 诊断信息
            console.warn("Mermaid 不可用，显示原始代码");
            new Notice("⚠️ Mermaid 渲染库未加载，显示原始代码", 3000);
            mermaidDiv.innerHTML = `
                <div style="padding:10px;background:rgba(255,200,0,0.1);border-radius:4px;margin-bottom:10px;">
                    <p style="margin:0;color:var(--text-warning);">⚠️ Mermaid 渲染库未加载</p>
                    <p style="margin:5px 0 0;font-size:11px;color:var(--text-muted);">请确保 Obsidian 已启用 Mermaid 支持，或安装相关插件</p>
                </div>
                <pre style="font-size:12px;overflow:auto;padding:10px;background:var(--background-secondary);border-radius:4px;">${code}</pre>
            `;
        }

        };

        if (collective && !widgetClosed && widget.isConnected) {
            contentDiv.replaceChildren();
            contentDiv.style.position = "relative";
            const legacyHost = document.createElement("div");
            legacyHost.style.cssText = "width:100%;height:100%;position:absolute;inset:0;display:none;overflow:auto;";
            contentDiv.appendChild(legacyHost);
            const gridHost = document.createElement("div");
            gridHost.style.cssText = "width:100%;height:100%;min-height:350px;position:absolute;inset:0;";
            contentDiv.appendChild(gridHost);
            const modeBtn = document.createElement("button"); modeBtn.className = "ref-btn"; headerBtns.insertBefore(modeBtn, closeBtn);
            let grid = true, legacyReady = false, originalHandlers = null;
            const openNode = async data => {
                if(data.filePath&&snapshotId)session?.hint(data.filePath,snapshotId);
                if (data.nodeKey) {
                    if (await revealNodeInProjectOverviewWorkspace(data.nodeKey)) return;
                    if (await getEvaRelationsApi()?.openNode?.(data.nodeKey)) return;
                }
                if (data.filePath) await openFileInLeaf(data.filePath);
            };
            const controls = { in: widget.querySelector("#z-in"), out: widget.querySelector("#z-out"), reset: widget.querySelector("#z-reset") };
            let restoreCamera=null;
            const show = async () => {
                if (widgetClosed || !widget.isConnected) return;
                modeBtn.disabled = true;
                modeBtn.textContent = grid ? "原引用图" : "集合关系图";
                legacyHost.style.display = grid ? "none" : "block";
                gridHost.style.display = grid ? "block" : "none";
                Object.values(controls).forEach(button => button.onclick = null);
                try {
                    if (grid) {
                        if (!collectiveView) {
                            if (graph.annotationAmbiguous) gridHost.textContent = "同名条目路径存在歧义，请使用原引用图。";
                            else collectiveView = collective.mount({ document, container: gridHost, graph, plugin: context.plugin, activeId: targetNodeId, groupByLevel: CONFIG.groupByLevel, openNode, controls, camera:restoreCamera, onReady:info=>{timing('diagram-ready',info);if(needsValidation){needsValidation=false;scheduleRevalidate();}} });
                        }
                    } else {
                        restoreCamera=collectiveView?.getCamera?.()||restoreCamera;
                        collectiveView?.dispose(); collectiveView = null;
                        if (!legacyReady) {
                            await renderOriginal(legacyHost);
                            if (widgetClosed || !widget.isConnected) return;
                            originalHandlers = Object.fromEntries(Object.entries(controls).map(([key, button]) => [key, button.onclick]));
                            legacyReady = true;
                        } else Object.keys(controls).forEach(k => controls[k].onclick = originalHandlers[k]);
                    }
                } catch (error) {
                    if (!widgetClosed && widget.isConnected) {
                        (grid ? gridHost : legacyHost).textContent = `绘制失败：${error.message}；可切换另一种图。`;
                    }
                } finally { if (!widgetClosed && widget.isConnected) {modeBtn.disabled = false;} }
            };
            const applyGraph=async (next,expectedEpoch)=>{
                if(widgetClosed||!widget.isConnected)return;
                while(modeBtn.disabled&&!widgetClosed)await new Promise(resolve=>window.setTimeout(resolve,40));
                if(widgetClosed||!widget.isConnected)return;
                if(session&&expectedEpoch!==session.epoch)return;
                const nextSignature=signatureOf(next);
                if(nextSignature===graphSignature)return;
                restoreCamera=collectiveView?.getCamera?.()||restoreCamera;
                if(grid&&!next.annotationAmbiguous){
                    // Keep the visible graph and camera until replacement geometry is ready.
                    modeBtn.disabled=true;
                    const nextHost=document.createElement('div');nextHost.style.cssText='position:absolute;inset:0;visibility:hidden;';gridHost.appendChild(nextHost);
                    const oldHandlers=Object.fromEntries(Object.entries(controls).map(([k,b])=>[k,b.onclick]));
                    let nextView;
                    const ready=await new Promise(resolve=>{
                        cancelPendingRender=()=>{nextView?.dispose();nextHost.remove();resolve(false);};
                        nextView=collective.mount({document,container:nextHost,graph:next,plugin:context.plugin,activeId:targetNodeId,groupByLevel:CONFIG.groupByLevel,openNode,controls,camera:restoreCamera,onReady:info=>resolve(!info.error)});
                    });
                    cancelPendingRender=null;
                    if(!ready||widgetClosed||!widget.isConnected||(session&&session.epoch!==expectedEpoch)){
                        nextView?.dispose();nextHost.remove();Object.entries(controls).forEach(([k,b])=>b.onclick=oldHandlers[k]);modeBtn.disabled=false;
                        if(!ready&&!widgetClosed)throw Error('新图绘制失败');return;
                    }
                    nextView.setCamera?.(collectiveView?.getCamera?.());
                    collectiveView?.dispose();collectiveView=nextView;
                    gridHost.replaceChildren(nextHost);nextHost.style.visibility='';modeBtn.disabled=false;
                }else{
                    collectiveView?.dispose();collectiveView=null;
                }
                graph=next;graphSignature=nextSignature;
                graph.nodes.forEach(n=>n.isTarget=n.id===targetNodeId);
                updateStats();legacyReady=false;legacyHost.replaceChildren();
                if(!grid||next.annotationAmbiguous)await show();
            };
            let rebuilding=false,rerun=false;
            const revalidate=async()=>{
                revalidationTimer=null;if(widgetClosed||!widget.isConnected)return;
                if(rebuilding){rerun=true;return;}
                rebuilding=true;const epoch=session.epoch,begin=Date.now();
                freshness.textContent='正在核验变化';backgroundBuild=true;buildHealthy=true;
                try{
                    const next=await buildReferenceGraph(targetNodeId,CONFIG.maxDepth,activeFile);
                    if(widgetClosed||!widget.isConnected)return;
                    if(epoch!==session.epoch){rerun=true;freshness.textContent='数据变化中 · 等待核验';return;}
                    if(!buildHealthy)throw Error('部分正文读取失败');
                    await applyGraph(next,epoch);if(widgetClosed)return;if(epoch!==session.epoch){rerun=true;return;}
                    snapshotId=session.put(activeFile.path,querySettings,next,signatureOf(next),epoch);freshness.textContent='已核验 · 最新';
                    timing('revalidated',{buildMs:Date.now()-begin,reads:session.counters.reads,parses:session.counters.parses});
                }catch(error){if(!widgetClosed){freshness.textContent='核验失败 · 保留上次图';console.warn('[ReferenceGraphWidget][revalidate-failed]',error);}}
                finally{backgroundBuild=false;rebuilding=false;if(rerun&&!widgetClosed){rerun=false;scheduleRevalidate();}}
            };
            scheduleRevalidate=()=>{if(widgetClosed)return;if(revalidationTimer)window.clearTimeout(revalidationTimer);revalidationTimer=window.setTimeout(()=>void revalidate(),180);};
            if(session)unsubscribeSession=session.subscribe(()=>{freshness.textContent='图可能有变化 · 待核验';scheduleRevalidate();});
            modeBtn.onclick = () => { if (!modeBtn.disabled) { grid = !grid; void show(); } };
            await show();
            // Ambiguous/unsupported views still revalidate even when mount cannot signal ready.
            if(needsValidation&&graph.annotationAmbiguous){needsValidation=false;scheduleRevalidate();}
        } else {
            await renderOriginal(contentDiv);
        }
        if (widgetClosed || !widget.isConnected) return;

        new Notice(`✅ 引用图加载完成: ${graph.stats.totalNodes}节点, ${graph.stats.totalEdges}边`, 3000);

    } catch (err) {
        if (widgetClosed || !widget.isConnected) return;
        contentDiv.innerHTML = `<div style="color:red;padding:20px;">
            <p>❌ 构建失败: ${err.message}</p>
            <pre style="font-size:11px;overflow:auto;">${err.stack}</pre>
        </div>`;
        new Notice(`❌ 引用图构建失败: ${err.message}`, 5000);
    }
};
