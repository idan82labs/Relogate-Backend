/**
 * Import Articles from DOCX Script
 *
 * Reads .docx files from the מאמרים לאתר directory and updates
 * the database with the actual content.
 *
 * Run with: npx tsx src/scripts/import-articles-from-docx.ts
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import mammoth from 'mammoth';
import { db } from '../db/index.js';
import { blogPosts } from '../db/schema/blog.js';
import { eq } from 'drizzle-orm';

// ============================================================================
// File to Slug Mapping
// ============================================================================

interface ArticleMapping {
  hebrewFile: string;
  englishFile: string;
  slug: string;
  hebrewTitle: string;
  englishTitle?: string;
}

/**
 * Mapping between .docx files and database slugs.
 * Hebrew and English files are paired together.
 */
const ARTICLE_MAPPINGS: ArticleMapping[] = [
  {
    hebrewFile: 'גם אני יכול להיות נווד דיגיטלי.docx',
    englishFile: 'Can I Really Become a Digital Nomad.docx',
    slug: 'digital-nomad-guide',
    hebrewTitle: 'גם אני יכול להיות נווד דיגיטלי?',
    englishTitle: 'Can I Really Become a Digital Nomad?',
  },
  {
    hebrewFile: 'השכרת דירה בחול.docx',
    englishFile: 'Renting a Home Abroad .docx',
    slug: 'renting-abroad',
    hebrewTitle: 'השכרת דירה בחו״ל למהגר הישראלי – מה חשוב באמת לדעת?',
    englishTitle: 'Renting a Home Abroad - What You Really Need to Know',
  },
  {
    hebrewFile: 'חורף קר עד כמה זה מפחיד_.docx',
    englishFile: 'Cold Countries.docx',
    slug: 'cold-weather-guide',
    hebrewTitle: 'מדינות קרות – מה זה באמת אומר למי שחושב על רילוקיישן?',
    englishTitle: 'Cold Countries - What It Really Means for Relocation',
  },
  {
    hebrewFile: 'מדריך מערכת חינוך.docx',
    englishFile: 'Education for Children Abroad.docx',
    slug: 'education-guide',
    hebrewTitle: 'חינוך לילדים בחו״ל: המדריך המלא להורים ישראלים',
    englishTitle: 'Education for Children Abroad: Complete Guide for Israeli Parents',
  },
  {
    hebrewFile: 'מערכת הבריאות בעולם לעומת ישראל.docx',
    englishFile: 'Healthcare Systems Around the World vs.docx',
    slug: 'healthcare-systems',
    hebrewTitle: 'מערכת הבריאות בעולם לעומת ישראל',
    englishTitle: 'Healthcare Systems Around the World vs. Israel',
  },
  {
    hebrewFile: 'פתיחת חשבון בנק און ליין.docx',
    englishFile: 'Moving Abroad.docx', // Note: English file name doesn't match but this is the best match
    slug: 'digital-banking',
    hebrewTitle: 'פתיחת חשבון בנק און ליין בחו״ל',
    englishTitle: 'Opening a Digital Bank Account Abroad',
  },
  {
    hebrewFile: 'קהילה יהודית וישראלית.docx',
    englishFile: 'Jewish and Israeli Communities Abroad  What You Really Need to Know Before Relocating.docx',
    slug: 'jewish-community',
    hebrewTitle: 'קהילה יהודית וישראלית בחו״ל',
    englishTitle: 'Jewish and Israeli Communities Abroad',
  },
];

// ============================================================================
// Paths Configuration
// ============================================================================

const ARTICLES_BASE_PATH = join(
  process.cwd(),
  '..',
  'Relogate-Website',
  'מאמרים לאתר',
  'מאמרים לאתר'
);

const HEBREW_PATH = join(ARTICLES_BASE_PATH, 'עברית');
const ENGLISH_PATH = join(ARTICLES_BASE_PATH, 'אנגלית');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clean up mammoth markdown output.
 * Removes excessive escaping and normalizes formatting.
 */
function cleanMarkdown(markdown: string): string {
  return (
    markdown
      // Remove backslash escapes from common characters
      .replace(/\\([._\-*[\](){}])/g, '$1')
      // Fix double underscores for bold (mammoth uses __)
      .replace(/__([^_]+)__/g, '**$1**')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      // Remove excessive blank lines (more than 2 in a row)
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim()
  );
}

/**
 * Extract content from a .docx file using mammoth.
 */
