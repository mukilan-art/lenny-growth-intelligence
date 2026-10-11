from typing import Optional, List, Dict, Any

def build_grounded_fallback_response(
    query: str,
    targeted_person: Optional[str],
    topic: str,
    direct_chunks: list,
    other_chunks: list,
    error_msg: Optional[str] = None
) -> str:
    sections = []
    
    if error_msg:
        sections.append(f"> [!NOTE]\n> **Model Offline Notice**: LLM inference is currently unavailable ({error_msg}). Generating grounded evidence synthesis directly from the archive.\n")

    if targeted_person:
        if not direct_chunks:
            sections.append(f"I couldn't find direct evidence of {targeted_person} discussing {topic} in the available sources.")
            if other_chunks:
                sections.append("\n### Related evidence from other speakers\n")
                sections.append(f"While {targeted_person} is not directly cited on this topic in the archive, here is relevant evidence from other operators:\n")
                for i, c in enumerate(other_chunks):
                    sections.append(
                        f"**{c.get('speaker', 'Guest')}** ({c.get('title')} - `{c.get('timestamp', '00:00')}`):\n"
                        f"> \"{c.get('excerpt', '')}\"\n"
                    )
            sections.append("\n*Would you like to broaden the search to related topics or other operators across the transcript archive?*")
        else:
            sections.append(f"### Direct Evidence from {targeted_person}\n")
            for c in direct_chunks:
                sections.append(
                    f"**{targeted_person}** in *\"{c.get('title')}\"* (Timestamp: `{c.get('timestamp', '00:00')}`):\n"
                    f"> \"{c.get('excerpt', '')}\"\n"
                )
            if other_chunks:
                sections.append("\n### Related evidence from other speakers\n")
                for c in other_chunks:
                    sections.append(
                        f"- **{c.get('speaker', 'Operator')}** (*\"{c.get('title')}\"*): {c.get('excerpt', '')[:180]}...\n"
                    )
    else:
        # General query
        if not direct_chunks:
            sections.append(f"I couldn't find direct evidence answering \"{query}\" in the available sources.\n\n*Would you like to broaden the search to explore adjacent growth frameworks?*")
        else:
            sections.append("### Retrieved Evidence from the Archive\n")
            for c in direct_chunks:
                sections.append(
                    f"**{c.get('speaker', 'Operator')}** in *\"{c.get('title')}\"* (Timestamp: `{c.get('timestamp', '00:00')}`):\n"
                    f"> \"{c.get('excerpt', '')}\"\n"
                )

    return "\n".join(sections)
