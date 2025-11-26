// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useMemo, useState } from 'react'
import './CommunityQuestionnaireModal.css';
import ScreenAwareModal from 'components/atoms/ScreenAwareModal/ScreenAwareModal';
import Button from 'components/atoms/Button/Button';
import { XMarkIcon } from '@heroicons/react/24/solid';
import CommunityPhoto from 'components/atoms/CommunityPhoto/CommunityPhoto';
import Scrollable from 'components/molecules/Scrollable/Scrollable';
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { getCommunityDisplayName } from '../../../util';
import TextAreaField from 'components/molecules/inputs/TextAreaField/TextAreaField';
import data from 'data';
import { useCommunityJoinedContext } from 'context/CommunityJoinedProvider';
import { useCommunityOnboardingContext } from 'context/CommunityOnboardingProvider';
import errors from 'common/errors';
import { useSnackbarContext } from 'context/SnackbarContext';

type Props = {
  community: Models.Community.DetailView;
  onClose: () => void;
};

export function joinedProgressAfterQuestionnaire(data: {
  community: Models.Community.DetailView;
  openPendingModal: (comm: Models.Community.DetailView) => void;
  openJoinedModal: (commId: string) => void;
}) {
  if (!data.community.onboardingOptions?.manuallyApprove?.enabled) {
    data.openJoinedModal(data.community.id);
  } else {
    data.openPendingModal(data.community);
  }
}

