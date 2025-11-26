// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { dockerSecret } from "./util";
import mailchimpClient from '@mailchimp/mailchimp_marketing';
import sgMail from '@sendgrid/mail';
import config from './common/config';

const serverconfig = {
    MAILCHIMP_API_KEY: dockerSecret('mailchimp_api') || process.env.MAILCHIMP_API_KEY || 'placeholder', // test key
    MAILCHIMP_SERVER: 'us9',
    MAILCHIMP_DEFAULT_LIST_ID: dockerSecret('mailchimp_list_id') || process.env.MAILCHIMP_LIST_ID || 'placeholder', // Todo: check if this should be hidden
    SENDGRID_API_KEY: dockerSecret('sendgrid_api') || process.env.SENDGRID_API_KEY || 'placeholder',
    SESSION_COOKIE_NAME: config.DEPLOYMENT === 'prod' ? 'connect.sid' : `cg_${config.DEPLOYMENT}.sid`,
}

mailchimpClient.setConfig({
    apiKey: serverconfig.MAILCHIMP_API_KEY,
    server: serverconfig.MAILCHIMP_SERVER
});

sgMail.setApiKey(serverconfig.SENDGRID_API_KEY);

export default Object.freeze(serverconfig);
