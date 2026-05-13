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

def decrease_font(match):
    size = int(match.group(1))
    # reduce by 1px for smaller fonts, maybe 2px for larger fonts
    if size > 20:
        new_size = size - 2
    elif size > 10:
        new_size = size - 1
    else:
        new_size = size # don't go below 10px usually
    
    # If it goes too small, keep it at 9px
    if new_size < 9:
        new_size = 9

    return f"font-size:{new_size}px"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match font-size:14px, font-size: 14px
    content, count1 = re.subn(r'font-size:\s*(\d+)px', decrease_font, content)
    
    # Inline styles: fontSize:14 or fontSize: 14
    def decrease_inline(match):
        size = int(match.group(1))
        if size > 20: new_size = size - 2
        elif size > 10: new_size = size - 1
        else: new_size = size
        if new_size < 9: new_size = 9
        return f"fontSize:{new_size}"
        
    content, count2 = re.subn(r'fontSize:\s*(\d+)(?!px)', decrease_inline, content)

    if count1 > 0 or count2 > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}: {count1} CSS, {count2} inline")

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                if file.endswith(".tsx") or file.endswith(".ts"):
                    process_file(os.path.join(root, file))

print("Done")
