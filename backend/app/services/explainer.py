import sympy as sp


def explain(text: str) -> dict:
    x = sp.symbols("x")

    try:
        if text.startswith("integrate(") and text.endswith(")"):
            expr = sp.sympify(text[10:-1], locals={"x": x})

            if expr.is_polynomial(x):
                return {
                    "operation": "Integration",
                    "steps": [
                        {
                            "step": "Identify the expression",
                            "explanation": "The given expression is a polynomial in x.",
                        },
                        {
                            "step": "Apply the power rule",
                            "explanation": (
                                "For a term x^n, increase the exponent by 1 "
                                "and divide by the new exponent."
                            ),
                        },
                    ],
                    "final_answer": str(sp.integrate(expr, x)),
                }

            if expr.has(sp.sin, sp.cos, sp.tan):
                return {
                    "operation": "Integration",
                    "steps": [
                        {
                            "step": "Identify the function",
                            "explanation": "The expression contains a trigonometric function.",
                        },
                        {
                            "step": "Use standard trigonometric integrals",
                            "explanation": (
                                "Standard integral formulas are applied for trigonometric functions."
                            ),
                        },
                    ],
                    "final_answer": str(sp.integrate(expr, x)),
                }

        if text.startswith("diff(") and text.endswith(")"):
            expr = sp.sympify(text[5:-1], locals={"x": x})
            return {
                "operation": "Differentiation",
                "steps": [
                    {
                        "step": "Identify the function",
                        "explanation": "The expression is differentiated with respect to x.",
                    },
                    {
                        "step": "Apply differentiation rules",
                        "explanation": (
                            "Power rule and standard derivative formulas "
                            "are applied where necessary."
                        ),
                    },
                ],
                "final_answer": str(sp.diff(expr, x)),
            }

        if text.startswith("simplify(") and text.endswith(")"):
            expr = sp.sympify(text[9:-1], locals={"x": x})
            return {
                "operation": "Simplification",
                "steps": [
                    {
                        "step": "Factor numerator and denominator",
                        "explanation": "Common factors are identified in the expression.",
                    },
                    {
                        "step": "Cancel common factors",
                        "explanation": "Common factors are cancelled to simplify the expression.",
                    },
                ],
                "final_answer": str(sp.simplify(expr)),
            }

        return {
            "error": "Explanation not available for this input yet",
            "hint": "Try diff(...), integrate(...), or simplify(...). Richer LLM-grounded explanations land in Phase 5.",
        }

    except Exception as e:
        return {"error": "Failed to generate explanation", "details": str(e)}
