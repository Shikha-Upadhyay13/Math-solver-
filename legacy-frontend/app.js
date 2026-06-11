/* =========================================================
     INPUT MODE SWITCH
========================================================= */
function changeMode() {
  const mode = document.getElementById("inputMode").value;

  document.getElementById("textInput").style.display =
    mode === "text" ? "block" : "none";
  document.getElementById("imageInput").style.display =
    mode === "image" ? "block" : "none";
  document.getElementById("audioInput").style.display =
    mode === "audio" ? "block" : "none";

  document.getElementById("output").innerHTML = "";
}

/* =========================================================
     TEXT INPUT SOLVE
========================================================= */
async function solve() {
  const question = document.getElementById("question").value.trim();
  const output = document.getElementById("output");

  if (!question) {
    output.innerHTML = "<span class='error'>Enter a question</span>";
    return;
  }

  output.innerHTML = "Solving...";
  sendToBackend(question, "solve");
}

/* =========================================================
     TEXT INPUT EXPLAIN
========================================================= */
async function explain() {
  const question = document.getElementById("question").value.trim();
  const output = document.getElementById("output");

  if (!question) {
    output.innerHTML = "<span class='error'>Enter a question</span>";
    return;
  }

  output.innerHTML = "Generating explanation...";
  sendToBackend(question, "explain");
}

/* =========================================================
     AUDIO INPUT SOLVE
========================================================= */
async function solveFromAudio() {
  const audioTextValue = document.getElementById("audioText").value.trim();
  const output = document.getElementById("output");

  if (!audioTextValue) {
    output.innerHTML = "<span class='error'>No audio input detected</span>";
    return;
  }

  output.innerHTML = "Solving...";
  sendToBackend(audioTextValue, "solve");
}

/* =========================================================
     COMMON BACKEND CALL
========================================================= */
async function sendToBackend(text, mode) {
  const output = document.getElementById("output");

  const endpoint =
    mode === "explain"
      ? "http://127.0.0.1:8000/explain"
      : "http://127.0.0.1:8000/solve";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (data.error) {
      output.innerHTML = `<span class="error">${data.error}</span>`;
      return;
    }

    /* ---------- SOLVE MODE ---------- */
    if (mode === "solve") {
      output.innerHTML = `
        <strong>Operation:</strong> ${data.operation}<br><br>
        <strong>Answer:</strong><br>
        ${data.final_answer}
      `;
    }

    /* ---------- EXPLANATION MODE ---------- */
    if (mode === "explain") {
      let html = `<strong>Explanation</strong><br><br>`;

      if (Array.isArray(data.steps)) {
        data.steps.forEach((s, i) => {
          html += `
            <strong>Step ${i + 1}: ${s.step}</strong><br>
            ${s.explanation}<br><br>
          `;
        });
      }

      html += `<strong>Final Answer:</strong><br>${data.final_answer}`;
      output.innerHTML = html;
    }
  } catch (err) {
    output.innerHTML = "<span class='error'>Backend not reachable</span>";
  }
}

/* =========================================================
     SPEECH TO TEXT (AUDIO MODE)
========================================================= */
let recognition;
let listening = false;

const audioText = document.getElementById("audioText");
const micCircle = document.querySelector(".mic-circle");

/* --------- SPOKEN MATH → SYMBOLS --------- */
function normalizeMathSpeech(text) {
  let t = text.toLowerCase();

  /* ---------- COMMAND DETECTION ---------- */
  let isDiff = false,
    isIntegrate = false,
    isLimit = false,
    isSimplify = false,
    isFactor = false,
    isExpand = false;

  if (t.includes("derivative") || t.includes("differentiate")) {
    isDiff = true;
    t = t.replace(/derivative of|derivative|differentiate/gi, "");
  }

  if (t.includes("integrate") || t.includes("integral")) {
    isIntegrate = true;
    t = t.replace(/integrate|integral of|integral/gi, "");
  }

  if (t.includes("limit")) {
    isLimit = true;
    t = t.replace(/limit of|limit/gi, "");
  }

  if (t.includes("simplify")) {
    isSimplify = true;
    t = t.replace(/simplify/gi, "");
  }

  if (t.includes("factor")) {
    isFactor = true;
    t = t.replace(/factor/gi, "");
  }

  if (t.includes("expand")) {
    isExpand = true;
    t = t.replace(/expand/gi, "");
  }

  /* ---------- WORD → SYMBOL ---------- */
  const replacements = {
    plus: "+",
    minus: "-",
    times: "*",
    into: "*",
    "divide by": "/",
    "divided by": "/",
    equals: "=",
    "equal to": "=",
    square: "**2",
    cube: "**3",
    power: "**",
    "open bracket": "(",
    "close bracket": ")",
    sin: "sin",
    cosine: "cos",
    cos: "cos",
    tangent: "tan",
    tan: "tan",
    log: "log",
    "square root": "sqrt",
    zero: "0",
    one: "1",
    two: "2",
    three: "3",
    four: "4",
    five: "5",
  };

  for (const key in replacements) {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    t = t.replace(regex, replacements[key]);
  }

  /* ---------- TRIG FIX ---------- */
  t = t.replace(/\bsin\s*x\b/g, "sin(x)");
  t = t.replace(/\bcos\s*x\b/g, "cos(x)");
  t = t.replace(/\btan\s*x\b/g, "tan(x)");

  /* ---------- MULTIPLICATION FIX ---------- */
  t = t.replace(/(\d)([a-z])/g, "$1*$2");
  t = t.replace(/([a-z])(\d)/g, "$1*$2");

  t = t.replace(/\s+/g, "");

  /* ---------- FINAL WRAP ---------- */
  if (isDiff) return `diff(${t})`;
  if (isIntegrate) return `integrate(${t})`;
  if (isSimplify) return `simplify(${t})`;
  if (isFactor) return `factor(${t})`;
  if (isExpand) return `expand(${t})`;

  return t;
}

/* --------- MIC CONTROL --------- */
function startVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported");
    return;
  }

  if (!recognition) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      audioText.value = normalizeMathSpeech(transcript);
    };

    recognition.onend = () => {
      if (listening) recognition.start();
    };
  }

  if (!listening) {
    listening = true;
    micCircle.classList.add("listening");
    recognition.start();
  } else {
    stopVoice();
  }
}

function stopVoice() {
  listening = false;
  micCircle.classList.remove("listening");
  recognition.stop();
}

function resetAudio() {
  audioText.value = "";
  stopVoice();
  document.getElementById("output").innerHTML = "";
}
