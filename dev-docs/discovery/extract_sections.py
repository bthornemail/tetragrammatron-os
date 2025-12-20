#!/usr/bin/env python3
"""
Extract and organize sections from the discovery document.
"""
import re
import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def extract_section(content, start_line, end_line):
    """Extract lines from start_line to end_line (0-indexed)."""
    lines = content.split('\n')
    if end_line > len(lines):
        end_line = len(lines)
    return '\n'.join(lines[start_line:end_line])

def find_sections(content):
    """Find all top-level sections (# ) and their line numbers."""
    lines = content.split('\n')
    sections = []
    current = None
    
    for i, line in enumerate(lines):
        if line.startswith('# ') and not line.startswith('##'):
            if current:
                sections.append({
                    'title': current['title'],
                    'start': current['start'],
                    'end': i,
                    'line_num': current['start'] + 1
                })
            current = {
                'title': line[2:].strip(),
                'start': i
            }
    
    if current:
        sections.append({
            'title': current['title'],
            'start': current['start'],
            'end': len(lines),
            'line_num': current['start'] + 1
        })
    
    return sections

def categorize_section(title, content_snippet):
    """Categorize a section based on title and content."""
    title_lower = title.lower()
    snippet_lower = content_snippet.lower()
    
    # Mathematics
    if any(kw in title_lower for kw in ['sphere', 'ball', 'topology', 'geometric', 'platonic', 'e8', 'leech', 'hopf']):
        return 'mathematics'
    
    # RFCs
    if 'rfc' in title_lower or 'request for comments' in title_lower:
        return 'rfcs'
    
    # Implementations
    if any(kw in snippet_lower for kw in ['```scheme', '```coq', '```lean', '```python', '```c', 'implementation', 'code']):
        if 'proof' not in title_lower and 'theorem' not in title_lower:
            return 'implementations'
    
    # Proofs
    if any(kw in title_lower for kw in ['proof', 'theorem', 'lean', 'coq', 'formal', 'verification']):
        return 'proofs'
    
    # CI/CD
    if any(kw in title_lower for kw in ['ci', 'github actions', 'workflow', 'pipeline', 'build']):
        return 'ci'
    
    # Visualization
    if any(kw in title_lower for kw in ['visualization', 'visual', 'svg', 'render', 'geometry']):
        return 'visualization'
    
    # Specifications
    if any(kw in title_lower for kw in ['spec', 'specification', 'standard', 'normative', 'canonical']):
        return 'specifications'
    
    return 'mathematics'  # Default

def sanitize_filename(title):
    """Convert title to safe filename."""
    # Remove emojis and special chars
    title = re.sub(r'[^\w\s-]', '', title)
    # Replace spaces with dashes
    title = re.sub(r'\s+', '-', title)
    # Limit length
    if len(title) > 100:
        title = title[:100]
    return title.lower()

def main():
    input_file = '/workspace/dev-docs/_tetragrammatron-os-discovery.md'
    base_dir = '/workspace/dev-docs/discovery'
    
    print(f"Reading {input_file}...")
    content = read_file(input_file)
    
    print("Finding sections...")
    sections = find_sections(content)
    print(f"Found {len(sections)} sections")
    
    # Extract frontmatter
    frontmatter_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if frontmatter_match:
        frontmatter = frontmatter_match.group(0)
    else:
        frontmatter = ''
    
    # Process sections
    index_entries = []
    
    for i, sec in enumerate(sections):
        # Get content snippet for categorization
        snippet = extract_section(content, sec['start'], min(sec['start'] + 50, sec['end']))
        
        category = categorize_section(sec['title'], snippet)
        filename = sanitize_filename(sec['title'])
        
        # Extract full section content
        section_content = extract_section(content, sec['start'], sec['end'])
        
        # Add frontmatter if this is the first section
        if i == 0 and frontmatter:
            section_content = frontmatter + '\n' + section_content
        
        # Write to file
        output_path = f"{base_dir}/{category}/{filename}.md"
        write_file(output_path, section_content)
        
        index_entries.append({
            'title': sec['title'],
            'category': category,
            'filename': filename,
            'line': sec['line_num']
        })
        
        if (i + 1) % 10 == 0:
            print(f"Processed {i + 1}/{len(sections)} sections...")
    
    # Create index
    index_content = "# Discovery Document Index\n\n"
    index_content += f"Total sections: {len(sections)}\n\n"
    
    for category in ['mathematics', 'rfcs', 'implementations', 'proofs', 'ci', 'visualization', 'specifications']:
        category_entries = [e for e in index_entries if e['category'] == category]
        if category_entries:
            index_content += f"## {category.title()}\n\n"
            for entry in category_entries:
                index_content += f"- [{entry['title']}]({category}/{entry['filename']}.md) (line {entry['line']})\n"
            index_content += "\n"
    
    write_file(f"{base_dir}/INDEX.md", index_content)
    print(f"\nDone! Processed {len(sections)} sections.")
    print(f"Index written to {base_dir}/INDEX.md")

if __name__ == '__main__':
    main()
