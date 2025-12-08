import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Helper function to parse MySQL INSERT statements
function parseInsertStatement(sql: string, tableName: string): any[] {
  // Find all INSERT statements for this table
  // Match: INSERT INTO table (...) VALUES ... ; (handles multiple statements)
  const tableRegex = new RegExp(`INSERT INTO \`?${tableName}\`?`, 'gi');
  const insertMatches = [...sql.matchAll(tableRegex)];
  
  if (insertMatches.length === 0) {
    console.warn(`No INSERT statements found for table: ${tableName}`);
    return [];
  }
  
  const rows: any[] = [];
  
  // Process each INSERT statement
  for (let i = 0; i < insertMatches.length; i++) {
    const match = insertMatches[i];
    const startPos = match.index!;
    const nextMatchPos = i < insertMatches.length - 1 ? insertMatches[i + 1].index! : sql.length;
    
    // Extract the VALUES section for this INSERT statement
    // Find the VALUES keyword and everything up to the last semicolon before the next INSERT or end
    const insertSection = sql.substring(startPos, nextMatchPos);
    const valuesStart = insertSection.indexOf('VALUES');
    
    if (valuesStart === -1) {
      console.warn(`Could not find VALUES keyword in INSERT statement ${i + 1} for ${tableName}`);
      continue;
    }
    
    // Find the last semicolon before the next INSERT statement (or end of string)
    // This handles semicolons within string values correctly
    let semicolonPos = insertSection.lastIndexOf(';');
    if (semicolonPos === -1 || semicolonPos < valuesStart) {
      console.warn(`Could not find terminating semicolon in INSERT statement ${i + 1} for ${tableName}`);
      continue;
    }
    
    const valuesString = insertSection.substring(valuesStart + 6, semicolonPos).trim();
    
    // Split by rows (handle multi-row inserts and nested parentheses)
    // Match balanced parentheses
    let depth = 0;
    let currentRow = '';
    let inString = false;
    let escapeNext = false;
    
    for (let j = 0; j < valuesString.length; j++) {
      const char = valuesString[j];
      
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
            // Parse this row
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
                // End of value
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
            
            // Add last value
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
  
  console.log(`Parsed ${rows.length} rows from ${insertMatches.length} INSERT statement(s) for ${tableName}`);
  return rows;
}

// Parse translation field to extract word class
function parseTranslation(translation: string): { wordClass: string | null; definition: string } {
  const match = translation.match(/^([^:]+):\s*(.+)$/);
  if (match) {
    return { wordClass: match[1].trim(), definition: match[2].trim() };
  }
  return { wordClass: null, definition: translation };
}

// Parse filter to determine dictionary
// Priority: Slakgedasleng > Noncanon > Canon (Trigedasleng)
function parseFilter(filter: string): string {
  if (!filter) return 'Trigedasleng';
  const lower = filter.toLowerCase();
  // Check slakgedasleng first (before noncanon) since words can have both
  if (lower.includes('slakgedasleng') || lower.includes('slakkru')) return 'Slakgedasleng';
  if (lower.includes('noncanon')) return 'Noncanon Trigedasleng';
  if (lower.includes('canon')) return 'Trigedasleng';
  return 'Trigedasleng';
}

// Parse episode string (e.g., "0203") to season/episode numbers
function parseEpisode(episode: string): { season: number; episode: number } | null {
  if (!episode || episode.length < 4) return null;
  const season = parseInt(episode.substring(0, 2), 10);
  const episodeNum = parseInt(episode.substring(2, 4), 10);
  if (isNaN(season) || isNaN(episodeNum)) return null;
  return { season, episode: episodeNum };
}

async function seed() {
  console.log('Starting seed...');

  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'data.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

  // 1. Seed Sources
  console.log('Seeding sources...');
  const sourceRows = parseInsertStatement(sqlContent, 'dict_sources');
  const sourceMap = new Map<number, string>(); // old_id -> new_id

  for (const row of sourceRows) {
    const [id, title, author, date, url] = row;
    const dateObj = date ? new Date(date) : null;
    
    let source = await prisma.source.findFirst({
      where: { url },
    });
    
    if (!source) {
      source = await prisma.source.create({
        data: {
          title,
          author,
          date: dateObj,
          url,
        },
      });
    }
    
    sourceMap.set(id, source.id);
  }
  console.log(`Seeded ${sourceMap.size} sources`);

  // 2. Ensure dictionaries exist
  console.log('Ensuring dictionaries exist...');
  const dictionaries = ['Trigedasleng', 'Slakgedasleng', 'Noncanon Trigedasleng', 'English'];
  const dictMap = new Map<string, string>();
  
  for (const dictName of dictionaries) {
    let dict = await prisma.dictionary.findFirst({
      where: { value: dictName },
    });
    
    if (!dict) {
      dict = await prisma.dictionary.create({
        data: { value: dictName },
      });
    }
    
    dictMap.set(dictName, dict.id);
  }

  // 3. Ensure classifications exist
  console.log('Ensuring classifications exist...');
  const classifications = ['none', 'noun', 'pronoun', 'verb', 'adjective', 'adverb', 'conjunction', 'preposition', 'interjection', 'auxiliary'];
  const classMap = new Map<string, string>();
  
  for (const className of classifications) {
    let classification = await prisma.classification.findFirst({
      where: { value: className },
    });
    
    if (!classification) {
      classification = await prisma.classification.create({
        data: { value: className },
      });
    }
    
    classMap.set(className, classification.id);
  }

  // 4. Ensure Series and Seasons exist
  console.log('Ensuring series and seasons exist...');
  let series = await prisma.series.findFirst({
    where: { value: 'The 100' },
  });
  
  if (!series) {
    series = await prisma.series.create({
      data: { value: 'The 100' },
    });
  }

  const seasonMap = new Map<string, string>(); // "seasonNumber" -> seasonId
  for (let i = 1; i <= 7; i++) {
    let season = await prisma.season.findFirst({
      where: {
        seriesId: series.id,
        seasonNumber: i,
      },
    });
    
    if (!season) {
      season = await prisma.season.create({
        data: {
          seriesId: series.id,
          seasonNumber: i,
        },
      });
    }
    
    seasonMap.set(i.toString(), season.id);
  }

  // 5. Ensure Episodes exist (we'll create them as we encounter them)
  console.log('Creating episodes as needed...');
  const episodeMap = new Map<string, string>(); // "seasonNumber-episodeNumber" -> episodeId

  // 6. Seed Words
  console.log('Seeding words...');
  const wordRows = parseInsertStatement(sqlContent, 'dict_words');
  const wordMap = new Map<number, string>(); // old_id -> new_id
  let wordCount = 0;

  for (const row of wordRows) {
    const [id, word, translation, etymology, link, citations, example, note, filter] = row;
    
    const dictName = parseFilter(filter || '');
    const dictionaryId = dictMap.get(dictName) || dictMap.get('Trigedasleng')!;
    
    const { wordClass, definition } = parseTranslation(translation || '');
    
    // Create or find the word
    let wordRecord = await prisma.word.findFirst({
      where: {
        value: word,
        dictionaryId,
      },
    });
    
    if (!wordRecord) {
      wordRecord = await prisma.word.create({
        data: {
          value: word,
          pronunciation: null, // Not in old schema
          dictionaryId,
        },
      });
    }
    
    wordMap.set(id, wordRecord.id);
    
    // Add classification if we have one
    if (wordClass && classMap.has(wordClass.toLowerCase())) {
      const classId = classMap.get(wordClass.toLowerCase())!;
      const existing = await prisma.wordClassification.findFirst({
        where: {
          wordId: wordRecord.id,
          classificationId: classId,
        },
      });
      
      if (!existing) {
        await prisma.wordClassification.create({
          data: {
            wordId: wordRecord.id,
            classificationId: classId,
          },
        });
      }
    }
    
    // Create translation to English word if definition exists
    if (definition) {
      // For complex definitions with semicolons, use only the first part
      // e.g., "as, like; often used..." -> "as, like"
      const primaryDefinition = definition.split(';')[0].trim();
      
      // Find or create English word
      const englishDictId = dictMap.get('English')!;
      let englishWord = await prisma.word.findFirst({
        where: {
          value: primaryDefinition,
          dictionaryId: englishDictId,
        },
      });
      
      if (!englishWord) {
        englishWord = await prisma.word.create({
          data: {
            value: primaryDefinition,
            dictionaryId: englishDictId,
          },
        });
      }
      
      // Create translation relationship
      const existingTranslation = await prisma.translation.findFirst({
        where: {
          wordSourceId: wordRecord.id,
          wordTargetId: englishWord.id,
        },
      });
      
      if (!existingTranslation) {
        await prisma.translation.create({
          data: {
            wordSourceId: wordRecord.id,
            wordTargetId: englishWord.id,
            etymology: etymology || null,
            isApproved: true,
          },
        });
      }
    }
    
    wordCount++;
    if (wordCount % 100 === 0) {
      console.log(`  Processed ${wordCount} words...`);
    }
  }
  console.log(`Seeded ${wordCount} words`);

  // 7. Seed Speakers
  console.log('Seeding speakers...');
  const speakerNames = [
    'Clarke', 'Octavia', 'Miller', 'Lincoln', 'Madi', 'Karina', 'Warrior(s)', 
    'Grounder(s)', 'Indra', 'Gaia', 'Echo', 'Crowd', 'Bellamy', 'Artigas', 
    'Brell', 'Tarik', 'Reaper', 'Penn', 'Murphey', 'Nyko', 'Obika'
  ];
  const speakerMap = new Map<string, string>();
  
  for (const speakerName of speakerNames) {
    let speaker = await prisma.speaker.findFirst({
      where: {
        value: speakerName,
        seriesId: series.id,
      },
    });
    
    if (!speaker) {
      speaker = await prisma.speaker.create({
        data: {
          value: speakerName,
          seriesId: series.id,
        },
      });
    }
    
    speakerMap.set(speakerName.toLowerCase(), speaker.id);
  }

  // 8. Seed Sentences (Translations)
  console.log('Seeding sentences/translations...');
  const translationRows = parseInsertStatement(sqlContent, 'dict_translations');
  let sentenceCount = 0;

  for (const row of translationRows) {
    const [id, trigedasleng, translation, etymology, leipzig, episode, audio, speaker, source] = row;
    
    // Get source
    const sourceId = source ? sourceMap.get(parseInt(source, 10)) : null;
    
    // Create sentence
    const sentence = await prisma.sentence.create({
      data: {
        dictionaryId: dictMap.get('Trigedasleng')!,
        sourceId: sourceId || null,
        value: trigedasleng || '',
        english: translation || '',
        etymology: etymology || null,
        leipzigGlossing: leipzig || null,
        audio: audio || null,
      },
    });
    
    // Handle episode - only create episode_sentence if episode is valid
    const epInfo = parseEpisode(episode || '');
    if (epInfo) {
      const seasonId = seasonMap.get(epInfo.season.toString());
      if (seasonId) {
        // Get or create episode
        const episodeKey = `${epInfo.season}-${epInfo.episode}`;
        let episodeId = episodeMap.get(episodeKey);
        if (!episodeId) {
          // Check if episode already exists in database
          let episodeRecord = await prisma.episode.findFirst({
            where: {
              seasonId,
              seasonNumber: epInfo.season,
              seriesNumber: epInfo.episode,
            },
          });
          
          if (!episodeRecord) {
            // Create episode (we need episode name, but we don't have it in the data)
            // We'll use a placeholder or try to find it
            episodeRecord = await prisma.episode.create({
              data: {
                seasonId,
                value: `S${epInfo.season}E${epInfo.episode.toString().padStart(2, '0')}`,
                seasonNumber: epInfo.season,
                seriesNumber: epInfo.episode,
              },
            });
          }
          
          episodeId = episodeRecord.id;
          episodeMap.set(episodeKey, episodeId);
        }
        
        // Create episode_sentence relationship
        const speakerId = speaker ? speakerMap.get(speaker.toLowerCase()) : null;
        await prisma.episodeSentence.create({
          data: {
            episodeId,
            sentenceId: sentence.id,
            speakerId: speakerId || null,
          },
        });
      }
    }
    // If episode is "other" or invalid, don't create episode_sentence relationship
    // The loader will identify these as "other" when episodes array is empty
    
    sentenceCount++;
    if (sentenceCount % 100 === 0) {
      console.log(`  Processed ${sentenceCount} sentences...`);
    }
  }
  console.log(`Seeded ${sentenceCount} sentences`);

  console.log('Seed completed!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

