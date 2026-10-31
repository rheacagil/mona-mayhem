import type { APIRoute } from 'astro';

export const prerender = false;

const cacheHeaders = {
	'Cache-Control': 'public, max-age=300',
	'Content-Type': 'application/json',
};

type ContributionDay = {
	date: string;
	count: number;
	intensity: number;
};

type ContributionCalendar = {
	from: string;
	to: string;
	days: ContributionDay[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isDate(value: unknown): value is string {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isNonNegativeInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function getIntensity(count: number, upstreamLevel: unknown): number {
	if (isNonNegativeInteger(upstreamLevel) && upstreamLevel <= 4) {
		return upstreamLevel;
	}

	if (count === 0) return 0;
	if (count <= 3) return 1;
	if (count <= 6) return 2;
	if (count <= 9) return 3;
	return 4;
}

function parseCalendar(payload: unknown): ContributionCalendar | null {
	if (!isRecord(payload) || !isDate(payload.from) || !isDate(payload.to) || payload.from > payload.to || !Array.isArray(payload.weeks)) {
		return null;
	}

	const days: ContributionDay[] = [];

	for (const week of payload.weeks) {
		if (!isRecord(week) || !isDate(week.first_day) || !Array.isArray(week.contribution_days) || week.contribution_days.length !== 7) {
			return null;
		}

		const firstDay = new Date(`${week.first_day}T00:00:00.000Z`);
		if (firstDay.getUTCDay() !== 0) {
			return null;
		}

		for (const [index, contribution] of week.contribution_days.entries()) {
			if (
				!isRecord(contribution) ||
				contribution.weekday !== index ||
				!isNonNegativeInteger(contribution.count)
			) {
				return null;
			}

			const date = new Date(firstDay);
			date.setUTCDate(firstDay.getUTCDate() + index);
			const dateString = date.toISOString().slice(0, 10);

			if (dateString >= payload.from && dateString <= payload.to) {
				days.push({
					date: dateString,
					count: contribution.count,
					intensity: getIntensity(contribution.count, contribution.level),
				});
			}
		}
	}

	if (days.length === 0) {
		return null;
	}

	return { from: payload.from, to: payload.to, days };
}

function jsonResponse(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body), { status, headers: cacheHeaders });
}

export const GET: APIRoute = async ({ params }) => {
	const username = params.username;
	if (!username || !/^(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(username)) {
		return jsonResponse({ error: 'Invalid GitHub username' }, 400);
	}

	let upstreamResponse: Response;
	try {
		upstreamResponse = await fetch(`https://github.com/${username}.contribs`, {
			headers: { Accept: 'application/json' },
		});
	} catch (error) {
		console.error(`Failed to fetch GitHub contributions for ${username}`, error);
		return jsonResponse({ error: 'Unable to reach GitHub contributions service' }, 502);
	}

	if (upstreamResponse.status === 404) {
		return jsonResponse({ error: 'GitHub user not found' }, 404);
	}

	if (!upstreamResponse.ok) {
		console.error(`GitHub contributions request for ${username} returned ${upstreamResponse.status}`);
		return jsonResponse({ error: 'GitHub contributions service failed' }, 502);
	}

	try {
		const calendar = parseCalendar(await upstreamResponse.json());
		if (!calendar) {
			console.error(`GitHub returned an invalid contributions calendar for ${username}`);
			return jsonResponse({ error: 'Invalid response from GitHub contributions service' }, 502);
		}

		return jsonResponse({
			username,
			from: calendar.from,
			to: calendar.to,
			totalContributions: calendar.days.reduce((total, day) => total + day.count, 0),
			days: calendar.days,
		}, 200);
	} catch (error) {
		console.error(`Failed to parse GitHub contributions for ${username}`, error);
		return jsonResponse({ error: 'Invalid response from GitHub contributions service' }, 502);
	}
};
