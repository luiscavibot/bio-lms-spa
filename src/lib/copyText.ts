function copyWithSelection(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.setAttribute("aria-hidden", "true");
  Object.assign(textArea.style, {
    position: "fixed",
    left: "-9999px",
    top: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  try {
    return document.execCommand("copy");
  } finally {
    textArea.remove();
  }
}

export async function copyText(text: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Algunos navegadores deniegan la API moderna aun en contextos seguros.
    }
  }

  if (!copyWithSelection(text)) {
    throw new Error("El navegador no permitió copiar al portapapeles");
  }
}
