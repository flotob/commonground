// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import CommunityPendingModal from "components/organisms/CommunityPendingModal/CommunityPendingModal";
import CommunityQuestionnaireModal from "components/organisms/CommunityQuestionnaireModal/CommunityQuestionnaireModal";
import CommunityRequirementsModal from "components/organisms/CommunityRequirementsModal/CommunityRequirementsModal";
import React, { useCallback, useState } from "react";

type CommunityOnboardingContextState = {
  password: string | undefined;
  setPassword: (password: string | undefined) => void;
  openRequirementsModal: (community: Models.Community.DetailView) => void;
  openQuestionnaireModal: (community: Models.Community.DetailView) => void;
  openPendingModal: (community: Models.Community.DetailView) => void;
  close: () => void;
};

export const CommunityOnboardingContext = React.createContext<CommunityOnboardingContextState>({
  password: undefined,
  setPassword: () => {},
  openRequirementsModal: () => {},
  openQuestionnaireModal: () => {},
  openPendingModal: () => {},
  close: () => {}
});

export function CommunityOnboardingProvider(props: React.PropsWithChildren<{}>) {
  const [community, setCommunity] = useState<Models.Community.DetailView | null>(null);
  const [password, setPassword] = useState<string | undefined>();
  const [mode, setMode] = useState<'pending' | 'questionnaire' | 'requirements'>('pending');

  const openRequirementsModal = useCallback((community: Models.Community.DetailView) => {
    setMode('requirements');
    setCommunity(community);
  }, []);

  const openQuestionnaireModal = useCallback((community: Models.Community.DetailView) => {
    setMode('questionnaire');
    setCommunity(community);
  }, []);

  const openPendingModal = useCallback((community: Models.Community.DetailView) => {
    setMode('pending');
    setCommunity(community);
  }, []);

  return (
    <CommunityOnboardingContext.Provider value={{ password, setPassword, openRequirementsModal, openPendingModal, openQuestionnaireModal, close: () => setCommunity(null) }}>
      {!!community && mode === 'requirements' && <CommunityRequirementsModal
        community={community}
        onClose={() => setCommunity(null)}
      />}
      {!!community && mode === 'questionnaire' && <CommunityQuestionnaireModal
        community={community}
        onClose={() => setCommunity(null)}
      />}
      {!!community && mode === 'pending' && <CommunityPendingModal
        community={community}
        onClose={() => setCommunity(null)}
      />}
      {props.children}
    </CommunityOnboardingContext.Provider>
  )
}

export function useCommunityOnboardingContext() {
  const context = React.useContext(CommunityOnboardingContext);
  return context;
}