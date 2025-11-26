// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useWindowSizeContext } from "../../context/WindowSizeProvider";

import ChatsMenu from "../../components/organisms/ChatsMenu/ChatsMenu";
import Scrollable from "../../components/molecules/Scrollable/Scrollable";

import './ConversationsBrowser.css';

const Placeholder = () => {
  return (
    <div className="socials-empty-state">
      {/* <div className="socials-empty-state-inner">
        <SocialsEmptyState />
        <p>Soon you’ll be able to see what people you follow are up to</p>
      </div> */}
    </div>
  )
}

export default function ConversationsBrowser() {
  const { isMobile } = useWindowSizeContext();

  if (isMobile) {
    return (
      <div className="conversation-browser">
        <ChatsMenu />
      </div>
    );
  } else {
    return (
      <div className="conversation-browser">
        <Scrollable
          hideOnNoScroll={true}
          hideOnNoScrollDelay={600}
          innerClassName="px-6"
        >
          <Placeholder />
        </Scrollable>
        <ChatsMenu />
      </div>
    );
  }
}