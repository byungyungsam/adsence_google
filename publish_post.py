import os
import re
import shutil
from datetime import datetime

# 프로젝트 절대경로 설정
project_dir = os.path.dirname(os.path.abspath(__file__))
drafts_dir = os.path.join(project_dir, "drafts")
blog_dir = os.path.join(project_dir, "blog")
index_path = os.path.join(project_dir, "index.html")
sitemap_path = os.path.join(project_dir, "sitemap.xml")

def get_next_draft():
    """drafts 폴더에서 발행할 가장 번호가 빠른 html 파일을 반환합니다."""
    if not os.path.exists(drafts_dir):
        return None
    
    draft_files = [f for f in os.listdir(drafts_dir) if f.startswith("post-") and f.endswith(".html")]
    if not draft_files:
        return None
    
    # post-12.html 등 파일 이름에서 숫자를 추출하여 정렬
    def extract_num(filename):
        match = re.search(r"post-(\d+)\.html", filename)
        return int(match.group(1)) if match else 999
        
    draft_files.sort(key=extract_num)
    return draft_files[0]

def get_post_title(file_path):
    """HTML 파일에서 h1 태그 내의 제목을 추출합니다."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # <h1> 태그 안의 텍스트 추출
    match = re.search(r"<h1>(.*?)</h1>", content, re.DOTALL)
    if match:
        title = match.group(1).strip()
        # 내부 태그나 줄바꿈 제거
        title = re.sub(r"<.*?>", "", title)
        return title
    return "새로운 포스트"

def update_index_html(post_num, post_title):
    """index.html의 적절한 컬럼 목록에 새 글의 링크를 추가합니다."""
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 열 선택 규칙: 12~16번은 2번 열, 17~21번은 3번 열
    col_num = 2 if post_num <= 16 else 3
    marker_end = f"<!-- [COL_{col_num}_LIST_END] -->"
    
    # 추가할 새 링크 코드
    new_link = f'                        <a href="blog/post-{post_num}.html" style="font-size: 0.95rem; color: var(--text-muted);" onmouseover="this.style.color=\'var(--secondary)\'" onmouseout="this.style.color=\'var(--text-muted)\'">📄 {post_num}. {post_title}</a>\n'
    
    # 마커 바로 앞에 새 링크를 삽입
    target_str = f"{new_link}{marker_end}"
    if marker_end in content:
        new_content = content.replace(marker_end, target_str)
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"index.html: post-{post_num} 링크 추가 완료 (Column {col_num})")
    else:
        print(f"Error: index.html에서 마커 {marker_end}를 찾을 수 없습니다.")

def update_sitemap_xml(post_num):
    """sitemap.xml에 새 포스트 주소를 추가합니다."""
    with open(sitemap_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    today_str = datetime.today().strftime('%Y-%m-%d')
    new_url_node = f"""  <url>
    <loc>https://adsencegoogle-5.vercel.app/blog/post-{post_num}.html</loc>
    <lastmod>{today_str}</lastmod>
    <priority>0.80</priority>
  </url>
</urlset>"""
    
    # </urlset> 바로 앞 공간에 새 url 노드를 덮어쓰기 치환
    if "</urlset>" in content:
        new_content = content.replace("</urlset>", new_url_node)
        with open(sitemap_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"sitemap.xml: post-{post_num} 주소 등록 완료")
    else:
        print("Error: sitemap.xml에서 </urlset> 종결 태그를 찾지 못했습니다.")

def update_post_publish_date(file_path):
    """post 파일의 '예약 발행일' 메타 텍스트를 오늘 날짜로 갱신합니다."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    today_korean = datetime.today().strftime('%Y년 %m월 %d일')
    target = "<span>작성일자: 예약 발행일</span>"
    replacement = f"<span>작성일자: {today_korean}</span>"
    
    if target in content:
        new_content = content.replace(target, replacement)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"post-{os.path.basename(file_path)}: 작성일자 업데이트 완료")

def main():
    next_draft = get_next_draft()
    if not next_draft:
        print("발행 대기 중인 글(draft)이 없습니다. 프로세스를 종료합니다.")
        return
    
    # 포스트 번호 추출 (예: post-12.html -> 12)
    match = re.search(r"post-(\d+)\.html", next_draft)
    if not match:
        print(f"올바르지 않은 파일명 형식입니다: {next_draft}")
        return
        
    post_num = int(match.group(1))
    draft_file_path = os.path.join(drafts_dir, next_draft)
    dest_file_path = os.path.join(blog_dir, next_draft)
    
    # 1. drafts에서 blog 폴더로 이동 (복사 후 drafts 원본 삭제)
    shutil.copy(draft_file_path, dest_file_path)
    os.remove(draft_file_path)
    print(f"성공: {next_draft} 파일을 blog/ 폴더로 복사 및 drafts/ 에서 제거 완료.")
    
    # 2. post 파일 내의 발행일을 오늘 날짜로 갱신
    update_post_publish_date(dest_file_path)
    
    # 3. post의 h1 제목 읽기
    post_title = get_post_title(dest_file_path)
    
    # 4. index.html의 아카이브 목록 업데이트
    update_index_html(post_num, post_title)
    
    # 5. sitemap.xml 업데이트
    update_sitemap_xml(post_num)
    
    print(f"🎉 12번~21번 예약 발행 시스템: {next_draft} ({post_title}) 최종 발행 프로세스 완료.")

if __name__ == "__main__":
    main()
