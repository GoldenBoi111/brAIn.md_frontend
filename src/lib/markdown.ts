function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function renderMarkdownPreview(content: string): string {
  const codeBlocks: string[] = [];
  let source = escapeHtml(content);

  source = source.replace(/```([\s\S]*?)```/g, (_match, code: string) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `@@CODE_BLOCK_${index}@@`;
  });

  const lines = source.split("\n");
  const html: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    html.push(`<ul>${listItems.join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === "") {
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      html.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      html.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      html.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushList();
      html.push(`<blockquote>${formatInline(line.slice(2))}</blockquote>`);
      continue;
    }

    if (/^- \[[ x]\] /.test(line)) {
      const checked = line.startsWith("- [x]");
      const text = formatInline(line.slice(6));
      listItems.push(
        `<li class="task-list-item"><span class="task-checkbox" aria-hidden="true">${checked ? "☑" : "☐"}</span>${text}</li>`,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      listItems.push(`<li>${formatInline(line.slice(2))}</li>`);
      continue;
    }

    if (/^@@CODE_BLOCK_\d+@@$/.test(line.trim())) {
      flushList();
      html.push(line.trim());
      continue;
    }

    flushList();
    html.push(`<p>${formatInline(line)}</p>`);
  }

  flushList();

  return html
    .join("\n")
    .replace(/@@CODE_BLOCK_(\d+)@@/g, (_match, index: string) => {
      return codeBlocks[Number(index)] ?? "";
    });
}
