// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

type State = 'IDLE' | 'LOADING' | 'DONE';
export type Filters = 'new' | 'popular';

type GroupExplorerDataState = {
    stateNode: State
    filterTab: Filters;
    filterTag?: string;
    tags: string[];
    search?: string;
    communityList: Models.Community.ListView[];
};

type ClearGroupsAndLoadAction = {
    type: 'ClearAndLoad';
    filterTab: Filters;
    filterTag?: string;
    tags: string[];
    search?: string;
};

type UpdateFreshDataAction = {
    type: 'UpdateFreshData';
    communityList: Models.Community.ListView[];
};

type StartLoadingAction = {
    type: 'StartLoading';
}

type AppendGroupsAction = {
    type: 'AppendGroups';
    communityList: Models.Community.ListView[];
};

type Action = ClearGroupsAndLoadAction | UpdateFreshDataAction | StartLoadingAction | AppendGroupsAction;

export const initialState: GroupExplorerDataState = {
    stateNode: 'LOADING',
    communityList: [],
    filterTab: 'new',
    filterTag: '',
    tags: [],
};

export function dataStateReducer(state: GroupExplorerDataState, action: Action): GroupExplorerDataState {
    switch (action.type) {
        case 'StartLoading':
            return {
                ...state,
                stateNode: 'LOADING'
            };
        case 'AppendGroups':
            return {
                ...state,
                communityList: [...state.communityList, ...action.communityList],
                stateNode: action.communityList.length > 0 ? 'IDLE' : 'DONE' 
            };
        case 'ClearAndLoad':
            return {
                stateNode: 'LOADING',
                filterTab: action.filterTab,
                filterTag: action.filterTag,
                tags: action.tags,
                search: action.search,
                communityList: []
            };
        case 'UpdateFreshData':
            return {
                ...state,
                stateNode: 'IDLE',
                communityList: action.communityList
            };
        default:
            throw new Error('Invalid reducer action');
    }
};
