// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useCallback, useLayoutEffect, useRef } from "react";
import { useOwnUser } from "context/OwnDataProvider";
import { Tooltip } from "../../../components/atoms/Tooltip/Tooltip";

import "./ReactionEmojiItem.css";

type Props = {
    reaction: string;
    count: number;
    hasReacted: boolean;
    transitionDuration: number;
    setReaction: (reaction: string) => void;
    unsetReaction: () => void;
    initiallyVisible: boolean;
}

export default function ReactionEmojiItem(props: Props) {
    const { reaction, count, hasReacted, transitionDuration, setReaction, unsetReaction, initiallyVisible } = props;
    // const [ loadedReactorData, setLoadedReactorData ] = useState< Models.User.Data | undefined>();
    const ref = useRef<HTMLButtonElement>(null);
    // const loadingUserData = useRef<boolean>(false);
    const ownData = useOwnUser();

    const onClick = useCallback((ev: React.MouseEvent) => {
      ev.stopPropagation();
      if (!!ownData) {
        if (hasReacted) {
          unsetReaction();
        }
        else {
          setReaction(reaction);
        }
      }
    }, [ownData, hasReacted, unsetReaction, setReaction, reaction])
  
    useLayoutEffect(() => {
      if (props.initiallyVisible) {
        if (ref.current) {
          ref.current.style.opacity = "1.0";
        }
      }
      else {
        setTimeout(() => {
          if (ref.current) {
            ref.current.style.opacity = "1.0";
          }
        }, transitionDuration);
      }
    }, [transitionDuration]);

    // const TooltipContent = () => {
    //   const firstReactorId = userIds[0];
    //   let reactorData:  Models.User.Data | null;

    const TooltipContent = () => {
      // FIXME: Redo this
      return <>{`${count} reacted`}</>;
      /*
      const firstReactorId = userIds[0];
      let reactorData:  Models.User.Data | null;

    //   if (!reactorData) {
    //     if (loadedReactorData) {
    //       reactorData = loadedReactorData;
    //     } else {
    //       (async () => {
    //         if (loadingUserData.current === false) {
    //           loadingUserData.current = true;
    //           const response = await data.user.getUsers([firstReactorId]);
    //           if (!!response && response.length === 1) {
    //             setLoadedReactorData(response[0]);
    //             loadingUserData.current = false;
    //           }
    //         }
    //       })();
    //     }
    //   }

      if (!reactorData) {
        if (loadedReactorData) {
          reactorData = loadedReactorData;
        } else {
          (async () => {
            if (loadingUserData.current === false) {
              loadingUserData.current = true;
              const response = await data.user.getUsers([firstReactorId]);
              if (!!response && response.length === 1) {
                setLoadedReactorData(response[0]);
                loadingUserData.current = false;
              }
            }
          })();
        }
      }

      // ToDo: I guess the coode should be refactored on observe loadedReactionData
      let reactorString: string = '';
      if (!!reactorData) {
        reactorString = getDisplayName(reactorData.id, reactorData);
      }
      if (userIds.length > 1) {
        return <>{`${reactorString} and ${userIds.length - 1} others reacted`}</>;
      } else {
        return <>{`${reactorString} reacted`}</>;
      }
      */
    }

    let buttonClassName = "emoji-reaction-item";
    if (hasReacted) {
      buttonClassName += " active-emoji-reaction-item";
    }
  
    return (
      <Tooltip
        placement="top"
        offset={6}
        triggerContent={
          <button className={buttonClassName} ref={ref} onClick={onClick}>
            <span className="emoji">{reaction}</span>
            <span className="reaction-count">{count}</span>
          </button>
        }
        tooltipContent={<TooltipContent />}
      />
    )
}