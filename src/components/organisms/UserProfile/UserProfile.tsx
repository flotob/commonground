// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "./UserProfile.css";
import UserProfileInner from "./UserProfileInner/UserProfileInner";
import { useLoadedProfileContext } from "context/ProfileProvider";

export default function UserProfile() {
  const { user } = useLoadedProfileContext();  

  return (<div className="user-profile-main-content">
    <UserProfileInner
      userId={user.id}
      showDeleteButton={false}
    />
  </div>);
}