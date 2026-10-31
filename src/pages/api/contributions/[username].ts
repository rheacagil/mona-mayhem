import type { APIRoute } from 'astro';
import { parseContributionCalendar } from '../../../lib/contribution-calendar.ts';

export const prerender = false;

const cacheHeaders = {
	'Cache-Control': 'public, max-age=300',
	'Content-Type': 'application/json',
};

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
		const calendar = parseContributionCalendar(await upstreamResponse.json());
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
