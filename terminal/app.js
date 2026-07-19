(function () {
  "use strict";

  const liveScene = document.getElementById("liveScene");
  const liveButton = document.getElementById("initializeButton");
  const announcement = document.getElementById("systemAnnouncement");
  const titleInput = document.getElementById("titleInput");
  const statusInput = document.getElementById("statusInput");
  const actionInput = document.getElementById("actionInput");
  const initializedInput = document.getElementById("initializedInput");
  const fontFamilyInput = document.getElementById("fontFamilyInput");
  const typingEnabledInput = document.getElementById("typingEnabledInput");
  const typingTargetInput = document.getElementById("typingTargetInput");
  const typingSpeedInput = document.getElementById("typingSpeedInput");
  const typingSpeedValue = document.getElementById("typingSpeedValue");
  const cursorVisibleInput = document.getElementById("cursorVisibleInput");
  const cursorBlinkInput = document.getElementById("cursorBlinkInput");
  const cursorBlinkSpeedInput = document.getElementById("cursorBlinkSpeedInput");
  const cursorBlinkSpeedValue = document.getElementById("cursorBlinkSpeedValue");
  const cursorBlinkField = document.getElementById("cursorBlinkField");
  const cursorBlinkSpeedField = document.getElementById("cursorBlinkSpeedField");
  const svgOutput = document.getElementById("svgOutput");
  const copySvgButton = document.getElementById("copySvgButton");
  const downloadSvgButton = document.getElementById("downloadSvgButton");
  const exportStatus = document.getElementById("exportStatus");
  const ghostScenes = Array.from(document.querySelectorAll(".scene--near-ghost, .scene--far-ghost"));
  const allScenes = [liveScene, ...ghostScenes];
  let initializeTimer;
  let typingFrame;
  let typingRun = 0;
  let currentSvg = "";

  const fontStacks = {
    iosevka: '"Iosevka Etoile", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    "ibm-plex": '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    jetbrains: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    "fira-code": '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    system: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  };

  function cleanSingleLine(value) {
    return value.replace(/[\r\n]+/g, " ").trim();
  }

  function cleanStatus(value) {
    return value.replace(/\r\n/g, "\n").trim();
  }

  function readContent() {
    return {
      title: cleanSingleLine(titleInput.value),
      status: cleanStatus(statusInput.value),
      action: cleanSingleLine(actionInput.value),
      initialized: cleanSingleLine(initializedInput.value),
      fontFamily: fontStacks[fontFamilyInput.value] || fontStacks.system,
      typing: {
        enabled: typingEnabledInput.checked,
        target: typingTargetInput.value === "status" ? "status" : "title",
        speed: Math.max(1, Number(typingSpeedInput.value) || 14),
        cursorVisible: cursorVisibleInput.checked,
        cursorBlink: cursorBlinkInput.checked,
        cursorBlinkSpeed: Math.min(2, Math.max(0.25, Number(cursorBlinkSpeedInput.value) || 0.85))
      }
    };
  }

  function statusLines(status) {
    return status ? status.split("\n").map((line) => line.trim()).slice(0, 6) : [];
  }

  function titleWords(title) {
    return title.split(/\s+/).filter(Boolean);
  }

  function setTitleText(element, value, keepVisible) {
    element.replaceChildren();
    element.hidden = !value && !keepVisible;
    const words = titleWords(value);

    words.forEach((word, index) => {
      if (index > 0) element.appendChild(document.createTextNode(" "));

      const wordElement = document.createElement("span");
      wordElement.className = "title-word";
      wordElement.textContent = word;
      element.appendChild(wordElement);
    });
  }

  function fitPreviewTitle(element) {
    if (element.hidden) return;

    element.style.removeProperty("font-size");

    // The far ghost is intentionally oversized. Keep its title as one
    // intrinsic line so a custom label cannot collapse into the live scene's
    // narrow preview width before the ghost transform is applied.
    if (element.closest(".scene--far-ghost")) {
      element.style.width = "max-content";
      element.style.maxWidth = "none";
      element.style.whiteSpace = "nowrap";
      return;
    }

    element.style.removeProperty("width");
    element.style.removeProperty("max-width");
    element.style.whiteSpace = "nowrap";

    const availableWidth = element.clientWidth;
    const naturalWidth = element.scrollWidth;
    const baseFontSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
    const wordCount = titleWords(element.textContent).length;

    if (!availableWidth || !naturalWidth || !baseFontSize || naturalWidth <= availableWidth) {
      element.style.whiteSpace = "normal";
      return;
    }

    // Keep a label on one line when it is only slightly too wide. Longer labels
    // use whole-word wrapping so the title remains readable instead of clipping.
    const isSlightOverflow = naturalWidth <= availableWidth * 1.24;
    const isSingleLongWord = wordCount <= 1;

    if (isSlightOverflow || isSingleLongWord) {
      element.style.fontSize = `${Math.max(12, baseFontSize * (availableWidth / naturalWidth))}px`;
      element.style.whiteSpace = "nowrap";
    } else {
      element.style.whiteSpace = "normal";
    }
  }

  function fitAllPreviewTitles() {
    allScenes.forEach((scene) => {
      const title = scene.querySelector(".glitch-header");
      if (title) fitPreviewTitle(title);
    });
  }

  function setMultilineText(element, value, keepVisible) {
    element.replaceChildren();
    element.hidden = !value && !keepVisible;
    const lines = statusLines(value);

    lines.forEach((line, index) => {
      element.appendChild(document.createTextNode(line || " "));
      if (index < lines.length - 1) element.appendChild(document.createElement("br"));
    });
  }

  function setTypingClasses(scene, content) {
    const title = scene.querySelector(".glitch-header");
    const status = scene.querySelector(".chrome-text");
    const targetElement = content.typing.target === "status" ? status : title;
    const targetContent = content[content.typing.target];

    [title, status].forEach((element) => {
      if (!element) return;
      element.classList.remove("typing-target", "cursor-visible", "cursor-blink");
      element.style.removeProperty("--cursor-blink-duration");
    });

    if (!targetElement || !targetContent) return;

    targetElement.classList.add("typing-target");
    targetElement.style.setProperty("--cursor-blink-duration", `${content.typing.cursorBlinkSpeed}s`);
    if (content.typing.cursorVisible) targetElement.classList.add("cursor-visible");
    if (content.typing.cursorVisible && content.typing.cursorBlink) {
      targetElement.classList.add("cursor-blink");
    }
  }

  function updatePreview(content, previewContent = content, typingActive = false) {
    allScenes.forEach((scene) => {
      scene.style.fontFamily = content.fontFamily;
      const title = scene.querySelector(".glitch-header");
      const status = scene.querySelector(".chrome-text");
      const button = scene.querySelector(".neon-button");
      const keepTitleVisible = typingActive && content.typing.target === "title" && content.title;
      const keepStatusVisible = typingActive && content.typing.target === "status" && content.status;

      if (title) setTitleText(title, previewContent.title, keepTitleVisible);
      if (status) setMultilineText(status, previewContent.status, keepStatusVisible);
      if (button) {
        const buttonLabel = scene.classList.contains("is-initializing")
          ? content.initialized
          : content.action;
        button.textContent = buttonLabel;
        button.hidden = !buttonLabel;
      }

      setTypingClasses(scene, content);
    });

    fitAllPreviewTitles();

    liveButton.setAttribute(
      "aria-label",
      liveScene.classList.contains("is-initializing") ? content.initialized : content.action
    );
  }

  function stopTyping() {
    typingRun += 1;
    if (typingFrame) {
      window.cancelAnimationFrame(typingFrame);
      typingFrame = undefined;
    }
  }

  function restartTyping(content) {
    stopTyping();

    const target = content.typing.target;
    const fullText = content[target];

    if (!content.typing.enabled || !fullText) {
      updatePreview(content);
      return;
    }

    const run = typingRun;
    const characterDelay = 1000 / content.typing.speed;
    const startedAt = window.performance.now();
    let renderedCharacters = -1;

    const renderFrame = (now) => {
      if (run !== typingRun) return;

      const characterCount = Math.min(
        fullText.length,
        Math.floor((now - startedAt) / characterDelay)
      );

      if (characterCount !== renderedCharacters) {
        renderedCharacters = characterCount;
        const previewContent = { ...content, [target]: fullText.slice(0, characterCount) };
        updatePreview(content, previewContent, characterCount < fullText.length);
      }

      if (characterCount < fullText.length) {
        typingFrame = window.requestAnimationFrame(renderFrame);
      } else {
        typingFrame = undefined;
      }
    };

    updatePreview(content, { ...content, [target]: "" }, true);
    typingFrame = window.requestAnimationFrame(renderFrame);
  }

  function escapeXml(value) {
    return value.replace(/[<>&'\"]/g, (character) => {
      const entities = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;"
      };
      return entities[character];
    });
  }

  function estimateTitleWidth(title, fontSize) {
    return title.length * fontSize * 0.61 + Math.max(0, title.length - 1) * 4;
  }

  function typingAttributes(content, target, text) {
    if (!content.typing.enabled || content.typing.target !== target || !text) return "";

    const duration = Math.max(0.5, text.length / content.typing.speed).toFixed(2);
    const steps = Math.max(1, text.length);
    return ` class="typing-layer" style="animation-duration:${duration}s;animation-timing-function:steps(${steps},end)"`;
  }

  function cursorClassName(content) {
    return `terminal-cursor${content.typing.cursorBlink ? " cursor-blink" : ""}`;
  }

  function cursorMarkup(content, titleLayoutData, titleFontSize, titleY, statusX, statusY, lines, lineHeight) {
    if (!content.typing.cursorVisible || !content[content.typing.target]) return "";

    const className = cursorClassName(content);
    const blinkStyle = content.typing.cursorBlink
      ? ` style="animation-duration:${content.typing.cursorBlinkSpeed}s"`
      : "";

    if (content.typing.target === "title") {
      const lastLine = titleLayoutData.lines[titleLayoutData.lines.length - 1] || "";
      const cursorX = statusX + estimateTitleWidth(lastLine, titleFontSize) + 8;
      const cursorY = titleY - titleFontSize * 0.82 + (titleLayoutData.lines.length - 1) * titleLayoutData.lineHeight;
      return `<rect class="${className}"${blinkStyle} x="${cursorX.toFixed(1)}" y="${cursorY.toFixed(1)}" width="${Math.max(3, titleFontSize * 0.08).toFixed(1)}" height="${(titleFontSize * 0.9).toFixed(1)}" rx="1" />`;
    }

    const lastLine = lines[lines.length - 1] || "";
    const cursorX = statusX + estimateTitleWidth(lastLine, 26) * 0.84 + 5;
    const cursorY = statusY - 22 + (lines.length - 1) * lineHeight;
    return `<rect class="${className}"${blinkStyle} x="${cursorX.toFixed(1)}" y="${cursorY}" width="3.5" height="28" rx="1" />`;
  }

  function wrapTitleLines(title, fontSize, maxWidth) {
    const words = titleWords(title);
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (currentLine && estimateTitleWidth(candidate, fontSize) > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [title];
  }

  function titleLayout(title) {
    const maxWidth = 1040;
    const baseFontSize = 68;
    const naturalWidth = estimateTitleWidth(title, baseFontSize);
    const words = titleWords(title);

    if (naturalWidth <= maxWidth) {
      return { fontSize: baseFontSize, lineHeight: Math.round(baseFontSize * 1.02), lines: [title] };
    }

    // A small overflow is more legible as a compact one-line title. Larger
    // labels wrap between words, matching the live preview.
    if (words.length <= 1 || naturalWidth <= maxWidth * 1.24) {
      const fontSize = Math.max(28, baseFontSize * (maxWidth / naturalWidth));
      return { fontSize, lineHeight: Math.round(fontSize * 1.02), lines: [title] };
    }

    const lines = wrapTitleLines(title, baseFontSize, maxWidth);
    return { fontSize: baseFontSize, lineHeight: Math.round(baseFontSize * 1.02), lines };
  }

  function titleMarkup(layout, x) {
    return layout.lines
      .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : layout.lineHeight}">${escapeXml(line)}</tspan>`)
      .join("");
  }

  function createSvg(content) {
    const width = 1200;
    const height = 500;
    const titleLayoutData = titleLayout(content.title);
    const titleY = 154;
    const statusX = 88;
    const titleLineCount = content.title ? titleLayoutData.lines.length : 0;
    const statusY = content.title
      ? titleY + titleLineCount * titleLayoutData.lineHeight + 2
      : titleY;
    const lineHeight = 38;
    const lines = statusLines(content.status);
    const buttonY = Math.min(390, statusY + lines.length * lineHeight + 18);
    const buttonWidth = Math.min(430, Math.max(250, content.action.length * 17 + 104));
    const title = escapeXml(content.title);
    const titleFontSize = titleLayoutData.fontSize;
    const titleTypingAttributes = typingAttributes(content, "title", content.title);
    const statusTypingAttributes = typingAttributes(content, "status", content.status);
    const titleLayers = content.title ? `
      <text x="${statusX - 8}" y="${titleY}" fill="#ff003c" opacity="0.54" font-size="${titleFontSize}" font-weight="700" letter-spacing="4"${titleTypingAttributes}>${titleMarkup(titleLayoutData, statusX - 8)}</text>
      <text x="${statusX + 8}" y="${titleY}" fill="#0000ff" opacity="0.72" font-size="${titleFontSize}" font-weight="700" letter-spacing="4"${titleTypingAttributes}>${titleMarkup(titleLayoutData, statusX + 8)}</text>
      <text x="${statusX}" y="${titleY}" fill="#1a7c32" filter="url(#greenGlow)" font-size="${titleFontSize}" font-weight="700" letter-spacing="4"${titleTypingAttributes}>${titleMarkup(titleLayoutData, statusX)}</text>` : "";
    const status = lines
      .map((line, index) => `<tspan x="${statusX}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line || " ")}</tspan>`)
      .join("");
    const action = escapeXml(content.action);
    const statusLayer = lines.length
      ? `<text x="${statusX}" y="${statusY}" fill="#e0e0e0" fill-opacity="0.58" font-size="26" letter-spacing="0.9"${statusTypingAttributes}>${status}</text>`
      : "";
    const buttonLayer = content.action
      ? `<g filter="url(#buttonGlow)">
        <rect x="${statusX}" y="${buttonY}" width="${buttonWidth}" height="66" fill="#000" fill-opacity="0.18" stroke="#1a7c32" stroke-width="2" />
        <text x="${statusX + buttonWidth / 2}" y="${buttonY + 42}" fill="#1a7c32" text-anchor="middle" font-size="24" font-weight="700" letter-spacing="2">${action}</text>
      </g>`
      : "";
    const cursorLayer = cursorMarkup(
      content,
      titleLayoutData,
      titleFontSize,
      titleY,
      statusX,
      statusY,
      lines,
      lineHeight
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="svgTitle svgDescription">
  <title id="svgTitle">${title}</title>
  <desc id="svgDescription">${escapeXml(content.status.replace(/\n/g, " "))}</desc>
  <defs>
    <style>
      @keyframes terminalTyping {
        from { clip-path: inset(0 100% 0 0); }
        to { clip-path: inset(0 0 0 0); }
      }
      @keyframes terminalCursorBlink {
        0%, 45% { opacity: 1; }
        46%, 100% { opacity: 0; }
      }
      .typing-layer {
        animation-name: terminalTyping;
        animation-fill-mode: both;
      }
      .terminal-cursor.cursor-blink {
        animation: terminalCursorBlink 0.85s steps(2, end) infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .typing-layer {
          animation: none;
        }
      }
    </style>
    <pattern id="screenDoor" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="2" height="2" fill="#000" opacity="0.2" />
      <rect x="2" y="2" width="2" height="2" fill="#000" opacity="0.2" />
    </pattern>
    <radialGradient id="warmHaze">
      <stop offset="0.34" stop-color="#000" stop-opacity="0" />
      <stop offset="0.66" stop-color="#ff005a" stop-opacity="0.08" />
      <stop offset="1" stop-color="#000" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="coolHaze">
      <stop offset="0.36" stop-color="#000" stop-opacity="0" />
      <stop offset="0.68" stop-color="#00beff" stop-opacity="0.08" />
      <stop offset="1" stop-color="#000" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="vignette">
      <stop offset="0.5" stop-color="#000" stop-opacity="0" />
      <stop offset="1" stop-color="#000" stop-opacity="0.58" />
    </radialGradient>
    <filter id="greenGlow" x="-30%" y="-40%" width="160%" height="180%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="buttonGlow" x="-20%" y="-30%" width="140%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id="nearGhost" x="-25%" y="-35%" width="150%" height="170%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018 0.045" numOctaves="2" seed="23" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" result="warped" />
      <feColorMatrix in="warped" type="hueRotate" values="160" result="colored" />
      <feGaussianBlur in="colored" stdDeviation="2.5" />
    </filter>
    <filter id="farGhost" x="-40%" y="-45%" width="180%" height="190%">
      <feTurbulence type="fractalNoise" baseFrequency="0.009 0.028" numOctaves="3" seed="47" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="32" xChannelSelector="G" yChannelSelector="R" result="warped" />
      <feColorMatrix in="warped" type="hueRotate" values="100" result="colored" />
      <feGaussianBlur in="colored" stdDeviation="5" />
    </filter>
    <g id="sceneContent" font-family="${escapeXml(content.fontFamily)}">
      ${titleLayers}
      ${statusLayer}
      ${cursorLayer}
      ${buttonLayer}
    </g>
  </defs>
  <rect width="${width}" height="${height}" fill="#000" />
  <ellipse cx="530" cy="205" rx="500" ry="270" fill="url(#warmHaze)" opacity="0.6" style="mix-blend-mode:screen" />
  <ellipse cx="680" cy="300" rx="470" ry="260" fill="url(#coolHaze)" opacity="0.6" style="mix-blend-mode:screen" />
  <g opacity="0.36" filter="url(#farGhost)" transform="translate(-330 -270) rotate(6 88 220) scale(2)">
    <g transform="translate(860 0) scale(-1 1)"><use href="#sceneContent" xlink:href="#sceneContent" /></g>
  </g>
  <g opacity="0.34" filter="url(#nearGhost)" transform="translate(190 78) rotate(-1 88 220) scale(0.82)"><use href="#sceneContent" xlink:href="#sceneContent" /></g>
  <use href="#sceneContent" xlink:href="#sceneContent" />
  <rect width="${width}" height="${height}" fill="url(#screenDoor)" opacity="0.72" />
  <rect width="${width}" height="${height}" fill="url(#vignette)" />
</svg>`;
  }

  function updateGenerator() {
    const content = readContent();
    updateTypingControls(content);
    currentSvg = createSvg(content);
    svgOutput.value = currentSvg;
    restartTyping(content);
  }

  function updateTypingControls(content = readContent()) {
    const speed = content.typing.speed;
    const blinkSpeed = content.typing.cursorBlinkSpeed;
    typingSpeedValue.textContent = `${speed} character${speed === 1 ? "" : "s"}/sec`;
    cursorBlinkSpeedValue.textContent = `${blinkSpeed.toFixed(2)}s/cycle`;
    typingSpeedInput.disabled = !content.typing.enabled;
    cursorBlinkInput.disabled = !content.typing.cursorVisible;
    cursorBlinkSpeedInput.disabled = !content.typing.cursorVisible || !content.typing.cursorBlink;
    cursorBlinkField.classList.toggle("is-disabled", !content.typing.cursorVisible);
    cursorBlinkSpeedField.classList.toggle(
      "is-disabled",
      !content.typing.cursorVisible || !content.typing.cursorBlink
    );
  }

  function setExportStatus(message) {
    exportStatus.textContent = message;
  }

  async function copySvg() {
    try {
      await navigator.clipboard.writeText(currentSvg);
      setExportStatus("SVG copied to the clipboard.");
    } catch (error) {
      svgOutput.focus();
      svgOutput.select();
      const copied = document.execCommand("copy");
      setExportStatus(copied ? "SVG copied to the clipboard." : "Select the SVG output and copy it manually.");
    }
  }

  function downloadSvg() {
    const blob = new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "terminal-signal.svg";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setExportStatus("terminal-signal.svg generated.");
  }

  function clearGhostHighlight() {
    if (window.CSS && CSS.highlights) {
      CSS.highlights.delete("ghost-select");
    }
  }

  function nodePath(node, sourceRoot, targetRoot) {
    const path = [];
    let current = node;

    while (current && current !== sourceRoot) {
      if (!current.parentNode) return null;
      path.unshift(Array.prototype.indexOf.call(current.parentNode.childNodes, current));
      current = current.parentNode;
    }

    if (current !== sourceRoot) return null;

    let equivalent = targetRoot;
    for (const index of path) {
      equivalent = equivalent && equivalent.childNodes[index];
    }
    return equivalent || null;
  }

  function syncGhostSelection() {
    clearGhostHighlight();

    if (!window.CSS || !CSS.highlights || typeof window.Highlight !== "function") return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!liveScene.contains(range.startContainer) || !liveScene.contains(range.endContainer)) return;

    const syncedRanges = [];
    ghostScenes.forEach((ghostScene) => {
      const startNode = nodePath(range.startContainer, liveScene, ghostScene);
      const endNode = nodePath(range.endContainer, liveScene, ghostScene);
      if (!startNode || !endNode) return;

      try {
        const ghostRange = new Range();
        ghostRange.setStart(startNode, range.startOffset);
        ghostRange.setEnd(endNode, range.endOffset);
        syncedRanges.push(ghostRange);
      } catch (error) {
        // The selection can briefly be stale while the browser is repainting.
      }
    });

    if (syncedRanges.length > 0) {
      CSS.highlights.set("ghost-select", new Highlight(...syncedRanges));
    }
  }

  function initializeSystem() {
    const content = readContent();
    window.clearTimeout(initializeTimer);
    allScenes.forEach((scene) => scene.classList.add("is-initializing"));
    allScenes.forEach((scene) => {
      const button = scene.querySelector(".neon-button");
      if (button) {
        button.textContent = content.initialized;
        button.hidden = !content.initialized;
      }
    });
    liveButton.setAttribute("aria-label", content.initialized);
    announcement.textContent = "System override initialized.";

    initializeTimer = window.setTimeout(() => {
      const content = readContent();
      allScenes.forEach((scene) => scene.classList.remove("is-initializing"));
      allScenes.forEach((scene) => {
        const button = scene.querySelector(".neon-button");
        if (button) {
          button.textContent = content.action;
          button.hidden = !content.action;
        }
      });
      liveButton.setAttribute("aria-label", content.action);
    }, 1600);
  }

  function setHoverState(isHovering) {
    allScenes.forEach((scene) => scene.classList.toggle("is-hovering", isHovering));
  }

  titleInput.addEventListener("input", updateGenerator);
  statusInput.addEventListener("input", updateGenerator);
  actionInput.addEventListener("input", updateGenerator);
  initializedInput.addEventListener("input", updateGenerator);
  fontFamilyInput.addEventListener("input", updateGenerator);
  typingEnabledInput.addEventListener("input", updateGenerator);
  typingTargetInput.addEventListener("input", updateGenerator);
  typingSpeedInput.addEventListener("input", updateGenerator);
  cursorVisibleInput.addEventListener("input", updateGenerator);
  cursorBlinkInput.addEventListener("input", updateGenerator);
  cursorBlinkSpeedInput.addEventListener("input", updateGenerator);
  document.getElementById("generatorForm").addEventListener("submit", (event) => event.preventDefault());
  copySvgButton.addEventListener("click", copySvg);
  downloadSvgButton.addEventListener("click", downloadSvg);
  liveButton.addEventListener("click", initializeSystem);
  liveButton.addEventListener("pointerenter", () => setHoverState(true));
  liveButton.addEventListener("pointerleave", () => setHoverState(false));
  liveButton.addEventListener("focus", () => setHoverState(true));
  liveButton.addEventListener("blur", () => setHoverState(false));
  document.addEventListener("selectionchange", syncGhostSelection);
  window.addEventListener("resize", fitAllPreviewTitles);
  window.addEventListener("blur", () => {
    clearGhostHighlight();
    setHoverState(false);
  });

  updateTypingControls();
  updateGenerator();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAllPreviewTitles);
})();
