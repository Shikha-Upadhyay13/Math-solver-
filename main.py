from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import sympy as sp
import re

# ---------------- APP SETUP ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATA MODEL ----------------
class Question(BaseModel):
    text: str

# ---------------- PREPROCESS INPUT ----------------
def preprocess_input(text: str) -> str:
    text = text.lower().strip()
    text = text.replace(" ", "")
    text = text.replace("^", "**")

    # sin^2x -> sin(x)**2
    text = re.sub(r'sin\*\*2([a-zA-Z])', r'sin(\1)**2', text)
    text = re.sub(r'cos\*\*2([a-zA-Z])', r'cos(\1)**2', text)
    text = re.sub(r'tan\*\*2([a-zA-Z])', r'tan(\1)**2', text)

    # 2x -> 2*x
    text = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', text)

    # x2 -> x*2
    text = re.sub(r'([a-zA-Z])(\d)', r'\1*\2', text)

    # integrate x**2 -> integrate(x**2)
    if text.startswith("integrate") and not text.startswith("integrate("):
        text = text.replace("integrate", "integrate(") + ")"

    # diff x**2 -> diff(x**2)
    if text.startswith("diff") and not text.startswith("diff("):
        text = text.replace("diff", "diff(") + ")"

    return text

# ---------------- RESPONSE BUILDER ----------------
def build_response(operation, answer, method=None, steps=None):
    return {
        "operation": operation,
        "method": method,
        "steps": steps,
        "final_answer": str(answer)
    }

# ---------------- SOLVER ----------------
@app.post("/solve")
def solve_math(q: Question):
    try:
        text = preprocess_input(q.text)
        x = sp.symbols("x")

        # ---------- LIMITS ----------
        if text.startswith("limit(") and text.endswith(")"):
            inner = text[6:-1]
            parts = [p.strip() for p in inner.split(",")]

            if len(parts) != 3:
                return {
                    "error": "Invalid limit format",
                    "hint": "Use limit(expression, variable, value)"
                }

            expr_text, var_text, val_text = parts
            var = sp.symbols(var_text)

            expr = sp.sympify(expr_text, locals={var_text: var})
            val = sp.sympify(val_text)

            result = sp.limit(expr, var, val)

            return build_response(
                operation="Limit",
                method="symbolic limit evaluation",
                steps=[
                    "Identify the limit expression",
                    f"Evaluate the limit as {var_text} approaches {val_text}",
                    "Simplify the result"
                ],
                answer=result
            )

        # ---------- DIFFERENTIATION ----------
        if text.startswith("diff(") and text.endswith(")"):
            expr_text = text[5:-1]
            expr = sp.sympify(expr_text, locals={"x": x})
            result = sp.simplify(sp.trigsimp(sp.diff(expr, x)))

            return build_response(
                operation="Differentiation",
                method="symbolic differentiation",
                steps=[
                    "Identify the expression",
                    "Apply differentiation rules",
                    "Simplify the derivative"
                ],
                answer=result
            )

        # ---------- INTEGRATION ----------
        if text.startswith("integrate(") and text.endswith(")"):
            expr_text = text[10:-1]
            expr = sp.sympify(expr_text, locals={"x": x})
            result = sp.integrate(expr, x)

            return build_response(
                operation="Integration",
                method="symbolic integration",
                steps=[
                    "Identify the expression",
                    "Apply integration rules",
                    "Simplify the result"
                ],
                answer=result
            )
        
        # ---------- SIMPLIFY ----------
        if text.startswith("simplify(") and text.endswith(")"):
            expr_text = text[9:-1]
            expr = sp.sympify(expr_text, locals={"x": x})
            result = sp.simplify(expr)

            return build_response(
                operation="simplification",
                method="symbolic simplification",
                steps=[
                    "Identify the expression",
                    "Apply algebraic simplification rules",
                    "Reduce the expression"
                ],
                answer=result
            )

        # ---------- FACTOR ----------
        if text.startswith("factor(") and text.endswith(")"):
            expr_text = text[7:-1]
            expr = sp.sympify(expr_text, locals={"x": x})
            result = sp.factor(expr)

            return build_response(
                operation="factorization",
                method="symbolic factorization",
                steps=[
                    "Identify the polynomial",
                    "Factor the expression",
                    "Simplify the result"
                ],
                answer=result
            )

        # ---------- EXPAND ----------
        if text.startswith("expand(") and text.endswith(")"):
            expr_text = text[7:-1]
            expr = sp.sympify(expr_text, locals={"x": x})
            result = sp.expand(expr)

            return build_response(
                operation="expansion",
                method="symbolic expansion",
                steps=[
                    "Identify the expression",
                    "Apply expansion rules",
                    "Expand all terms"
                ],
                answer=result
            )
        # ---------- MATRIX OPERATIONS ----------
        if text.startswith("det(") and text.endswith(")"):
            matrix_text = text[4:-1]
            matrix = sp.Matrix(eval(matrix_text))
            result = matrix.det()

            return build_response(
                operation="matrix determinant",
                method="symbolic determinant",
                steps=[
                    "Parse the matrix",
                    "Compute the determinant"
                ],
                answer=result
            )

        if text.startswith("inv(") and text.endswith(")"):
            matrix_text = text[4:-1]
            matrix = sp.Matrix(eval(matrix_text))

            if matrix.det() == 0:
                return {
                    "error": "Matrix is singular and has no inverse"
                }

            result = matrix.inv()

            return build_response(
                operation="matrix inverse",
                method="symbolic inversion",
                steps=[
                    "Parse the matrix",
                    "Check determinant",
                    "Compute the inverse"
                ],
                answer=str(result)
            )

        if text.startswith("eigen(") and text.endswith(")"):
            matrix_text = text[6:-1]
            matrix = sp.Matrix(eval(matrix_text))

            eigen_data = matrix.eigenvals()

            # Convert eigenvalues to JSON-safe format
            formatted_eigen = {str(k): int(v) for k, v in eigen_data.items()}

            return {
                "operation": "matrix eigenvalues",
                "final_answer": formatted_eigen
            }

