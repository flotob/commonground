// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import ReactDOM from "react-dom";
import {
  useFloating,
  useInteractions,
  useHover,
  useClick,
  shift,
  flip,
  arrow,
  offset,
  Placement,
  useFloatingParentNodeId,
  FloatingTree,
  autoUpdate,
  useDismiss,
  FloatingContext,
} from "@floating-ui/react-dom-interactions";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import './Tooltip.css';
import { useGlobalDictionaryContext } from "../../../context/GlobalDictionaryProvider";
import { randomString } from "../../../util";
import { AnimatePresence, motion } from "framer-motion";

export type PopoverProps = {
  placement: Placement;
  padding?: number;
  offset?: number;
  triggerContent: string | JSX.Element;
  tooltipContent: string | JSX.Element;
  triggerClassName?: string;
  tooltipClassName?: string;
  openDelay?: number;
  closeDelay?: number;
  showArrow?: boolean;
  domChildOfTrigger?: boolean;
  singletonGroupIdentifier?: string;
  dismissOnScroll?: boolean;
  disableFlip?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  closeBtnRef?: React.RefObject<HTMLButtonElement>;
  disableDismiss?: boolean;
  allowPropagation?: boolean;
} & PopoverTrigger;

export type PopoverTrigger = ({
  triggerType: "click";
  closeOn: "toggle" | "toggleOrClick" | "toggleOrLeavePopover" | "mouseleavePopover" | "clickPopover" | "mouseleaveOrClickPopover";
} | {
  triggerType: "hover";
  closeOn: "mouseleaveTrigger" | "mouseleaveTriggerAndPopover" | "mouseleaveAllTooltips";
});

type TooltipProps = Pick<PopoverProps, 'placement' | 'offset' | 'triggerContent' | 'triggerClassName' | 'tooltipContent' | 'dismissOnScroll' | 'openDelay' | 'closeDelay' | 'allowPropagation'>;

export type PopoverHandle = {
  open: () => void;
  close: () => void;
}

