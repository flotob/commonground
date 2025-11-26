// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from "react";
import userApi from "data/api/user";
import Button from "components/atoms/Button/Button";

export default function VerifyEmailView() {
  const [isVerified, setIsVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isTokenExpired, setIsTokenExpired] = React.useState(false);
  const email = decodeURIComponent(
    window.location.search.split("email=")[1]?.split("&")[0] || ''
  );
  const token = decodeURIComponent(
    window.location.search.split("token=")[1]?.split("&")[0] || ''
  );

  React.useEffect(() => {
    if (token && email) {
      userApi
        .verifyEmail({ email, token })
        .then((result ) => {
          console.log('result: ', result)
          setIsVerified(true);
        })
        .catch((error) => {
          console.log('error: ', error);
          switch (error.message) {
            case 'VERIFY_EMAIL_INVALID_TOKEN':
              setErrorMessage('Invalid token');
              break;
            case 'VERIFY_EMAIL_EXPIRED_TOKEN':
              setErrorMessage('Token expired');
              setIsTokenExpired(true);
              break;
            default:
              setErrorMessage('Unknown error');
              break;
          }
          setIsVerified(false);
        })
        .finally(() => {
          console.log('stop loading')
          setLoading(false);
        });
    }
  }, [email, token]);

  if (!token) {
    return (
      <div className="flex items-center justify-center w-screen h-screen cg-text-main cg-heading-2">
        <span>Validation token invalid</span>
      </div>
    );
  }
  if (isTokenExpired) {
    // offer to resend email
    return (
      <div className="flex items-center justify-center w-screen h-screen cg-text-main cg-heading-2">
        <span>Email verification token expired. </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center w-screen h-screen cg-text-main cg-heading-2">
      <span className="mb-4 text-center">
        {loading
          ? "Verifying email..."
          : isVerified
          ? "your email was confirmed, you can close this window"
          : `Email verification failed: ${errorMessage}`}
      </span>
      <Button role={"primary"} text={"Close tab"} onClick={() => window.close()}/>
    </div>
  );
}
