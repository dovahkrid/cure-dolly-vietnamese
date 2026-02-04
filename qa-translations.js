/**
 * QA and Fix script for Vietnamese translations
 * Reviews each file for natural Vietnamese and fixes issues
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
  delayBetweenRequests: 2000,
};

// Known terminology fixes - add more as discovered
const TERMINOLOGY_FIXES = {
  "Động từ tự động & tha động": "Tự động từ và tha động từ",
  "Động từ tự động và tha động": "Tự động từ và tha động từ",
  "động từ tự động": "tự động từ",
  "động từ tha động": "tha động từ",
  // Add more known fixes here as you discover them
};

const QA_SYSTEM_PROMPT = `You are a Vietnamese language expert reviewing translations of Japanese grammar lessons.
Your task is to review and fix the Vietnamese translation for naturalness and accuracy.

CRITICAL RULES:
1. KEEP ALL JAPANESE TEXT UNCHANGED - Do not modify any kanji, hiragana, katakana
2. KEEP ALL MARKDOWN FORMATTING - Headers, bold, code blocks, links, images must stay intact
3. KEEP ALL HTML/VUE COMPONENTS unchanged

REVIEW CRITERIA:
1. **Natural Vietnamese**: Fix awkward phrasing, word order issues, unnatural expressions
2. **Linguistic terminology**: Use proper Vietnamese grammar terms:
   - "Tự động từ" (intransitive verb), NOT "Động từ tự động"
   - "Tha động từ" (transitive verb), NOT "Động từ tha động"
   - "Hệ từ" (copula)
   - "Trợ từ" (particle)
   - "Trợ động từ" (auxiliary verb)
3. **Consistency**: Use consistent terminology throughout
4. **Completeness**: Ensure nothing was lost in translation
5. **Grammar**: Fix Vietnamese grammatical errors

OUTPUT FORMAT:
If the translation is good and needs no changes, respond with exactly: NO_CHANGES_NEEDED

If changes are needed, respond with the COMPLETE corrected markdown content.
Do NOT include explanations - only output the corrected content or NO_CHANGES_NEEDED.`;

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

async function main() {
  console.log("=".repeat(60));
  console.log("Vietnamese Translation QA Script");
  console.log("=".repeat(60));

  if (!CONFIG.openrouterApiKey) {
    console.error("❌ Error: OPENROUTER_API_KEY not set in .env");
    process.exit(1);
  }

  const files = await glob("*.md", { cwd: CONFIG.viDir });
  const sortedFiles = files.sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)/)?.[1] || "999");
    const numB = parseInt(b.match(/^(\d+)/)?.[1] || "999");
    return numA - numB;
  });

  console.log(`\n📝 Found ${sortedFiles.length} files to review\n`);

  const results = [];

  for (let i = 0; i < sortedFiles.length; i++) {
    const file = sortedFiles[i];
    console.log(`[${i + 1}/${sortedFiles.length}] ${file}`);

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
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({ filename: file, status: "error", error: error.message });
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

// Single file mode
if (process.argv[2] === "--file") {
  const filename = process.argv[3];
  if (!filename) {
    console.error("Usage: node qa-translations.js --file <filename>");
    process.exit(1);
  }
  qaFile(filename)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
} else {
  main().catch(console.error);
}
