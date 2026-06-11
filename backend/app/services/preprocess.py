import re


def preprocess_input(text: str) -> str:
    text = text.lower().strip()
    text = text.replace(" ", "")
    text = text.replace("^", "**")

    text = re.sub(r"sin\*\*2([a-zA-Z])", r"sin(\1)**2", text)
    text = re.sub(r"cos\*\*2([a-zA-Z])", r"cos(\1)**2", text)
    text = re.sub(r"tan\*\*2([a-zA-Z])", r"tan(\1)**2", text)

    text = re.sub(r"(\d)([a-zA-Z])", r"\1*\2", text)
    text = re.sub(r"([a-zA-Z])(\d)", r"\1*\2", text)

    if text.startswith("integrate") and not text.startswith("integrate("):
        text = text.replace("integrate", "integrate(", 1) + ")"
    if text.startswith("diff") and not text.startswith("diff("):
        text = text.replace("diff", "diff(", 1) + ")"

    return text
