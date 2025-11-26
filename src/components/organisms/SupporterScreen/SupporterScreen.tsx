// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from 'common/config';
import { UserPremiumFeatureName } from 'common/enums';
import Button from 'components/atoms/Button/Button';
import Jdenticon from 'components/atoms/Jdenticon/Jdenticon';
import SupporterIcon from 'components/atoms/SupporterIcon/SupporterIcon';
import ToggleInputField from 'components/molecules/inputs/ToggleInputField/ToggleInputField';
import { useOwnUser } from 'context/OwnDataProvider';
import { useSnackbarContext } from 'context/SnackbarContext';
import userApi from 'data/api/user';
import dayjs from 'dayjs';
import { usePremiumTier } from 'hooks/usePremiumTier';
import React, { useCallback, useMemo } from 'react'

const SupporterScreen = () => {
  const ownUser = useOwnUser();
  const tier = usePremiumTier();
  const { showSnackbar } = useSnackbarContext();

  const expireDate = useMemo(() => {
    if (tier.type === 'free') return null;
    return dayjs(tier.activeUntil);
  }, [tier]);

  const onChangeRenew = useCallback(async (autoRenew: Common.PremiumRenewal | null) => {
    try {
      await userApi.setPremiumFeatureAutoRenew({
        featureName: tier.type === 'silver' ? UserPremiumFeatureName.SUPPORTER_1 : UserPremiumFeatureName.SUPPORTER_2,
        autoRenew,
      });
    } catch (e) {
      showSnackbar({ type: 'warning', text: 'Something went wrong, please try again later' });
    }
  }, [showSnackbar, tier.type]);

  const renewSparkPrice = useMemo(() => {
    if (tier.type === 'free' || !tier.autoRenew) return 0;
    const basePrice = tier.type === 'silver' ? config.PREMIUM.USER_SUPPORTER_1.MONTHLY_PRICE : config.PREMIUM.USER_SUPPORTER_2.MONTHLY_PRICE;
    if (tier.autoRenew === 'MONTH') return basePrice;
    else return basePrice * 12 * (1 - (config.PREMIUM.YEARLY_DISCOUNT_PERCENT / 100));
  }, [tier]);

  return <div className='flex flex-col items-center gap-2 cg-text-main cg-text-lg-400'>
    <div className='p-6 relative'>
      <Jdenticon
        userId={ownUser?.id || ''}
        predefinedSize='80'
        hideStatus
      />
      {tier.type !== 'free' && <div className='absolute bottom-0 right-0'>
        <SupporterIcon
          type={tier.type}
          size={56}
        />
      </div>}
    </div>
    <h3 className='cg-heading-3'>Thanks for supporting CG</h3>
    <span className='text-center'>We genuinely couldn’t do it without you. With your help, Common Ground will keep growing and releasing new features 💙</span>
    <span>Enjoy your shiny badge!</span>
    <div className='cg-separator' />
    <div className='flex items-center justify-center gap-2'>
      <span>Auto-renew</span>
      <ToggleInputField
        toggled={tier.type !== 'free' && !!tier.autoRenew}
        onChange={(toggled) => {
          if (toggled) {
            onChangeRenew('MONTH');
          } else {
            onChangeRenew(null);
          }
        }}
      />
    </div>
    {expireDate && tier.type !== 'free' && !tier.autoRenew && <span className='cg-text-secondary'>Badge expires {expireDate.format('MMM DD, YYYY')}</span>}
    {expireDate && tier.type !== 'free' && !!tier.autoRenew && <span className='cg-text-secondary text-center'>Badge will renew {expireDate.format('MMM DD, YYYY')} for a {tier.autoRenew === 'MONTH' ? 'month' : 'year'} for {renewSparkPrice.toLocaleString()} Spark</span>}
    {tier.type !== 'free' && tier.autoRenew === 'MONTH' && <Button
      className='w-full'
      role='secondary'
      text='Save 20% with yearly billing'
      onClick={() => onChangeRenew('YEAR')}
    />}
  </div>
}

export default React.memo(SupporterScreen);