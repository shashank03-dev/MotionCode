import React from "react";

export function SplitText({
  as: Component = "span",
  text,
  className,
  id,
  delayStep = 24,
}: {
  as?: "p" | "h2" | "span" | "strong";
  text: string;
  className?: string;
  id?: string;
  delayStep?: number;
}) {
  const words = text.split(/(\s+)/);
  let characterIndex = 0;

  return (
    <Component
      id={id}
      className={className}
      aria-label={text}
      style={{ "--split-step": `${delayStep}ms` } as React.CSSProperties}
    >
      <span aria-hidden="true">
        {words.map((word, wordIndex) => {
          if (/^\s+$/.test(word)) return " ";

          return (
            <span
              key={`${word}-${wordIndex}`}
              className="motioncode-split-word"
            >
              {Array.from(word).map((character, index) => {
                const currentIndex = characterIndex;
                characterIndex += 1;

                return (
                  <span
                    key={`${character}-${wordIndex}-${index}`}
                    className="motioncode-split-char"
                    style={
                      { "--char-index": currentIndex } as React.CSSProperties
                    }
                  >
                    {character}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </Component>
  );
}
