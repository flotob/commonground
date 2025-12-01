// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { dockerSecret } from "./util";
import mailchimpClient from '@mailchimp/mailchimp_marketing';
import sgMail from '@sendgrid/mail';
import config from './common/config';
import { BotChannelPermission } from './common/enums';

// Validate bot default permission from env
const botDefaultPermEnv = process.env.BOT_DEFAULT_CHANNEL_PERMISSION;
const validBotPermissions: BotChannelPermission[] = [
    BotChannelPermission.NO_ACCESS,
    BotChannelPermission.MENTIONS_ONLY,
    BotChannelPermission.FULL_ACCESS,
    BotChannelPermission.MODERATOR,
];
const BOT_DEFAULT_CHANNEL_PERMISSION: BotChannelPermission = 
    botDefaultPermEnv && validBotPermissions.includes(botDefaultPermEnv as BotChannelPermission)
        ? botDefaultPermEnv as BotChannelPermission
        : BotChannelPermission.FULL_ACCESS;

const serverconfig = {
    MAILCHIMP_API_KEY: dockerSecret('mailchimp_api') || process.env.MAILCHIMP_API_KEY || 'placeholder', // test key
    MAILCHIMP_SERVER: 'us9',
    MAILCHIMP_DEFAULT_LIST_ID: dockerSecret('mailchimp_list_id') || process.env.MAILCHIMP_LIST_ID || 'placeholder', // Todo: check if this should be hidden
    SENDGRID_API_KEY: dockerSecret('sendgrid_api') || process.env.SENDGRID_API_KEY || 'placeholder',
    SESSION_COOKIE_NAME: config.DEPLOYMENT === 'prod' ? 'connect.sid' : `cg_${config.DEPLOYMENT}.sid`,
    
    // Bot settings
    // Default permission level for bots in channels where no specific permission is set
    // Valid values: 'no_access', 'mentions_only', 'full_access', 'moderator'
    BOT_DEFAULT_CHANNEL_PERMISSION,
}

mailchimpClient.setConfig({
    apiKey: serverconfig.MAILCHIMP_API_KEY,
    server: serverconfig.MAILCHIMP_SERVER
});

sgMail.setApiKey(serverconfig.SENDGRID_API_KEY);

export default Object.freeze(serverconfig);
