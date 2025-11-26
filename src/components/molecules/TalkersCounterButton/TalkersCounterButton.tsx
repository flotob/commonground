// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md


import { useCallContext } from "../../../context/CallProvider";

import Button from "../../../components/atoms/Button/Button";

import './TalkersCounterButton.css';

type Props = {
  onClick?: () => void;
}

export default function TalkersCounterButton(props: Props) {
  const { onClick } = props;
  const {peers} = useCallContext();

  return (
    <Button role="secondary" className="btnTalkersCounter" text={`${peers.size}`} onClick={onClick} />
  );
}
