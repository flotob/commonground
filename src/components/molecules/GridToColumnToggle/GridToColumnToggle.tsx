// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import SwitchInputField from "../inputs/SwitchInputField/SwitchInputField";

import { ReactComponent as GridIcon } from "../../atoms/icons/16/Grid.svg";
import { ReactComponent as TripleRowsIcon } from "../../atoms/icons/16/TripleRows.svg";

import "./GridToColumnToggle.css";

type Props = {
    selectedValue: SwitchViewMode;
    onChange: (value: SwitchViewMode) => void;
}

export type SwitchViewMode = 'list' | 'grid';

const switchViewModes = [
    {
        value: 'grid',
        iconRight: <GridIcon />
    },
    {
      value: 'list',
      iconRight: <TripleRowsIcon />
    }
];

export default function GridToColumnToggle(props: Props) {
    const { selectedValue, onChange } = props;

    return (
        <div className="grid-column-toggle">
            <SwitchInputField
                options={switchViewModes}
                value={selectedValue}
                onChange={(value) => onChange(value as SwitchViewMode)}
            />
        </div>
    )
}