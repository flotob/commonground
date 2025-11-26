// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import ReactDOM from "react-dom";
import {
  useFloating,
  useInteractions,
  useHover,
  shift,
  flip,
  Placement,
  useDelayGroupContext,
  useDelayGroup,
  useFloatingParentNodeId,
  FloatingTree,
  useClick,
  useDismiss,
  autoUpdate,
  FloatingContext
} from "@floating-ui/react-dom-interactions";
import { motion, AnimatePresence } from "framer-motion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useGlobalDictionaryContext } from "../../../context/GlobalDictionaryProvider";
import { randomString } from "../../../util";

type Props = {
  placement: Placement;
  padding: number;
  triggerContent: string | JSX.Element;
  tooltipContent: string | JSX.Element;
  triggerClassName?: string;
  tooltipClassName?: string;
  openDelay?: number;
  closeDelay?: number;
  withDelayGroup?: boolean;
  delayGroupListId?: string;
  isMessageTooltip?: boolean;
  modalDescendantRef?: React.RefObject<HTMLDivElement>; // is using to prevent close popover when its modal descendant is alive
}

export type UserTooltipHandle = {
  open: () => void;
}

const UserProfilePopover = forwardRef<UserTooltipHandle, Props>((props, ref) => {
  const {
    placement,
    padding,
    triggerContent,
    tooltipContent,
    triggerClassName,
    tooltipClassName,
    openDelay,
    closeDelay,
    withDelayGroup,
    delayGroupListId,
    modalDescendantRef
  } = props;

  const [open, setOpen] = useState<boolean>(false);
  const { dict, setEntry } = useGlobalDictionaryContext();
  const { delay, setCurrentId } = useDelayGroupContext();
  const parentId = useFloatingParentNodeId();
  const tooltipRoot = useMemo(() => document.getElementById("tooltip-root") as HTMLElement, []);
  const thisId = useMemo(() => randomString(), []);

  const onOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);
      if (open && withDelayGroup) {
        setCurrentId(delayGroupListId);
      }
      if (open === true) {
        setEntry('tooltip-user-tooltip', thisId);
      }
    }
    , [withDelayGroup, delayGroupListId, setCurrentId, setEntry, thisId]);

  useEffect(() => {
    if (dict['tooltip-user-tooltip'] !== thisId) {
      setOpen(false);
    }
  }, [dict, thisId]);

  const { x, y, reference, floating, strategy, context } = useFloating({
    placement,
    open,
    onOpenChange,
    middleware: [
      flip(),
      shift({ padding })
    ],
    whileElementsMounted: (reference, floating, update) => {
      autoUpdate(reference, floating, update, {
        ancestorScroll: true,
        ancestorResize: true,
        elementResize: true,
        animationFrame: true
      })
    }
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useDelayGroup(context, { id: delayGroupListId }),
    useHover(context, {
      enabled: open,
      delay: openDelay !== undefined && closeDelay !== undefined ? {
        open: openDelay,
        close: closeDelay
      } : delay,
      handleClose: (() => {
        const fn = ({ onClose, refs }: FloatingContext & { onClose: () => void }) => (event: PointerEvent) => {
          const path = event.composedPath();
          const triggerEl = refs.reference.current;
          const floatEl = refs.floating.current;
          if (!(path.includes(triggerEl as any)) && !(path.includes(floatEl as any)) && !(path.includes(tooltipRoot)) && !modalDescendantRef?.current) {
            onClose();
          }
        };
        fn.__options = {
          blockPointerEvents: false
        }
        return fn;
      })()
    }),
    useClick(context, {
      enabled: true
    }),
    useDismiss(context, {
      enabled: true,
      outsidePressEvent: 'pointerdown'
    })
  ]);

  useImperativeHandle(ref, () => ({
    open: () => {
      onOpenChange(true);
    }
  }), [onOpenChange]);

  const floatingStyle: React.CSSProperties = useMemo(() => ({
    position: strategy,
    top: y ?? 0,
    left: x ?? 0,
    visibility: x === null || y === null ? "hidden" : "visible",
    zIndex: 600,
    boxSizing: "border-box",
    maxHeight: `calc(100vh - ${2 * padding}px)`,
    paddingLeft: `${padding}px`,
    paddingRight: `${padding}px`,
  }), [strategy, x, y, padding]);

  const content = (
    <>
      <div {...getReferenceProps({ className: triggerClassName, ref: reference })}>
        {triggerContent}
      </div>
      {ReactDOM.createPortal((
        <AnimatePresence>
          {open &&
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              ref={floating}
              className={tooltipClassName}
              style={floatingStyle}
              {...getFloatingProps()}
            >
              {tooltipContent}
            </motion.div>
          }
        </AnimatePresence>
      ), tooltipRoot)}
    </>
  );

  if (parentId === null) {
    return (
      <FloatingTree>
        {content}
      </FloatingTree>
    )
  } else {
    return content;
  }
});

export default UserProfilePopover;