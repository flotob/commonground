// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo, useState } from 'react'
import { AudioWidgetProps } from './AudioWidget';
import LogOffModal from 'components/organisms/LogOffModal/LogOffModal';
import { useCallContext } from 'context/CallProvider';
import { SidebarVoiceCallManager } from 'components/organisms/VoiceCallManager/VoiceCallManager';
import UserWidget from '../UserWidget/UserWidget';

type Props = AudioWidgetProps & {
  handleProfileClick: () => void;
};

const AudioWidgetDesktop: React.FC<Props> = (props) => {
  const { isConnected } = useCallContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);  

  const containerClassname = [
    'audio-widget-desktop-container',
    isConnected ? 'call-active' : '',
    props.isCollapsed ? 'collapsed' : ''
  ].join(' ');

  return useMemo(() => {
    return (
      <div className={containerClassname}>
        {isConnected && <SidebarVoiceCallManager collapsed={props.isCollapsed} />}
        <UserWidget collapsed={props.isCollapsed || false} />
        <LogOffModal open={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
      </div>
    );
  }, [containerClassname, isConnected, isLogoutModalOpen, props.isCollapsed]);
}

export default React.memo(AudioWidgetDesktop);