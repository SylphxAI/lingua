'use client';

/**
 * Focused hook for batch translation
 */

import { useCallback, useMemo } from 'react';
import type { SourceEntry } from '../../core/types';
import { useAdminState, useAdminStore } from '../context';

export interface UseBatchTranslateReturn {
	/** Is batch translation running */
	isRunning: boolean;
	/** Progress */
	progress: { current: number; total: number };
	/** Error message */
	error: string | null;

	/** Sources that need translation for current locale */
	untranslatedSources: SourceEntry[];
	/** Count of sources that need translation */
	untranslatedCount: number;

	/** Start batch translation */
	run: (options?: { locale?: string; hashes?: string[] }) => Promise<void>;
	/** Translate only selected sources */
	translateSelected: (hashes: string[]) => Promise<void>;
	/** Translate all untranslated sources */
	translateAll: () => Promise<void>;
}

/**
 * Hook for batch AI translation
 *
 * @example
 * ```tsx
 * function BatchTranslateButton() {
 *   const {
 *     isRunning,
 *     progress,
 *     untranslatedCount,
 *     translateAll,
 *   } = useBatchTranslate();
 *
 *   return (
 *     <button onClick={translateAll} disabled={isRunning || untranslatedCount === 0}>
 *       {isRunning
 *         ? `Translating ${progress.current}/${progress.total}...`
 *         : `Translate ${untranslatedCount} strings`
 *       }
 *     </button>
 *   );
 * }
 * ```
 */
export function useBatchTranslate(): UseBatchTranslateReturn {
	const store = useAdminStore();

	const state = useAdminState((s) => s.getState());
	const untranslatedSources = useAdminState((s) => s.getUntranslatedSources());

	const run = useCallback(
		async (options?: { locale?: string; hashes?: string[] }) => {
			await store.batchTranslate(options?.locale, options?.hashes);
		},
		[store]
	);

	const translateSelected = useCallback(
		async (hashes: string[]) => {
			await store.batchTranslate(undefined, hashes);
		},
		[store]
	);

	const translateAll = useCallback(async () => {
		await store.batchTranslate();
	}, [store]);

	return useMemo(
		() => ({
			isRunning: state.isBatchTranslating,
			progress: state.batchProgress,
			error: state.error,
			untranslatedSources,
			untranslatedCount: untranslatedSources.length,
			run,
			translateSelected,
			translateAll,
		}),
		[state.isBatchTranslating, state.batchProgress, state.error, untranslatedSources, run, translateSelected, translateAll]
	);
}
