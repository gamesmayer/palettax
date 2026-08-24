import { BrowserWindow } from "electron";
import { IPC_CHANNELS, UpdateInfo } from "../../shared/ipc-contract";

// See package.json "repository" for the source of truth.
const REPO_OWNER = "gamesmayer";
const REPO_NAME = "palettax";
const GITHUB_LATEST_RELEASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

interface GithubReleaseResponse {
	tag_name: string;
	html_url: string;
	body: string | null;
	published_at: string;
	draft: boolean;
	prerelease: boolean;
}

export function isNewerVersion(latest: string, current: string): boolean {
	const parts = (version: string): number[] =>
		version
			.replace(/^v/, "")
			.split(".")
			.map((part) => parseInt(part, 10) || 0);
	const latestParts = parts(latest);
	const currentParts = parts(current);
	for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
		const diff = (latestParts[i] ?? 0) - (currentParts[i] ?? 0);
		if (diff !== 0) return diff > 0;
	}
	return false;
}

export async function fetchLatestRelease(): Promise<GithubReleaseResponse | null> {
	const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
		headers: { Accept: "application/vnd.github+json" },
	});
	if (!response.ok) return null;
	return (await response.json()) as GithubReleaseResponse;
}

export async function checkForUpdates(
	mainWindow: BrowserWindow,
	currentVersion: string
): Promise<void> {
	try {
		const release = await fetchLatestRelease();
		if (!release) return;
		if (release.draft || release.prerelease) return;

		const latestVersion = release.tag_name.replace(/^v/, "");
		if (!isNewerVersion(latestVersion, currentVersion)) return;

		const updateInfo: UpdateInfo = {
			version: latestVersion,
			tagName: release.tag_name,
			releaseUrl: release.html_url,
			releaseNotes: release.body ?? undefined,
			publishedAt: release.published_at,
		};

		if (!mainWindow.isDestroyed()) {
			mainWindow.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, updateInfo);
		}
	} catch (error) {
		console.error("[update-check] failed:", error);
	}
}
