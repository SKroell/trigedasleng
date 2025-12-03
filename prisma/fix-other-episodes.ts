import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Helper function to parse MySQL INSERT statements (same as seed.ts)
function parseInsertStatement(sql: string, tableName: string): any[] {
  const regex = new RegExp(`INSERT INTO \`?${tableName}\`?[^)]+\\) VALUES\\s*([\\s\\S]+?);`, 'gi');
  const matches = [...sql.matchAll(regex)];
  const rows: any[] = [];

  for (const match of matches) {
    const valuesString = match[1];
    let depth = 0;
    let currentRow = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < valuesString.length; i++) {
      const char = valuesString[i];
      
      if (escapeNext) {
        currentRow += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentRow += char;
        continue;
      }
      
      if (char === "'" && !escapeNext) {
        inString = !inString;
        currentRow += char;
        continue;
      }
      
      if (!inString) {
        if (char === '(') {
          depth++;
          if (depth === 1) {
            currentRow = '';
            continue;
          }
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            const values: any[] = [];
            let currentValue = '';
            let valueDepth = 0;
            let valueInString = false;
            let valueEscapeNext = false;
            
            for (let j = 0; j < currentRow.length; j++) {
              const c = currentRow[j];
              
              if (valueEscapeNext) {
                currentValue += c;
                valueEscapeNext = false;
                continue;
              }
              
              if (c === '\\') {
                valueEscapeNext = true;
                currentValue += c;
                continue;
              }
              
              if (c === "'" && !valueEscapeNext) {
                valueInString = !valueInString;
                currentValue += c;
                continue;
              }
              
              if (!valueInString && c === ',' && valueDepth === 0) {
                let val = currentValue.trim();
                if (val.startsWith("'") && val.endsWith("'")) {
                  val = val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                } else if (val === 'NULL' || val === '') {
                  val = null;
                }
                values.push(val);
                currentValue = '';
                continue;
              }
              
              currentValue += c;
            }
            
            let val = currentValue.trim();
            if (val.startsWith("'") && val.endsWith("'")) {
              val = val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
            } else if (val === 'NULL' || val === '') {
              val = null;
            }
            values.push(val);
            
            rows.push(values);
            currentRow = '';
            continue;
          }
        }
      }
      
      currentRow += char;
    }
  }
  return rows;
}

async function fixOtherEpisodes() {
  console.log('Fixing "other" episodes...');
  
  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'data.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
  
  // Get dictionary
  const dictionary = await prisma.dictionary.findFirst({
    where: { value: 'Trigedasleng' }
  });
  
  if (!dictionary) {
    console.error('Trigedasleng dictionary not found!');
    await prisma.$disconnect();
    return;
  }
  
  // Parse translation rows
  const translationRows = parseInsertStatement(sqlContent, 'dict_translations');
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const row of translationRows) {
    const [id, trigedasleng, translation, etymology, leipzig, episode, audio, speaker, source] = row;
    
    // Only process rows with episode "other"
    if (episode !== 'other') continue;
    
    // Check if sentence already exists
    const existing = await prisma.sentence.findFirst({
      where: {
        value: trigedasleng || '',
        english: translation || '',
      },
      include: { episodes: true }
    });
    
    if (existing) {
      // If it exists but has no episodes, it's already correct
      if (existing.episodes.length === 0) {
        skippedCount++;
        continue;
      }
      // If it exists with episodes, skip (it was already processed)
      skippedCount++;
      continue;
    }
    
    // Get source if provided
    let sourceId = null;
    if (source) {
      const sourceRecord = await prisma.source.findFirst({
        where: { id: source }
      });
      if (sourceRecord) {
        sourceId = sourceRecord.id;
      }
    }
    
    // Create sentence without episode relationship
    await prisma.sentence.create({
      data: {
        dictionaryId: dictionary.id,
        sourceId: sourceId,
        value: trigedasleng || '',
        english: translation || '',
        etymology: etymology || null,
        leipzigGlossing: leipzig || null,
        audio: audio || null,
      },
    });
    
    addedCount++;
  }
  
  console.log(`Added ${addedCount} "other" sentences`);
  console.log(`Skipped ${skippedCount} existing sentences`);
  console.log('Done!');
  
  await prisma.$disconnect();
}

fixOtherEpisodes()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


