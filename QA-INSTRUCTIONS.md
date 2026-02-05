# QA Instructions

## Resume QA from where we left off

The QA was paused at file 15/102 (lesson 14). To continue:

```bash
# Set your API key in .env file
OPENROUTER_API_KEY=your-key-here

# Resume from lesson 15 (file number in filename)
npm run qa -- --start-from 15

# Or auto-resume from last saved progress
npm run qa -- --resume

# Run full QA (will re-check all files from beginning)
npm run qa

# Run QA on a single file
npm run qa -- --file "15-transitive-intransitive-verbs.md"
```

## Progress tracking

The script automatically saves progress to `qa-progress.json`. If the script crashes or you stop it, you can:
- Use `--resume` to continue from where it stopped
- Use `--start-from N` to start from a specific lesson number

## Files already QA'd (lessons 1-13)
- 1-the-basic-types-of-sentences.md
- 2-the-invisible-carriage-and-the-を-particle.md
- 3-the-は-particle.md
- 4-japanese-verb-tenses.md
- 5-verb-groups-and-the-て-form.md
- 6-adjectives.md
- 7-negative-forms-and-adjectives-in-past-tense.md
- 7-5-conjugation.md
- 8-the-に-and-へ-particles.md
- 8b-particles-explained.md
- 9-the-subject-of-the-japanese-sentence...md
- 10-helper-verbs-the-potential-helper-verb.md
- 11-compound-sentences-くれる-あげる...md
- 12-quotation-particle-と...md
- 13-passive-conjugation-receptive-helper-verb.md

## Adding terminology fixes

Edit `qa-translations.js` and add to `TERMINOLOGY_FIXES`:

```javascript
const TERMINOLOGY_FIXES = {
  "wrong phrase": "correct phrase",
  // Add more as discovered
};
```

### Standard terminology (Vietnamese Japanese education)

| English | Vietnamese (correct) | Wrong |
|---------|---------------------|-------|
| intransitive verb (自動詞) | tự động từ | động từ tự động |
| transitive verb (他動詞) | tha động từ | động từ tha động |
| particle (助詞) | trợ từ | hạt, tiểu từ |
| auxiliary verb (助動詞) | trợ động từ | động từ phụ |
| causative | thể cầu khiến | thể sai khiến |

## After QA completes

1. Check `qa-report.md` for summary of changes
2. Run `npm run docs:build` to verify site builds
3. Commit and push changes
