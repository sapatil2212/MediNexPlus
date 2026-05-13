import os
import glob
import re

base_dir = r"e:\Full Stack Projects\Hospital Management System\healthcare-landing\src\app\treatments"

hero_files = glob.glob(os.path.join(base_dir, "**", "*Hero.tsx"), recursive=True)

for file_path in hero_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_content = content
    
    content = re.sub(r'\s*\{/\* Floating Card: Doctors \*/\}.*?</motion\.div>', '', content, flags=re.DOTALL)
    
    # Also catch other floating cards that might not have the comment but use doctorsCard
    content = re.sub(r'<motion\.div[^>]*className=\{[^}]*doctorsCard[^}]*\}[^>]*>.*?</motion\.div>', '', content, flags=re.DOTALL)
    
    def replace_image(match):
        img_tag = match.group(0)
        img_tag = re.sub(r'width=\{[0-9]+\}', 'width={480}', img_tag)
        img_tag = re.sub(r'height=\{[0-9]+\}', 'height={530}', img_tag)
        return img_tag
        
    content = re.sub(r'<Image[^>]+className=\{styles\.heroImage\}[^>]*/>', replace_image, content, flags=re.DOTALL)
    
    content = re.sub(r'<div className=\{styles\.satisfiedCount\}>.*?</div>', '<div className={styles.satisfiedCount}>9K+</div>', content)
    
    if content != original_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {file_path}")
