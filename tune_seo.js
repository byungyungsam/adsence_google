const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const blogDir = path.join(rootDir, 'blog');

const descriptionUpdates = {
    "blog/post-5.html": "자신이 과거에 작성한 과제나 학술 자료를 적절한 인용 없이 다시 재사용하여 발생하는 자기표절(Self-Plagiarism)의 정의와 대학 학칙별 조치 사례를 알아봅니다.",
    "blog/post-6.html": "학술 논문 및 연구 자료를 간접적으로 전해 들어 인용하는 2차 문헌 인용(Secondary Citation)의 위험성과 원전을 찾아 직접 검증해야 하는 3가지 핵심 이유를 알아봅니다.",
    "blog/post-12.html": "학업 및 연구 과정에서 무심코 발생하기 쉬운 자기 표절(Self-Plagiarism)의 구체적인 예방 가이드와 올바른 선행 연구 재사용 규칙을 다룹니다."
};

function tuneFile(filePath) {
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Description 업데이트 대상인지 확인 및 적용
    // Backreference \2를 사용하여 쌍따옴표/홑따옴표 짝을 정확히 매칭 및 치환
    if (descriptionUpdates[relativePath]) {
        const newDesc = descriptionUpdates[relativePath];
        const descRegex = /(<meta\s+name=["']description["']\s+content=(["']))([\s\S]*?)\2/i;
        if (descRegex.test(content)) {
            content = content.replace(descRegex, `$1${newDesc}$2`);
            console.log(`Updated meta description for: ${relativePath}`);
        }
    }

    // 2. Title 및 Description, Canonical URL 추출
    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : 'VerifyAI';

    // Backreference \1을 사용하여 정확한 description 속성값 추출 (그룹 2가 매칭 내용)
    const descMatch = content.match(/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i);
    const description = descMatch ? descMatch[2].trim() : '';

    const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=(["'])([\s\S]*?)\1/i);
    const canonicalUrl = canonicalMatch ? canonicalMatch[2].trim() : `https://adsencegoogle-5.vercel.app/${relativePath}`;

    // 3. 대표 이미지 결정
    let imageUrl = 'https://adsencegoogle-5.vercel.app/images/logo-og.png'; // 기본 대표 이미지
    const postMatch = relativePath.match(/post-(\d+)\.html/);
    if (postMatch) {
        const postNum = postMatch[1];
        const localImgPath = path.join(rootDir, 'images', `post-${postNum}.png`);
        if (fs.existsSync(localImgPath)) {
            imageUrl = `https://adsencegoogle-5.vercel.app/images/post-${postNum}.png`;
        }
    }

    // 4. Open Graph 태그 블록 생성
    const ogBlock = `    <!-- Open Graph Tags (SNS 공유 최적화) -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="${relativePath.startsWith('blog/') ? 'article' : 'website'}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${imageUrl}">`;

    // 5. 기존 OG 태그 블록이 존재하면 제거 (중복 방지)
    const existingOgRegex = /<!-- Open Graph Tags [\s\S]*?-->[\s\S]*?<meta property=["']og:[\s\S]*?>\r?\n?/gi;
    const individualOgRegex = /<meta property=["']og:[^>]*>\r?\n?/gi;
    
    content = content.replace(existingOgRegex, '');
    content = content.replace(individualOgRegex, '');

    // 6. </head> 바로 직전 또는 stylesheet link 아래에 OG 태그 삽입
    const headEnd = '</head>';
    if (content.includes(headEnd)) {
        content = content.replace(headEnd, `\n${ogBlock}\n</head>`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Successfully injected Open Graph tags into: ${relativePath}`);
    } else {
        console.error(`Error: Could not find </head> tag in ${relativePath}`);
    }
}

// 대상 메인 서브 HTML 파일들
const mainSubFiles = ['privacy.html', 'terms.html', 'about.html'];
mainSubFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
        tuneFile(fullPath);
    }
});

// 블로그 포스트 HTML 파일들
if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir);
    files.forEach(file => {
        if (file.endsWith('.html') && file.startsWith('post-')) {
            tuneFile(path.join(blogDir, file));
        }
    });
}

console.log('SEO Tuning completed successfully!');
