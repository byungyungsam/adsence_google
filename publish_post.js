const fs = require('fs');
const path = require('path');

// 프로젝트 절대경로 설정
const projectDir = __dirname;
const draftsDir = path.join(projectDir, "drafts");
const blogDir = path.join(projectDir, "blog");
const indexClassPath = path.join(projectDir, "index.html");
const sitemapPath = path.join(projectDir, "sitemap.xml");

function getNextDraft() {
    if (!fs.existsSync(draftsDir)) {
        return null;
    }
    
    const files = fs.readdirSync(draftsDir);
    const draftFiles = files.filter(f => f.startsWith("post-") && f.endsWith(".html"));
    
    if (draftFiles.length === 0) {
        return null;
    }
    
    // post-12.html 등 파일 이름에서 숫자를 추출하여 정렬
    const extractNum = (filename) => {
        const match = filename.match(/post-(\d+)\.html/);
        return match ? parseInt(match[1], 10) : 999;
    };
    
    draftFiles.sort((a, b) => extractNum(a) - extractNum(b));
    return draftFiles[0];
}

function getPostTitle(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/<h1>([\s\S]*?)<\/h1>/);
    if (match) {
        let title = match[1].trim();
        // 내부 태그나 줄바꿈 제거
        title = title.replace(/<.*?>/g, "").replace(/\r?\n|\r/g, " ");
        return title;
    }
    return "새로운 포스트";
}

function updateIndexHtml(postNum, postTitle) {
    let content = fs.readFileSync(indexClassPath, "utf-8");
    
    // 열 선택 규칙: 12~16번은 2번 열, 17~21번은 3번 열
    const colNum = postNum <= 16 ? 2 : 3;
    const markerEnd = `<!-- [COL_${colNum}_LIST_END] -->`;
    
    // 추가할 새 링크 코드
    const newLink = `                        <a href="blog/post-${postNum}.html" style="font-size: 0.95rem; color: var(--text-muted);" onmouseover="this.style.color='var(--secondary)'" onmouseout="this.style.color='var(--text-muted)'">📄 ${postNum}. ${postTitle}</a>\n`;
    
    // 마커 바로 앞에 새 링크를 삽입
    const targetStr = `${newLink}${markerEnd}`;
    if (content.includes(markerEnd)) {
        const newContent = content.replace(markerEnd, targetStr);
        fs.writeFileSync(indexClassPath, newContent, "utf-8");
        console.log(`index.html: post-${postNum} 링크 추가 완료 (Column {colNum})`);
    } else {
        console.error(`Error: index.html에서 마커 ${markerEnd}를 찾을 수 없습니다.`);
    }
}

function updateSitemapXml(postNum) {
    let content = fs.readFileSync(sitemapPath, "utf-8");
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    const newUrlNode = `  <url>
    <loc>https://adsencegoogle-5.vercel.app/blog/post-${postNum}.html</loc>
    <lastmod>${todayStr}</lastmod>
    <priority>0.80</priority>
  </url>
</urlset>`;
    
    // </urlset> 바로 앞 공간에 새 url 노드를 덮어쓰기 치환
    if (content.includes("</urlset>")) {
        const newContent = content.replace("</urlset>", newUrlNode);
        fs.writeFileSync(sitemapPath, newContent, "utf-8");
        console.log(`sitemap.xml: post-${postNum} 주소 등록 완료`);
    } else {
        console.error("Error: sitemap.xml에서 </urlset> 종결 태그를 찾지 못했습니다.");
    }
}

function updatePostPublishDate(filePath) {
    let content = fs.readFileSync(filePath, "utf-8");
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const todayKorean = `${year}년 ${month}월 ${day}일`;
    
    const target = "<span>작성일자: 예약 발행일</span>";
    const replacement = `<span>작성일자: ${todayKorean}</span>`;
    
    if (content.includes(target)) {
        const newContent = content.replace(target, replacement);
        fs.writeFileSync(filePath, newContent, "utf-8");
        console.log(`post-${path.basename(filePath)}: 작성일자 업데이트 완료`);
    } else {
        // 이미 갱신되었거나 해당 문구가 없을 경우 조용히 넘어감
        console.log(`post-${path.basename(filePath)}: 작성일자 태그가 생략되었거나 이미 갱신되었습니다.`);
    }
}

function main() {
    const nextDraft = getNextDraft();
    if (!nextDraft) {
        console.log("발행 대기 중인 글(draft)이 없습니다. 프로세스를 종료합니다.");
        return;
    }
    
    // 포스트 번호 추출 (예: post-12.html -> 12)
    const match = nextDraft.match(/post-(\d+)\.html/);
    if (!match) {
        console.log(`올바르지 않은 파일명 형식입니다: ${nextDraft}`);
        return;
    }
        
    const postNum = parseInt(match[1], 10);
    const draftFilePath = path.join(draftsDir, nextDraft);
    const destFilePath = path.join(blogDir, nextDraft);
    
    // 1. blog 폴더 생성 확인
    if (!fs.existsSync(blogDir)) {
        fs.mkdirSync(blogDir, { recursive: true });
    }
    
    // 2. drafts에서 blog 폴더로 이동 (복사 후 drafts 원본 삭제)
    fs.copyFileSync(draftFilePath, destFilePath);
    fs.unlinkSync(draftFilePath);
    console.log(`성공: ${nextDraft} 파일을 blog/ 폴더로 복사 및 drafts/ 에서 제거 완료.`);
    
    // 3. post 파일 내의 발행일을 오늘 날짜로 갱신
    updatePostPublishDate(destFilePath);
    
    // 4. post의 h1 제목 읽기
    const postTitle = getPostTitle(destFilePath);
    
    // 5. index.html의 아카이브 목록 업데이트
    updateIndexHtml(postNum, postTitle);
    
    // 6. sitemap.xml 업데이트
    updateSitemapXml(postNum);
    
    console.log(`\n🎉 12번~21번 예약 발행 시스템: ${nextDraft} (${postTitle}) 최종 발행 프로세스 완료.`);
}

main();
