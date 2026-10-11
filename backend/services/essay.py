from typing import List, Dict, Any
from backend.services.models import ModelProviderService

SHIP_30_PROMPT_TEMPLATE = """
You are an elite product and growth strategy writer who specializes in the Ship 30 for 30 digital writing framework.
Your task is to write a compelling, comprehensive ~1,250-word Atomic Essay on the topic below, strictly grounded in the provided evidence from Lenny's Podcast transcripts.

Writing Rules:
1. Compelling Opening Hook: Start with a bold 1-2 sentence hook that highlights an unexpected truth, problem, or counter-intuitive insight.
2. Structure & Narrative Arc: Use clear subheadings (e.g., The Core Problem, The Counter-Intuitive Shift, The Strategic Framework, Step-by-Step Implementation, Traps to Avoid).
3. Digital Formatting (Ship 30 for 30 Style):
   - Short paragraphs (1 to 3 sentences maximum).
   - Generous use of white space and bullet points.
   - Selective **bold emphasis** on high-leverage phrases.
4. Grounded in Evidence: Cite the guest speakers by name, their company/context, and exact insights from the evidence provided below.
5. Specific, Actionable Takeaways: End with a concrete checklist or playbook that product managers / founders can implement tomorrow.
6. Target Length: Approximately 1,200 - 1,400 words. Do NOT truncate early.

EVIDENCE FROM LENNY'S ARCHIVE:
{evidence_text}

TOPIC / QUESTION:
{topic}
"""

class EssayService:
    @staticmethod
    async def generate_ship30_essay(topic: str, retrieved_chunks: List[Dict[str, Any]], provider: str = None, model: str = None) -> str:
        if not retrieved_chunks:
            evidence_text = "No direct transcript matches found. Synthesize based on foundational product growth strategy while noting the archive limit."
        else:
            evidence_lines = []
            for i, c in enumerate(retrieved_chunks):
                speaker = c.get('speaker', 'Unknown')
                title = c.get('title', 'Lenny Transcript')
                timestamp = c.get('timestamp', '')
                content = c.get('excerpt', '') or c.get('full_content', '')
                evidence_lines.append(f"[{i+1}] Source: {title} | Speaker: {speaker} ({timestamp})\nExcerpt: {content}\n")
            evidence_text = "\n".join(evidence_lines)

        prompt = SHIP_30_PROMPT_TEMPLATE.format(evidence_text=evidence_text, topic=topic)
        system_prompt = "You are a master digital essayist producing high-signal, Ship 30 for 30 product strategy essays."
        
        return await ModelProviderService.generate_completion(prompt, system_prompt, provider=provider, model=model)
