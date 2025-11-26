// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Scrollable from "../../../molecules/Scrollable/Scrollable";
import "./ManagementContentModalWrappers.css";

export default function ManagementContentModalMenuWrapper(props: React.PropsWithChildren) {
    return (
        <div className="management-content-modal-menu-container">
            <Scrollable>
                {props.children}
            </Scrollable>
        </div>
    )
}