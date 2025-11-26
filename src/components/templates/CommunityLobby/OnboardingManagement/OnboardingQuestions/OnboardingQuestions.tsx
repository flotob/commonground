// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './OnboardingQuestions.css';
import { CaretCircleUpDown, Minus, Plus } from '@phosphor-icons/react';
import Button from 'components/atoms/Button/Button';
import MultiEntryField from 'components/molecules/inputs/MultiEntryField/MultiEntryField';
import TextInputField from 'components/molecules/inputs/TextInputField/TextInputField';
import React, { useMemo, useState } from 'react';

type OnboardingQuestionType = Models.Community.OnboardingOptionsQuestion;

type Props = {
  questions: OnboardingQuestionType[];
  setQuestions: React.Dispatch<React.SetStateAction<OnboardingQuestionType[]>>;
  showErrors: boolean;
};

const QUESTION_LIMIT = 5;

const removeQuestion = (questions: OnboardingQuestionType[], index: number) => {
  const newQuestions = [...questions];
  newQuestions.splice(index, 1);
  return newQuestions;
}

const setQuestionField = (questions: OnboardingQuestionType[], index: number, field: (keyof OnboardingQuestionType), value: any) => {
  const newQuestions = [...questions];
  newQuestions[index] = { ...newQuestions[index], [field]: value };
  return newQuestions;
}

const OnboardingQuestions: React.FC<Props> = (props) => {
  const { questions, setQuestions, showErrors } = props;
  const [autoFocusIndex, setAutoFocusIndex] = useState<number | null>(null);

  return (<div className='flex flex-col gap-4'>
    <span className='cg-text-secondary cg-text-md-400'>{questions.length} of {QUESTION_LIMIT} questions</span>
    {questions.map((question, index) => <OnboardingQuestion
      key={index}
      title={question.question}
      setTitle={(title) => setQuestions(old => setQuestionField(old, index, 'question', title))}
      options={question.options}
      setOptions={(options) => setQuestions(old => setQuestionField(old, index, 'options', options))}
      onRemove={() => setQuestions(old => removeQuestion(old, index))}
      questionNo={index + 1}
      type={question.type}
      setType={(type) => setQuestions(old => setQuestionField(old, index, 'type', type))}
      autoFocus={index === autoFocusIndex}
      showErrors={showErrors}
    />)}
    {questions.length < QUESTION_LIMIT && <Button
      className='w-fit'
      iconLeft={<Plus className='w-4 h-4' />}
      text='Question'
      role='textual'
      onClick={() => {
        setQuestions(old => [...old, { question: '', type: 'text', options: [] }]);
        setAutoFocusIndex(questions.length);
      }}
    />}
  </div>)
};

type OnboardingQuestionProps = {
  onRemove: () => void;
  questionNo: number;
  title: string;
  setTitle: (title: string) => void;
  options?: string[];
  setOptions: (options: string[]) => void;
  type: OnboardingQuestionType['type'];
  setType: (options: OnboardingQuestionType['type']) => void;
  autoFocus: boolean;
  showErrors: boolean;
};

const OnboardingQuestion: React.FC<OnboardingQuestionProps> = (props) => {
  const toggleType = () => {
    if (props.type === 'text') props.setType('multi-choice');
    if (props.type === 'multi-choice') props.setType('multi-select');
    if (props.type === 'multi-select') props.setType('text');
  }

  const typeString = useMemo(() => {
    if (props.type === 'text') return 'Text answer';
    if (props.type === 'multi-choice') return 'Multiple Choice';
    if (props.type === 'multi-select') return 'Multiple Choice multi-select';
  }, [props.type]);

  if (props.type !== 'text') {
    if (props.options?.length === 0) {
      props.setOptions(['', '']);
    } else if (props.options?.length === 1) {
      props.setOptions([...props.options, '']);
    }
  }

  return <div className='flex flex-col gap-1'>
    <div className='flex justify-between'>
      <div className='flex gap-1'>
        <Minus weight='duotone' className='w-4 h-4 cg-text-secondary cursor-pointer' onClick={props.onRemove} />
        <span className='cg-text-md-500'>Question {props.questionNo}<span className='cg-text-secondary'>*</span></span>
      </div>

      <div className='flex gap-1 items-center cursor-pointer' onClick={toggleType}>
        <span className='cg-text-md-500'>{typeString}</span>
        <CaretCircleUpDown weight='duotone' className='w-4 h-4 cg-text-secondary' />
      </div>
    </div>
    <div className='flex flex-col gap-1'>
      <div className='onboarding-input-container'>
        <TextInputField
          placeholder='New question'
          value={props.title}
          onChange={props.setTitle}
          inputClassName='onboarding-input'
          maxLetters={180}
          autoFocus={props.autoFocus}
        />
      </div>
      {props.showErrors && props.title.length === 0 && <span className='cg-text-warning'>Question must not be empty</span>}
      {props.type !== 'text' && <div className='pl-4'>
        <MultiEntryField
          entries={props.options || []}
          limit={5}
          newEntryBtnText='Option'
          setEntries={props.setOptions}
          disallowEmpty={props.showErrors}
        />
      </div>}
    </div>
  </div>
};

export default React.memo(OnboardingQuestions);