// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useNavigate } from "react-router-dom";
import { getUrl } from "common/util";
import { useEffect } from "react";

const TokenSaleRedirect = () => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(getUrl({ type: 'token' }));
    }, []);
    return null;
}

export default TokenSaleRedirect;
