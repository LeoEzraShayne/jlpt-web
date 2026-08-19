import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FuriganaText } from "./furigana-text";

describe("FuriganaText", () => {
  it("renders kanji with ruby readings", () => {
    const { container } = render(
      <p>
        <FuriganaText
          annotated="国家[こっか]の存続[そんぞく]"
          fallback="国家の存続"
        />
      </p>,
    );
    expect(container.querySelectorAll("ruby")).toHaveLength(2);
    expect(screen.getByText("こっか")).toBeInTheDocument();
    expect(screen.getByText("そんぞく")).toBeInTheDocument();
  });

  it("falls back to the plain sentence for old results", () => {
    render(<FuriganaText fallback="自然な表現です。" />);
    expect(screen.getByText("自然な表現です。")).toBeInTheDocument();
  });
});
