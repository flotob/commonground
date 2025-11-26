// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import CommunityJoinedModal from "components/organisms/CommunityJoinedModal/CommunityJoinedModal";
import data from "data";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useState } from "react";

type CommunityJoinedContextState = {
  openModal: (communityId: string) => void;
  close: () => void;
};

export const CommunityJoinedContext = React.createContext<CommunityJoinedContextState>({
  openModal: () => {},
  close: () => {}
});

export function CommunityJoinedProvider(props: React.PropsWithChildren<{}>) {
  const [communityId, setCommunityId] = useState<string | null>(null);
  const community = useLiveQuery(async () => {
    const myCommunities = await data.community.getOwnCommunities();
    return myCommunities?.find(comm => comm.id === communityId);
  }, [communityId]);

  return (
    <CommunityJoinedContext.Provider value={{ openModal: setCommunityId, close: () => setCommunityId(null) }}>
      {!!community && <CommunityJoinedModal
        community={community}
        onClose={() => setCommunityId(null)}
      />}
      {props.children}
    </CommunityJoinedContext.Provider>
  )
}

export function useCommunityJoinedContext() {
  const context = React.useContext(CommunityJoinedContext);
  return context;
}