// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from "common/config";
import { useOwnUser } from "context/OwnDataProvider";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";

export function useUserPremiumTier(user?: Pick<Models.User.Data, 'premiumFeatures'>) {
  const tier: {
    type: 'free';
  } | {
    type: 'silver' | 'gold';
    activeUntil: Date;
    autoRenew: Common.PremiumRenewal | null | undefined;
  } = useMemo(() => {
    const now = new Date();
    let feature: Models.User.PremiumFeature | undefined = user?.premiumFeatures.find(f => f.featureName === 'SUPPORTER_2' && new Date(f.activeUntil) > now);
    if (!!feature) {
      return {
        type: 'gold',
        activeUntil: new Date(feature.activeUntil),
        autoRenew: feature.autoRenew,
      };
    }
    feature = user?.premiumFeatures.find(f => f.featureName === 'SUPPORTER_1' && new Date(f.activeUntil) > now);
    if (!!feature) {
      return {
        type: 'silver',
        activeUntil: new Date(feature.activeUntil),
        autoRenew: feature.autoRenew,
      };
    }
    return {
      type: 'free',
    };
  }, [user?.premiumFeatures]);

  return tier;
}

export function usePremiumTier() {
  const ownUser = useOwnUser();
  const tier: {
    type: 'free';
  } | {
    type: 'silver' | 'gold';
    activeUntil: Date;
    autoRenew: Common.PremiumRenewal | null | undefined;
  } = useMemo(() => {
    const now = new Date();
    let feature: Models.User.PremiumFeature | undefined = ownUser?.premiumFeatures.find(f => f.featureName === 'SUPPORTER_2' && new Date(f.activeUntil) > now);
    if (!!feature) {
      return {
        type: 'gold',
        activeUntil: new Date(feature.activeUntil),
        autoRenew: feature.autoRenew,
      };
    }
    feature = ownUser?.premiumFeatures.find(f => f.featureName === 'SUPPORTER_1' && new Date(f.activeUntil) > now);
    if (!!feature) {
      return {
        type: 'silver',
        activeUntil: new Date(feature.activeUntil),
        autoRenew: feature.autoRenew,
      };
    }
    return {
      type: 'free',
    };
  }, [ownUser?.premiumFeatures]);

  return tier;
}

function getCommunityTierData(premium?: Models.Community.Premium | null) {
  if (!!premium && dayjs(premium.activeUntil).isAfter(dayjs())) {
    if (premium.featureName === 'ENTERPRISE') return config.PREMIUM.COMMUNITY_ENTERPRISE;
    if (premium.featureName === 'PRO') return config.PREMIUM.COMMUNITY_PRO;
    if (premium.featureName === 'BASIC') return config.PREMIUM.COMMUNITY_BASIC;
  }
  return config.PREMIUM.COMMUNITY_FREE;
}

export function useCommunityPremiumTier(premium: Models.Community.Premium | undefined | null) {
  const timeoutRef = useRef<any>(undefined);
  const [updateCounter, setUpdateCounter] = useState(0);

  const tier = useMemo(() => {
    if (!!premium && dayjs(premium.activeUntil).isAfter(dayjs())) {
      return premium.featureName;
    }
    return undefined;
  }, [premium, updateCounter]);

  const canUpgradeTier = useMemo(() => {
    return tier !== 'ENTERPRISE';
  }, [tier]);

  const tierData = useMemo(() => {
    return getCommunityTierData(premium);
  }, [premium, updateCounter]);

  useEffect(() => {
    if (!premium) return;
    const diff = dayjs(premium.activeUntil).diff(dayjs());
    if (diff > 0) {
      timeoutRef.current = setTimeout(() => {
        setUpdateCounter(prev => prev + 1);
      }, Math.min(diff + 100, 24 * 60 * 60 * 1000));
      return () => clearTimeout(timeoutRef.current);
    }
  }, [premium, updateCounter]);

  return {
    tier,
    tierData,
    canUpgradeTier,
    autoRenew: premium?.autoRenew || null,
  };
}
