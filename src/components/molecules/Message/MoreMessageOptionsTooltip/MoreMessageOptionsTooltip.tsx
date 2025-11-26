// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import data from 'data';

import { useCommunityModerationContext } from '../../../../context/CommunityModerationContext';

import Button from '../../../../components/atoms/Button/Button';
import Dropdown from "../../../../components/molecules/Dropdown/Dropdown";
import DropdownItem from '../../../atoms/ListItem/ListItem';

import { ReactComponent as DeleteIcon } from '../../../../components/atoms/icons/20/Delete.svg';
import { ReactComponent as EditIcon } from '../../../../components/atoms/icons/20/Edit.svg';
import { ReactComponent as ModIcon } from '../../../../components/atoms/icons/20/Mod.svg';
import { ReactComponent as MoreVerticalIcon } from '../../../../components/atoms/icons/20/MoreVertical.svg';

import "./MoreMessageOptionsTooltip.css";
import { useOwnUser } from 'context/OwnDataProvider';

type Props = {
    senderId: string;
    messageId: string;
    channelId: string;
    onEditClick: (messageId: string) => void;
    setTooltipSticky: (isSticky: boolean) => void;
}

export default function MoreMessageOptionsTooltip(props: Props) {
    const { deleteMessage } = useCommunityModerationContext();
    const { senderId, messageId, channelId, onEditClick } = props;

    const ownUser = useOwnUser();
    
    const isSender = !!ownUser && senderId === ownUser.id;

    const handleDeletePostClick = () => {
        deleteMessage(messageId, senderId, channelId);
    }

    const handleEditPostClick = () => {
        onEditClick(messageId);
    }

    const items = [];
    if (isSender) {
        items.push(<DropdownItem key="Edit" title="Edit" icon={<EditIcon />} className="edit-message-dropdown-item" onClick={handleEditPostClick} />);
        items.push(<DropdownItem key="Delete" title="Delete" icon={<DeleteIcon />} className="delete-message-dropdown-item" onClick={handleDeletePostClick} />);
    }
    items.push(<DropdownItem key="Report" title="Report" icon={<ModIcon />} disabled={true} />);

    return (
        <>
            <Dropdown
                onOpen={() => props.setTooltipSticky(true)}
                onClose={() => props.setTooltipSticky(false)}
                triggerContent={<Button iconLeft={<MoreVerticalIcon />} role="borderless" className="more-message-options-dropdown-trigger" />}
                items={items}
                placement="left"
                title="More options"
                className="more-message-options-dropdown"
                offset={0}
            />
        </>
    )
}