export const Popover = forwardRef<PopoverHandle, PopoverProps>((props, ref) => {
  const {
    placement,
    padding,
    triggerContent,
    tooltipContent,
    triggerClassName,
    tooltipClassName,
    triggerType,
    openDelay,
    closeDelay,
    showArrow,
    offset: _offset,
    closeOn,
    domChildOfTrigger,
    singletonGroupIdentifier,
    dismissOnScroll,
    disableFlip,
    onOpen,
    onClose,
    closeBtnRef,
    disableDismiss,
    allowPropagation
  } = props;

  const thisId = useMemo(() => randomString(), []);
  const { dict, setEntry } = useGlobalDictionaryContext();
  const [open, setOpen] = useState<boolean>(false);
  const parentId = useFloatingParentNodeId();
  const tooltipRoot = useMemo(() => document.getElementById("tooltip-root") as HTMLElement, []);
  const arrowRef = useRef<HTMLDivElement>(null);

  const onOpenChange = useCallback((open: boolean) => {
    if (open === true && singletonGroupIdentifier !== undefined) {
      setEntry(`tooltip-${singletonGroupIdentifier}`, thisId);
    }
    if (open === true && !!onOpen) {
      onOpen();
    } else if (!!onClose) {
      onClose();
    }
    setOpen(open);
  }, [setEntry, singletonGroupIdentifier, onOpen, onClose]);

  useImperativeHandle(ref, () => ({
    open() {
      onOpenChange(true);
    },
    close() {
      onOpenChange(false);
    },
  }), [onOpenChange]);

  useEffect(() => {
    if (singletonGroupIdentifier !== undefined && dict[`tooltip-${singletonGroupIdentifier}`] !== thisId) {
      setOpen(false);
    }
  }, [dict, singletonGroupIdentifier, thisId]);

  const middlewareOptions = useMemo(() => {
    const options = [
      shift({ padding }),
      offset(_offset ?? 0),
      arrow({
        element: arrowRef
      })
    ];
    if (!disableFlip) {
      options.push(flip());
    }
    return options;
  }, [padding, _offset, disableFlip]);

  const { x, y, reference, floating, strategy, context, middlewareData } = useFloating({
    placement,
    open,
    onOpenChange,
    middleware: middlewareOptions,
    whileElementsMounted: (reference, floating, update) => {
      autoUpdate(reference, floating, update, {
        ancestorScroll: true,
        ancestorResize: true,
        elementResize: true,
        animationFrame: true,
      });
    },
  });

  const handleClose = useMemo(() => {
    const fn = ({ onClose, refs }: FloatingContext & { onClose: () => void }) => (event: PointerEvent) => {
      const path = event.composedPath();
      const triggerEl = refs.reference.current;
      const floatEl = refs.floating.current;
      if (triggerType === "hover") {
        switch (closeOn) {
          case "mouseleaveTrigger": {
            if (!(path.includes(triggerEl as any))) {
              onClose();
            }
            break;
          }
          case "mouseleaveTriggerAndPopover": {
            if (!(path.includes(triggerEl as any)) && !(path.includes(floatEl as any))) {
              onClose();
            }
            break;
          }
          case "mouseleaveAllTooltips": {
            if (!(path.includes(triggerEl as any)) && !(path.includes(floatEl as any)) && !(path.includes(tooltipRoot))) {
              onClose();
            }
            break;
          }
        }
      }
    };
    fn.__options = {
      blockPointerEvents: false
    }
    return fn;
  }, [triggerType, closeOn]);

  const { getReferenceProps } = useInteractions([
    useHover(context, {
      enabled: triggerType === "hover",
      delay: {
        open: openDelay ?? 0,
        close: closeDelay ?? 0
      },
      handleClose,
    }),
    useClick(context, {
      enabled: triggerType === "click",
      toggle: closeOn === 'toggle' || closeOn === 'toggleOrClick' || closeOn === 'toggleOrLeavePopover'
    }),
    useDismiss(context, {
      enabled: !disableDismiss,
      ancestorScroll: dismissOnScroll ?? false,
    }),
  ]);

  const floatingStyle: React.CSSProperties = useMemo(() => ({
    position: strategy,
    top: `${Math.round(y ?? 0)}px`,
    left: `${Math.round(x ?? 0)}px`,
    visibility: x === null || y === null ? "hidden" : "visible",
    zIndex: 10100,
    boxSizing: "border-box",
    maxHeight: `calc(var(--visualHeight) - ${2 * (padding ?? 0)}px)`
  }), [strategy, x, y, padding]);

  const staticSide = useMemo(() => ({
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[placement.split('-')[0]]), [placement]);

  useEffect(() => {
    const arrow = arrowRef.current;
    const data = middlewareData.arrow;
    if (arrow && data) {
      Object.assign(arrow.style, {
        left: data.x !== null ? `${data.x}px` : "",
        top: data.y !== null ? `${data.y}px` : "",
        right: "",
        bottom: "",
        [staticSide as any]: "-4px"
      });
    }
  }, [staticSide, middlewareData.arrow]);

  useEffect(() => {
    const flt = context.refs.floating.current as HTMLDivElement;
    if (triggerType === "click" && flt) {
      const closeHandler = () => {
        setTimeout(() => onOpenChange(false), 0);
      }
      if (closeOn === "mouseleavePopover" || closeOn === "mouseleaveOrClickPopover" || closeOn === 'toggleOrLeavePopover') {
        flt.addEventListener("mouseleave", closeHandler);
      }
      if (closeOn === "clickPopover" || closeOn === "mouseleaveOrClickPopover" || closeOn === 'toggleOrClick') {
        flt.addEventListener("click", closeHandler);
      }
      return () => {
        flt.removeEventListener("mouseleave", closeHandler);
        flt.removeEventListener("click", closeHandler);
      }
    }
  }, [closeOn, context, onOpenChange, triggerType]);

  useEffect(() => {
    if (closeBtnRef && closeBtnRef.current) {
      const closeHandler = () => {
        setTimeout(() => onOpenChange(false), 0);
      }
      const closeButton = closeBtnRef.current;
      closeButton.addEventListener("click", closeHandler);
      return () => { closeButton.removeEventListener("click", closeHandler); }
    }
  }, [closeBtnRef, onOpenChange]);

  const animatePresence = useMemo(() => {
    if (open) {
      if (domChildOfTrigger) {
        return <AnimatePresence>
          <motion.div
            key="tooltip"
            className={`tooltip ${tooltipClassName ?? ''}`}
            ref={floating}
            style={floatingStyle}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {tooltipContent instanceof Object ? tooltipContent : <div className="tooltip-content">{tooltipContent}</div>}
            {showArrow && <div className={`floating-arrow floating-arrow-${staticSide}`} ref={arrowRef} />}
          </motion.div>
        </AnimatePresence>;
      }
      else {
        return ReactDOM.createPortal((
          <AnimatePresence>
            <motion.div
              key="tooltip"
              className={`tooltip ${tooltipClassName ?? ''}`}
              ref={floating}
              style={floatingStyle}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              {tooltipContent instanceof Object ? tooltipContent : <div className="tooltip-content">{tooltipContent}</div>}
              {showArrow && <div className={`floating-arrow floating-arrow-${staticSide}`} ref={arrowRef} />}
            </motion.div>
          </AnimatePresence>
        ), tooltipRoot);
      }
    }
    return null;
  }, [open, domChildOfTrigger, tooltipClassName, floating, floatingStyle, tooltipContent, showArrow, staticSide]);

  const content = (
    <>
      <div {...getReferenceProps({
        className: triggerClassName,
        ref: reference,
        onClick: (event) => {
          if (!allowPropagation) event.stopPropagation();
        },
      })}>
        {triggerContent}
      </div>
      {animatePresence}
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

export function Tooltip(props: TooltipProps) {
  const { offset, placement, tooltipContent, triggerContent, dismissOnScroll, triggerClassName, openDelay, closeDelay, allowPropagation } = props;

  return <Popover
    placement={placement}
    offset={offset}
    triggerContent={triggerContent}
    tooltipContent={tooltipContent}
    triggerClassName={triggerClassName}
    tooltipClassName="tooltip-simple"
    triggerType="hover"
    closeOn="mouseleaveTrigger"
    dismissOnScroll={dismissOnScroll}
    openDelay={openDelay ?? 500}
    closeDelay={closeDelay ?? 100}
    allowPropagation={allowPropagation}
  />;
}