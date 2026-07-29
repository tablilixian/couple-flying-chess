const fs = require('fs');
const path = require('path');

const partsDir = path.resolve(__dirname, '../data/novel');
const outDir = path.resolve(__dirname, '../src/data/novel');

// Part files in order
const partFiles = [
  'characterDB.part1.json',
  'characterDB.part2.json',
  'characterDB.part3.json',
  'characterDB.part4.json',
  'characterDB.part5.json',
];

const full = {
  version: '2.0',
  generatedAt: new Date().toISOString(),
  sourceFile: 'public/novels/xiangyinqi.md',
  totalChapters: 60,
  characters: {},
  relationships: {},
  chapterSummaries: [],
};

for (const f of partFiles) {
  const p = path.join(partsDir, f);
  if (!fs.existsSync(p)) {
    console.warn(`⚠  ${f} not found, skipping`);
    continue;
  }
  const part = JSON.parse(fs.readFileSync(p, 'utf-8'));

  // Merge characters: full definition wins over delta (which only has lastAppearChapter + appearCount)
  for (const [id, ch] of Object.entries(part.characters)) {
    if (full.characters[id]) {
      // Delta mode: update only lastAppearChapter and appearCount
      if (ch.lastAppearChapter !== undefined) full.characters[id].lastAppearChapter = ch.lastAppearChapter;
      if (ch.appearCount !== undefined) full.characters[id].appearCount = ch.appearCount;
      // Merge metadata if present
      if (ch.metadata) {
        full.characters[id].metadata = { ...full.characters[id].metadata, ...ch.metadata };
      }
    } else {
      // Full definition: include everything
      full.characters[id] = { ...ch };
    }
  }

  // Merge relationships: by id
  for (const rel of (part.relationships || [])) {
    const rid = rel.id;
    if (full.relationships[rid]) {
      // Append new keyEvents
      for (const ke of (rel.keyEvents || [])) {
        if (!full.relationships[rid].keyEvents.some(e => e.chapter === ke.chapter && e.eventType === ke.eventType && e.summary === ke.summary)) {
          full.relationships[rid].keyEvents.push(ke);
        }
      }
      // Update endChapter if exists
      if (rel.endChapter !== undefined) full.relationships[rid].endChapter = rel.endChapter;
    } else {
      full.relationships[rid] = { ...rel, keyEvents: [...(rel.keyEvents || [])] };
    }
  }

  // Merge chapterSummaries: by chapter number
  for (const cs of (part.chapterSummaries || [])) {
    const existing = full.chapterSummaries.find(s => s.chapter === cs.chapter);
    if (!existing) {
      full.chapterSummaries.push({ ...cs });
    } else {
      // Merge keyEvents
      for (const ke of (cs.keyEvents || [])) {
        if (!existing.keyEvents.some(e => e.chapter === ke.chapter && e.eventType === ke.eventType && e.summary === ke.summary)) {
          existing.keyEvents.push(ke);
        }
      }
    }
  }
}

// Convert relationships from object back to array, sorted
full.relationships = Object.values(full.relationships);
// Sort chapter summaries by chapter number
full.chapterSummaries.sort((a, b) => a.chapter - b.chapter);

// Write JSON
const outPath = path.join(outDir, 'characterDB.full.json');
fs.writeFileSync(outPath, JSON.stringify(full, null, 2), 'utf-8');
console.log(`✓ Merged ${partFiles.filter(f => fs.existsSync(path.join(partsDir, f))).length} parts → ${outPath}`);
console.log(`  Characters: ${Object.keys(full.characters).length}`);
console.log(`  Relationships: ${full.relationships.length}`);
console.log(`  Chapters: ${full.chapterSummaries.length}`);
