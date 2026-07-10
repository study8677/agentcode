# Repair slug normalization

`normalizeSlug` converts user input into a URL slug. The current implementation preserves punctuation, path separators, and some Unicode combining marks, and it can return an empty string.

Change only `src/slug.ts` and submit a unified diff patch. The result must contain lowercase ASCII letters, digits, and single hyphens; collapse separators; fold common accented Latin letters; and throw `TypeError` when no valid slug remains.
