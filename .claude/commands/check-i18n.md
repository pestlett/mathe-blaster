Audit the i18n system in Mathe Blaster for missing or inconsistent translations.

Read js/i18n.js in full.

Then:
1. Extract all string keys defined in STRINGS.en
2. Check every key exists in STRINGS.de — list any missing ones
3. Check every key exists in STRINGS.es — list any missing ones
4. Check the reverse: any keys in de or es that don't exist in en
5. Scan index.html for any data-i18n, data-i18n-ph, or data-i18n-html attributes — check each referenced key exists in STRINGS.en
6. Report a summary table:
   - Keys missing from DE
   - Keys missing from ES
   - Keys in HTML but not in STRINGS
   - Any placeholder {var} mismatches between languages

If there are missing keys, ask whether to add stub translations or translate them properly. If translating properly, use the `i18n-translator` agent — it knows the correct register and math terminology for both languages.

After fixing, run npm test to verify i18n.test.js passes.
