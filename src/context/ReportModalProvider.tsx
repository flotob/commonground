// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from "react";
import { useWindowSizeContext } from "./WindowSizeProvider";
import ScreenAwareModal from "components/atoms/ScreenAwareModal/ScreenAwareModal";
import { ReportType } from "common/enums";
import Button from "components/atoms/Button/Button";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import TextAreaField from "components/molecules/inputs/TextAreaField/TextAreaField";
import Dropdown from "components/molecules/Dropdown/Dropdown";
import ListItem from "components/atoms/ListItem/ListItem";
import reportApi from "data/api/report";
import { useSnackbarContext } from "./SnackbarContext";

type ReportModalContentProps = {
  type: ReportType;
  targetId: string;
};

type ReportModalContextState = {
  showReportModal: (data: ReportModalContentProps) => void;
  closeReportModal: () => void;
};

export const ReportModalContext = React.createContext<ReportModalContextState>({
  showReportModal: () => { },
  closeReportModal: () => { },
});

function typeToText(type: ReportType): string {
  switch (type) {
    case ReportType.PLUGIN:
      return "plugin";
    case ReportType.USER:
      return "user";
    case ReportType.COMMUNITY:
      return "community";
    case ReportType.ARTICLE:
      return "article";
    case ReportType.MESSAGE:
      return "message";
  }
}

const reportOptions: { value: string, label: string }[] = [
  { value: "does-not-load", label: "Content does not load" },
  { value: "spam", label: "Spam" },
  { value: "abusive-content", label: "Abusive Content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

export function reasonCodeToText(value: string): string {
  const option = reportOptions.find(option => option.value === value);
  return option ? option.label : "Unknown";
}

export function ReportModalProvider(props: React.PropsWithChildren<{}>) {
  const { showSnackbar } = useSnackbarContext();
  const { isMobile } = useWindowSizeContext();
  const [currentData, setCurrentData] = React.useState<ReportModalContentProps | undefined>(undefined);
  const [currentOption, setCurrentOption] = useState<string>("");
  const [reportMessage, setReportMessage] = useState<string>("");

  const showReportModal = React.useCallback((data: ReportModalContentProps) => {
    setCurrentData(data);
  }, []);

  const closeReportModal = React.useCallback(() => {
    setCurrentOption("");
    setReportMessage("");
    setCurrentData(undefined);
  }, []);

  return (
    <ReportModalContext.Provider value={{ showReportModal, closeReportModal }}>
      {props.children}
      <ScreenAwareModal
        hideHeader
        isOpen={!!currentData}
        onClose={closeReportModal}
      >
        <div className={`flex flex-col gap-4${isMobile ? " p-4 pb-16" : ''}`}>
          <h3>Report this {currentData && typeToText(currentData.type)}?</h3>
          <p className="text-sm text-gray-500">
            Are you sure you want to report this {currentData && typeToText(currentData.type)}?
            Your report will be reviewed by the CG Team and will be used to take down any content that violates our guidelines.
          </p>

          <div
            className="flex flex-col gap-2"
          >
            <span className="cg-text-lg-500">Reason:</span>
            <Dropdown
              placement="bottom-start"
              items={reportOptions.map(option => <ListItem
                key={option.value}
                onClick={() => setCurrentOption(option.value)}
                title={option.label}
                selected={currentOption === option.value}
              />)}
              triggerContent={<Button
                text={currentOption ? reportOptions.find(option => option.value === currentOption)?.label : "Select reason"}
                iconRight={<ChevronDownIcon className="w-5 h-5" />}
                className="w-full"
                role="secondary"
              />}
            />
          </div>

          <TextAreaField
            label="Additional details (optional)"
            placeholder="Add more details about the issue..."
            value={reportMessage}
            onChange={(value) => setReportMessage(value)}
          />

          <div className="flex justify-end gap-4">
            <Button
              role="secondary"
              onClick={closeReportModal}
              className="mr-2"
              text="Cancel"
            />
            <Button
              role="primary"
              disabled={!currentOption}
              text="Send Report"
              onClick={async () => {
                if (!currentData?.type || !currentData.targetId) return;

                try {
                  // Handle sending the report here
                  await reportApi.createReport({
                    type: currentData?.type,
                    targetId: currentData?.targetId,
                    reason: currentOption,
                    message: reportMessage,
                  });

                  showSnackbar({
                    type: "success",
                    text: `Thanks for your report! Our team will review it shortly.`,
                  });

                  closeReportModal();
                } catch (error) {
                  showSnackbar({
                    type: "warning",
                    text: `Failed to send report: ${(error as any).message}`,
                  });
                }
              }}
            />
          </div>


        </div>



      </ScreenAwareModal>
    </ReportModalContext.Provider>
  );
}

export function useReportModalContext() {
  return React.useContext(ReportModalContext);
}