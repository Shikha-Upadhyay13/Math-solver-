/**
 * Convert spoken math into SymPy-friendly syntax.
 * Wraps the body in diff(), integrate(), simplify(), factor(), or expand()
 * when the user said the corresponding command.
 */
export function normalizeMathSpeech(text: string): string {
  let t = text.toLowerCase();

  let isDiff = false;
  let isIntegrate = false;
  let isSimplify = false;
  let isFactor = false;
  let isExpand = false;

  if (/\b(derivative|differentiate)\b/.test(t)) {
    isDiff = true;
    t = t.replace(/\b(derivative of|derivative|differentiate)\b/g, "");
  }
  if (/\b(integral|integrate)\b/.test(t)) {
    isIntegrate = true;
    t = t.replace(/\b(integrate|integral of|integral)\b/g, "");
  }
  if (/\bsimplify\b/.test(t)) {
    isSimplify = true;
    t = t.replace(/\bsimplify\b/g, "");
  }
  if (/\bfactor\b/.test(t)) {
    isFactor = true;
    t = t.replace(/\bfactor\b/g, "");
  }
  if (/\bexpand\b/.test(t)) {
    isExpand = true;
    t = t.replace(/\bexpand\b/g, "");
  }

  const replacements: Array<[RegExp, string]> = [
    [/\bplus\b/g, "+"],
    [/\bminus\b/g, "-"],
    [/\btimes\b/g, "*"],
    [/\binto\b/g, "*"],
    [/\bdivided by\b/g, "/"],
    [/\bdivide by\b/g, "/"],
    [/\bover\b/g, "/"],
    [/\bequals\b/g, "="],
    [/\bequal to\b/g, "="],
    [/\bsquared\b/g, "**2"],
    [/\bcubed\b/g, "**3"],
    [/\bsquare\b/g, "**2"],
    [/\bcube\b/g, "**3"],
    [/\bto the power of\b/g, "**"],
    [/\bpower\b/g, "**"],
    [/\bopen (bracket|paren|parenthesis)\b/g, "("],
    [/\bclose (bracket|paren|parenthesis)\b/g, ")"],
    [/\bcosine\b/g, "cos"],
    [/\btangent\b/g, "tan"],
    [/\bsquare root of\b/g, "sqrt"],
    [/\bsquare root\b/g, "sqrt"],
    [/\bpi\b/g, "pi"],
    [/\bzero\b/g, "0"],
    [/\bone\b/g, "1"],
    [/\btwo\b/g, "2"],
    [/\bthree\b/g, "3"],
    [/\bfour\b/g, "4"],
    [/\bfive\b/g, "5"],
    [/\bsix\b/g, "6"],
    [/\bseven\b/g, "7"],
    [/\beight\b/g, "8"],
    [/\bnine\b/g, "9"],
    [/\bten\b/g, "10"],
  ];

  for (const [re, to] of replacements) {
    t = t.replace(re, to);
  }

  t = t.replace(/\bsin\s+x\b/g, "sin(x)");
  t = t.replace(/\bcos\s+x\b/g, "cos(x)");
  t = t.replace(/\btan\s+x\b/g, "tan(x)");

  t = t.replace(/(\d)([a-z])/g, "$1*$2");
  t = t.replace(/([a-z])(\d)/g, "$1*$2");

  t = t.replace(/\s+/g, "");

  if (isDiff) return `diff(${t})`;
  if (isIntegrate) return `integrate(${t})`;
  if (isSimplify) return `simplify(${t})`;
  if (isFactor) return `factor(${t})`;
  if (isExpand) return `expand(${t})`;
  return t;
}
