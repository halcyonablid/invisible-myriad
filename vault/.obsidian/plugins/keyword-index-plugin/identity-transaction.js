"use strict";

// One owner journal: intent is durable BEFORE the first note/index mutation.
// Adapter is injected so conflict, I/O failure and crash paths are testable.
async function assertSource(io, indexPath, before, plans) {
  if (await io.readIndex(indexPath) !== before) throw new Error("索引已被修改，请重新预览");
  for (const plan of plans) {
    if (await io.readNote(plan.path) !== plan.before) throw new Error(`笔记已被修改：${plan.path}`);
    if (plan.newPath && plan.newPath !== plan.path && await io.exists(plan.newPath)) throw new Error(`移动目标已存在：${plan.newPath}`);
  }
}

async function recover(io, journal) {
  if (journal.schema !== 1 || !Array.isArray(journal.plans)) throw new Error("未知事务日志，拒绝自动恢复");
  const current = await io.readIndex(journal.indexPath);
  if (current === journal.after) {
    // Commit already happened: do not roll back content behind a published identity.
    return { committed: true, needsPublish: true };
  }
  if (current !== journal.before) throw new Error("索引存在并发修改，保留事务日志和备份，需人工处理");
  // Check every target BEFORE rolling anything back. Never overwrite later user edits.
  const actions = [];
  for (const plan of [...journal.plans].reverse()) {
    if (plan.newPath && plan.newPath !== plan.path) {
      const oldExists = await io.exists(plan.path), newExists = await io.exists(plan.newPath);
      if (oldExists && !newExists && await io.readNote(plan.path) === plan.before) continue;
      if (!oldExists && newExists && await io.readNote(plan.newPath) === plan.after) actions.push({ plan, rename: true });
      else throw new Error(`笔记路径恢复冲突：${plan.path}`);
    } else {
      const content = await io.readNote(plan.path);
      if (content === plan.before) continue;
      if (content !== plan.after) throw new Error(`笔记内容恢复冲突：${plan.path}`);
      actions.push({ plan, rename: false });
    }
  }
  for (const { plan, rename } of actions) {
    if (rename) await io.renameNote(plan.newPath, plan.path, plan.after);
    else await io.replaceNote(plan.path, plan.after, plan.before);
  }
  return { committed: false, rolledBack: true };
}

async function execute(io, { indexPath, before, after, plans, txId }) {
  await assertSource(io, indexPath, before, plans);
  const journal = { schema: 1, txId, indexPath, before, after, plans, phase: "prepared" };
  await io.writeJournal(journal);
  try {
    for (const plan of plans) {
      if (plan.newPath && plan.newPath !== plan.path) await io.renameNote(plan.path, plan.newPath, plan.before);
      else await io.replaceNote(plan.path, plan.before, plan.after);
    }
    if (await io.readIndex(indexPath) !== before) throw new Error("索引提交前发生冲突");
    await io.writeIndex(indexPath, after);
    if (await io.readIndex(indexPath) !== after) throw new Error("索引提交回读不一致");
  } catch (error) {
    try {
      const result = await recover(io, journal);
      if (result.committed) return { ...result, txId, warning: error.message };
      await io.finishJournal({ ...journal, phase: "rolled-back" });
    } catch (recoveryError) {
      throw new Error(`${error.message}；恢复未完成：${recoveryError.message}。事务日志已保留，禁止继续写入。`);
    }
    throw error;
  }
  return { committed: true, txId, needsPublish: true };
}

module.exports = { assertSource, execute, recover };
