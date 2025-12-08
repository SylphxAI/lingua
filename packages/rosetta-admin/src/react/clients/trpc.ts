'use client';

/**
 * tRPC client adapter for translation admin
 *
 * @example
 * ```tsx
 * import { createTRPCClient } from '@sylphx/rosetta-admin/react';
 * import { api } from '@/trpc/react';
 *
 * const client = createTRPCClient(api.admin.translations);
 *
 * export default function Page() {
 *   return (
 *     <TranslationAdminProvider client={client}>
 *       <MyTranslationUI />
 *     </TranslationAdminProvider>
 *   );
 * }
 * ```
 */

import type {
	AdminAPIClient,
	BatchTranslateRequest,
	BatchTranslateResponse,
	FetchTranslationsResponse,
	MarkAsReviewedRequest,
	SaveTranslationRequest,
} from '../../core/types';

/**
 * Type for tRPC router with translation admin procedures
 * This is a loose type that works with any tRPC setup
 */
export interface TRPCAdminRouter {
	getTranslations: {
		query: () => Promise<FetchTranslationsResponse>;
	};
	saveTranslation: {
		mutate: (input: SaveTranslationRequest) => Promise<{ success: boolean }>;
	};
	markAsReviewed: {
		mutate: (input: MarkAsReviewedRequest) => Promise<{ success: boolean }>;
	};
	batchTranslate: {
		mutate: (input: BatchTranslateRequest) => Promise<BatchTranslateResponse>;
	};
	addLocale?: {
		mutate: (input: { locale: string }) => Promise<{ success: boolean; locale: string }>;
	};
}

/**
 * Create an API client from a tRPC router
 */
export function createTRPCClient(trpc: TRPCAdminRouter): AdminAPIClient {
	return {
		async fetchTranslations(): Promise<FetchTranslationsResponse> {
			return await trpc.getTranslations.query();
		},

		async saveTranslation(request: SaveTranslationRequest): Promise<void> {
			await trpc.saveTranslation.mutate(request);
		},

		async markAsReviewed(request: MarkAsReviewedRequest): Promise<void> {
			await trpc.markAsReviewed.mutate(request);
		},

		async batchTranslate(request: BatchTranslateRequest): Promise<BatchTranslateResponse> {
			return await trpc.batchTranslate.mutate(request);
		},

		async addLocale(locale: string): Promise<void> {
			if (trpc.addLocale) {
				await trpc.addLocale.mutate({ locale });
			}
		},
	};
}