# ---------- SYSTEM OF EQUATIONS ----------
        if ";" in text:
            equations_text = text.split(";")

            equations = []
            variables = set()

            for eq in equations_text:
                if "=" not in eq:
                    return {
                        "error": "Invalid system format",
                        "hint": "Use eq1; eq2; eq3"
                    }

                left, right = eq.split("=")
                left_expr = sp.sympify(left)
                right_expr = sp.sympify(right)

                equations.append(sp.Eq(left_expr, right_expr))
                variables.update(left_expr.free_symbols)
                variables.update(right_expr.free_symbols)

            variables = list(variables)

            solution = sp.solve(equations, variables, dict=True)

            # 🔑 CONVERT SymPy objects to JSON-safe format
            formatted_solution = []
            for sol in solution:
                formatted_solution.append(
                    {str(var): str(val) for var, val in sol.items()}
                )

            return {
                "operation": "System of Equations",
                "variables": [str(v) for v in variables],
                "final_answer": formatted_solution
            }


        
        # ---------- SINGLE EQUATION ----------
        if "=" in text and ";" not in text:
            left, right = text.split("=")

            expr = sp.sympify(left) - sp.sympify(right)
            variables = list(expr.free_symbols)

            if len(variables) != 1:
                return {
                    "error": "Numeric solving supports only one variable"
                }

            var = variables[0]

            # 1️⃣ Try symbolic solve
            try:
                solution = sp.solve(expr, var)

                if solution:
                    return build_response(
                        operation="equation solving",
                        method="symbolic solving",
                        steps=[
                            "Form the equation",
                            "Solve symbolically",
                            "Simplify the solution"
                        ],
                        answer=[str(sol) for sol in solution]
                    )
            except:
                pass

            # 2️⃣ Fallback to numeric solve
            try:
                numeric_solution = sp.nsolve(expr, var, 1)

                return build_response(
                    operation="numeric equation solving",
                    method="numeric approximation (nsolve)",
                    steps=[
                        "Form the equation",
                        "Attempt symbolic solve (failed)",
                        "Apply numeric approximation"
                    ],
                    answer=str(numeric_solution)
                )

            except Exception as e:
                return {
                    "error": "Unable to solve equation",
                    "details": str(e)
                }


        # ---------- EVALUATION ----------
        result = sp.sympify(text, locals={"x": x})
        result = sp.trigsimp(result)

        return build_response(
            operation="evaluation",
            method="symbolic evaluation with trigonometric simplification",
            steps=[
                "Parse the expression",
                "Apply trigonometric identities",
                "Simplify the result"
            ],
            answer=result
        )

    except Exception as e:
        return {
            "error": "Unable to process input",
            "details": str(e)
        }

#pix2text OCR endpoint
from fastapi import UploadFile, File
from pix2text import Pix2Text
import tempfile
import os

p2t = Pix2Text()

