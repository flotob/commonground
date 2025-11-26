// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useState, useMemo } from 'react'
import './RoleCard.css';
import RolePhoto from '../RolePhoto/RolePhoto';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import Button from 'components/atoms/Button/Button';
import { LockClosedIcon } from '@heroicons/react/20/solid';
import communityApi from 'data/api/community';
import ContractDetails from '../ContractDetails/ContractDetails';
import RoleBenefitsModal from 'components/organisms/RoleBenefitsModal/RoleBenefitsModal';
import { useRoleClaimedContext } from 'context/RoleClaimedProvider';
import { useContractData } from 'context/CommunityProvider';
import config from 'common/config';
import { Tooltip } from 'components/atoms/Tooltip/Tooltip';
import { WarningCircle } from '@phosphor-icons/react';

type Props = {
  role: Models.Community.Role;
  ownRole?: boolean;
  locked?: boolean;
  onJoined?: () => void;
  noClaimedModal?: boolean;
  simpleClaimedDetails?: boolean;
};

const RoleCard: React.FC<Props> = (props) => {
  const { role, ownRole, locked, onJoined, noClaimedModal, simpleClaimedDetails } = props;
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const { isMobile } = useWindowSizeContext();
  const { openModal } = useRoleClaimedContext();

  const contractIds = useMemo(() => {
    const assignmentRules = role.assignmentRules;
    if (!assignmentRules) return [];
    if (assignmentRules.type !== 'token') return [];

    const contractIds = [assignmentRules.rules.rule1.contractId];
    if ("rule2" in assignmentRules.rules) {
      contractIds.push(assignmentRules.rules.rule2.contractId);
    }
    return contractIds;
  }, [role.assignmentRules]);

  const contractData = useContractData(contractIds);

  const activeChains = useMemo(() => new Set(config.ACTIVE_CHAINS), []);

  const isInactive = useMemo(() => {
    const contracts = Object.values(contractData);
    if (contracts.length === 0) return false;
    return contracts.some(cd => !activeChains.has(cd.chain));
  }, [contractData]);

  const claimRole = useCallback(async () => {
    if (isInactive) {
      return;
    }

    const result = await communityApi.claimRole({
      communityId: role.communityId,
      roleId: role.id
    });

    if (result) {
      onJoined?.();
      if (!noClaimedModal) openModal(role);
    }
  }, [noClaimedModal, onJoined, openModal, role]);

  const renderBenefitsButtons = () => {
    if (simpleClaimedDetails) {
      return <div className={`flex gap-2`}>
        <div className='simple-claimed cg-border-xl cg-text-lg-500 py-3 px-4'>Claimed</div>
      </div>;
    }

    return <div className={`flex gap-2${isMobile ? ' w-full justify-center' : ''}`}>
      <Button
        className={isMobile ? 'flex-1' : undefined}
        text='Benefits'
        role='secondary'
        onClick={() => setBenefitsOpen(true)}
      />
      {/* <Button
        className={isMobile ? 'flex-1' : undefined}
        text='Revoke'
        role='secondary'
      /> */}
    </div>;
  }

  const className = [
    'role-card flex flex-col py-6 px-4 items-start justify-center self-stretch cg-text-main',
    ownRole ? 'own-role' : ''
  ].join(' ').trim();

  return (<div className={className}>
    <div className='flex items-center self-stretch gap-4'>
      <RolePhoto
        roleId={role.id}
        communityId={role.communityId}
        imageId={role.imageId}
        small
      />
      <span className='flex-1 cg-heading-3'>
        {role.title}
      </span>
      {isInactive && <Tooltip
        placement="top"
        offset={6}
        triggerContent={
          <div className='cg-text-error'><WarningCircle className='w-6 h-6' weight='duotone' /></div>
        }
        tooltipContent={<span>One of the required tokens is on an inactive chain. Roles with such tokens are not claimable anymore.</span>}
      />}
      {!ownRole && <Button
        iconLeft={locked ? <LockClosedIcon className='w-5 h-5' /> : undefined}
        text={locked ? 'Locked' : 'Get role'}
        disabled={locked || isInactive}
        role='primary'
        onClick={claimRole}
      />}
      {ownRole && (!isMobile || simpleClaimedDetails) && renderBenefitsButtons()}
    </div>
    {role.description && <span className='cg-text-secondary cg-text-lg-400'>{role.description}</span>}
    {ownRole && isMobile && !simpleClaimedDetails && renderBenefitsButtons()}
    {!ownRole && role.assignmentRules?.type === 'token' && <ContractDetails
      assignmentRules={role.assignmentRules}
      locked={!!locked}
      contractData={contractData}
    />}
    {benefitsOpen && <RoleBenefitsModal
      visible={benefitsOpen}
      role={role}
      onClose={() => setBenefitsOpen(false)}
    />}
  </div>);
}

export default React.memo(RoleCard);