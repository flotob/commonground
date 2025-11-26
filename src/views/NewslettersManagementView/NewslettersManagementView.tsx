// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import "./NewslettersManagementView.css";
import { useWindowSizeContext } from "../../context/WindowSizeProvider";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";

type Props = {

}

export default function NewslettersManagementView(props: Props) {
  const { isMobile } = useWindowSizeContext();

  if (isMobile) {
    return (
      <div className="newsletters-management-view">
        <NewslettersManagementView />
      </div>
    );
  } else {
    return (
      <div className="newsletters-management-view">
        <Scrollable>
          <NewslettersManagementView />
        </Scrollable>
      </div>
    );
  }
}