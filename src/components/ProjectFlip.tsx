"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";

const directions = ["left", "right", "up", "down"] as const;
type Direction = (typeof directions)[number];
const rotations: Record<Direction, [number, number]> = {
  left: [0, -180],
  right: [0, 180],
  up: [180, 0],
  down: [-180, 0],
};

/** The front alone sizes the card. The back never participates in layout. */
export default function ProjectFlip({
  title,
  index,
  front,
  back,
}: {
  title: string;
  index: number;
  front: ReactNode;
  back: ReactNode;
}) {
  const [state, setState] = useState<{ open: boolean; direction: Direction }>({
    open: false,
    direction: "right",
  });
  const openButton = useRef<HTMLButtonElement>(null);
  const returnButton = useRef<HTMLButtonElement>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const activated = useRef(false);
  const [rx, ry] = rotations[state.direction];
  const id = `project-back-${index}`;
  const changeFace = (open: boolean) => {
    activated.current = true;
    const direction = open
      ? directions[Math.floor(Math.random() * directions.length)]
      : state.direction;
    setState({ open, direction });
  };
  useLayoutEffect(() => {
    if (!activated.current) return;
    if (state.open && scrollArea.current) scrollArea.current.scrollTop = 0;
    (state.open ? returnButton : openButton).current?.focus({
      preventScroll: true,
    });
  }, [state.open]);
  return (
    <article
      className={`project-card project-showcase project-showcase--${index} project-flip`}
      data-open={state.open}
      data-direction={state.direction}
      onKeyDown={(event) => {
        if (event.key === "Escape" && state.open) {
          event.preventDefault();
          changeFace(false);
        }
      }}
      style={
        { "--flip-x": `${rx}deg`, "--flip-y": `${ry}deg` } as CSSProperties
      }
    >
      <div className="project-flip-inner">
        <div
          className="project-face project-face-front"
          inert={state.open}
          aria-hidden={state.open}
        >
          {front}
          <button
            ref={openButton}
            className="project-flip-open"
            type="button"
            aria-label={`Explore ${title}`}
            aria-expanded={state.open}
            aria-controls={id}
            onClick={() => changeFace(true)}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <div
          id={id}
          className="project-face project-face-back"
          inert={!state.open}
          aria-hidden={!state.open}
        >
          <div className="project-back-bar">
            <h3>{title}</h3>
            <button
              ref={returnButton}
              type="button"
              className="project-flip-return"
              aria-label={`Return to ${title} overview`}
              onClick={() => changeFace(false)}
            >
              Return
            </button>
          </div>
          <div
            ref={scrollArea}
            className="project-back-scroll"
            tabIndex={state.open ? 0 : -1}
            role="region"
            aria-label={`${title} project details`}
          >
            {back}
          </div>
        </div>
      </div>
    </article>
  );
}
