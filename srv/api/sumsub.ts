// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import express, { Request } from "express";
import { createHmac } from "crypto";
import { registerPostRoute } from "./util";
import { getSumsubAccessToken, handleSumsubWebhook, } from "./util";
import validators from "../validators";
import errors from "../common/errors";
import { dockerSecret } from "../util";

const sumsubPrivateKey = dockerSecret('sumsub_webhook_private_key') || process.env.SUMSUB_PRIVATE_KEY;

const sumsubRouter = express.Router();

export function checkDigest(req: Request, rawBody: string): boolean {
  if (!sumsubPrivateKey) {
    throw new Error('Missing sumsub private key');
  }

  const signatureAlgorithm = req.headers['x-payload-digest-alg'];

  if (!signatureAlgorithm) {
    throw new Error('Missing digest algorithm')
  }

  const calculatedDigest = createHmac('sha256', sumsubPrivateKey)
    .update(rawBody)
    .digest('hex');

  return calculatedDigest === req.headers['x-payload-digest'];
}

registerPostRoute<
  API.Sumsub.getAccessToken.Request,
  API.Sumsub.getAccessToken.Response
>(
  sumsubRouter,
  '/getAccessToken',
  validators.API.Sumsub.getAccesToken,
  async (request, response, data) => {
    const { user } = request.session;
    if (!user) {
      throw new Error(errors.server.LOGIN_REQUIRED);
    }
    try {
      const response = await getSumsubAccessToken(
        "/resources/accessTokens",
        "POST",
        {
          ttlInSecs: 600,
          userId: user.id,
          levelName: data.type,
        }
      );
      return { accessToken: response.accessToken };
    } catch (error) {
      throw new Error(errors.server.FAILED_TO_FETCH_ACCESS_TOKEN);
    }
  }
);

sumsubRouter.post('/webhook', express.raw({type: "*/*", limit: '10mb' }), async (req, res) => {
  try {
    const rawBody = req.body.toString('utf-8');
    const checkDigestResult = checkDigest(req, rawBody);

    if (!checkDigestResult) {
      throw new Error('Invalid payload digest');
    }
    await handleSumsubWebhook(JSON.parse(rawBody));
    res.sendStatus(200);

  } catch (e) {
    console.error('Error handling sumsub webhook', e);
    res.sendStatus(500);
  }
});

export default sumsubRouter;