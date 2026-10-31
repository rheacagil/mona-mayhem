import {
	isSoundEnabled,
	playButtonClick,
	playPowerUp,
	playStatHit,
	playVictoryFanfare,
	setSoundEnabled,
} from './sound-effects';
import {
	getBattleCategories,
	getPlayerStats,
	scoreBattle,
	type PlayerStats,
} from '../lib/battle-scoring';
import type { ContributionDay } from '../lib/contribution-calendar';

type BattleState = 'idle' | 'loading' | 'error' | 'complete';

interface ContributionResponse {
	username: string;
	from: string;
	to: string;
	totalContributions: number;
	days: ContributionDay[];
}

interface FighterClass {
	name: string;
	description: string;
}

const usernamePattern = /^(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const usernameRules = 'Use 1–39 letters, numbers, or single hyphens; start and end with a letter or number.';
const statRevealDelay = 400;
const healthDamagePerWin = 20;
const form = requiredElement<HTMLFormElement>('[data-battle-form]');
const playerOneInput = requiredElement<HTMLInputElement>('[name="playerOne"]');
const playerTwoInput = requiredElement<HTMLInputElement>('[name="playerTwo"]');
const battleButton = requiredElement<HTMLButtonElement>('[data-battle-button]');
const statusMessage = requiredElement<HTMLElement>('[data-battle-status]');
const scoreboard = requiredElement<HTMLElement>('[data-scoreboard]');
const scoreMessage = requiredElement<HTMLElement>('[data-score-message]');
const scoreDetail = requiredElement<HTMLElement>('[data-score-detail]');
const countdownOverlay = requiredElement<HTMLElement>('[data-countdown]');
const countdownValue = requiredElement<HTMLElement>('[data-countdown-value]');
const victoryOverlay = requiredElement<HTMLElement>('[data-victory-overlay]');
const victoryKicker = requiredElement<HTMLElement>('[data-victory-kicker]');
const victoryWinner = requiredElement<HTMLElement>('[data-victory-winner]');
const victoryDetail = requiredElement<HTMLElement>('[data-victory-detail]');
const particleField = requiredElement<HTMLElement>('[data-particle-field]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let state: BattleState = 'idle';
let battleRun = 0;

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

function delay(milliseconds: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function playCountdown(run: number): Promise<void> {
	countdownOverlay.hidden = false;
	countdownValue.removeAttribute('data-fight');

	for (const value of ['3', '2', '1']) {
		if (run !== battleRun) return;
		countdownValue.textContent = value;
		scoreMessage.textContent = value;
		await delay(600);
	}

	if (run !== battleRun) return;
	countdownValue.textContent = 'FIGHT!';
	countdownValue.dataset.fight = 'true';
	scoreMessage.textContent = 'FIGHT!';
	await delay(450);
}

function resetHealthBars(): void {
	for (const playerNumber of [1, 2] as const) {
		const meter = requiredElement<HTMLElement>(`[data-health-meter="${playerNumber}"]`);
		const fill = requiredElement<HTMLElement>(`[data-health-fill="${playerNumber}"]`);
		const label = requiredElement<HTMLElement>(`[data-health-value="${playerNumber}"]`);
		meter.setAttribute('aria-valuenow', '100');
		fill.style.width = '100%';
		label.textContent = '100%';
	}
}

function updateHealthBar(playerNumber: 1 | 2, health: number): void {
	const meter = requiredElement<HTMLElement>(`[data-health-meter="${playerNumber}"]`);
	const fill = requiredElement<HTMLElement>(`[data-health-fill="${playerNumber}"]`);
	const label = requiredElement<HTMLElement>(`[data-health-value="${playerNumber}"]`);
	meter.setAttribute('aria-valuenow', String(health));
	fill.style.width = `${health}%`;
	label.textContent = `${health}%`;
}

function clearResultAnimation(): void {
	victoryOverlay.hidden = true;
	particleField.replaceChildren();
	document.body.classList.remove('battle-shake');
}

function showVictory(winner: string | null, health: [number, number]): void {
	const isKnockout = health.includes(0);
	victoryKicker.textContent = winner ? (isKnockout ? 'K.O.!' : 'VICTORY!') : 'DRAW!';
	victoryWinner.textContent = winner ? `@${winner} WINS!` : 'EVENLY MATCHED';
	victoryDetail.textContent = `FINAL HEALTH ${health[0]}% — ${health[1]}%`;
	victoryOverlay.hidden = false;
	victoryWinner.focus();
	if (winner) playVictoryFanfare(isKnockout);

	if (!reducedMotion.matches) {
		createVictoryParticles();
		document.body.classList.remove('battle-shake');
		void document.body.offsetWidth;
		document.body.classList.add('battle-shake');
		window.setTimeout(() => document.body.classList.remove('battle-shake'), 650);
	}
}

function createVictoryParticles(): void {
	const colors = ['#5fed83', '#00f5ff', '#ff3bd4', '#ffd166'];
	const particles = document.createDocumentFragment();

	for (let index = 0; index < 32; index += 1) {
		const angle = (Math.PI * 2 * index) / 32;
		const distance = 90 + ((index * 37) % 150);
		const particle = document.createElement('span');
		particle.className = 'particle';
		particle.style.setProperty('--particle-x', `${Math.cos(angle) * distance}px`);
		particle.style.setProperty('--particle-y', `${Math.sin(angle) * distance}px`);
		particle.style.setProperty('--particle-color', colors[index % colors.length]);
		particle.style.animationDelay = `${(index % 8) * 25}ms`;
		particles.append(particle);
	}

	particleField.replaceChildren(particles);
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

function getFighterClass(data: ContributionResponse, stats: PlayerStats): FighterClass {
	const weekendRatio = data.totalContributions === 0
		? 0
		: stats.totalWeekendContributions / data.totalContributions;
	const averageDailyContributions = data.totalContributions / data.days.length;
	const peakThreshold = Math.max(10, averageDailyContributions * 4);

	if (stats.longestStreak > 30) {
		return {
			name: 'Streak Paladin',
			description: `${stats.longestStreak}-day longest streak`,
		};
	}

	if (stats.peakDay.count >= peakThreshold && stats.peakDay.count > 0) {
		return {
			name: 'Commit Berserker',
			description: `${stats.peakDay.count} contributions on peak day`,
		};
	}

	if (weekendRatio >= 0.4) {
		return {
			name: 'Weekend Warrior',
			description: `${Math.round(weekendRatio * 100)}% of contributions landed on weekends`,
		};
	}

	return {
		name: 'Grid Guardian',
		description: 'A balanced contribution calendar',
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

function renderPlayer(playerNumber: 1 | 2, data: ContributionResponse): PlayerStats {
	const panel = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"]`);
	const avatar = requiredElement<HTMLImageElement>(`[data-player-panel="${playerNumber}"] [data-profile-avatar]`);
	const profileLink = requiredElement<HTMLAnchorElement>(`[data-player-panel="${playerNumber}"] [data-profile-link]`);
	const username = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"] [data-profile-username]`);
	const fighterClass = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"] [data-fighter-class]`);
	const contributionGrid = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"] [data-contribution-grid]`);
	const calendarRange = requiredElement<HTMLElement>(`[data-player-panel="${playerNumber}"] [data-calendar-range]`);
	const stats = getPlayerStats(data);
	const playerClass = getFighterClass(data, stats);

	username.textContent = `@${data.username}`;
	fighterClass.textContent = playerClass.name;
	fighterClass.title = playerClass.description;
	fighterClass.hidden = false;
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
	for (const [index, day] of data.days.entries()) {
		const cell = document.createElement('span');
		cell.dataset.level = String(day.intensity);
		cell.dataset.columnIndex = String(Math.floor(index / 7));
		cell.style.setProperty('--cell-delay', `${Math.floor(index / 7) * 22}ms`);
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

	for (const row of panel.querySelectorAll<HTMLElement>('[data-stat-row]')) {
		row.hidden = true;
		row.dataset.revealed = 'false';
	}

	return stats;
}

async function waitForGridReveal(days: ContributionDay[]): Promise<void> {
	if (reducedMotion.matches || days.length === 0) return;

	const finalColumn = Math.floor((days.length - 1) / 7);
	await delay(finalColumn * 22 + 300);
}

async function revealStats(
	firstData: ContributionResponse,
	secondData: ContributionResponse,
	firstStats: PlayerStats,
	secondStats: PlayerStats,
): Promise<[number, number]> {
	const categories = getBattleCategories(firstData, secondData, firstStats, secondStats);
	const outcome = scoreBattle(categories, healthDamagePerWin);

	for (const [index, category] of categories.entries()) {
		if (index > 0) await delay(statRevealDelay);
		playStatHit();

		for (const playerNumber of [1, 2] as const) {
			const row = requiredElement<HTMLElement>(
				`[data-player-panel="${playerNumber}"] [data-stat-row="${category.id}"]`,
			);
			row.hidden = false;
			requestAnimationFrame(() => {
				row.dataset.revealed = 'true';
			});
		}

		const health = outcome.healthByCategory[index];
		updateHealthBar(1, health[0]);
		updateHealthBar(2, health[1]);
	}

	return outcome.health;
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

function dismissVictory(): void {
	victoryOverlay.hidden = true;
	battleButton.focus();
}

requiredElement<HTMLButtonElement>('[data-dismiss-victory]').addEventListener('click', dismissVictory);

document.addEventListener('keydown', (event) => {
	if (victoryOverlay.hidden) return;

	if (event.key === 'Escape') {
		event.preventDefault();
		dismissVictory();
		return;
	}

	if (event.key !== 'Tab') return;

	const focusableElements = [...victoryOverlay.querySelectorAll<HTMLElement>(
		'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
	)];
	if (focusableElements.length === 0) {
		event.preventDefault();
		victoryWinner.focus();
		return;
	}

	const firstElement = focusableElements[0];
	const lastElement = focusableElements[focusableElements.length - 1];
	if (event.shiftKey && (document.activeElement === firstElement || document.activeElement === victoryWinner)) {
		event.preventDefault();
		lastElement.focus();
	} else if (!event.shiftKey && document.activeElement === lastElement) {
		event.preventDefault();
		firstElement.focus();
	}
});

const soundToggle = requiredElement<HTMLButtonElement>('[data-sfx-toggle]');

function updateSoundToggle(): void {
	const enabled = isSoundEnabled();
	soundToggle.setAttribute('aria-pressed', String(enabled));
	soundToggle.setAttribute('aria-label', enabled ? 'Mute sound effects' : 'Enable sound effects');
	soundToggle.textContent = `${enabled ? '🔊' : '🔇'} SFX: ${enabled ? 'ON' : 'OFF'}`;
}

soundToggle.addEventListener('click', () => {
	const enabled = !isSoundEnabled();
	setSoundEnabled(enabled);
	updateSoundToggle();
	if (enabled) playButtonClick();
});

document.addEventListener('click', (event) => {
	if (event.target instanceof Element && event.target.closest('[data-sfx-preset]')) {
		playButtonClick();
	}
});

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	if (state === 'loading') return;
	playButtonClick();

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

	const run = ++battleRun;
	const battleUrl = new URL(window.location.href);
	battleUrl.searchParams.set('p1', playerOne);
	battleUrl.searchParams.set('p2', playerTwo);
	window.history.replaceState(window.history.state, '', battleUrl);
	clearResultAnimation();
	resetHealthBars();
	requiredElement<HTMLElement>('[data-health-name="1"]').textContent = `P1 · ${playerOne}`;
	requiredElement<HTMLElement>('[data-health-name="2"]').textContent = `P2 · ${playerTwo}`;

	setState('loading', 'Fetching both contribution calendars…');
	for (const panel of document.querySelectorAll<HTMLElement>('[data-player-panel]')) {
		panel.querySelector<HTMLElement>('[data-profile-username]')!.textContent = 'Loading contender…';
		panel.querySelector<HTMLElement>('[data-fighter-class]')!.hidden = true;
		panel.querySelector<HTMLAnchorElement>('[data-profile-link]')!.hidden = true;
		panel.querySelector<HTMLImageElement>('[data-profile-avatar]')!.hidden = true;
		panel.querySelector<HTMLElement>('[data-contribution-grid]')!.replaceChildren();
		panel.querySelector<HTMLElement>('[data-calendar-range]')!.textContent = '52 weeks';
		for (const row of panel.querySelectorAll<HTMLElement>('[data-stat-row]')) {
			row.hidden = true;
			row.dataset.revealed = 'false';
		}
		for (const value of panel.querySelectorAll<HTMLElement>('[data-stat]')) {
			value.textContent = '—';
		}
	}

	try {
		const [[firstPlayer, secondPlayer]] = await Promise.all([
			Promise.all([fetchContributions(playerOne), fetchContributions(playerTwo)]),
			playCountdown(run),
		]);

		if (run !== battleRun) return;

		countdownOverlay.hidden = true;
		const firstStats = renderPlayer(1, firstPlayer);
		const secondStats = renderPlayer(2, secondPlayer);
		setState('loading', 'Calendars ready — reveal the fighter stats!');
		scoreDetail.textContent = 'Contribution grids loading…';
		playPowerUp();
		await Promise.all([waitForGridReveal(firstPlayer.days), waitForGridReveal(secondPlayer.days)]);

		if (run !== battleRun) return;

		scoreDetail.textContent = 'Comparing fighter stats…';
		const health = await revealStats(firstPlayer, secondPlayer, firstStats, secondStats);

		if (run !== battleRun) return;

		const winner =
			health[0] > health[1]
				? firstPlayer.username
				: health[1] > health[0]
					? secondPlayer.username
					: null;

		if (winner) {
			scoreboard.dataset.state = health.includes(0) ? 'knockout' : 'winner';
			scoreMessage.textContent = health.includes(0) ? 'K.O.!' : 'VICTORY!';
			scoreDetail.textContent = `${winner} wins on category health`;
		} else {
			scoreboard.dataset.state = 'draw';
			scoreMessage.textContent = "IT'S A DRAW!";
			scoreDetail.textContent = 'Both fighters finished with equal health';
		}

		statusMessage.hidden = true;
		state = 'complete';
		battleButton.disabled = false;
		showVictory(winner, health);
	} catch (error) {
		battleRun += 1;
		countdownOverlay.hidden = true;
		setState('error', error instanceof Error ? error.message : 'The battle could not be completed.');
		scoreMessage.textContent = 'BATTLE ABORTED';
		scoreDetail.textContent = 'Check the usernames and try again.';
	}
});

updateSoundToggle();
updateBattleButton();

const sharedBattleUrl = new URL(window.location.href);
if (sharedBattleUrl.searchParams.has('p1') && sharedBattleUrl.searchParams.has('p2')) {
	playerOneInput.value = sharedBattleUrl.searchParams.get('p1') ?? '';
	playerTwoInput.value = sharedBattleUrl.searchParams.get('p2') ?? '';
	form.requestSubmit();
}
