import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_ACCOUNTS, DEMO_MODE, DEMO_PASSWORD, demoLoginPath, expertHandoffActions, findDemoAccount, findDemoAccountByName } from '../../src/features/demo/demoConfig.js';

test('demo mode is off unless VITE_DEMO_MODE=true', () => {
  assert.equal(DEMO_MODE, false);
});

test('login paths carry the pre-selected demo account', () => {
  assert.equal(demoLoginPath('expert', 'sara@example.com'), '/expert/login?demo=sara%40example.com');
  assert.equal(demoLoginPath('admin'), '/admin/login');
  assert.equal(demoLoginPath('user', 'investor@example.com'), '/login?demo=investor%40example.com');
});

test('every role has accounts with unique emails and bilingual names', () => {
  for (const role of ['user', 'expert', 'admin']) {
    const list = DEMO_ACCOUNTS[role];
    assert.ok(list.length > 0);
    assert.equal(new Set(list.map((a) => a.email)).size, list.length);
    for (const a of list) assert.ok(a.name.ar && a.name.en && a.role.ar && a.role.en);
  }
  assert.equal(DEMO_PASSWORD, 'Password123!');
});

test('lookups are case-insensitive by email and match experts by displayed name', () => {
  assert.equal(findDemoAccount('expert', 'SARA@example.com')?.name.en, 'Sara Al Mansoori');
  assert.equal(findDemoAccountByName('expert', 'سارة المنصوري')?.email, 'sara@example.com');
  assert.equal(findDemoAccount('expert', 'nobody@example.com'), null);
});

test('hand-off actions target the invited demo experts, else the generic expert login', () => {
  const actions = expertHandoffActions([{ name: 'سارة المنصوري' }, { name: 'سارة المنصوري' }, { name: 'Karim Fouad' }]);
  assert.deepEqual(actions.map((a) => a.email), ['sara@example.com', 'karim@example.com']);
  const generic = expertHandoffActions([{ name: 'Someone Real' }]);
  assert.equal(generic.length, 1);
  assert.equal(generic[0].email, undefined);
});
