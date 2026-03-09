const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

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
  model: process.env.MODEL || "anthropic/claude-sonnet-4",
  inputDir: "./config/docs/en",
  outputFile: "./config/docs/vi/summary.md",
  delayBetweenRequests: 2000,
  concurrency: 3,
};

const SYSTEM_PROMPT = `You are a Japanese language tutor helping a Vietnamese-speaking beginner understand Cure Dolly's grammar lessons.

Your task: summarize a lesson into a SHORT TL;DR in Vietnamese.

RULES:
1. Write the summary in Vietnamese
2. KEEP ALL JAPANESE TEXT UNCHANGED (kanji, hiragana, katakana, romaji)
3. Scale length to complexity: simple topics get 2-3 sentences, complex ones get a short paragraph
4. Include 2-5 KEY example sentences from the lesson — pick the ones that best illustrate the grammar point
5. Format examples as: Japanese → Vietnamese meaning
6. Be concise and practical — a beginner should walk away understanding the core idea
7. Do NOT include the lesson title — just the summary content
8. Output ONLY the summary, no preamble`;

async function summarizeWithOpenRouter(content, filename) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.openrouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/cure-dolly-vietnamese",
      "X-Title": "Cure Dolly Summary Generator",
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Summarize this Cure Dolly lesson for a Vietnamese-speaking Japanese beginner. Keep all Japanese text intact. Include 2-5 key examples.\n\n${content}`,
        },
      ],
      max_tokens: 2000,
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractLessonNumber(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 999;
}

function extractLessonTitle(content) {
  const match = content.match(/^#\s*\*?\*?(.+?)\*?\*?\s*$/m);
  return match ? match[1].replace(/\*\*/g, "").trim() : null;
}

async function processLesson(file) {
  const inputPath = path.join(CONFIG.inputDir, file);
  const content = fs.readFileSync(inputPath, "utf8");
  const num = extractLessonNumber(file);
  const title = extractLessonTitle(content) || file.replace(".md", "");

  console.log(`  [${num}] Summarizing: ${file}`);
  const summary = await summarizeWithOpenRouter(content, file);
  return { num, title, summary, file };
}

async function processBatch(batch) {
  return Promise.all(batch.map((file) => processLesson(file)));
}

async function main() {
  console.log("=".repeat(60));
  console.log("Cure Dolly Lesson Summarizer");
  console.log("=".repeat(60));

  if (!CONFIG.openrouterApiKey) {
    console.error("\nError: OPENROUTER_API_KEY not set in .env");
    process.exit(1);
  }

  // Check for existing progress
  const progressFile = "./summarize-progress.json";
  let completed = {};
  if (fs.existsSync(progressFile)) {
    completed = JSON.parse(fs.readFileSync(progressFile, "utf8"));
    console.log(`\nResuming: ${Object.keys(completed).length} lessons already done`);
  }

  const allFiles = await glob("*.md", { cwd: CONFIG.inputDir });
  const lessonFiles = allFiles
    .filter((f) => /^\d+/.test(f))
    .sort((a, b) => extractLessonNumber(a) - extractLessonNumber(b));

  const filesToProcess = lessonFiles.filter((f) => !completed[f]);

  console.log(`\nModel: ${CONFIG.model}`);
  console.log(`Total lessons: ${lessonFiles.length}`);
  console.log(`Remaining: ${filesToProcess.length}`);
  console.log(`Concurrency: ${CONFIG.concurrency}\n`);

  // Process in batches
  for (let i = 0; i < filesToProcess.length; i += CONFIG.concurrency) {
    const batch = filesToProcess.slice(i, i + CONFIG.concurrency);
    console.log(`\nBatch ${Math.floor(i / CONFIG.concurrency) + 1}/${Math.ceil(filesToProcess.length / CONFIG.concurrency)}`);

    try {
      const results = await processBatch(batch);
      for (const r of results) {
        completed[r.file] = { num: r.num, title: r.title, summary: r.summary };
        console.log(`  Done: [${r.num}] ${r.file}`);
      }
      // Save progress after each batch
      fs.writeFileSync(progressFile, JSON.stringify(completed, null, 2));
    } catch (error) {
      console.error(`  Batch error: ${error.message}`);
      // Save progress so far
      fs.writeFileSync(progressFile, JSON.stringify(completed, null, 2));
    }

    if (i + CONFIG.concurrency < filesToProcess.length) {
      await sleep(CONFIG.delayBetweenRequests);
    }
  }

  // Build final markdown
  const sorted = Object.values(completed).sort((a, b) => a.num - b.num);

  let md = `# Cure Dolly - Tóm tắt bài học\n\n`;
  md += `> Tóm tắt ngắn gọn ${sorted.length} bài học ngữ pháp tiếng Nhật từ Cure Dolly, dành cho người mới bắt đầu.\n\n`;
  md += `---\n\n`;

  for (const lesson of sorted) {
    md += `## ${lesson.num}. ${lesson.title}\n\n`;
    md += `${lesson.summary}\n\n`;
    md += `---\n\n`;
  }

  fs.mkdirSync(path.dirname(CONFIG.outputFile), { recursive: true });
  fs.writeFileSync(CONFIG.outputFile, md, "utf8");
  console.log(`\nWrote summary to: ${CONFIG.outputFile}`);
  console.log(`Total lessons summarized: ${sorted.length}`);

  // Clean up progress file
  if (filesToProcess.length === 0 || Object.keys(completed).length === lessonFiles.length) {
    fs.unlinkSync(progressFile);
    console.log("Cleaned up progress file.");
  }
}

main().catch(console.error);
