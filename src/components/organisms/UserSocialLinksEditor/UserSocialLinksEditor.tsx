// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useEffect, useState } from "react";
import Button from "../../../components/atoms/Button/Button";
import SocialLink from "../../../components/molecules/SocialLink/SocialLink";
import { InlineToastType } from "../../atoms/InlineToast/InlineToast";
import data from "data";
import { Tooltip } from "../../../components/atoms/Tooltip/Tooltip";
import Scrollable from "../../molecules/Scrollable/Scrollable";

import { LinkIcon, GlobeAltIcon } from '@heroicons/react/24/solid';

import "./UserSocialLinksEditor.css";
import { useOwnUser } from "context/OwnDataProvider";
import userApi from "data/api/user";

const MAX_LINKS_ERROR = "You can only add up to 5 links!";

export default function UserSocialLinksEditor() {
  const ownUser = useOwnUser();
  const cgProfile = ownUser?.accounts?.find(a => a.type === 'cg');
  const extraData = cgProfile?.extraData;
  const homepage = extraData?.type === 'cg' ? extraData.homepage : undefined;
  const links = extraData?.type === 'cg' ? extraData.links : undefined;

  const [homepageLoading, setHomepageLoading] = useState<InlineToastType>();
  const [linksLoading, setLinksLoading] = useState<InlineToastType>();

  const [homepageError, setHomepageError] = useState<string>();
  const [linksError, setLinksError] = useState<string>();
  const [error, setError] = useState<string>();

  const [_homepage, _setHomepage] = useState<string>(homepage || "");
  const [_links, _setLinks] = useState<Common.Link[]>(links || []);

  useEffect(() => {
    _setHomepage(homepage || "");
  }, [homepage]);

  useEffect(() => {
    _setLinks(links || []);
  }, [links]);

  const saveSocialContacts = useCallback(async (userInfo: API.User.updateUserAccount.Request): Promise<void> => {
    if (!!userInfo) {
      return userApi.updateUserAccount(userInfo);
    }
  }, []);

  const setHomePage = useCallback(async (homepage: string) => {
    setHomepageLoading('loading');
    _setHomepage(homepage);

    const userInfo: API.User.updateUserAccount.Request = {
      type: 'cg',
      homepage,
      links: _links
    };
    saveSocialContacts(userInfo).then(value => {
      setHomepageError(undefined);
    }).catch(err => {
      setHomepageError("Could not save homepage link");
    }).finally(() => {
      setHomepageLoading('done');
    });
  }, [ _links, setHomepageLoading, _setHomepage, saveSocialContacts]);

  const setLinks = useCallback((links: Common.Link[]) => {
    setLinksLoading('loading');
    _setLinks(links);

    const userInfo: API.User.updateUserAccount.Request = {
      type: 'cg',
      homepage: _homepage,
      links
    };
    saveSocialContacts(userInfo).then(value => {
      setLinksError(undefined);
    }).catch(err => {
      setLinksError("Could not save link");
    }).finally(() => {
      setLinksLoading('done');
    });
  }, [_homepage, setLinksLoading, _setLinks, saveSocialContacts]);

  const setLink = useCallback((changedLink: string, index: number) => {
    const links = [..._links];
    links[index] = {
      url: changedLink,
      text: changedLink
    };
    setLinks(links);
  }, [_links, setLinks]);

  const addNewLink = useCallback(() => {
    if (_links.length === 5) {
      setError(MAX_LINKS_ERROR);
      setTimeout(() => {
        setError(undefined);
      }, 3000);
    } else {
      const emptyLink: Common.Link = {
        url: '',
        text: ''
      };
      const links = [..._links, emptyLink];
      _setLinks(links);
      setError(undefined);
    }
  }, [_links]);

  const removeLink = useCallback((index: number) => {
    _links.splice(index, 1);
    setLinks([..._links]);
  }, [_links, setLinks]);

  return (
    <div className="user-socials-link-editor">
      <Scrollable>
        <div className="user-socials-link-editor-links-container">
        <SocialLink
          index={0}
          key="social-link-homepage"
          icon={
            <Tooltip
              triggerContent={<GlobeAltIcon className="w-6 h-6 social-link-icon" />}
              tooltipContent={_homepage}
              placement="top" />
          }
          placeholder='Link to Homepage'
          value={_homepage}
          setValue={setHomePage}
          loading={homepageLoading}
          error={homepageError}
        />
        {!!_links && _links.map((link: Common.Link, index: number) => {
          return <SocialLink
            index={index}
            key={`social-link-${index}`}
            icon={
              <Tooltip
                triggerContent={<LinkIcon className="w-6 h-6 social-link-icon" />}
                tooltipContent={link.text}
                placement="top"
              />
            }
            placeholder='Your link'
            value={link.url}
            setValue={(changedLink: string) => setLink(changedLink, index)}
            removeLink={removeLink}
            loading={linksLoading}
            error={linksError}
          />
        })}
        </div>
      </Scrollable>
      <Button role="secondary" text="Add link" onClick={() => addNewLink()} />
      {error && <div className='text-red-400'>{error}</div>}
    </div>
  );
}