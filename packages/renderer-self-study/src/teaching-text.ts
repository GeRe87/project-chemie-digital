// Keep the public adapter names; all views share one safe inline-math parser.
export {
  escapeInlineText as escapeStudyText,
  renderInlineMath as renderStudyMath,
  renderInlineText as renderStudyInline,
} from "../../renderer-shared/src/inline-math.ts";
