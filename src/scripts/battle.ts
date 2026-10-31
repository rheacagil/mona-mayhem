type BattleState = 'idle' | 'loading' | 'error' | 'complete';

interface ContributionDay {
	date: string;
	count: number;
	intensity: number;
}

interface ContributionResponse {
	username: string;
	from: string;
	to: string;
	totalContributions: number;
	days: ContributionDay[];
}

interface PlayerStats {
	longestStreak: number;
	currentStreak: number;
	peakDay: ContributionDay;
	consistency: number;
}

const usernamePattern = /^(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const usernameRules = 'Use 1–39 letters, numbers, or single hyphens; start and end with a letter or number.';
const form = requiredElement<HTMLFormElement>('[data-battle-form]');
const playerOneInput = requiredElement<HTMLInputElement>('[name="playerOne"]');
const playerTwoInput = requiredElement<HTMLInputElement>('[name="playerTwo"]');
const battleButton = requiredElement<HTMLButtonElement>('[data-battle-button]');
const statusMessage = requiredElement<HTMLElement>('[data-battle-status]');
const scoreboard = requiredElement<HTMLElement>('[data-scoreboard]');
const scoreMessage = requiredElement<HTMLElement>('[data-score-message]');
const scoreDetail = requiredElement<HTMLElement>('[data-score-detail]');

let state: BattleState = 'idle';

function requiredElement<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (!element) {
		throw new Error(`Required battle page element is missing: ${selector}`);
	}

	return element;
}

function setState(nextState: BattleState, message = ''): void {
	state = nextState;
	statusMessage.hidden = nextState !== 'loading' && nextState !== 'error';
	statusMessage.dataset.state = nextState;
	statusMessage.textContent = message;
	scoreboard.dataset.state = nextState;

	if (nextState === 'loading') {
		scoreMessage.textContent = 'FIGHT!';
		scoreDetail.textContent = 'Loading both contribution calendars…';
	} else if (nextState === 'idle') {
		scoreMessage.textContent = 'READY?';
		scoreDetail.textContent = 'Enter two players to start';
	}

	battleButton.disabled = nextState === 'loading';
}

function isCalendarDate(value: unknown): value is string {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const date = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isContributionResponse(value: unknown, username: string): value is ContributionResponse {
	if (
		typeof value !== 'object' ||
		value === null ||
		!('username' in value) ||
		value.username !== username ||
		!('from' in value) ||
		!isCalendarDate(value.from) ||
		!('to' in value) ||
		!isCalendarDate(value.to) ||
		value.from > value.to ||
		!('totalContributions' in value) ||
		typeof value.totalContributions !== 'number' ||
		!Number.isInteger(value.totalContributions) ||
		value.totalContributions < 0 ||
		!('days' in value) ||
		!Array.isArray(value.days) ||
		value.days.length === 0
	) {
		return false;
	}

	let previousDate = '';
	for (const day of value.days) {
		if (
			typeof day !== 'object' ||
			day === null ||
			!('date' in day) ||
			!isCalendarDate(day.date) ||
			day.date < value.from ||
			day.date > value.to ||
			day.date <= previousDate ||
			!('count' in day) ||
			typeof day.count !== 'number' ||
			!Number.isInteger(day.count) ||
			day.count < 0 ||
			!('intensity' in day) ||
			typeof day.intensity !== 'number' ||
			!Number.isInteger(day.intensity) ||
			day.intensity < 0 ||
			day.intensity > 4
		) {
			return false;
		}

		previousDate = day.date;
	}

	return true;
}

async function fetchContributions(username: string): Promise<ContributionResponse> {
	let response: Response;
	try {
		response = await fetch(`/api/contributions/${encodeURIComponent(username)}`);
	} catch {
		throw new Error(`Could not connect to the contribution service for @${username}.`);
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		throw new Error(`The contribution service returned an unreadable response for @${username}.`);
	}

	if (!response.ok) {
		const message =
			typeof payload === 'object' &&
			payload !== null &&
			'error' in payload &&
			typeof payload.error === 'string'
				? payload.error
				: 'Could not load contribution data.';
		throw new Error(`@${username}: ${message}`);
	}

	if (!isContributionResponse(payload, username)) {
		throw new Error(`The contribution service returned invalid data for @${username}.`);
	}

	return payload;
}

function getDayDistance(first: string, second: string): number {
	const firstDate = new Date(`${first}T00:00:00.000Z`);
	const secondDate = new Date(`${second}T00:00:00.000Z`);
	return Math.round((secondDate.getTime() - firstDate.getTime()) / 86_400_000);
}

function getStats(data: ContributionResponse): PlayerStats {
	let longestStreak = 0;
	let activeRun = 0;
	let peakDay = data.days[0];

	for (let index = 0; index < data.days.length; index += 1) {
		const day = data.days[index];
		if (day.count > peakDay.count) {
			peakDay = day;
		}

		if (day.count > 0) {
			if (index > 0 && getDayDistance(data.days[index - 1].date, day.date) === 1 && data.days[index - 1].count > 0) {
				activeRun += 1;
			} else {
				activeRun = 1;
			}
			longestStreak = Math.max(longestStreak, activeRun);
		} else {
			activeRun = 0;
		}
	}

	const today = new Date().toISOString().slice(0, 10);
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
	};
}

function formatDate(date: string): string {
	return new Intl.DateTimeFormat(undefined, {
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC',
		year: 'numeric',
	}).format(new Date(`${date}T00:00:00.000Z`));
}

