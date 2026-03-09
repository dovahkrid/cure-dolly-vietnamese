const fs = require("fs");
const path = require("path");

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
  outputFile: "./config/docs/vi/jlpt-grammar-guide.md",
  progressFile: "./jlpt-progress.json",
  delayBetweenRequests: 2000,
};

const SYSTEM_PROMPT = `You are an expert Japanese language teacher creating a JLPT grammar reference guide that is bilingual (English and Vietnamese).

RULES:
1. For each grammar point, provide:
   - The pattern in Japanese
   - Meaning in English AND Vietnamese
   - 2-3 example sentences with Japanese, English translation, and Vietnamese translation
   - Brief usage note if there's a common mistake or nuance
2. Keep ALL Japanese text unchanged
3. Format consistently using the markdown table/list format shown in the user prompt
4. Be concise but complete — this is a reference, not a textbook
5. Order grammar points from most fundamental to more nuanced within each level
6. Output ONLY the content, no preamble or closing remarks
7. Make sure examples use natural, everyday Japanese — not textbook-stiff sentences`;

const SECTIONS = [
  {
    id: "n5",
    title: "JLPT N5",
    titleVi: "JLPT N5 — Nền tảng / Foundation",
    prompt: `Generate a COMPLETE JLPT N5 grammar reference. Include ALL major N5 grammar points (approximately 80+ points). Organize into logical sub-groups:

1. **Sentence endings & copula**: です, だ, ます, ません, ました, ませんでした
2. **Particles**: は, が, を, に, で, へ, と, も, の, か, から, まで, より, ね, よ, な
3. **Verb forms**: dictionary form, ます form, て form, た form, ない form, たい form
4. **Adjectives**: い-adjectives, な-adjectives, past tense, negative
5. **Basic patterns**: がある/いる, ことができる, たことがある, ているところ, てから, てもいい, てはいけない, なければならない, なくてもいい, ないでください, ましょう, ましょうか, たり...たりする, のがすき, のがじょうず/へた, つもり, 予定, はずだ
6. **Question words**: 何, 誰, どこ, いつ, なぜ/どうして, どう, いくら, いくつ
7. **Comparisons**: より, のほうが, いちばん
8. **Counters & time**: 時間, ～つ, ～個, ～人, ～本, etc.
9. **Conjunctions**: そして, でも, だから, それから, けど
10. **Other essentials**: まだ, もう, あまり...ない, 全然...ない, だけ, しか...ない, ちょっと

For each grammar point use this format:

### Pattern: 〜てもいい
**Meaning:** May do / It's okay to do ~ | Được phép làm / Làm ~ cũng được
**Formation:** Verb て-form + もいい
- 写真を撮ってもいいですか → May I take a photo? → Tôi chụp ảnh được không?
- ここに座ってもいいよ → You can sit here → Ngồi đây được nè
> **Note:** Use てもいいですか to ask permission politely.`
  },
  {
    id: "n4",
    title: "JLPT N4",
    titleVi: "JLPT N4 — Cơ bản / Elementary",
    prompt: `Generate a COMPLETE JLPT N4 grammar reference. Include ALL major N4 grammar points (approximately 60+ points). Organize into logical sub-groups:

1. **Verb forms**: passive (られる), causative (させる), potential (られる/える), volitional (よう), conditional (たら, ば, と, なら), imperative
2. **て-form extensions**: てあげる, てくれる, てもらう, ておく, てしまう, てある, ていく, てくる, てみる
3. **Auxiliary expressions**: そうだ (looks like), そうだ (hearsay), ようだ, らしい, みたい, はず, つもり, ことにする, ことになる
4. **Conjunctions & connectors**: し, ので, のに, ながら, たり...たり, ても
5. **Nominal expressions**: こと, の (nominalization), ため, よう
6. **Degree & extent**: すぎる, やすい, にくい, ほど, くらい/ぐらい
7. **Giving/receiving**: あげる, もらう, くれる (plain and て-form)
8. **Other patterns**: ようにする, ようになる, ことがある, ばかり, ところ, ようとする, させてもらう, てほしい, かもしれない, にちがいない

For each grammar point use this format:

### Pattern: 〜すぎる
**Meaning:** Too much ~ | Quá ~ / ~ quá
**Formation:** Verb い-stem + すぎる | Adj-い (drop い) + すぎる | Adj-な + すぎる
- 食べすぎた → Ate too much → Ăn quá nhiều rồi
- この映画は長すぎる → This movie is too long → Phim này dài quá
- 静かすぎて怖い → It's too quiet and scary → Yên tĩnh quá nên sợ
> **Note:** すぎる itself conjugates as an ichidan verb (すぎます, すぎない, etc.)`
  },
  {
    id: "n3",
    title: "JLPT N3",
    titleVi: "JLPT N3 — Trung cấp / Intermediate",
    prompt: `Generate a COMPLETE JLPT N3 grammar reference. Include ALL major N3 grammar points (approximately 70+ points). Organize into logical sub-groups:

1. **Conditional & hypothetical**: としたら, とすれば, ものなら, さえ...ば, ないことには
2. **Reason & cause**: わけだ, わけではない, わけにはいかない, わけがない, ことだから, 以上(は), からには, 上で
3. **Contrast & concession**: にもかかわらず, ものの, とはいえ, くせに, ながら(も), つつ(も), にしても, としても
4. **Extent & degree**: ほど, くらい/ぐらい, ばかり, だらけ, っぽい, 気味
5. **Time expressions**: たとたん, 際(に), うちに, ついでに, てからでないと, にあたって, に先立って, 次第
6. **Tendency & habit**: がち, 傾向がある, ものだ (tendency), ことだ (advice)
7. **Relation**: に関して, について, にとって, に対して, において, にわたって, を通じて, をめぐって
8. **Emphasis & listing**: こそ, さえ, すら, はもちろん, はもとより, をはじめ, ばかりか, どころか, に限らず
9. **Others**: っけ, っぱなし, かねる, かねない, 得る(うる/える), ざるを得ない, ないわけにはいかない, せいで/おかげで, 向け/向き

For each grammar point use this format:

### Pattern: 〜わけにはいかない
**Meaning:** Cannot / must not ~ (due to social/moral reasons) | Không thể ~ được (vì lý do xã hội/đạo đức)
**Formation:** Verb dictionary form + わけにはいかない
- 約束したから、行かないわけにはいかない → I promised, so I can't not go → Đã hứa rồi nên không thể không đi
- 秘密だから言うわけにはいかない → It's a secret so I can't tell → Là bí mật nên không thể nói được
> **Note:** Different from できない (physical inability). This is about social obligation.`
  },
  {
    id: "n2",
    title: "JLPT N2",
    titleVi: "JLPT N2 — Trung cao cấp / Upper-Intermediate",
    prompt: `Generate a COMPLETE JLPT N2 grammar reference. Include ALL major N2 grammar points (approximately 70+ points). Organize into logical sub-groups:

1. **Formal expressions**: において, における, にあたり, に際して, を踏まえて, をもって, に基づいて, に沿って
2. **Emphasis**: からこそ, てこそ, ばこそ, にほかならない, に相違ない, といっても過言ではない
3. **Limitation**: に限り, に限って, を限りに, きり, っきり, のみ, だけあって, ならでは
4. **Degree & proportion**: にしたがって, につれて, に伴って, とともに, 一方(で), 反面, 半面
5. **Negative patterns**: ものか, ようがない/ようもない, どころではない, はおろか, ないものか, ずにはいられない, てならない, てたまらない, てしょうがない/しかたがない
6. **Conditional**: ものなら, ようものなら, としたところで, ないことには, なくして(は), んばかりに
7. **Comparison & contrast**: 一方(で), かと思ったら, と思いきや, わりに(は), にしては, 割に
8. **Intent & attempt**: べく, ようにも〜ない, かけ, んがため(に), にかけて(は)
9. **Result & conclusion**: 結果, 末(に), あげく, 挙句の果てに, ことから, 以来, を機に, を契機に
10. **Others**: っこない, ぶり, げ, まみれ, ずくめ, 抜き, がてら, つつある, かたがた

For each grammar point use this format:

### Pattern: 〜ずにはいられない
**Meaning:** Can't help but ~ / Can't resist ~ing | Không thể không ~ / Không nhịn được mà phải ~
**Formation:** Verb ない-stem + ずにはいられない (する → せずにはいられない)
- この映画を見ると泣かずにはいられない → I can't help crying when I watch this movie → Xem phim này không thể không khóc
- あの店を見ると買わずにはいられない → I can't resist buying when I see that shop → Thấy cửa hàng đó là không nhịn được mà phải mua
> **Note:** Very literary. Casual equivalent: ないではいられない or just つい〜てしまう`
  },
  {
    id: "n1",
    title: "JLPT N1",
    titleVi: "JLPT N1 — Cao cấp / Advanced",
    prompt: `Generate a COMPLETE JLPT N1 grammar reference. Include ALL major N1 grammar points (approximately 80+ points). Organize into logical sub-groups:

1. **Formal/written expressions**: たる, たるもの, ともなると, ともなれば, であれ, であろうと, をものともせず, ならいざしらず, はさておき
2. **Emphasis & extreme**: ただ〜のみ, てやまない, に堪えない, 極まる/極まりない, この上ない, といったらない/ありはしない
3. **Cause & reason**: ゆえに, 手前, ばかりに, とあって, 至って, ともあろう
4. **Negative nuance**: まじき, べからず, べくもない, ならまだしも, はともかく(として), もさることながら
5. **Concession**: ものを, ところを, とはいうものの, いかに〜とも, たところで, つつも, ながらも
6. **Time & sequence**: が早いか, や否や, なり, そばから, ところに/ところへ, 折(に), 矢先(に), にあって
7. **Relation & scope**: をよそに, をしり目に, を皮切りに(して), にひきかえ, とあいまって, に則って/に即して
8. **Manner**: ごとく, ごとし, んばかりに, いかんによっては, かたわら, ともなく/ともなしに, まくる
9. **Conjecture & hearsay**: とか (hearsay), とのことだ, まい (negative conjecture), であれ〜であれ, にせよ〜にせよ
10. **Others**: ずじまい, 始末だ, ないまでも, ならまだしも, でなくてなんだろう, とは打って変わって, をおいて〜ない

For each grammar point use this format:

### Pattern: 〜や否や (やいなや)
**Meaning:** As soon as ~ / The moment ~ | Vừa ~ thì ngay lập tức / Vừa ~ là
**Formation:** Verb dictionary form + や否や
- ベルが鳴るや否や、学生たちは教室を飛び出した → The moment the bell rang, the students rushed out → Vừa nghe chuông kêu, học sinh lập tức chạy ổ ra khỏi lớp
- 彼は目を覚ますや否や、スマホをチェックした → As soon as he woke up, he checked his phone → Vừa thức dậy là anh ấy kiểm tra điện thoại ngay
> **Note:** Very literary/formal. Similar to が早いか and なり. Casual: 〜たとたん or 〜てすぐ`
  },
];

