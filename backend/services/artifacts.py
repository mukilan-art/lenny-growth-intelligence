import re
from typing import Dict, Any
from backend.services.models import ModelProviderService

ARTIFACT_PROMPT_TEMPLATE = """
You are an expert product designer and technical architect.
Convert the following product research or strategy answer into an interactive, beautifully styled HTML/CSS artifact or a structured Markdown document.

CRITICAL SECURITY AND DESIGN RULES:
1. Return ONLY valid, self-contained HTML/CSS inside a `<!DOCTYPE html><html>...</html>` block (if HTML is requested) or clean Markdown.
2. If HTML is requested:
   - Use clean, modern inline CSS or `<style>` tags with an editorial aesthetic: warm ivory (#FDFBF7), deep ink text (#1B2533), violet accents (#6366F1), elegant typography, clean card borders, badges, and tables.
   - Do NOT include any external tracking scripts, privileged cookies, or attempts to access `window.parent` or `localStorage`.
   - The artifact will be displayed inside a secure sandboxed iframe (`sandbox="allow-scripts"`).
   - CRITICAL IMAGE RULE: DO NOT use <img> tags with made-up, local, or broken image URLs (such as "framework-diagram.png", "diagram.jpg", etc.). Instead, render all diagrams, steps, and visual workflows using pure CSS boxes, flowchart cards, inline SVG icons/diagrams, and stylized table scorecards!
3. Focus on clarity: use visual scorecards, comparative tables, executive summary callouts, and step-by-step framework diagrams built with CSS cards.

CONTENT TO TRANSFORM:
{content}

FORMAT REQUESTED: {format_type}
"""

def clean_broken_images(html_str: str) -> str:
    """
    Scans HTML for <img> tags. If src is a placeholder, relative file, or missing image,
    transforms it into a styled CSS visual card or safe fallback container.
    """
    # Replace img tags that have relative or placeholder sources with clean CSS diagrams
    def img_replacer(match):
        alt = re.search(r'alt=["\']([^"\']*)["\']', match.group(0), re.IGNORECASE)
        alt_text = alt.group(1) if alt else "Visual Framework Workflow"
        return f"""
        <div style="background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 1.5rem; text-align: center; margin: 1rem 0;">
            <div style="display: inline-block; background: #EEF2FF; color: #6366F1; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">
                Visual Strategy Diagram
            </div>
            <div style="font-weight: 600; color: #1E293B; font-size: 0.95rem;">{alt_text}</div>
            <p style="color: #64748B; font-size: 0.825rem; margin-top: 0.25rem; margin-bottom: 0;">Interactive process flow rendered cleanly without external image dependencies.</p>
        </div>
        """
    # Look for img tags with relative paths, .png, .jpg, .svg, etc.
    cleaned = re.sub(r'<img\s+[^>]*src=["\'](?!https?://)[^"\']*["\'][^>]*>', img_replacer, html_str, flags=re.IGNORECASE)
    # Also add onerror handler to any remaining external img tags to prevent broken image icon
    fallback_script = """
    <script>
    document.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll("img").forEach(function(img) {
            img.onerror = function() {
                var container = document.createElement("div");
                container.style.cssText = "background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 1.25rem; text-align: center; margin: 1rem 0; font-family: sans-serif;";
                container.innerHTML = '<div style=\"color: #6366F1; font-weight: 600; font-size: 0.85rem;\">Visual Workflow</div><div style=\"color: #64748B; font-size: 0.8rem; margin-top: 0.25rem;\">' + (img.alt || 'Diagram') + '</div>';
                img.parentNode.replaceChild(container, img);
            };
        });
    });
    </script>
    """
    if "</body>" in cleaned:
        cleaned = cleaned.replace("</body>", f"{fallback_script}\n</body>")
    else:
        cleaned += fallback_script
    return cleaned

class ArtifactService:
    @staticmethod
    async def generate_artifact(content: str, format_type: str = "html", provider: str = None, model: str = None) -> str:
        prompt = ARTIFACT_PROMPT_TEMPLATE.format(content=content, format_type=format_type)
        system_prompt = "You are an expert artifact generator producing safe, standalone HTML/CSS components and Markdown docs."
        
        try:
            raw_output = await ModelProviderService.generate_completion(prompt, system_prompt, provider=provider, model=model)
        except Exception as e:
            # High-fidelity fallback rendering when local model provider is offline
            if format_type == "html":
                return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Product Strategy Brief</title>
<style>
  :root {{
    --bg: #FDFBF7;
    --text: #1B2533;
    --card: #FFFFFF;
    --accent: #6366F1;
    --border: #E2E8F0;
    --muted: #64748B;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 2rem;
    line-height: 1.6;
  }}
  .artifact-container {{
    max-width: 800px;
    margin: 0 auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  }}
  .badge {{
    display: inline-block;
    background: #EEF2FF;
    color: var(--accent);
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.825rem;
    font-weight: 600;
    margin-bottom: 1rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }}
  h1 {{
    font-size: 1.75rem;
    margin-top: 0;
    color: #0F172A;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.75rem;
  }}
  .content-body {{
    font-size: 1.05rem;
    color: #334155;
    margin-top: 1.5rem;
  }}
  .notice {{
    background: #F8FAFC;
    border-left: 4px solid var(--accent);
    padding: 1rem 1.25rem;
    margin: 1.5rem 0;
    font-size: 0.95rem;
    color: var(--muted);
  }}
</style>
</head>
<body>
<div class="artifact-container">
  <span class="badge">Strategy Framework Artifact</span>
  <h1>Executive Synthesis</h1>
  <div class="content-body">
    <p>{content}</p>
  </div>
  <div class="notice">
    <strong>Security Sandbox</strong>: Rendered in isolated context with restricted script execution.
  </div>
</div>
</body>
</html>"""
            else:
                return f"# Executive Synthesis\n\n{content}\n\n*Generated by Lenny Growth Intelligence*"
        
        if format_type == "html":
            html_match = re.search(r'```(?:html)?\s*(<!DOCTYPE.*?</html>)\s*```', raw_output, re.DOTALL | re.IGNORECASE)
            if html_match:
                extracted = html_match.group(1).strip()
            elif "<!DOCTYPE" in raw_output or "<html" in raw_output:
                extracted = raw_output.strip()
            else:
                extracted = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FDFBF7; color: #1B2533; padding: 2rem; line-height: 1.6; }}
h1, h2, h3 {{ color: #0F172A; }}
.card {{ background: #ffffff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
</style>
</head>
<body>
<div class="card">
{raw_output}
</div>
</body>
</html>"""
            return clean_broken_images(extracted)

        return raw_output
