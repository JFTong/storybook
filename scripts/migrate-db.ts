#!/usr/bin/env ts-node
/**
 * 数据库迁移执行脚本
 * 运行方式: npm run migrate 或 tsx scripts/migrate-db.ts
 */

import { runMigrations } from '../lib/db/migrate';

console.log('开始执行数据库迁移...\n');

try {
  runMigrations();
  console.log('\n✅ 数据库迁移完成!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ 数据库迁移失败:', error);
  process.exit(1);
}
