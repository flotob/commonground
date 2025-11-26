// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from "common/config";
import { CommunityPremiumFeatureName } from "common/enums";
import React, { useCallback, useEffect, useMemo } from "react";
import { Users, Broadcast } from "@phosphor-icons/react";
import CheckboxBase from "components/atoms/CheckboxBase/CheckboxBase";
import './CallConfigurationToggle.css';
import Tag from "components/atoms/Tag/Tag";

export interface IConfig {
  stageLimit: number;
  overallCallLimit: number;
  highDefinition: boolean;
  audioOnly: boolean;
}

enum CallTiers {
  STANDARD = "STANDARD",
  HD = "HD",
  AUDIO = "AUDIO",
}

type Props = {
  premiumConfig: Models.Community.PremiumConfig;
  isBroadcast: boolean;
  callConfig: IConfig;
  setCallConfig: React.Dispatch<React.SetStateAction<IConfig>>;
};

const CallConfigurationToggle: React.FC<Props> = (props: Props) => {
  const { premiumConfig, isBroadcast, callConfig, setCallConfig } = props;
  const standardCallLimit = premiumConfig.CALL_STANDARD;
  const hdCallLimit = premiumConfig.CALL_HD;
  const audioOnlyCallLimit = premiumConfig.CALL_AUDIO;
  const standardBroadcastLimit = premiumConfig.BROADCAST_STANDARD;
  const hdBroadcastLimit = premiumConfig.BROADCAST_HD;
  const audioOnlyBroadcastLimit = premiumConfig.BROADCAST_AUDIO;
  
  const selectedTier = useMemo(() => {
    if (callConfig.audioOnly) return CallTiers.AUDIO;
    if (callConfig.highDefinition) return CallTiers.HD;
    return CallTiers.STANDARD;
  }, [callConfig.audioOnly, callConfig.highDefinition]);

  const handleConfigurationClick = useCallback((tier: CallTiers) => {
    switch (tier) {
      case CallTiers.STANDARD:
        setCallConfig(old => ({
          ...old,
          overallCallLimit: isBroadcast ? standardBroadcastLimit : standardCallLimit,
          highDefinition: false,
          audioOnly: false,
        }));
        break;
      case CallTiers.HD:
        setCallConfig(old => ({
          ...old,
          overallCallLimit: isBroadcast ? hdBroadcastLimit : hdCallLimit,
          highDefinition: true,
          audioOnly: false,
        }));
        break;
      case CallTiers.AUDIO:
        setCallConfig(old => ({
          ...old,
          overallCallLimit: isBroadcast ? audioOnlyBroadcastLimit : audioOnlyCallLimit,
          highDefinition: false,
          audioOnly: true,
        }));
        break;
      default:
        break;
    }
  }, [audioOnlyBroadcastLimit, audioOnlyCallLimit, hdBroadcastLimit, hdCallLimit, isBroadcast, setCallConfig, standardBroadcastLimit, standardCallLimit]);

  useEffect(() => {
    if (!isBroadcast) {
      handleConfigurationClick(CallTiers.HD);
    }
  }, [handleConfigurationClick, isBroadcast]);

  if (!isBroadcast) {
    return <Tag variant="info" label="You can have up to 50 people here, HD Quality" />
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <label className="cg-text-md-500">{"Set quality"}</label>
        <span className="cg-text-md-400 cg-text-secondary">{"Adjust Quality to host more people."}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <CallConfigurationBox
          name='Standard'
          limitAmount={isBroadcast ? standardBroadcastLimit : standardCallLimit}
          limitDesc="720p 30fps"
          selected={selectedTier === CallTiers.STANDARD}
          onClick={() => { handleConfigurationClick(CallTiers.STANDARD) }}
        />
        <CallConfigurationBox
          name='HD'
          limitAmount={isBroadcast ? hdBroadcastLimit : hdCallLimit}
          limitDesc="1080p 60fps"
          selected={selectedTier === CallTiers.HD}
          onClick={() => { handleConfigurationClick(CallTiers.HD) }}
        />
        <CallConfigurationBox
          name='Audio only'
          limitAmount={isBroadcast ? audioOnlyBroadcastLimit : audioOnlyBroadcastLimit}
          selected={selectedTier === CallTiers.AUDIO}
          onClick={() => { handleConfigurationClick(CallTiers.AUDIO) }}
        />
      </div>
    </div>
  );
};

type ConfigurationBoxProps = {
  name: string;
  limitAmount: number | string;
  limitDesc?: string;
  selected: boolean;
  onClick: () => void;
};

const CallConfigurationBox: React.FC<ConfigurationBoxProps> = (props) => {
  return <div className={`call-configuration-box${props.selected ? ' selected' : ''}`} onClick={props.onClick}>
    <CheckboxBase type="radio" size="small" checked={props.selected} />
    <span className="cg-text-md-500">{props.name}</span>
    <div className="flex flex-col gap-1 cg-text-md-400 cg-text-secondary">
      <div className="flex items-center gap-1">
        <Users weight="duotone" className="h-5 w-5" />
        <div className="flex-1">{props.limitAmount} Limit</div>
      </div>
      {!!props.limitDesc && <div className="flex items-center gap-1 cg-text-sm-500">
        <Broadcast weight="duotone" className="h-5 w-5" />
        <div className="flex-1">{props.limitDesc}</div>
      </div>}
    </div>
  </div>;
}

export default CallConfigurationToggle;
