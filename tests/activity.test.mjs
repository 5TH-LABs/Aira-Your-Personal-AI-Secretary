import {test} from 'node:test';import assert from 'node:assert/strict';import {activityDay,activityTime} from '../src/activity.ts';
test('older activity is preserved without a fabricated day',()=>{assert.equal(activityDay({time:'09:42'}),'Earlier activity');assert.equal(activityTime({time:'09:42'}),'09:42');});
test('new timestamps group by the Sri Lanka day including midnight boundaries',()=>{const now=new Date('2026-10-30T02:00:00Z');assert.equal(activityDay({createdAt:'2026-10-29T20:00:00Z'},now),'Today');assert.equal(activityDay({createdAt:'2026-10-29T10:00:00Z'},now),'Yesterday');});

import {monthKey} from '../src/shared/calendar.ts';
test('usage months follow the Sri Lanka calendar boundary',()=>{assert.equal(monthKey('2026-10-31T18:29:59Z'),'2026-10');assert.equal(monthKey('2026-10-31T18:30:00Z'),'2026-11');});
