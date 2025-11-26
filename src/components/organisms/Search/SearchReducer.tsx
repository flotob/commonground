// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import { debounce } from '../../../util';

const DEBOUNCE_DELAY = 600;

export type SearchState<T> = {
  items: T[];
  status: 'idle' | 'loading' | 'done';
  search: string;
  tags: string[];
  error?: string;
};

type SearchAction<T> =
  | { type: 'FETCH_START'; }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'FETCH_SUCCESS'; search: string; payload: T[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_DONE' }
  | { type: 'RESET' };

export const STARTING_LIMIT = 6;

function searchReducer<T extends object>(
  state: SearchState<T>,
  action: SearchAction<T>
): SearchState<T> {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        status: 'loading',
        error: undefined,
      };

    case 'SET_SEARCH':
      return {
        ...state,
        search: action.payload,
      };

    case 'FETCH_SUCCESS':
      if (state.status !== 'loading' || state.search !== action.search) {
        return state;
      }

      return {
        ...state,
        status: 'idle',
        items: [...state.items, ...action.payload],
        error: undefined,
      };

    case 'FETCH_ERROR':
      if (state.status !== 'loading') {
        return state;
      }

      return {
        ...state,
        status: 'idle',
        error: action.payload,
      };

    case 'SET_DONE':
      return {
        ...state,
        status: 'done',
      };

    case 'RESET':
      return {
        items: [],
        search: '',
        tags: [],
        status: 'idle',
        error: undefined,
      };

    default:
      return state;
  }
}

const initialSearchState = <T extends object>(): SearchState<T> => ({
  items: [],
  status: 'idle',
  search: '',
  tags: [],
});

export const useSearchReducer = <T extends object>(
  fetcher: (search: string, tags: string[], offset: number, limit?: number) => Promise<T[]>,
  initialState: SearchState<T> = initialSearchState<T>()
) => {
  const [state, dispatch] = React.useReducer(
    searchReducer as React.Reducer<SearchState<T>, SearchAction<T>>,
    initialState
  );

  const _search = React.useCallback(async (search: string, tags: string[]) => {
    dispatch({ type: 'RESET' });
    dispatch({ type: 'SET_SEARCH', payload: search });
    dispatch({ type: 'FETCH_START' });
    try {
      const results = await fetcher(search, tags, 0, STARTING_LIMIT);
      if (results.length === 0) {
        dispatch({ type: 'SET_DONE' });
      } else {
        dispatch({ type: 'FETCH_SUCCESS', search, payload: results });
      }
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', payload: (error as Error).message });
    }
  }, [fetcher]);

  const search = React.useMemo(() => debounce(_search, DEBOUNCE_DELAY), [_search]);

  const loadMore = React.useCallback(async () => {
    if (state.status !== 'idle') {
      return;
    }

    dispatch({ type: 'FETCH_START' });
    try {
      const results = await fetcher(state.search, state.tags, state.items.length);
      if (results.length === 0) {
        dispatch({ type: 'SET_DONE' });
      } else {
        dispatch({ type: 'FETCH_SUCCESS', search: state.search, payload: results });
      }
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', payload: (error as Error).message });
    }
  }, [state.status, state.search, state.tags, state.items.length, fetcher]);

  return [state, search, loadMore] as const;
};