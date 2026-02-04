/**
 * Translation script using OpenRouter API
 * Translates English markdown files to Vietnamese while preserving:
 * - Japanese text (kanji, hiragana, katakana)
 * - Markdown formatting
 * - HTML/Vue components
 */

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

// Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").trim();
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnv();

// Configuration
const CONFIG = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.MODEL || "anthropic/claude-sonnet-4", // or "anthropic/claude-3.5-sonnet", "openai/gpt-4o", etc.
  inputDir: "./config/docs/en",
  outputDir: "./config/docs/vi",
  batchSize: 1, // Process one file at a time to avoid rate limits
  delayBetweenRequests: 2000, // 2 seconds between requests
};

const SYSTEM_PROMPT = `You are a professional translator specializing in Japanese language education materials.
Your task is to translate English text to Vietnamese.

CRITICAL RULES:
1. KEEP ALL JAPANESE TEXT UNCHANGED - Do not translate or modify any:
   - Kanji (漢字)
   - Hiragana (ひらがな)
   - Katakana (カタカナ)
   - Romaji that represents Japanese words (like "ga", "wa", "desu")
   - Japanese names (Sakura, etc.)

2. KEEP ALL FORMATTING UNCHANGED:
   - Markdown headers (#, ##, ###)
   - Bold (**text**) and italic (*text*)
   - Code blocks (\`code\`) and code fences (\`\`\`)
   - Links [text](url)
   - Images ![alt](path)
   - HTML tags and Vue components
   - Line breaks and paragraph structure

3. TRANSLATE NATURALLY:
   - Translate English explanations, notes, and sentences to natural Vietnamese
   - Keep the educational tone appropriate for language learners
   - Preserve technical linguistic terms when appropriate

4. OUTPUT FORMAT:
   - Return ONLY the translated content
   - Do not add any explanations or comments
   - Preserve the exact structure of the input`;

async function translateWithOpenRouter(content) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.openrouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/cure-dolly-vietnamese",
      "X-Title": "Cure Dolly Vietnamese Translation",
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Translate the following English markdown content to Vietnamese. Keep all Japanese text, markdown formatting, and HTML unchanged:\n\n${content}`,
        },
      ],
      max_tokens: 16000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function getFilesToTranslate() {
  const enFiles = await glob("*.md", { cwd: CONFIG.inputDir });
  const filesToTranslate = [];

  for (const file of enFiles) {
    const viPath = path.join(CONFIG.outputDir, file);
    if (fs.existsSync(viPath)) {
      // Check if the Vietnamese file still contains Russian text
      const content = fs.readFileSync(viPath, "utf8");
      // Common Russian patterns
      if (
        /[а-яА-ЯёЁ]{3,}/.test(content) ||
        content.includes("Однако") ||
        content.includes("Например") ||
        content.includes("является")
      ) {
        filesToTranslate.push(file);
      }
    } else {
      filesToTranslate.push(file);
    }
  }

  return filesToTranslate.sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)/)?.[1] || "999");
    const numB = parseInt(b.match(/^(\d+)/)?.[1] || "999");
    return numA - numB;
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateFile(filename) {
  const inputPath = path.join(CONFIG.inputDir, filename);
  const outputPath = path.join(CONFIG.outputDir, filename);

  console.log(`\n📖 Reading: ${filename}`);
  const content = fs.readFileSync(inputPath, "utf8");

  console.log(`🔄 Translating...`);
  const translated = await translateWithOpenRouter(content);

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  console.log(`💾 Saving: ${outputPath}`);
  fs.writeFileSync(outputPath, translated, "utf8");

  return { filename, success: true };
}

async function main() {
  console.log("=".repeat(60));
  console.log("Cure Dolly Vietnamese Translation Script");
  console.log("=".repeat(60));

  if (!CONFIG.openrouterApiKey) {
    console.error(
      "\n❌ Error: OPENROUTER_API_KEY environment variable not set!"
    );
    console.log("\nTo set it, run:");
    console.log("  Windows CMD:   set OPENROUTER_API_KEY=your-key-here");
    console.log("  Windows PS:    $env:OPENROUTER_API_KEY='your-key-here'");
    console.log("  Linux/Mac:     export OPENROUTER_API_KEY=your-key-here");
    process.exit(1);
  }

  console.log(`\n📁 Input directory: ${CONFIG.inputDir}`);
  console.log(`📁 Output directory: ${CONFIG.outputDir}`);
  console.log(`🤖 Model: ${CONFIG.model}`);

  const files = await getFilesToTranslate();

  if (files.length === 0) {
    console.log("\n✅ All files are already translated!");
    return;
  }

  console.log(`\n📝 Found ${files.length} files to translate:`);
  files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));

  const results = { success: [], failed: [] };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`\n[${ i + 1}/${files.length}] Processing: ${file}`);

    try {
      await translateFile(file);
      results.success.push(file);
      console.log(`✅ Done: ${file}`);
    } catch (error) {
      console.error(`❌ Failed: ${file} - ${error.message}`);
      results.failed.push({ file, error: error.message });
    }

    // Delay between requests to avoid rate limits
    if (i < files.length - 1) {
      console.log(`⏳ Waiting ${CONFIG.delayBetweenRequests / 1000}s...`);
      await sleep(CONFIG.delayBetweenRequests);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TRANSLATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("\nFailed files:");
    results.failed.forEach((f) => console.log(`  - ${f.file}: ${f.error}`));
  }
}

// Allow running a single file for testing
if (process.argv[2] === "--test") {
  const testFile = process.argv[3] || "1-the-basic-types-of-sentences.md";
  console.log(`Testing with file: ${testFile}`);
  translateFile(testFile)
    .then(() => console.log("Test complete!"))
    .catch((err) => console.error("Test failed:", err));
} else if (process.argv[2] === "--list") {
  getFilesToTranslate().then((files) => {
    console.log(`Files needing translation (${files.length}):`);
    files.forEach((f, i) => console.log(`${i + 1}. ${f}`));
  });
} else {
  main().catch(console.error);
}
