// ==========================================================================
// NELC // SIGNAL ROOM — Interactive Studio Application Logic
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadReadmeContent();
});

// Tab Navigation Logic
function initTabs() {
  const buttons = document.querySelectorAll('.nav-btn[data-tab]');
  const views = document.querySelectorAll('.tab-view');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      buttons.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // Top Copy Button
  document.getElementById('copy-markdown-top')?.addEventListener('click', copyFullMarkdown);
  document.getElementById('copy-markdown-source-btn')?.addEventListener('click', copyFullMarkdown);
}

let rawReadme = '';

// Load README.md content dynamically
async function loadReadmeContent() {
  try {
    const res = await fetch('./README.md');
    if (!res.ok) throw new Error('Failed to fetch README.md');
    rawReadme = await res.text();

    // Set raw markdown text
    const rawBox = document.getElementById('raw-markdown-text');
    if (rawBox) rawBox.textContent = rawReadme;

    // Render markdown preview
    const renderBox = document.getElementById('markdown-rendered-content');
    if (renderBox) renderBox.innerHTML = parseMarkdownToHTML(rawReadme);

  } catch (err) {
    console.error('Error loading README:', err);
    document.getElementById('markdown-rendered-content').innerHTML = `
      <div style="color: #F26A2E; font-family: monospace; padding: 2rem;">
        ERROR: Could not load README.md directly via HTTP protocol. 
        <br/><br/>
        Please ensure a local web server (e.g. <code>npx serve</code> or Python <code>http.server</code>) is running.
      </div>
    `;
  }
}

// Light-weight custom Markdown to HTML parser tailored for GitHub profile preview
function parseMarkdownToHTML(md) {
  let html = md;

  // Escape basic HTML comment wrappers
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // Convert SVG img tags with relative paths
  html = html.replace(/<img\s+src="\.\/assets\/([^"]+)"([^>]*)>/g, '<img src="./assets/$1" $2 style="max-width:100%; height:auto; margin: 1rem 0; border-radius:6px;" />');

  // Convert markdown images ![alt](./assets/...)
  html = html.replace(/!\[([^\]]*)\]\(\.\/assets\/([^)]+)\)/g, '<img src="./assets/$2" alt="$1" style="max-width:100%; height:auto; margin: 1rem 0; border-radius:6px;" />');

  // Headers
  html = html.replace(/^### `\/\/ (.*)`/gm, '<h3 style="font-family: var(--font-mono); color: var(--color-teal); letter-spacing: 2px; margin-top: 1.5rem;">// $1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2 style="font-family: var(--font-mono); color: var(--color-ivory); border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem; margin-top: 2rem;">$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1 style="font-family: var(--font-mono); color: var(--color-ivory); margin-top: 1rem;">$1</h1>');

  // Blockquotes
  html = html.replace(/^>\s*(.*)$/gm, '<blockquote style="border-left: 3px solid var(--color-teal); background: rgba(24, 199, 181, 0.05); padding: 12px 18px; margin: 1rem 0; color: var(--color-ivory); font-style: italic; font-size: 1.05rem;">$1</blockquote>');

  // Code blocks ```...```
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre style="background: #080C0B; border: 1px solid rgba(24, 199, 181, 0.2); border-radius: 6px; padding: 1rem; font-family: var(--font-mono); font-size: 0.85rem; color: #18C7B5; overflow-x: auto; margin: 1rem 0;"><code>${escapeHTML(code.trim())}</code></pre>`;
  });

  // Inline code `...`
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(24, 199, 181, 0.1); color: var(--color-teal); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85rem;">$1</code>');

  // Bold **...**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: var(--color-ivory);">$1</strong>');
  
  // Italic *...*
  html = html.replace(/\*([^*]+)\*/g, '<em style="color: var(--color-slate);">$1</em>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid var(--color-border-subtle); margin: 2rem 0;" />');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--color-teal); text-decoration: none; border-bottom: 1px stroke var(--color-teal);">$1</a>');

  return html;
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Copy full README.md markdown
function copyFullMarkdown() {
  if (!rawReadme) {
    showToast('README content loading...');
    return;
  }
  navigator.clipboard.writeText(rawReadme).then(() => {
    showToast('✓ Full README.md copied to clipboard!');
  }).catch(err => {
    console.error('Clipboard error:', err);
    showToast('Failed to copy. Please select manually.');
  });
}

// Copy SVG asset raw code
async function copyAssetCode(assetKey) {
  const assetPaths = {
    hero: './assets/nelc-signal-hero.svg',
    manifest: './assets/manifest-card.svg',
    domain: './assets/domain-cards.svg',
    field: './assets/signal-field.svg',
    badge: './assets/status-badge.svg'
  };

  const path = assetPaths[assetKey];
  if (!path) return;

  try {
    const res = await fetch(path);
    const code = await res.text();
    await navigator.clipboard.writeText(code);
    showToast(`✓ SVG code for [${assetKey}] copied to clipboard!`);
  } catch (err) {
    showToast(`Failed to copy SVG asset.`);
  }
}

// Toast notification helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
