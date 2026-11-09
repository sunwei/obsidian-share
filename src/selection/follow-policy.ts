/**
 * Share panel selection tracks the active markdown note.
 *
 * explicit — context menu / published target / command (may expand the sidebar).
 * follow — seeded from an empty panel, then tracks notes the user opens.
 *
 * Share is note-only: once the panel is open, active-file changes always update
 * the target so users do not need to right-click every note.
 * Panel controls (theme, demo, password) are not selection signals.
 */

export type SelectionOrigin = 'explicit' | 'follow';

export type FollowSignal =
	| { type: 'panel-focused'; hasTarget: boolean }
	| { type: 'active-file-changed'; hasTarget: boolean };

/** Whether a workspace signal may replace the current publish target. */
export function allowFollow(
	origin: SelectionOrigin | null,
	signal: FollowSignal,
): boolean {
	if (signal.type === 'panel-focused') {
		return origin == null && !signal.hasTarget;
	}
	if (signal.type === 'active-file-changed') {
		// Always follow the active note while Share is open (explicit does not pin).
		void origin;
		return true;
	}
	return false;
}
