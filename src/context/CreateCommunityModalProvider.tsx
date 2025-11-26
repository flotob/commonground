// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback } from 'react';
import CreateCommunityModal from '../components/templates/CreateCommunity/CreateCommunityModal';
import { useOwnUser } from './OwnDataProvider';
import { useUserOnboardingContext } from './UserOnboarding';

type CreateCommunityModalState = {
  isVisible: boolean;
  setVisible: (isVisible: boolean) => void;
};

const CreateCommunityModalContext = React.createContext<CreateCommunityModalState>({
  isVisible: false,
  setVisible: () => {}
});

export function CreateCommunityModalProvider(props: React.PropsWithChildren<{}>) {
  const [isVisible, _setVisible] = React.useState(false);
  const { setUserOnboardingVisibility } = useUserOnboardingContext();
  const ownUser = useOwnUser();

  const setVisible = useCallback((value: boolean) => {
    if (!ownUser) {
      setUserOnboardingVisibility(true);
    } else {
      _setVisible(value);
    }
  }, [ownUser, setUserOnboardingVisibility]);

  return (
    <CreateCommunityModalContext.Provider value={{
      isVisible,
      setVisible
    }}>
      {isVisible && <CreateCommunityModal />}
      {props.children}
    </CreateCommunityModalContext.Provider>
  );
}

export function useCreateCommunityModalContext() {
  const context = React.useContext(CreateCommunityModalContext);
  return context;
}