async function generateSection(section) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.openrouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/cure-dolly-vietnamese",
      "X-Title": "JLPT Grammar Guide Generator",
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: section.prompt },
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("=".repeat(60));
  console.log("JLPT Grammar Guide Generator");
  console.log("=".repeat(60));

  if (!CONFIG.openrouterApiKey) {
    console.error("\nError: OPENROUTER_API_KEY not set in .env");
    process.exit(1);
  }

  // Load progress
  let progress = {};
  if (fs.existsSync(CONFIG.progressFile)) {
    progress = JSON.parse(fs.readFileSync(CONFIG.progressFile, "utf8"));
    console.log(`Resuming: ${Object.keys(progress).length}/${SECTIONS.length} sections done`);
  }

  console.log(`Model: ${CONFIG.model}`);
  console.log(`Sections: ${SECTIONS.length}\n`);

  for (const section of SECTIONS) {
    if (progress[section.id]) {
      console.log(`Skipping ${section.id} (cached)`);
      continue;
    }

    console.log(`Generating ${section.id}...`);
    try {
      const content = await generateSection(section);
      progress[section.id] = { title: section.titleVi, content };
      fs.writeFileSync(CONFIG.progressFile, JSON.stringify(progress, null, 2));
      console.log(`  Done: ${section.id}`);
    } catch (error) {
      console.error(`  Error: ${section.id} - ${error.message}`);
      fs.writeFileSync(CONFIG.progressFile, JSON.stringify(progress, null, 2));
      // Retry once after delay
      console.log(`  Retrying ${section.id} in 5s...`);
      await sleep(5000);
      try {
        const content = await generateSection(section);
        progress[section.id] = { title: section.titleVi, content };
        fs.writeFileSync(CONFIG.progressFile, JSON.stringify(progress, null, 2));
        console.log(`  Done (retry): ${section.id}`);
      } catch (retryError) {
        console.error(`  Failed again: ${section.id} - ${retryError.message}`);
      }
    }

    await sleep(CONFIG.delayBetweenRequests);
  }

  // Build final markdown
  let md = `# JLPT Grammar Reference / Tổng hợp Ngữ pháp JLPT

> Complete JLPT grammar reference from N5 to N1, bilingual English-Vietnamese.
> Tổng hợp ngữ pháp JLPT đầy đủ từ N5 đến N1, song ngữ Anh-Việt.

## How to use this guide / Cách sử dụng

- **N5** 🟢: Absolute basics — start here | Nền tảng — bắt đầu từ đây
- **N4** 🟡: Elementary grammar | Ngữ pháp sơ cấp
- **N3** 🟠: Intermediate — most common in daily life | Trung cấp — phổ biến nhất trong đời sống
- **N2** 🔵: Upper-intermediate — news, business, novels | Trung cao cấp — tin tức, kinh doanh, tiểu thuyết
- **N1** 🔴: Advanced — literary, academic, formal | Cao cấp — văn chương, học thuật, trang trọng

> **Tip / Mẹo:** Cure Dolly lessons 1-20 ≈ N5, lessons 21-40 ≈ N4-N3, lessons 41-97 ≈ N3-N1.
> Cure Dolly focuses on understanding the *logic* behind grammar; JLPT focuses on pattern recognition. Both approaches complement each other.
>
> Cure Dolly tập trung vào *logic* đằng sau ngữ pháp; JLPT tập trung vào nhận dạng mẫu. Hai cách tiếp cận bổ trợ cho nhau.

---

`;

  const levelEmojis = { n5: "🟢", n4: "🟡", n3: "🟠", n2: "🔵", n1: "🔴" };

  for (const section of SECTIONS) {
    if (!progress[section.id]) {
      md += `## ${levelEmojis[section.id]} ${section.titleVi}\n\n*Generation failed — re-run script to retry.*\n\n---\n\n`;
      continue;
    }

    md += `## ${levelEmojis[section.id]} ${progress[section.id].title}\n\n`;
    md += progress[section.id].content;
    md += `\n\n---\n\n`;
  }

  md += `*Generated for the Cure Dolly Vietnamese translation project. Combines JLPT standard grammar with bilingual explanations.*\n`;

  fs.mkdirSync(path.dirname(CONFIG.outputFile), { recursive: true });
  fs.writeFileSync(CONFIG.outputFile, md, "utf8");
  console.log(`\nWrote JLPT guide to: ${CONFIG.outputFile}`);

  // Clean up progress if all done
  if (Object.keys(progress).length === SECTIONS.length) {
    fs.unlinkSync(CONFIG.progressFile);
    console.log("Cleaned up progress file.");
  }
}

main().catch(console.error);
