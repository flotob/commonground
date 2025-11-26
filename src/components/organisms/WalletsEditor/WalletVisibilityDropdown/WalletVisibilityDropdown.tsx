// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import DropdownItem from "../../../atoms/ListItem/ListItem";
import Dropdown from "../../../../components/molecules/Dropdown/Dropdown";
import WalletVisibility from "../../../../components/organisms/ConnectedWalletsModal/WalletVisibility/WalletVisibility";

import "./WalletVisibilityDropdown.css";
import Button from "components/atoms/Button/Button";

type Props = {
    visibility: Models.Wallet.Visibility;
    onChange: (visibility: Models.Wallet.Visibility) => void;
}

export default function WalletVisibilityDropdown(props: Props) {
    const { visibility, onChange } = props;

    return (
        <div>
            <Dropdown
                triggerContent={<Button role="chip" text={<WalletVisibility visibility={visibility} />}/>}
                items={[
                    <DropdownItem title="Hidden" description="Nobody can see this wallet. Your NFTs and transactions are also hidden." onClick={() => onChange("private")} key="private" />,
                    <DropdownItem title="Public" description="Everyone can see this wallet, any NFTs and transactions" onClick={() => onChange("public")} key="public" />,
                    <DropdownItem title="Limited" description="Only users you follow can see this wallet, any NFTs and transactions" onClick={() => onChange("followed")} key="followed" />
                ]}
            />
        </div>
    )
}