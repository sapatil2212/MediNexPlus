import os
import re

directories = [
    "src/app/superadmin",
    "src/app/hospitaladmin",
    "src/app/parentdept",
    "src/app/receptionist",
    "src/app/subdept",
    "src/app/support",
    "src/app/finance",
    "src/app/doctor",
    "src/app/clinical",
    "src/app/administrative",
    "src/app/diagnostic"
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Matches <Search size={...} color="..." /> just before <input
    # e.g., <Search size={14} color="#94a3b8"/><input
    content, count1 = re.subn(r'<Search\s+size=\{\d+\}\s+color=".*?"\s*/>\s*(?=<input)', '', content)
    
    # 2. Matches <Search ... /> just before <input but with spaces
    content, count2 = re.subn(r'<Search\s+size=\{\d+\}\s+color=".*?"\s*/>(\s*)<input', r'\1<input', content)

    # 3. Matches <Search ... /> inside finance dashboard topbar
    # <div className="fin-search-wrap">
    #   <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
    #   <input
    if "finance" in filepath and "dashboard" in filepath:
        content, count3 = re.subn(r'<Search[^>]*/>\s*(?=<input)', '', content)
    else:
        count3 = 0
        
    # 4. In case the input is on the next line
    content, count4 = re.subn(r'<Search\s+size=\{\d+\}\s+color=".*?"\s*/>\s*\n\s*<input', '\n<input', content)

    total_count = count1 + count2 + count3 + count4
    if total_count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Removed search icon from {filepath}: {total_count} replacements")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                if file.endswith("layout.tsx") or file.endswith("page.tsx"):
                    process_file(os.path.join(root, file))

print("Done removing search icons")
