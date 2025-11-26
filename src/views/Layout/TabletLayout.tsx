// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { PropsWithChildren } from "react";
import ExpandedMenu from "../../components/organisms/Menu/ExpandedMenu/ExpandedMenu";
import UserOnboarding from '../../components/organisms/UserOnboarding/UserOnboarding';
import './TabletLayout.css';

type Props = {
}

export default function TabletLayout(props: PropsWithChildren<Props>) {
  return (
    <>
      <div className="background"/>
      <div className={`layout desktop-layout tablet-layout`}>
        <div className="content">
          {props.children}
        </div>
        <ExpandedMenu />
        <UserOnboarding />
      </div>
    </>
  );
}