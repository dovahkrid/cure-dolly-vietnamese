const fs = require("fs");

const INPUT = "./config/docs/vi/summary.md";
const OUTPUT = "./config/docs/vi/summary.md";

// Difficulty classification by lesson number
// Based on topic complexity, not just order
const DIFFICULTY = {
  // === BEGINNER: Core sentence structure, basic particles, verb forms ===
  beginner: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 20, 21],
  // === INTERMEDIATE: Conjugations, conditionals, grammar patterns ===
  intermediate: [
    13, 18, 19, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
    37, 38, 39, 40, 41, 42, 43, 44, 46, 47, 49, 55, 58, 63, 67, 71, 72, 80,
    82, 83,
  ],
  // === ADVANCED: Deep structure, nuance, native-level patterns ===
  advanced: [
    48, 50, 51, 52, 53, 54, 56, 57, 59, 60, 61, 62, 64, 65, 66, 68, 69, 70,
    73, 74, 75, 76, 77, 78, 79, 81, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93,
    94, 95, 96, 97,
  ],
  // === META: Study tips, not grammar ===
  meta: [45],
};

// 7.5 is lesson 7.5
const DIFFICULTY_75 = "beginner";
const DIFFICULTY_8B = "beginner";

function getDifficulty(num, file) {
  if (file && file.includes("7-5")) return DIFFICULTY_75;
  if (file && file.includes("8b")) return DIFFICULTY_8B;
  for (const [level, nums] of Object.entries(DIFFICULTY)) {
    if (nums.includes(num)) return level;
  }
  return "intermediate";
}

const TAGS = {
  beginner: "🟢 Cơ bản",
  intermediate: "🟡 Trung cấp",
  advanced: "🔴 Nâng cao",
  meta: "📚 Phương pháp học",
};

const READING_ORDER = `# Cure Dolly - Tóm tắt bài học

> Tóm tắt ngắn gọn 99 bài học ngữ pháp tiếng Nhật từ Cure Dolly, dành cho người mới bắt đầu.
>
> 🟢 Cơ bản · 🟡 Trung cấp · 🔴 Nâng cao · 📚 Phương pháp học

## Lộ trình học đề xuất

### Giai đoạn 1: Nền tảng (Bài 1-12)
Hiểu cấu trúc câu cơ bản, trợ từ, chia động từ, て-form. **Đây là phần quan trọng nhất** — nếu hiểu vững giai đoạn này thì phần sau sẽ dễ hơn nhiều.

> Bài 1 → 2 → 3 → 4 → 5 → 6 → 7 → 7.5 → 8 → 8b → 9 → 10 → 11 → 12

### Giai đoạn 2: Mở rộng ngữ pháp (Bài 13-33)
Học thêm các dạng chia động từ (passive, causative, volitional), trợ từ nâng cao, điều kiện, so sánh.

> Bài 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25 → 26 → 27 → 28 → 29 → 30 → 31 → 32 → 33

### Giai đoạn 3: Hiểu sâu hơn (Bài 34-50)
Phân tích câu phức, thứ tự từ, sự mơ hồ, tiếng Nhật tự nhiên.

> Bài 34 → 35 → 36 → 37 → 38 → 39 → 40 → 41 → 42 → 43 → 44 → 45 → 46 → 47 → 48 → 49 → 50

### Giai đoạn 4: Thực chiến & nâng cao (Bài 51-97)
Đọc hiểu văn bản thật, trợ từ kép, cấu trúc nâng cao, sắc thái ngôn ngữ.

> Bài 51 → 52 → ... → 97 (theo thứ tự hoặc chọn chủ đề quan tâm)

---

`;

function main() {
  let content = fs.readFileSync(INPUT, "utf8");
  const lines = content.split("\n");
  const output = [];

  let headerWritten = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip the old header (everything before first ## lesson heading)
    if (!headerWritten) {
      if (line.startsWith("## ") && /## \d+\./.test(line)) {
        output.push(READING_ORDER);
        headerWritten = true;
        // Fall through to process this line
      } else {
        continue;
      }
    }

    // Fix lesson headings: "## 1. 1. Title" → "## 1. Title" + add difficulty tag
    const headingMatch = line.match(/^## (\d+)\. \d+[\.\s]*(.+)$/);
    // Also handle "## 7. 7.5 Conjugation" style
    const headingMatch2 = line.match(/^## (\d+)\. (.+)$/);

    if (headingMatch) {
      const num = parseInt(headingMatch[1]);
      const title = headingMatch[2].trim();
      const diff = getDifficulty(num, lines[i]);
      const tag = TAGS[diff];
      output.push(`## ${num}. ${title} ${tag}`);
    } else if (headingMatch2 && !headingMatch) {
      // Already clean heading, just add tag
      const num = parseInt(headingMatch2[1]);
      const title = headingMatch2[2].trim();
      const diff = getDifficulty(num, lines[i]);
      const tag = TAGS[diff];
      // Check if tag already present
      if (!title.includes("🟢") && !title.includes("🟡") && !title.includes("🔴") && !title.includes("📚")) {
        output.push(`## ${num}. ${title} ${tag}`);
      } else {
        output.push(line);
      }
    } else {
      output.push(line);
    }
  }

  fs.writeFileSync(OUTPUT, output.join("\n"), "utf8");
  console.log("Done! Summary post-processed.");

  // Count by difficulty
  const counts = { beginner: 0, intermediate: 0, advanced: 0, meta: 0 };
  for (const [level, nums] of Object.entries(DIFFICULTY)) {
    counts[level] = nums.length;
  }
  // Add 7.5 and 8b
  counts.beginner += 2;
  console.log(`  🟢 Cơ bản: ${counts.beginner}`);
  console.log(`  🟡 Trung cấp: ${counts.intermediate}`);
  console.log(`  🔴 Nâng cao: ${counts.advanced}`);
  console.log(`  📚 Phương pháp: ${counts.meta}`);
}

main();
