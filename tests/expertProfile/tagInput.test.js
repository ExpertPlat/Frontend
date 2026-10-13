import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeUniqueTags, splitTags } from '../../src/components/TagInput/tagUtils.js';

test('tag input accepts Arabic and English separators', () => {
  assert.deepEqual(splitTags('قانون، عقود, تحكيم; امتثال\nضرائب'), ['قانون', 'عقود', 'تحكيم', 'امتثال', 'ضرائب']);
});

test('tag input removes duplicates and respects the maximum', () => {
  assert.deepEqual(mergeUniqueTags(['Legal'], 'legal, Contracts, Tax', 3), ['Legal', 'Contracts', 'Tax']);
});