async function extractDocxContent(filePath: string): Promise<string | null> {
  try {
    const buffer = await readFile(filePath);
    // @ts-expect-error - mammoth types don't include convertToMarkdown but it exists at runtime
    const result = await mammoth.convertToMarkdown({ buffer });

    if (result.messages.length > 0) {
      console.log(`  ⚠ Warnings for ${basename(filePath)}:`);
      result.messages.forEach((msg: { message: string }) => console.log(`    - ${msg.message}`));
    }

    return cleanMarkdown(result.value);
  } catch (error) {
    console.error(`  ❌ Failed to read ${filePath}:`, error);
    return null;
  }
}

/**
 * Generate excerpt from content (first paragraph or first 200 chars).
 */
function generateExcerpt(content: string, maxLength = 200): string {
  // Remove markdown formatting for excerpt
  const plainText = content
    .replace(/#+\s/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();

  // Get first sentence or max chars
  const firstSentence = plainText.match(/^[^.!?]+[.!?]/)?.[0] || plainText;

  if (firstSentence.length <= maxLength) {
    return firstSentence;
  }

  return plainText.substring(0, maxLength).trim() + '...';
}

// ============================================================================
// Main Import Function
// ============================================================================

async function importArticles() {
  console.log('🚀 Starting article import from .docx files...\n');
  console.log(`📁 Hebrew path: ${HEBREW_PATH}`);
  console.log(`📁 English path: ${ENGLISH_PATH}\n`);

  // Verify paths exist
  try {
    await readdir(HEBREW_PATH);
    console.log('✅ Hebrew directory found');
  } catch {
    console.error('❌ Hebrew directory not found!');
    process.exit(1);
  }

  try {
    await readdir(ENGLISH_PATH);
    console.log('✅ English directory found\n');
  } catch {
    console.log('⚠ English directory not found, will skip English content\n');
  }

  let successCount = 0;
  let errorCount = 0;

  for (const mapping of ARTICLE_MAPPINGS) {
    console.log(`\n📄 Processing: ${mapping.slug}`);
    console.log(`   Hebrew file: ${mapping.hebrewFile}`);
    console.log(`   English file: ${mapping.englishFile}`);

    // Extract Hebrew content
    const hebrewFilePath = join(HEBREW_PATH, mapping.hebrewFile);
    const hebrewContent = await extractDocxContent(hebrewFilePath);

    if (!hebrewContent) {
      console.log(`   ❌ Failed to extract Hebrew content`);
      errorCount++;
      continue;
    }

    console.log(`   ✅ Hebrew content extracted (${hebrewContent.length} chars)`);

    // Extract English content (optional)
    const englishFilePath = join(ENGLISH_PATH, mapping.englishFile);
    const englishContent = await extractDocxContent(englishFilePath);

    if (englishContent) {
      console.log(`   ✅ English content extracted (${englishContent.length} chars)`);
    } else {
      console.log(`   ⚠ English content not found or failed to extract`);
    }

    // Generate excerpts
    const hebrewExcerpt = generateExcerpt(hebrewContent);
    const englishExcerpt = englishContent ? generateExcerpt(englishContent) : undefined;

    // Update database
    try {
      const updateData: {
        title: { he: string; en?: string };
        content: { he: string; en?: string };
        excerpt: { he: string; en?: string };
        updatedAt: Date;
      } = {
        title: {
          he: mapping.hebrewTitle,
          ...(mapping.englishTitle && { en: mapping.englishTitle }),
        },
        content: {
          he: hebrewContent,
          ...(englishContent && { en: englishContent }),
        },
        excerpt: {
          he: hebrewExcerpt,
          ...(englishExcerpt && { en: englishExcerpt }),
        },
        updatedAt: new Date(),
      };

      const result = await db
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.slug, mapping.slug))
        .returning({ id: blogPosts.id, slug: blogPosts.slug });

      if (result.length === 0) {
        console.log(`   ⚠ No article found with slug: ${mapping.slug}`);
        errorCount++;
      } else {
        console.log(`   ✅ Database updated for: ${mapping.slug}`);
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Database update failed:`, error);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully updated: ${successCount} articles`);
  console.log(`❌ Failed: ${errorCount} articles`);
  console.log('='.repeat(50));
}

// ============================================================================
// Run Script
// ============================================================================

importArticles()
  .then(() => {
    console.log('\n✅ Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
