// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo } from "react";
import SumsubKyc from "../../components/molecules/SumsubKyc/SumsubKyc";
import SelectInput from "components/molecules/inputs/SelectInput/SelectInput";
import config from "common/config";

const IdVerificationView: React.FC = () => {
  const [kycType, setKycType] = React.useState<API.Sumsub.KycType | undefined>(
    undefined
  );

  const kycComponent = useMemo(() => {
    if (!kycType) {
      return null;
    }
    const wizardAction: Models.Wizard.WizardAction = {
      text: "Continue",
      action: {
        type: "goto",
        navigate: {
          type: "close",
        },
      },
      role: "primary",
    }
    return <SumsubKyc kycType={kycType}
    actions={[wizardAction]}
    handleWizardAction={() => {}}/>;
  }, [kycType]);
  
  const options: {value: API.Sumsub.KycType, label: string}[] = useMemo(() => [
    { value: "liveness-only", label: "Liveness" },
    { value: "full-kyc-level", label: "Full" },
    { value: "cg-tokensale", label: "CG Tokensale" },
  ], []);

  if (config.DEPLOYMENT === 'prod') {
    return (<div>Unavailable</div>);
  }
  
  return (
    <div>
      <SelectInput
        onChange={(value: {label: string, value: API.Sumsub.KycType}) => setKycType(value.value)}
        options={options}
        selectedValue={undefined}
      />
      {kycComponent}
    </div>
  );
};

export default IdVerificationView;
