/**
 * QA and Fix script for Vietnamese translations
 * Reviews each file for natural Vietnamese and fixes issues
 *
 * Usage:
 *   npm run qa                    # Run all files
 *   npm run qa -- --start-from 15 # Resume from file 15
 *   npm run qa:file "filename.md" # Run single file
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

const CONFIG = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.QA_MODEL || "anthropic/claude-sonnet-4",
  viDir: "./config/docs/vi",
  enDir: "./config/docs/en",
  reportFile: "./qa-report.md",
  progressFile: "./qa-progress.json",
  delayBetweenRequests: 2000,
};

// Known terminology fixes - only for clear errors, not style preferences
// Add fixes here as you discover consistent mistranslations
const TERMINOLOGY_FIXES = {
  // Add specific fixes as discovered during QA
  // Example: "mistranslated term": "correct term",
};

const QA_SYSTEM_PROMPT = `You are editing Vietnamese translations of Japanese grammar lessons from "Cure Dolly's Organic Japanese".

TARGET AUDIENCE: Vietnamese learners studying Japanese (N5-N3 level), familiar with textbooks like Minna no Nihongo.

RULES:
1. PRESERVE all Japanese text (kanji, hiragana, katakana) exactly
2. PRESERVE all markdown formatting (headers, bold, links, images, code blocks)
3. PRESERVE all HTML/Vue components (::: info, ::: tip, etc.)

GOALS:
- Natural Vietnamese: Fix awkward phrasing, improve flow
- Concise: Prefer shorter sentences over verbose translations
- Consistent: Same concept = same Vietnamese term throughout
- Match Vietnamese Japanese-learning conventions when applicable

OUTPUT:
- If translation is good: respond exactly "NO_CHANGES_NEEDED"
- If changes needed: respond with the COMPLETE corrected markdown (no explanations)`;

async function reviewWithOpenRouter(viContent, enContent, filename) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.openrouterApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: [
        { role: "system", content: QA_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Review this Vietnamese translation and fix any issues.

FILENAME: ${filename}

=== ORIGINAL ENGLISH ===
${enContent}

=== VIETNAMESE TRANSLATION TO REVIEW ===
${viContent}

Remember: Output ONLY the corrected content, or NO_CHANGES_NEEDED if perfect.`,
        },
      ],
      max_tokens: 16000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function applyTerminologyFixes(content) {
  let fixed = content;
  let appliedFixes = [];

  for (const [wrong, correct] of Object.entries(TERMINOLOGY_FIXES)) {
    if (fixed.includes(wrong)) {
      fixed = fixed.split(wrong).join(correct);
      appliedFixes.push(`"${wrong}" → "${correct}"`);
    }
  }

  return { fixed, appliedFixes };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function qaFile(filename) {
  const viPath = path.join(CONFIG.viDir, filename);
  const enPath = path.join(CONFIG.enDir, filename);

  if (!fs.existsSync(viPath) || !fs.existsSync(enPath)) {
    return { filename, status: "skipped", reason: "Missing file" };
  }

  let viContent = fs.readFileSync(viPath, "utf8");
  const enContent = fs.readFileSync(enPath, "utf8");

  // Step 1: Apply known terminology fixes first
  const { fixed: afterTermFixes, appliedFixes } = applyTerminologyFixes(viContent);
  viContent = afterTermFixes;

  // Step 2: LLM review
  console.log(`🔍 Reviewing: ${filename}`);
  const result = await reviewWithOpenRouter(viContent, enContent, filename);

  const changes = [];

  if (appliedFixes.length > 0) {
    changes.push(...appliedFixes.map((f) => `[Terminology] ${f}`));
  }

  if (result.trim() === "NO_CHANGES_NEEDED") {
    if (appliedFixes.length > 0) {
      // Only terminology fixes were needed
      fs.writeFileSync(viPath, viContent, "utf8");
      return { filename, status: "fixed", changes };
    }
    return { filename, status: "ok", changes: [] };
  } else {
    // LLM made changes
    changes.push("[LLM Review] Content improved for naturalness");
    fs.writeFileSync(viPath, result, "utf8");
    return { filename, status: "fixed", changes };
  }
}

async function generateReport(results) {
  const fixed = results.filter((r) => r.status === "fixed");
  const ok = results.filter((r) => r.status === "ok");
  const errors = results.filter((r) => r.status === "error");

  let report = `# QA Report - Vietnamese Translations

Generated: ${new Date().toISOString()}

## Summary
- ✅ No changes needed: ${ok.length}
- 🔧 Fixed: ${fixed.length}
- ❌ Errors: ${errors.length}
- Total reviewed: ${results.length}

## Files Fixed

`;

  for (const r of fixed) {
    report += `### ${r.filename}\n`;
    for (const c of r.changes) {
      report += `- ${c}\n`;
    }
    report += "\n";
  }

  if (errors.length > 0) {
    report += `## Errors\n\n`;
    for (const r of errors) {
      report += `- ${r.filename}: ${r.error}\n`;
    }
  }

  fs.writeFileSync(CONFIG.reportFile, report, "utf8");
  console.log(`\n📄 Report saved to: ${CONFIG.reportFile}`);
}

function loadProgress() {
  try {
    if (fs.existsSync(CONFIG.progressFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.progressFile, "utf8"));
    }
  } catch (e) {
    console.warn("⚠️ Could not load progress file, starting fresh");
  }
  return { completed: [], lastIndex: 0 };
}

function saveProgress(progress) {
  fs.writeFileSync(CONFIG.progressFile, JSON.stringify(progress, null, 2), "utf8");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { startFrom: null, file: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--start-from" && args[i + 1]) {
      options.startFrom = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--file" && args[i + 1]) {
      options.file = args[i + 1];
      i++;
    } else if (args[i] === "--resume") {
      options.resume = true;
    }
  }
  return options;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Vietnamese Translation QA Script");
  console.log("=".repeat(60));

  if (!CONFIG.openrouterApiKey) {
    console.error("❌ Error: OPENROUTER_API_KEY not set in .env");
    process.exit(1);
  }

  const options = parseArgs();

  const files = await glob("*.md", { cwd: CONFIG.viDir });
  const sortedFiles = files.sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)/)?.[1] || "999");
    const numB = parseInt(b.match(/^(\d+)/)?.[1] || "999");
    return numA - numB;
  });

  // Determine starting index
  let startIndex = 0;
  const progress = loadProgress();

  if (options.startFrom) {
    // --start-from N: start from file number N (1-indexed display, but we find by file prefix)
    startIndex = sortedFiles.findIndex((f) => {
      const num = parseInt(f.match(/^(\d+)/)?.[1] || "0");
      return num >= options.startFrom;
    });
    if (startIndex === -1) startIndex = 0;
    console.log(`\n▶️  Starting from file #${options.startFrom} (index ${startIndex})`);
  } else if (options.resume) {
    // --resume: continue from last saved progress
    startIndex = progress.lastIndex;
    console.log(`\n▶️  Resuming from index ${startIndex} (${sortedFiles[startIndex] || "end"})`);
  }

  console.log(`\n📝 Found ${sortedFiles.length} files, processing ${sortedFiles.length - startIndex} files\n`);

  const results = [];

  for (let i = startIndex; i < sortedFiles.length; i++) {
    const file = sortedFiles[i];
    const fileNum = parseInt(file.match(/^(\d+)/)?.[1] || "?");
    console.log(`[${i + 1}/${sortedFiles.length}] (Lesson ${fileNum}) ${file}`);

    try {
      const result = await qaFile(file);
      results.push(result);

      if (result.status === "fixed") {
        console.log(`   🔧 Fixed: ${result.changes.length} changes`);
      } else if (result.status === "ok") {
        console.log(`   ✅ OK`);
      } else {
        console.log(`   ⏭️ Skipped: ${result.reason}`);
      }

      // Save progress after each file
      progress.completed.push(file);
      progress.lastIndex = i + 1;
      saveProgress(progress);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({ filename: file, status: "error", error: error.message });

      // Save progress even on error
      progress.lastIndex = i;
      saveProgress(progress);
    }

    if (i < sortedFiles.length - 1) {
      await sleep(CONFIG.delayBetweenRequests);
    }
  }

  await generateReport(results);

  console.log("\n" + "=".repeat(60));
  console.log("QA COMPLETE");
  console.log("=".repeat(60));
  console.log(`✅ OK: ${results.filter((r) => r.status === "ok").length}`);
  console.log(`🔧 Fixed: ${results.filter((r) => r.status === "fixed").length}`);
  console.log(`❌ Errors: ${results.filter((r) => r.status === "error").length}`);
}

// Parse arguments and run
const args = parseArgs();
if (args.file) {
  qaFile(args.file)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
} else {
  main().catch(console.error);
}
