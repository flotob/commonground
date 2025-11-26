// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import FullscreenWizard from "components/organisms/FullscreenWizard/FullscreenWizard";
import communityApi from "data/api/community";
import { useOwnUser } from "./OwnDataProvider";
import errors from "common/errors";
import shortUUID from "short-uuid";

const t = shortUUID();

export const CommunityWizardContext = React.createContext<{
  isLoading: boolean | null;
  wizardId?: string;
  wizard?: Models.Wizard.Wizard | undefined;
  wizardUserData?: Models.Wizard.WizardUserData | undefined;
  setWizardStepData: (stepId: number, value: Models.Wizard.WizardStepData & { serverTimestamp?: never }) => Promise<void>;
}>({
  isLoading: true,
  setWizardStepData: () => Promise.resolve(),
});

export function CommunityWizardProvider(props: React.PropsWithChildren<{ pageTitle?: string }>) {
  const [isOpen, setOpen] = useState(true);
  const { wizardId: wizardIdParam } = useParams<'wizardId'>();
  const [wizardResponse, setWizardResponse] = useState<(API.Community.Wizard.getWizardData.Response & { wizardId: string, userId?: string }) | null>(null);
  const ownUser = useOwnUser();
  const [isLoading, setIsLoading] = useState<boolean | null>(null);
  const lastWizardId = useRef<string | undefined>(undefined);
  const lastUserId = useRef<string | undefined>(ownUser?.id);
  const pageTitleBackup = useRef<string>(document.title);

  useEffect(() => {
    if (!!props.pageTitle) {
      document.title = props.pageTitle;
      return () => {
        document.title = pageTitleBackup.current;
      };
    }
  }, [props.pageTitle]);

  const wizardId = useMemo(() => {
    if (wizardIdParam) {
      if (wizardIdParam.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
        return wizardIdParam;
      }
      else if (wizardIdParam.match(/^[0-9a-z]{22}$/i)) {
        return t.toUUID(wizardIdParam);
      }
    }
    return undefined;
  }, [wizardIdParam]);

  useEffect(() => {
    if (wizardId && !isLoading && (lastWizardId.current !== wizardId || lastUserId.current !== ownUser?.id)) {
      setIsLoading(true);
      lastUserId.current = ownUser?.id;
      lastWizardId.current = wizardId;
      communityApi.getWizardData({ wizardId }).then((response) => {
        setWizardResponse({ ...response, wizardId, userId: ownUser?.id });
      }).catch((error) => {
        setWizardResponse(null);
        if (error instanceof Error) {
          if (error.message === errors.server.NOT_ALLOWED && !ownUser?.id) {
            // User is not logged in
            // Either wait until ownUser.id is set, or redirect to login
          }
          else {
            console.error("Error fetching wizard data", error.message);
          }
        }
      }).finally(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      });
    }
  }, [wizardId, isLoading, ownUser?.id]);

  const setWizardStepData = useCallback(async (stepId: number, value: Models.Wizard.WizardStepData & { serverTimestamp?: never }) => {
    if (!!wizardId) {
      await communityApi.wizardSetWizardStepData({ wizardId, stepId, value }).then(userData => {
        setWizardResponse(prev => {
          if (!prev) {
            return null;
          }
          return {
            ...prev,
            userData,
          };
        });
      });
    }
  }, [wizardId]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <CommunityWizardContext.Provider value={{
      isLoading,
      wizardId,
      wizard: wizardResponse?.wizardData,
      wizardUserData: wizardResponse?.userData,
      setWizardStepData,
    }}>
      {!isOpen && props.children}
      <FullscreenWizard
        isOpen={isOpen}
        onClose={onClose}
      />
    </CommunityWizardContext.Provider>
  );
}

export function useCommunityWizardContext() {
  const context = React.useContext(CommunityWizardContext);
  return context;
}