function renderPlayer(playerNumber: 1 | 2, data: ContributionResponse): void {
	const panel = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"]`);
	const avatar = requiredElement<HTMLImageElement>(`[data-player-panel="${playerNumber}"] [data-profile-avatar]`);
	const profileLink = requiredElement<HTMLAnchorElement>(`[data-player-panel="${playerNumber}"] [data-profile-link]`);
	const username = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"] [data-profile-username]`);
	const contributionGrid = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"] [data-contribution-grid]`);
	const calendarRange = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"] [data-calendar-range]`);
	const stats = getStats(data);

	username.textContent = `@${data.username}`;
	profileLink.href = `https://github.com/${encodeURIComponent(data.username)}`;
	profileLink.textContent = 'View GitHub profile';
	profileLink.hidden = false;
	avatar.src = `https://github.com/${encodeURIComponent(data.username)}.png`;
	avatar.alt = `${data.username}'s GitHub avatar`;
	avatar.hidden = false;
	avatar.onerror = () => {
		avatar.hidden = true;
	};

	calendarRange.textContent = `${formatDate(data.from)} – ${formatDate(data.to)}`;
	contributionGrid.replaceChildren();
	const cells = document.createDocumentFragment();
	for (const day of data.days) {
		const cell = document.createElement('span');
		cell.dataset.level = String(day.intensity);
		cell.title = `${formatDate(day.date)}: ${day.count} contribution${day.count === 1 ? '' : 's'}`;
		cells.append(cell);
	}
	contributionGrid.append(cells);
	contributionGrid.setAttribute(
		'aria-label',
		`${data.days.length} daily contribution totals from ${formatDate(data.from)} through ${formatDate(data.to)}`,
	);

	const peakLabel =
		stats.peakDay.count === 0
			? 'No contributions'
			: `${formatDate(stats.peakDay.date)} · ${stats.peakDay.count}`;

	panel.querySelector<HTMLElement>('[data-stat="total"]')!.textContent = data.totalContributions.toLocaleString();
	panel.querySelector<HTMLElement>('[data-stat="longest-streak"]')!.textContent = `${stats.longestStreak} day${stats.longestStreak === 1 ? '' : 's'}`;
	panel.querySelector<HTMLElement>('[data-stat="current-streak"]')!.textContent = `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`;
	panel.querySelector<HTMLElement>('[data-stat="peak-day"]')!.textContent = peakLabel;
	panel.querySelector<HTMLElement>('[data-stat="consistency"]')!.textContent = `${(stats.consistency * 100).toFixed(1)}%`;
}

function updateBattleButton(): void {
	battleButton.disabled = state === 'loading';
}

for (const input of [playerOneInput, playerTwoInput]) {
	input.addEventListener('input', () => {
		input.removeAttribute('aria-invalid');
		if (state === 'error') {
			setState('idle');
		}
		updateBattleButton();
	});
}

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	const playerOne = playerOneInput.value.trim();
	const playerTwo = playerTwoInput.value.trim();
	playerOneInput.value = playerOne;
	playerTwoInput.value = playerTwo;

	const validationErrors: string[] = [];
	const inputs = [
		{ input: playerOneInput, label: 'Player 1' },
		{ input: playerTwoInput, label: 'Player 2' },
	];

	for (const { input, label } of inputs) {
		const username = input.value;
		const error = username
			? usernamePattern.test(username)
				? ''
				: `${label} username is invalid. ${usernameRules}`
			: `${label} username is required.`;

		if (error) {
			input.setAttribute('aria-invalid', 'true');
			validationErrors.push(error);
		} else {
			input.removeAttribute('aria-invalid');
		}
	}

	if (validationErrors.length > 0) {
		setState('error', validationErrors.join(' '));
		scoreMessage.textContent = 'CHECK USERNAMES';
		scoreDetail.textContent = 'Correct the highlighted fields, then battle again.';
		inputs.find(({ input }) => input.getAttribute('aria-invalid') === 'true')?.input.focus();
		return;
	}

	setState('loading', 'Fetching both contribution calendars…');
	for (const panel of document.querySelectorAll<HTMLElement>('[data-player-panel]')) {
		panel.querySelector<HTMLElement>('[data-profile-username]')!.textContent = 'Loading contender…';
		panel.querySelector<HTMLAnchorElement>('[data-profile-link]')!.hidden = true;
		panel.querySelector<HTMLImageElement>('[data-profile-avatar]')!.hidden = true;
		panel.querySelector<HTMLElement>('[data-contribution-grid]')!.replaceChildren();
		panel.querySelector<HTMLElement>('[data-calendar-range]')!.textContent = '52 weeks';
		for (const value of panel.querySelectorAll<HTMLElement>('[data-stat]')) {
			value.textContent = '—';
		}
	}

	try {
		const [firstPlayer, secondPlayer] = await Promise.all([
			fetchContributions(playerOne),
			fetchContributions(playerTwo),
		]);

		renderPlayer(1, firstPlayer);
		renderPlayer(2, secondPlayer);
		statusMessage.hidden = true;
		state = 'complete';

		if (firstPlayer.totalContributions > secondPlayer.totalContributions) {
			scoreboard.dataset.state = 'winner';
			scoreMessage.textContent = `${firstPlayer.username} WINS!`;
		} else if (secondPlayer.totalContributions > firstPlayer.totalContributions) {
			scoreboard.dataset.state = 'winner';
			scoreMessage.textContent = `${secondPlayer.username} WINS!`;
		} else {
			scoreboard.dataset.state = 'draw';
			scoreMessage.textContent = "IT'S A DRAW!";
		}

		scoreDetail.textContent = `${firstPlayer.totalContributions.toLocaleString()} vs ${secondPlayer.totalContributions.toLocaleString()} total contributions`;
		battleButton.disabled = false;
	} catch (error) {
		setState('error', error instanceof Error ? error.message : 'The battle could not be completed.');
		scoreMessage.textContent = 'BATTLE ABORTED';
		scoreDetail.textContent = 'Check the usernames and try again.';
	}
});

updateBattleButton();
