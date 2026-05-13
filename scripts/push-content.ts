/**
 * Push content seed JSON files to Supabase.
 *
 * Usage:
 *   1. Fill in SUPABASE_SERVICE_ROLE_KEY in .env (from Supabase dashboard › Settings › API)
 *   2. Fill in content/seed/*.json (especially words.json + distractors.json + lesson_items.json
 *      from the mega-prompt output)
 *   3. Run: npm run content:push
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

function load<T>(name: string): T[] {
  const path = resolve(process.cwd(), 'content', 'seed', name);
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as T[];
}

async function upsertBatch(table: string, rows: any[], chunkSize = 500) {
  if (rows.length === 0) { console.log(`  ⏭  ${table}: nothing to push`); return; }
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await sb.from(table).upsert(chunk);
    if (error) {
      console.error(`  ❌ ${table} chunk ${i}: ${error.message}`);
      process.exit(1);
    }
    process.stdout.write(`\r  ⏳ ${table}: ${Math.min(i + chunkSize, rows.length)} / ${rows.length}`);
  }
  console.log(`\r  ✓  ${table}: ${rows.length} rows                    `);
}

async function main() {
  console.log('🌱 Cesta content push starting...\n');

  // Foreign-key order: units → lessons → words → lesson_items → distractors → placement_questions
  await upsertBatch('units', load('units.json'));
  await upsertBatch('lessons', load('lessons.json'));
  await upsertBatch('words', load('words.json'));
  await upsertBatch('lesson_items', load('lesson_items.json'));
  await upsertBatch('distractors', load('distractors.json'));
  await upsertBatch('placement_questions', load('placement_questions.json'));

  console.log('\n🎉 Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
