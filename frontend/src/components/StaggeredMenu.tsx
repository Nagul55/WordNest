"use client";

import React, { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface MenuItem {
  id: string;
  label: string;
  ariaLabel?: string;
  link?: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: MenuItem[];
  displayItemNumbering?: boolean;
  className?: string;
  menuButtonColor?: string;
  menuLabel?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  activeItemId?: string;
  onSelectItem?: (id: string) => void;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  bottomContent?: React.ReactNode;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'left',
  colors = ['#A58CF4', '#736A86', '#433075'],
  items = [],
  displayItemNumbering = true,
  className,
  menuButtonColor = '#0D0D0D',
  menuLabel = 'Menu',
  openMenuButtonColor = '#433075',
  accentColor = '#433075',
  changeMenuColorOnOpen = true,
  isFixed = false,
  closeOnClickAway = true,
  activeItemId,
  onSelectItem,
  onMenuOpen,
  onMenuClose,
  bottomContent
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<Element[]>([]);
  const plusHRef = useRef<HTMLSpanElement>(null);
  const plusVRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);
  const textWrapRef = useRef<HTMLSpanElement>(null);
  const [textLines, setTextLines] = useState([menuLabel, 'Close']);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);

  const menuLabelRef = useRef(menuLabel);
  useEffect(() => {
    menuLabelRef.current = menuLabel;
    if (!openRef.current) {
      textCycleAnimRef.current?.kill();
      textCycleAnimRef.current = null;
      setTextLines([menuLabel, 'Close']);
      if (textInnerRef.current) {
        gsap.set(textInnerRef.current, { yPercent: 0 });
      }
    }
  }, [menuLabel]);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers: Element[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer'));
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
    const bottomEl = panel.querySelector('.sm-bottom-content');

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
    }
    if (bottomEl) {
      gsap.set(bottomEl, { y: 25, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.45, ease: 'power4.out' }, i * 0.06);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.06 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.6;
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 0.85,
          ease: 'power4.out',
          stagger: { each: 0.08, from: 'start' }
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.5,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.06, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    if (bottomEl) {
      const bottomStart = panelInsertTime + panelDuration * 0.35;
      tl.to(
        bottomEl,
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          onComplete: () => {
            gsap.set(bottomEl, { clearProps: 'opacity' });
          }
        },
        bottomStart
      );
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (panel) {
      gsap.set([panel, ...layers], { visibility: 'visible', pointerEvents: 'auto' });
    }
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.3,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        gsap.set(all, { visibility: 'hidden', pointerEvents: 'none' });
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        if (numberEls.length) {
          gsap.set(numberEls, { '--sm-num-opacity': 0 });
        }
        const bottomEl = panel.querySelector('.sm-bottom-content');
        if (bottomEl) gsap.set(bottomEl, { y: 25, opacity: 0 });
        busyRef.current = false;
      }
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.to(icon, { rotate: 225, duration: 0.7, ease: 'power4.out', overwrite: 'auto' });
    } else {
      spinTweenRef.current = gsap.to(icon, { rotate: 0, duration: 0.3, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }, []);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.15,
          duration: 0.25,
          ease: 'power2.out'
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  useEffect(() => {
    if (toggleBtnRef.current) {
      if (changeMenuColorOnOpen) {
        const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
        gsap.set(toggleBtnRef.current, { color: targetColor });
      } else {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? menuLabelRef.current : 'Close';
    const targetLabel = opening ? 'Close' : menuLabelRef.current;
    const cycles = 2;
    const seq = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === menuLabelRef.current ? 'Close' : menuLabelRef.current;
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);

    gsap.set(inner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.4 + lineCount * 0.06,
      ease: 'power4.out'
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [playClose, animateIcon, animateColor, animateText, onMenuClose]);

  useEffect(() => {
    const handleForceClose = () => {
      closeMenu();
    };
    window.addEventListener('wordnest-close-menu', handleForceClose);
    return () => window.removeEventListener('wordnest-close-menu', handleForceClose);
  }, [closeMenu]);

  useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  const handleItemClick = (id: string) => {
    onSelectItem?.(id);
    closeMenu();
  };

  return (
    <div
      className={(className ? className + ' ' : '') + 'staggered-menu-wrapper' + (isFixed ? ' fixed-wrapper' : '')}
      style={accentColor ? { ['--sm-accent' as any]: accentColor } : undefined}
      data-position={position}
      data-open={open || undefined}
    >
      {/* Backdrop when menu is open */}
      {open && (
        <div 
          onClick={closeMenu}
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[52] transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {(() => {
          const raw = colors && colors.length ? colors : ['#A58CF4', '#736A86', '#433075'];
          return raw.map((c, i) => <div key={i} className="sm-prelayer" style={{ background: c }} />);
        })()}
      </div>

      <div className="staggered-menu-header" aria-label="Main navigation toggle area">
        <button
          id="tour-menu-toggle-btn"
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span ref={textWrapRef} className="sm-toggle-textWrap" aria-hidden="true">
            <span ref={textInnerRef} className="sm-toggle-textInner">
              {textLines.map((l, i) => (
                <span className="sm-toggle-line" key={i}>
                  {l}
                </span>
              ))}
            </span>
          </span>
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span ref={plusHRef} className="sm-icon-line" />
            <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
          </span>
        </button>
      </div>

      {open && (
        <div 
          className="fixed inset-0 z-[58] bg-black/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
          onClick={closeMenu}
        />
      )}

      <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel righteous-regular" aria-hidden={!open}>
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list">
            {items && items.length ? (
              items.map((it, idx) => {
                const isActive = activeItemId === it.id;
                return (
                  <li className="sm-panel-itemWrap" key={it.id || idx}>
                    <button 
                      id={`tour-menu-item-${it.id}`}
                      type="button"
                      className={`sm-panel-item text-left ${isActive ? 'active-item' : ''}`}
                      onClick={() => handleItemClick(it.id)}
                      aria-label={it.ariaLabel || it.label} 
                    >
                      <span className="sm-panel-itemLabel">
                        {it.label.toUpperCase()}
                        {displayItemNumbering && (
                          <sup className="sm-panel-itemIndex">
                            {String(idx + 1).padStart(2, '0')}
                          </sup>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">No items</span>
                </span>
              </li>
            )}
          </ul>
          {bottomContent && (
            <div className="sm-bottom-content">
              {bottomContent}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;
