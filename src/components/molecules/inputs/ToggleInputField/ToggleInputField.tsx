// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "./ToggleInputField.css";

type Props = {
    toggled: boolean;
    onChange?: (toggled: boolean) => void;
    label?: string;
    className?: string;
    small?: boolean;
    disabled?: boolean;
}

export default function ToggleInputField(props: Props) {
    const { toggled, onChange, label, className, small, disabled } = props;

    const containerClassName = [
        "toggle-input-field-container",
        className ? className : ""
    ].join(" ").trim();

    const inpuClassName = [
        "toggle-input-field",
        toggled ? "toggled" : "",
        small ? "small" : "",
        disabled ? "disabled" : ""
    ].join(" ").trim();

    const handleOnChange = (value: boolean) => {
        if (!!onChange) {
            onChange(value);
        }
    }

    return (
        <label className={containerClassName} onClick={() => { if (!disabled) handleOnChange(!toggled); }}>
            {label && label}
            <div className={inpuClassName}>
                <div className="toggle-button"></div>
            </div>
        </label>
    )
}