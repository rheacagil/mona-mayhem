import type { ContributionDay } from './contribution-calendar';

export interface PlayerContributionData {
	days: ContributionDay[];
	totalContributions: number;
}

export interface PlayerStats {
	longestStreak: number;
	currentStreak: number;
	peakDay: ContributionDay;
	consistency: number;
	totalWeekendContributions: number;
}

export interface BattleCategory {
	id: 'total' | 'longest-streak' | 'current-streak' | 'peak-day' | 'consistency';
	playerOne: number;
	playerTwo: number;
}

export interface BattleOutcome {
	healthByCategory: [number, number][];
	health: [number, number];
	winner: 1 | 2 | null;
}

function getDayDistance(first: string, second: string): number {
	const firstDate = new Date(`${first}T00:00:00.000Z`);
	const secondDate = new Date(`${second}T00:00:00.000Z`);
	return Math.round((secondDate.getTime() - firstDate.getTime()) / 86_400_000);
}

export function getPlayerStats(data: PlayerContributionData, today = new Date().toISOString().slice(0, 10)): PlayerStats {
	if (data.days.length === 0) {
		throw new Error('Cannot score a player without contribution days.');
	}

	let longestStreak = 0;
	let activeRun = 0;
	let peakDay = data.days[0];

	for (let index = 0; index < data.days.length; index += 1) {
		const day = data.days[index];
		if (day.count > peakDay.count) {
			peakDay = day;
		}

		if (day.count > 0) {
			if (
				index > 0 &&
				getDayDistance(data.days[index - 1].date, day.date) === 1 &&
				data.days[index - 1].count > 0
			) {
				activeRun += 1;
			} else {
				activeRun = 1;
			}
			longestStreak = Math.max(longestStreak, activeRun);
		} else {
			activeRun = 0;
		}
	}

	const latestIndex = data.days.length - 1;
	const latestDate = data.days[latestIndex].date;
	let currentIndex = -1;

	if (latestDate === today) {
		currentIndex = data.days[latestIndex].count > 0 ? latestIndex : latestIndex - 1;
	} else if (getDayDistance(latestDate, today) === 1) {
		currentIndex = latestIndex;
	}

	let currentStreak = 0;
	for (let index = currentIndex; index >= 0; index -= 1) {
		const day = data.days[index];
		if (day.count === 0) break;
		if (index < currentIndex && getDayDistance(day.date, data.days[index + 1].date) !== 1) break;
		currentStreak += 1;
	}

	return {
		longestStreak,
		currentStreak,
		peakDay,
		consistency: data.days.filter((day) => day.count > 0).length / data.days.length,
		totalWeekendContributions: data.days.reduce((total, day) => {
			const weekday = new Date(`${day.date}T00:00:00.000Z`).getUTCDay();
			return total + (weekday === 0 || weekday === 6 ? day.count : 0);
		}, 0),
	};
}

export function getBattleCategories(
	firstData: PlayerContributionData,
	secondData: PlayerContributionData,
	firstStats: PlayerStats,
	secondStats: PlayerStats,
): BattleCategory[] {
	return [
		{ id: 'total', playerOne: firstData.totalContributions, playerTwo: secondData.totalContributions },
		{ id: 'longest-streak', playerOne: firstStats.longestStreak, playerTwo: secondStats.longestStreak },
		{ id: 'current-streak', playerOne: firstStats.currentStreak, playerTwo: secondStats.currentStreak },
		{ id: 'peak-day', playerOne: firstStats.peakDay.count, playerTwo: secondStats.peakDay.count },
		{ id: 'consistency', playerOne: firstStats.consistency, playerTwo: secondStats.consistency },
	];
}

export function scoreBattle(categories: BattleCategory[], damagePerWin = 20): BattleOutcome {
	const health: [number, number] = [100, 100];
	const healthByCategory: [number, number][] = [];

	for (const category of categories) {
		if (category.playerOne > category.playerTwo) {
			health[1] = Math.max(0, health[1] - damagePerWin);
		} else if (category.playerTwo > category.playerOne) {
			health[0] = Math.max(0, health[0] - damagePerWin);
		}
		healthByCategory.push([...health]);
	}

	return {
		healthByCategory,
		health,
		winner: health[0] > health[1] ? 1 : health[1] > health[0] ? 2 : null,
	};
}
