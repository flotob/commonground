// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback } from "react";
import './CallWidget.css';
import Button from "components/atoms/Button/Button";
import PeersCards from "./Peers";
import CallActions from "./CallActions";
import UserTag from "components/atoms/UserTag/UserTag";
import { Dayjs } from "dayjs";
import { CallTimer } from "./CallTimer";
import { useWindowSizeContext } from "context/WindowSizeProvider";
import { CallType } from "common/enums";
import BroadcastActions from "./BroadcastActions";
import BroadcastCards from "./BroadcastCards";
import CallHeader from "./CallHeader/CallHeader";
import PreviewCards from "./PreviewCards/PreviewCards";
import JoinCallModal from "components/molecules/JoinCallModal/JoinCallModal";
import ReactionOverlay from "./ReactionOverlay/ReactionOverlay";

interface CallWidgetProperties {
    name: string;
    description: string | null;
    startTime: Dayjs;
    roomId: string;
    membersInCall: Models.User.Data[];
    channelId: string;
    isConnected: boolean;
    isFullscreen: boolean;
    callType: CallType;
    setFullscreen: (fullscreen: boolean) => void;
    chatViewVisible: boolean;
    toggleChatView: () => void;
    onStartCall?: () => void;
    showReactionPicker: boolean;
    setShowReactionPicker: (show: boolean) => void;
    mobileCollapsed: boolean;
    callMembers: number;
    callSlots: number;
}

export const CallWidget: React.FC<CallWidgetProperties> = (props) => {
    const { isMobile, isTablet } = useWindowSizeContext();
    const {
        name,
        roomId,
        startTime,
        membersInCall,
        description,
        channelId,
        isConnected,
        isFullscreen,
        callType,
        setFullscreen,
        chatViewVisible,
        toggleChatView,
        onStartCall,
        showReactionPicker,
        setShowReactionPicker,
        mobileCollapsed,
        callMembers,
        callSlots
    } = props;

    const toggleFullScreen = useCallback(() => {
        setFullscreen(!isFullscreen);
    }, [isFullscreen, setFullscreen]);

    if (isConnected) {
        const defaultCall = <div className={`video-call-container ${isFullscreen ? 'full-screen' : ''}`}>
            {(isMobile || isTablet) && !mobileCollapsed && <CallHeader 
                name={name}
                description={description}
                membersInCall={membersInCall}
                roomId={roomId}
            />}
            <div className="flex flex-col w-full h-full overflow-hidden">
                <div className='video-call-cards'>
                    <PeersCards mobileCollapsed={mobileCollapsed} />
                    <ReactionOverlay showPicker={showReactionPicker} closePicker={() => setShowReactionPicker(false)} />
                </div>
                {!mobileCollapsed && <CallActions
                    onFullScreen={toggleFullScreen}
                    isFullscreen={isFullscreen}
                    showReactionPicker={showReactionPicker}
                    setShowReactionPicker={setShowReactionPicker}
                />}
            </div>
        </div>;
        const broadcastCall = <div className={`video-call-container ${isFullscreen ? 'full-screen' : ''}`}>
            {(isMobile || isTablet) && !mobileCollapsed && <CallHeader 
                name={name}
                description={description}
                membersInCall={membersInCall}
                roomId={roomId}
            />}
            <div className="flex flex-col w-full h-full overflow-hidden">
                <div className='video-call-cards'>
                    <BroadcastCards mobileCollapsed={mobileCollapsed} />
                    <ReactionOverlay showPicker={showReactionPicker} closePicker={() => setShowReactionPicker(false)} />
                </div>
                {!mobileCollapsed && <BroadcastActions
                    onFullScreen={toggleFullScreen}
                    chatViewVisible={chatViewVisible}
                    toggleChatView={toggleChatView}
                    isFullscreen={isFullscreen}
                    showReactionPicker={showReactionPicker}
                    setShowReactionPicker={setShowReactionPicker}
                />}
            </div>
        </div>;
        return (
            callType === CallType.DEFAULT ? defaultCall : broadcastCall
        )
    }
    return (
        <div className={`video-call-container ${isConnected ? '' : 'not-connected'}`}>
            {(isMobile || isTablet) && <CallHeader 
                name={name}
                description={description}
                membersInCall={membersInCall}
                roomId={roomId}
            />}
            <div className='flex items-center self-stretch p-2 justify-center h-full'>
                {(isMobile || isTablet) && <div className="flex items-center gap-2 w-full">
                    <CallTimer startTime={startTime || 0} className="cg-text-md-500 cg-text-secondary" />
                    <div className="active-users-list">
                        {membersInCall && membersInCall.map((member) => <UserTag userData={member} channelId={channelId} />)}
                    </div>
                    <Button
                        text={'Join call'}
                        onClick={onStartCall}
                        role='primary'
                    />
                </div>}
                {!isMobile && !isTablet && <div className='video-call-cards h-full'>
                    <PreviewCards membersInCall={membersInCall} />
                </div>}
                <JoinCallModal
                    title={name}
                    description={description}
                    startTime={startTime}
                    onStartCall={() => onStartCall?.()}
                    callLimit={callSlots}
                    callMemberCount={callMembers}
                />
            </div>
        </div>
    );
}