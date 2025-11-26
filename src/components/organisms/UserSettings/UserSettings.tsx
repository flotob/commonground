// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useManagementContentModalContext } from "../ManagementContentModal/ManagementContentModalContext";

import AudioDevicesManagement from "../AudioDevicesManagement/AudioDevicesManagement";
import SwapAccount from "../SwapAccount/SwapAccount";
import UserProfileManagement from "../UserProfileManagement/UserProfileManagement";
import WalletsManagement from "../WalletsManagement/WalletsManagement";

import "./UserSettings.css";

export default function UserSettings() {
  const { activeModalContent } = useManagementContentModalContext();

  return (
    <div className="user-settings">
      {activeModalContent === "manage-profile" && <UserProfileManagement />}
      {activeModalContent === "wallets" && <WalletsManagement />}
      {activeModalContent === "audio-devices" && <AudioDevicesManagement />}
      {activeModalContent === "help" && <>Help</>}
    </div>
  )
}