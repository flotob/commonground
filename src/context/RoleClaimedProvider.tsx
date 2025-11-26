// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from "react";
import RoleClaimedModal from "components/organisms/RoleClaimedModal/RoleClaimedModal";

type RoleClaimedContextState = {
  openModal: (role: Models.Community.Role) => void;
  close: () => void;
};

export const RoleClaimedContext = React.createContext<RoleClaimedContextState>({
  openModal: () => {},
  close: () => {}
});

export function RoleClaimedProvider(props: React.PropsWithChildren<{}>) {
  const [role, setRole] = useState<Models.Community.Role | null>(null);

  return (
    <RoleClaimedContext.Provider value={{ openModal: setRole, close: () => setRole(null) }}>
      {!!role && <RoleClaimedModal
        role={role}
        communityId={role.communityId}
        onClose={() => setRole(null)}
        visible={true}
      />}
      {props.children}
    </RoleClaimedContext.Provider>
  )
}

export function useRoleClaimedContext() {
  const context = React.useContext(RoleClaimedContext);
  return context;
}