# Japanese Grammar Visual Learning App — Product Brief

## Vision
An animated, visual Japanese grammar learning web app organized by JLPT levels (N5→N1), where grammar points are taught through interactive visualizations inspired by Cure Dolly's train metaphor. JLPT is the primary structure; Cure Dolly lessons serve as supplementary "deep dive" links.

## Target User
Vietnamese-speaking Japanese learners (beginner to advanced). UI in Vietnamese + English, all Japanese content preserved.

## Core Concept
- **JLPT-first organization**: Grammar points grouped by N5 → N4 → N3 → N2 → N1
- **Visual/animated teaching**: Each grammar point has interactive animations that show HOW the grammar works (e.g., particles as connectors, verb conjugation as transformation, sentence structure as train cars)
- **Cure Dolly as assist**: Link to relevant Cure Dolly lesson for deeper structural understanding
- **Not a quiz app** (v1): Focus on understanding through visualization, not testing

## MVP Scope (v1): N5 Only
~80 grammar points, fully animated and polished. If it works, expand level by level.

### Key Features (v1)
1. **Grammar browser** — Browse N5 grammar points by category (particles, verb forms, patterns, etc.)
2. **Animated grammar cards** — Each point has:
   - Pattern name + formation rule
   - Animated visualization showing how the grammar works
   - 2-3 example sentences (Japanese → English → Vietnamese)
   - Link to related Cure Dolly lesson (if applicable)
3. **Progress tracking** — Mark points as "learning" / "understood" / "mastered", persisted in localStorage
4. **Search** — Find grammar by Japanese pattern, English meaning, or Vietnamese meaning
5. **Responsive** — Works on desktop and mobile

### Animation Concepts
- **Sentence structure**: Train metaphor — subject car (A) + engine (B), particles as connectors between cars
- **Verb conjugation**: Morphing animation showing the verb stem staying while the ending transforms (食べ|る → 食べ|た → 食べ|ている)
- **Particles**: Visual metaphor — が as a spotlight on the subject, を as an arrow to the object, に as a pin on a location
- **て-form helpers**: Stacking blocks — base verb + て + helper verb, each block animated in
- **Comparisons**: Side-by-side split screen showing the difference (e.g., は vs が, ている vs てある)

### Future Levels (v2+)
- N4, N3, N2, N1 (progressive unlock or free browse)
- Quiz/flashcard mode
- Spaced repetition
- User accounts + cloud sync
- Community-contributed animations

## Tech Stack (Recommended)
- **Framework**: Next.js 14+ (App Router) or Vite + React
- **Animations**: Framer Motion (declarative, React-native) + Lottie for complex illustrations
- **Styling**: Tailwind CSS
- **State**: Zustand or localStorage for v1
- **Data**: Static JSON files generated from the JLPT grammar guide markdown
- **Deployment**: Vercel or Cloudflare Pages

## Data Resources (Included)
These files are in this folder and serve as the raw content source:

| File | Content | Lines |
|---|---|---|
| `jlpt-grammar-guide.md` | All JLPT N5-N1 grammar points, bilingual EN/VI, with examples | 2,600 |
| `tense-aspect-guide.md` | Complete tense/aspect system reference, bilingual | 500 |
| `summary.md` | 97 Cure Dolly lesson summaries with difficulty tags | 1,500 |

### Data Pipeline
1. Parse `jlpt-grammar-guide.md` → structured JSON (one object per grammar point)
2. Parse `summary.md` → map Cure Dolly lessons to JLPT levels for cross-referencing
3. Use `tense-aspect-guide.md` as content for the tense/aspect section animations

## Cure Dolly ↔ JLPT Mapping (Approximate)
| JLPT Level | Cure Dolly Lessons | Topics |
|---|---|---|
| N5 | 1-20 | Sentence structure, particles, verb groups, て-form, adjectives |
| N4 | 13-33 | Passive, causative, conditionals, て-form helpers, hearsay |
| N3 | 34-60 | Complex sentences, nuance, ambiguity, deeper particle usage |
| N2 | 55-80 | Formal patterns, double particles, structural analysis |
| N1 | 75-97 | Literary forms, advanced nuance, native-level patterns |

## Design Direction
- Clean, modern, dark/light mode
- Satisfying micro-animations (hover, transitions, progress)
- Japanese aesthetic influence (subtle, not over-the-top)
- Inspiration: Brilliant.org (interactive learning), Duolingo (gamification later), Linear (clean UI)

## Non-Goals (v1)
- No user accounts / auth
- No backend / database
- No quiz / testing mode
- No mobile app (responsive web only)
- No N4-N1 content (N5 only for MVP)
