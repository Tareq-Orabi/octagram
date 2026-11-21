import type { CSSProperties } from "react";

/** Cosmetic glyph motion, with one uninterrupted copy for assistive technology. */
export default function ExploreText({ children }: { children:string }) {
  let at=0;
  return <span className="explore-text"><span className="sr-only">{children}</span><span aria-hidden="true">{children.split(" ").map((word,n)=><span key={n}>{n>0?" ":null}<span className="explore-word">{[...word].map((letter,i)=><span className="explore-letter" key={i} style={{"--hover-letter":at++} as CSSProperties}>{letter}</span>)}</span></span>)}</span></span>;
}
