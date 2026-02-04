# QA Instructions

## Resume QA from where we left off

The QA was paused at file 15/102 (lesson 13). To continue:

```bash
# Set your API key
$env:OPENROUTER_API_KEY="your-key-here"

# Run full QA (will re-check all files)
npm run qa

# Or run QA on a single file
npm run qa:file "15-transitive-intransitive-verbs.md"
```

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

## After QA completes

1. Check `qa-report.md` for summary of changes
2. Run `npm run docs:build` to verify site builds
3. Commit and push changes