@app.post("/image-ocr")
async def image_ocr(file: UploadFile = File(...)):
    try:
        # Save uploaded image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Run OCR
        page = p2t(tmp_path)

        extracted_text = []

        for el in page.elements:
            if hasattr(el, "latex") and el.latex:
                extracted_text.append(el.latex)
            elif hasattr(el, "text") and el.text:
                extracted_text.append(el.text)

        os.remove(tmp_path)

        if not extracted_text:
            return {
                "success": False,
                "message": "No text detected in image"
            }

        return {
            "success": True,
            "text": " ".join(extracted_text)
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/extract-image")
async def extract_image(file: UploadFile = File(...)):
    return {
        "success": True,
        "extracted_text": "x^2 + 2x + 1"
    }


#EXPLANATION ENDPOINT

@app.post("/explain")
def explain_math(q: Question):
    text = preprocess_input(q.text)
    x = sp.symbols("x")

    try:
        # ---------- INTEGRATION ----------
        if text.startswith("integrate("):
            expr = sp.sympify(text[10:-1])

            if expr.is_polynomial(x):
                return {
                    "operation": "Integration",
                    "steps": [
                        {
                            "step": "Identify the expression",
                            "explanation": "The given expression is a polynomial in x."
                        },
                        {
                            "step": "Apply the power rule",
                            "explanation": (
                                "For a term xⁿ, increase the exponent by 1 "
                                "and divide by the new exponent."
                            )
                        }
                    ],
                    "final_answer": str(sp.integrate(expr, x))
                }

            if expr.has(sp.sin, sp.cos, sp.tan):
                return {
                    "operation": "Integration",
                    "steps": [
                        {
                            "step": "Identify the function",
                            "explanation": "The expression contains a trigonometric function."
                        },
                        {
                            "step": "Use standard trigonometric integrals",
                            "explanation": (
                                "Standard integral formulas are applied "
                                "for trigonometric functions."
                            )
                        }
                    ],
                    "final_answer": str(sp.integrate(expr, x))
                }

        # ---------- DIFFERENTIATION ----------
        if text.startswith("diff("):
            expr = sp.sympify(text[5:-1])

            return {
                "operation": "Differentiation",
                "steps": [
                    {
                        "step": "Identify the function",
                        "explanation": "The expression is differentiated with respect to x."
                    },
                    {
                        "step": "Apply differentiation rules",
                        "explanation": (
                            "Power rule and standard derivative formulas "
                            "are applied where necessary."
                        )
                    }
                ],
                "final_answer": str(sp.diff(expr, x))
            }

        # ---------- SIMPLIFICATION ----------
        if text.startswith("simplify("):
            expr = sp.sympify(text[9:-1])

            return {
                "operation": "Simplification",
                "steps": [
                    {
                        "step": "Factor numerator and denominator",
                        "explanation": (
                            "Common factors are identified in the expression."
                        )
                    },
                    {
                        "step": "Cancel common factors",
                        "explanation": (
                            "Common factors are cancelled to simplify the expression."
                        )
                    }
                ],
                "final_answer": str(sp.simplify(expr))
            }

        return {
            "error": "Explanation not available for this input yet"
        }

    except Exception as e:
        return {
            "error": "Failed to generate explanation",
            "details": str(e)
        }
    
import sympy as sp

def explain_differentiation(expr, variable):
    steps = []

    # Case 1: diff(x)
    if expr == variable:
        steps.append({
            "step": "Identify the function",
            "explanation": "The given function is x, which is a linear polynomial."
        })
        steps.append({
            "step": "Differentiate",
            "explanation": "The derivative of x with respect to x is 1, because the rate of change of x with itself is constant."
        })
        return steps

    # Case 2: x^n
    if isinstance(expr, sp.Pow) and expr.base == variable:
        n = expr.exp
        steps.append({
            "step": "Identify the function",
            "explanation": f"The given function is x raised to the power {n}."
        })
        steps.append({
            "step": "Apply the power rule",
            "explanation": f"Using the power rule, the derivative of xⁿ is n·xⁿ⁻¹. Here n = {n}."
        })
        return steps

    # Case 3: sin(x), cos(x), tan(x)
    if expr.func == sp.sin:
        steps.append({
            "step": "Identify the function",
            "explanation": "The given function is sin(x), a trigonometric function."
        })
        steps.append({
            "step": "Apply trigonometric differentiation",
            "explanation": "The derivative of sin(x) with respect to x is cos(x)."
        })
        return steps

    if expr.func == sp.cos:
        steps.append({
            "step": "Identify the function",
            "explanation": "The given function is cos(x), a trigonometric function."
        })
        steps.append({
            "step": "Apply trigonometric differentiation",
            "explanation": "The derivative of cos(x) with respect to x is -sin(x)."
        })
        return steps

    # Case 4: sum of terms
    if isinstance(expr, sp.Add):
        steps.append({
            "step": "Identify the structure",
            "explanation": "The expression is a sum of multiple terms."
        })
        steps.append({
            "step": "Apply linearity of differentiation",
            "explanation": "Each term is differentiated separately and then combined."
        })
        return steps

    # Fallback
    steps.append({
        "step": "Differentiate the expression",
        "explanation": "Standard differentiation rules are applied to compute the derivative."
    })

    return steps
