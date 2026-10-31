export interface ContributionDay {
	date: string;
	count: number;
	intensity: number;
}

export interface ContributionCalendar {
	from: string;
	to: string;
	days: ContributionDay[];
}

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

export function parseContributionCalendar(payload: unknown): ContributionCalendar | null {
	if (
		!isRecord(payload) ||
		!isDate(payload.from) ||
		!isDate(payload.to) ||
		payload.from > payload.to ||
		!Array.isArray(payload.weeks)
	) {
		return null;
	}

	const days: ContributionDay[] = [];

	for (const week of payload.weeks) {
		if (
			!isRecord(week) ||
			!isDate(week.first_day) ||
			!Array.isArray(week.contribution_days) ||
			week.contribution_days.length !== 7
		) {
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
