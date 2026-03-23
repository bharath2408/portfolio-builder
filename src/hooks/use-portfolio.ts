"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import axios from "axios";

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, ApiClientError } from "@/lib/api";
import { usePortfolioStore } from "@/stores/portfolio-store";
import type {
  PortfolioListItem,
  PortfolioWithRelations,
  CreatePortfolioInput,
  UpdatePortfolioInput,
  SectionWithBlocks,
  CreateSectionInput,
  UpdateSectionInput,
} from "@/types";

// ─── usePortfolios (list) ─────────────────────────────────────────

export function usePortfolios() {
  const { portfolios, setPortfolios, setLoading, setError, isLoading, error } =
    usePortfolioStore();

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<PortfolioListItem[]>("/portfolios");
      setPortfolios(data);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load portfolios";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setPortfolios, setLoading, setError]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  return { portfolios, isLoading, error, refetch: fetchPortfolios };
}

// ─── usePortfolio (single with relations) ─────────────────────────

export function usePortfolio(portfolioId: string | null) {
  const { currentPortfolio, setCurrentPortfolio } = usePortfolioStore();
  const abortRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear stale data when the portfolio ID changes
  useEffect(() => {
    if (currentPortfolio && currentPortfolio.id !== portfolioId) {
      setCurrentPortfolio(null);
    }
  }, [portfolioId, currentPortfolio, setCurrentPortfolio]);

  const fetchPortfolio = useCallback(async () => {
    if (!portfolioId) {
      setCurrentPortfolio(null);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    // Clear stale portfolio before fetching new one
    setCurrentPortfolio(null);

    try {
      const data = await apiGet<PortfolioWithRelations>(
        `/portfolios/${portfolioId}`,
        { signal: abortRef.current.signal },
      );
      setCurrentPortfolio(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (axios.isCancel(err)) return;
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load portfolio";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, setCurrentPortfolio]);

  useEffect(() => {
    fetchPortfolio();
    return () => abortRef.current?.abort();
  }, [fetchPortfolio]);

  return { portfolio: currentPortfolio, isLoading, error, refetch: fetchPortfolio };
}

// ─── usePortfolioMutations ────────────────────────────────────────

export function usePortfolioMutations() {
  const [isPending] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const store = usePortfolioStore();

  const createPortfolio = useCallback(
    async (input: CreatePortfolioInput & { importData?: Record<string, unknown> }) => {
      setError(null);
      try {
        const data = await apiPost<PortfolioListItem>("/portfolios", input);
        store.addPortfolio(data);
        return data;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to create portfolio";
        setError(message);
        throw err;
      }
    },
    [store],
  );

  const updatePortfolio = useCallback(
    async (id: string, input: UpdatePortfolioInput) => {
      setError(null);
      try {
        const data = await apiPatch<PortfolioWithRelations>(
          `/portfolios/${id}`,
          input,
        );
        store.updatePortfolioInList(id, input);
        if (store.currentPortfolio?.id === id) {
          store.setCurrentPortfolio(data);
        }
        return data;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to update portfolio";
        setError(message);
        throw err;
      }
    },
    [store],
  );

  const deletePortfolio = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await apiDelete(`/portfolios/${id}`);
        store.removePortfolio(id);
        if (store.currentPortfolio?.id === id) {
          store.setCurrentPortfolio(null);
        }
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to delete portfolio";
        setError(message);
        throw err;
      }
    },
    [store],
  );

  const duplicatePortfolio = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const data = await apiPost<PortfolioListItem>(`/portfolios/${id}/duplicate`, {});
        store.addPortfolio(data);
        return data;
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : "Failed to duplicate portfolio";
        setError(message);
        throw err;
      }
    },
    [store],
  );

  return {
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    duplicatePortfolio,
    isPending,
    error,
  };
}

// ─── useSectionMutations ──────────────────────────────────────────

export function useSectionMutations(portfolioId: string) {
  const [error, setError] = useState<string | null>(null);
  const store = usePortfolioStore();

  const createSection = useCallback(
    async (input: CreateSectionInput) => {
      setError(null);
      try {
        const data = await apiPost<SectionWithBlocks>(
          `/portfolios/${portfolioId}/sections`,
          input,
        );
        store.addSection(data);
        return data;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to create section";
        setError(message);
        throw err;
      }
    },
    [portfolioId, store],
  );

  const updateSection = useCallback(
    async (sectionId: string, input: UpdateSectionInput) => {
      setError(null);
      try {
        const data = await apiPatch<SectionWithBlocks>(
          `/portfolios/${portfolioId}/sections`,
          { sectionId, ...input },
        );
        store.updateSection(sectionId, data);
        return data;
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to update section";
        setError(message);
        throw err;
      }
    },
    [portfolioId, store],
  );

  const deleteSection = useCallback(
    async (sectionId: string) => {
      setError(null);
      try {
        await apiDelete(`/portfolios/${portfolioId}/sections?sectionId=${sectionId}`);
        store.removeSection(sectionId);
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to delete section";
        setError(message);
        throw err;
      }
    },
    [portfolioId, store],
  );

  const reorderSections = useCallback(
    async (orderedIds: string[]) => {
      // Optimistic update
      store.reorderSections(orderedIds);

      try {
        await apiPut(`/portfolios/${portfolioId}/sections`, {
          sections: orderedIds.map((id, index) => ({ id, sortOrder: index })),
        });
      } catch (err) {
        // Revert on failure — refetch
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to reorder sections";
        setError(message);
      }
    },
    [portfolioId, store],
  );

  return { createSection, updateSection, deleteSection, reorderSections, error };
}
