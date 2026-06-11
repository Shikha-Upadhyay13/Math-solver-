import ast
import sympy as sp


def _parse_matrix_literal(text: str) -> sp.Matrix:
    try:
        data = ast.literal_eval(text)
    except (ValueError, SyntaxError) as e:
        raise ValueError(f"Invalid matrix literal: {e}")
    if not isinstance(data, (list, tuple)):
        raise ValueError("Matrix must be a nested list like [[1,2],[3,4]]")
    return sp.Matrix(data)


def _build(operation, answer, method=None, steps=None):
    return {
        "operation": operation,
        "method": method,
        "steps": steps,
        "final_answer": str(answer),
    }


def solve(text: str) -> dict:
    x = sp.symbols("x")

    try:
        if text.startswith("limit(") and text.endswith(")"):
            inner = text[6:-1]
            parts = [p.strip() for p in inner.split(",")]
            if len(parts) != 3:
                return {
                    "error": "Invalid limit format",
                    "hint": "Use limit(expression, variable, value)",
                }
            expr_text, var_text, val_text = parts
            var = sp.symbols(var_text)
            expr = sp.sympify(expr_text, locals={var_text: var})
            val = sp.sympify(val_text)
            result = sp.limit(expr, var, val)
            return _build(
                "Limit",
                result,
                method="symbolic limit evaluation",
                steps=[
                    "Identify the limit expression",
                    f"Evaluate the limit as {var_text} approaches {val_text}",
                    "Simplify the result",
                ],
            )

        if text.startswith("diff(") and text.endswith(")"):
            expr = sp.sympify(text[5:-1], locals={"x": x})
            result = sp.simplify(sp.trigsimp(sp.diff(expr, x)))
            return _build(
                "Differentiation",
                result,
                method="symbolic differentiation",
                steps=[
                    "Identify the expression",
                    "Apply differentiation rules",
                    "Simplify the derivative",
                ],
            )

        if text.startswith("integrate(") and text.endswith(")"):
            expr = sp.sympify(text[10:-1], locals={"x": x})
            result = sp.integrate(expr, x)
            return _build(
                "Integration",
                result,
                method="symbolic integration",
                steps=[
                    "Identify the expression",
                    "Apply integration rules",
                    "Simplify the result",
                ],
            )

        if text.startswith("simplify(") and text.endswith(")"):
            expr = sp.sympify(text[9:-1], locals={"x": x})
            return _build(
                "Simplification",
                sp.simplify(expr),
                method="symbolic simplification",
                steps=[
                    "Identify the expression",
                    "Apply algebraic simplification rules",
                    "Reduce the expression",
                ],
            )

        if text.startswith("factor(") and text.endswith(")"):
            expr = sp.sympify(text[7:-1], locals={"x": x})
            return _build(
                "Factorization",
                sp.factor(expr),
                method="symbolic factorization",
                steps=[
                    "Identify the polynomial",
                    "Factor the expression",
                    "Simplify the result",
                ],
            )

        if text.startswith("expand(") and text.endswith(")"):
            expr = sp.sympify(text[7:-1], locals={"x": x})
            return _build(
                "Expansion",
                sp.expand(expr),
                method="symbolic expansion",
                steps=[
                    "Identify the expression",
                    "Apply expansion rules",
                    "Expand all terms",
                ],
            )

        if text.startswith("det(") and text.endswith(")"):
            matrix = _parse_matrix_literal(text[4:-1])
            return _build(
                "Matrix determinant",
                matrix.det(),
                method="symbolic determinant",
                steps=["Parse the matrix", "Compute the determinant"],
            )

        if text.startswith("inv(") and text.endswith(")"):
            matrix = _parse_matrix_literal(text[4:-1])
            if matrix.det() == 0:
                return {"error": "Matrix is singular and has no inverse"}
            return _build(
                "Matrix inverse",
                matrix.inv(),
                method="symbolic inversion",
                steps=["Parse the matrix", "Check determinant", "Compute the inverse"],
            )

        if text.startswith("eigen(") and text.endswith(")"):
            matrix = _parse_matrix_literal(text[6:-1])
            eigen_data = matrix.eigenvals()
            return {
                "operation": "Matrix eigenvalues",
                "final_answer": {str(k): int(v) for k, v in eigen_data.items()},
            }

        if ";" in text:
            equations_text = text.split(";")
            equations = []
            variables = set()
            for eq in equations_text:
                if "=" not in eq:
                    return {
                        "error": "Invalid system format",
                        "hint": "Use eq1; eq2; eq3",
                    }
                left, right = eq.split("=", 1)
                left_expr = sp.sympify(left)
                right_expr = sp.sympify(right)
                equations.append(sp.Eq(left_expr, right_expr))
                variables.update(left_expr.free_symbols)
                variables.update(right_expr.free_symbols)
            variables = list(variables)
            solution = sp.solve(equations, variables, dict=True)
            return {
                "operation": "System of Equations",
                "variables": [str(v) for v in variables],
                "final_answer": [
                    {str(v): str(val) for v, val in sol.items()} for sol in solution
                ],
            }

        if "=" in text and ";" not in text:
            left, right = text.split("=", 1)
            expr = sp.sympify(left) - sp.sympify(right)
            free_vars = list(expr.free_symbols)
            if len(free_vars) != 1:
                return {"error": "Numeric solving supports only one variable"}
            var = free_vars[0]
            try:
                solution = sp.solve(expr, var)
                if solution:
                    return _build(
                        "Equation solving",
                        [str(s) for s in solution],
                        method="symbolic solving",
                        steps=[
                            "Form the equation",
                            "Solve symbolically",
                            "Simplify the solution",
                        ],
                    )
            except Exception:
                pass
            try:
                numeric_solution = sp.nsolve(expr, var, 1)
                return _build(
                    "Numeric equation solving",
                    numeric_solution,
                    method="numeric approximation (nsolve)",
                    steps=[
                        "Form the equation",
                        "Attempt symbolic solve (failed)",
                        "Apply numeric approximation",
                    ],
                )
            except Exception as e:
                return {"error": "Unable to solve equation", "details": str(e)}

        result = sp.sympify(text, locals={"x": x})
        result = sp.trigsimp(result)
        return _build(
            "Evaluation",
            result,
            method="symbolic evaluation with trigonometric simplification",
            steps=[
                "Parse the expression",
                "Apply trigonometric identities",
                "Simplify the result",
            ],
        )

    except Exception as e:
        return {"error": "Unable to process input", "details": str(e)}