const CommunityQuestionnaireModal: React.FC<Props> = ({ community, onClose }) => {
  const { isMobile, isTablet } = useWindowSizeContext();
  const isDesktop = !isMobile && !isTablet;
  const [isLoading, setIsLoading] = useState(false);
  const { password, setPassword, close, openPendingModal } = useCommunityOnboardingContext();
  const { openModal } = useCommunityJoinedContext();
  const { showSnackbar } = useSnackbarContext();

  const [currentData, setCurrentData] = useState<Models.Community.QuestionnaireAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);

  const questions = community.onboardingOptions?.questionnaire?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const toggleOption = (option: string) => {
    const isSelected = answer.includes(option);
    if (currentQuestion.type === 'multi-choice') setAnswer(isSelected ? [] : [option]);
    else {
      if (isSelected) {
        setAnswer(old => old.filter(sel => sel !== option));
      } else {
        setAnswer(old => old.concat([option]));
      }
    }
  };

  const validate = useCallback(() => {
    if (currentQuestion.type === 'text' && !answer[0]?.length) {
      return 'Please type an answer';
    }

    if (currentQuestion.type !== 'text' && answer.length === 0) {
      return currentQuestion.type === 'multi-choice' ? 'Please pick an option' : 'Please pick at least one option';
    }
    return null;  
  }, [answer, currentQuestion.type]);

  const onBack = async () => {
    setCurrentQuestionIndex(old => old - 1);
    setCurrentData(data => data.slice(0, -1));
    setAnswer([]);
  }

  const onNext = async () => {
    if (validate())  {
      setShowError(true);
      return;
    }

    const newData = [...currentData, {
      type: currentQuestion.type,
      question: currentQuestion.question,
      answer,
    }];
    setShowError(false);
    setCurrentData(newData);
    setAnswer([]);
    const isLastQuestion = currentQuestionIndex === (questions.length - 1);

    if (isLastQuestion) {
      // Join community
      try {
        setIsLoading(true);
        await data.community.joinCommunity({
          id: community.id,
          questionnaireAnswers: newData,
          password
        });
        setPassword(undefined);
        close();
        joinedProgressAfterQuestionnaire({
          community,
          openJoinedModal: openModal,
          openPendingModal
        });
      } catch (e: any) {
        if (e.message === errors.server.COMMUNITY_JOIN_IN_WAIT_PERIOD) {
          showSnackbar({type: 'warning', text: 'You last join request has been denied, please try again tomorrow'});
          onClose();
        } else {
          console.error(e);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentQuestionIndex(old => old + 1);
    }
  }

  const errorElement = useMemo(() => {
    if (!showError) return null;
    const validation = validate();
    if (validation) return <span className='cg-text-md-500 cg-text-warning'>{validation}</span>
  }, [showError, validate]);

  const content = <div className='flex flex-col gap-4'>
    <div className='flex gap-2 items-center'>
      <CommunityPhoto community={community} size='small-32' />
      {getCommunityDisplayName(community)}
    </div>
    <div className='flex gap-2 items-center'>
      <span className='cg-text-lg-500'>Questionnaire</span>
      <span className='cg-text-md-400 cg-text-secondary'>Question {currentQuestionIndex + 1} of {questions.length}</span>
    </div>
    <h3>{currentQuestion.question}</h3>
    {currentQuestion.type === 'text' && <TextAreaField
      key={currentQuestionIndex}
      value={answer[0]}
      onChange={(value) => setAnswer([value])}
      autoGrow
    />}
    {currentQuestion.type !== 'text' && <div className='questionnaire-options cg-bg-subtle cg-border-subtle cg-border-xl flex flex-col'>
      {currentQuestion.options.map(option => <div
        onClick={() => toggleOption(option)}
        className={`p-4 flex gap-4 justify-between cursor-pointer${answer.includes(option) ? ' active-option' : ''}`}
        key={option}
      >
        <span className='cg-text-lg-500'>{option}</span>
      </div>)}
    </div>}
    <div className='flex gap-4 items-center ml-auto mt-auto'>
      {errorElement}
      {currentQuestion.type === 'multi-select' && <span className='cg-text-md-500 cg-text-secondary'>You can select multiple</span>}
      <div className='flex gap-2'>
        {currentQuestionIndex > 0 && <Button
          role='secondary'
          text={'Back'}
          onClick={onBack}
        />}
        <Button
          role='primary'
          text={currentQuestionIndex < (questions.length - 1) ? 'Next' : 'Finish'}
          onClick={onNext}
          loading={isLoading}
        />
      </div>
    </div>

    {/*
    <div className='joined-community-container flex flex-col justify-center items-center gap-2 flex-1 self-stretch'>
      <div className='flex flex-col py-5 px-6 items-center justify-center gap-2 flex-1 self-stretch'>
        <CommunityPhoto community={community} size='large' noHover />
        <span className='cg-heading-2 cg-text-secondary'>Welcome to <span className='cg-text-main'>{community.title}</span></span>
        {community.shortDescription && <span className='cg-text-lg-400 cg-text-main'>{community.shortDescription}</span>}
      </div>
      {isDesktop && <div className='flex justify-center py-8 px-4 w-full'>
        <Button className='w-full' text='Done' role='primary' onClick={onClose} />
      </div>}
    </div>

    {roles.length > 0 && <div className='flex flex-col joined-community-role-container'>
      <Scrollable>
        <div className='joined-community-role-content'>
          <div className='flex gap-2 p-2 items-center cg-text-main'>
            <RoleIcon className='w-5 h-5' />
            <span className='cg-heading-3'>{roles.length} Roles</span>
            <Tag
              label='Roles'
              tooltipPlacement='top'
              variant='help'
              tooltipContent={'Roles may unlock additional chats and content, or may be only cosmetic'}
            />
          </div>
          <div className='roles-list'>
            {roles.map(role => <RoleCard
              key={role.id}
              role={role}
              ownRole={community.myRoleIds.includes(role.id)}
              noClaimedModal
              simpleClaimedDetails
              locked={role.assignmentRules?.type !== 'free' && !roleClaimability[role.id]}
              onJoined={() => {
                const canvas = canvasRef.current;
                if (canvas) {
                  const createdConfetti = confetti.create(canvas, { resize: true });
                  createdConfetti({
                    spread: 180,
                    origin: { y: 0.1 },
                    startVelocity: 20,
                  });
                }
              }}
            />)}
          </div>
        </div>
      </Scrollable>
    </div>} */}
  </div>;

  return (<ScreenAwareModal
    customClassname={`relative community-questionnaire-modal${!isMobile ? '' : ' mobile-modal'}`}
    isOpen={true}
    onClose={onClose}
    hideHeader
    noDefaultScrollable
    modalRootStyle={{ zIndex: 10101 }}
  >
    {!isMobile && <Button
      className='absolute top-4 right-4 cg-circular z-10'
      role='secondary'
      iconLeft={<XMarkIcon className='w-6 h-6' />}
      onClick={onClose}
    />}
    <div className={`community-questionnaire-modal-content${!isMobile ? '' : ' mobile-modal'}`}>
      {isDesktop && content}
      {!isDesktop && <>
        <Scrollable>
          {content}
        </Scrollable>
      </>}
    </div>
  </ScreenAwareModal>);
}

export default CommunityQuestionnaireModal