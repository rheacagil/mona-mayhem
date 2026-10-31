import assert from 'node:assert/strict';
import test from 'node:test';
import { getBattleCategories, getPlayerStats, scoreBattle } from '../src/lib/battle-scoring.ts';
import { parseContributionCalendar } from '../src/lib/contribution-calendar.ts';
import { GET } from '../src/pages/api/contributions/[username].ts';

function getWeek(firstDay: string, counts: number[] = Array(7).fill(0)): Record<string, unknown> {
	return {
		first_day: firstDay,
		contribution_days: counts.map((count, weekday) => ({
			weekday,
			count,
			level: count === 0 ? 0 : undefined,
		})),
	};
}

function createDays(from: string, counts: number[]): { date: string; count: number; intensity: number }[] {
	const start = new Date(`${from}T00:00:00.000Z`);
	return counts.map((count, index) => {
		const date = new Date(start);
		date.setUTCDate(start.getUTCDate() + index);
		return { date: date.toISOString().slice(0, 10), count, intensity: count === 0 ? 0 : 1 };
	});
}

test('parses a full year with zero contributions', () => {
	const weeks: Record<string, unknown>[] = [];
	const start = new Date('2023-12-31T00:00:00.000Z');
	for (let index = 0; index < 53; index += 1) {
		const firstDay = new Date(start);
		firstDay.setUTCDate(start.getUTCDate() + index * 7);
		weeks.push(getWeek(firstDay.toISOString().slice(0, 10)));
	}

	const calendar = parseContributionCalendar({
		from: '2024-01-01',
		to: '2024-12-31',
		weeks,
	});

	assert.ok(calendar);
	assert.equal(calendar.days.length, 366);
	assert.ok(calendar.days.every((day) => day.count === 0 && day.intensity === 0));
	assert.equal(
		getPlayerStats({ days: calendar.days, totalContributions: 0 }, '2025-01-01').longestStreak,
		0,
	);
});

test('counts a longest streak across month and year boundaries', () => {
	const stats = getPlayerStats(
		{
			days: createDays('2023-12-29', [1, 2, 1, 1, 3, 1]),
			totalContributions: 9,
		},
		'2024-01-04',
	);

	assert.equal(stats.longestStreak, 6);
	assert.equal(stats.currentStreak, 6);
});

test('identical player stats leave the battle tied', () => {
	const days = createDays('2024-01-01', [1, 0, 2, 1]);
	const player = { days, totalContributions: 4 };
	const firstStats = getPlayerStats(player, '2024-01-04');
	const secondStats = getPlayerStats(player, '2024-01-04');
	const categories = getBattleCategories(player, player, firstStats, secondStats);
	const outcome = scoreBattle(categories);

	assert.deepEqual(outcome.health, [100, 100]);
	assert.equal(outcome.winner, null);
});

test('API rejects invalid GitHub usernames without requesting upstream data', async (context) => {
	const originalFetch = globalThis.fetch;
	let fetchCalled = false;
	globalThis.fetch = async () => {
		fetchCalled = true;
		throw new Error('Invalid usernames must not reach upstream');
	};
	context.after(() => {
		globalThis.fetch = originalFetch;
	});

	for (const username of ['', '-leading', 'trailing-', 'double--hyphen', 'contains_underscore', 'a'.repeat(40)]) {
		const response = await GET({ params: { username } } as never);
		assert.equal(response.status, 400, `expected ${JSON.stringify(username)} to be rejected`);
		assert.deepEqual(await response.json(), { error: 'Invalid GitHub username' });
	}

	assert.equal(fetchCalled, false);
});
