document.addEventListener('DOMContentLoaded', () => {
    // UI Elements Mapping
    const els = {
        tabBtns: document.querySelectorAll('.tools-tab-btn'),
        tabPanels: document.querySelectorAll('.tools-tab-panel'),
        
        // Char Counter
        charInput: document.getElementById('char-input'),
        btnClearChar: document.getElementById('btn-clear-char'),
        statCharWithSpace: document.getElementById('stat-char-with-space'),
        statCharNoSpace: document.getElementById('stat-char-no-space'),
        statSpaces: document.getElementById('stat-spaces'),
        statWords: document.getElementById('stat-words'),
        statBytes: document.getElementById('stat-bytes'),
        statReadingTime: document.getElementById('stat-reading-time'),

        // Ad Cleaner
        cleanInput: document.getElementById('clean-input'),
        cleanOutput: document.getElementById('clean-output'),
        cleanSummary: document.getElementById('clean-summary'),
        cleanDetectedCount: document.getElementById('clean-detected-count'),
        btnLoadCleanSample: document.getElementById('btn-load-clean-sample'),
        btnClearClean: document.getElementById('btn-clear-clean'),
        btnRunClean: document.getElementById('btn-run-clean'),
        btnCopyClean: document.getElementById('btn-copy-clean'),

        // Academic Search
        searchQuery: document.getElementById('search-query'),
        btnSearchRun: document.getElementById('btn-search-run'),
        searchResultsBox: document.getElementById('search-results-box'),
        searchPlaceholder: document.getElementById('search-placeholder'),

        // TOC Balancer
        tocTitle: document.getElementById('toc-title'),
        tocTargetPages: document.getElementById('toc-target-pages'),
        tocDegree: document.getElementById('toc-degree'),
        btnTocInit: document.getElementById('btn-toc-init'),
        btnTocExport: document.getElementById('btn-toc-export'),
        tocAllocatedSum: document.getElementById('toc-allocated-sum'),
        tocTargetSum: document.getElementById('toc-target-sum'),
        tocGaugeBar: document.getElementById('toc-gauge-bar'),
        tocAllocatedStatus: document.getElementById('toc-allocated-status'),
        tocChaptersContainer: document.getElementById('toc-chapters-container'),
        tocEmptyPlaceholder: document.getElementById('toc-empty-placeholder'),
        btnTocAddChapter: document.getElementById('btn-toc-add-chapter'),

        // Typing Practice
        btnTypeLangKo: document.getElementById('btn-type-lang-ko'),
        btnTypeLangEn: document.getElementById('btn-type-lang-en'),
        typeStatCpm: document.getElementById('type-stat-cpm'),
        typeStatMaxCpm: document.getElementById('type-stat-max-cpm'),
        typeStatAccuracy: document.getElementById('type-stat-accuracy'),
        typeStatProgress: document.getElementById('type-stat-progress'),
        typeTargetSentence: document.getElementById('type-target-sentence'),
        typeFeedbackLine: document.getElementById('type-feedback-line'),
        typeHiddenInput: document.getElementById('type-hidden-input'),
        btnTypeReset: document.getElementById('btn-type-reset')
    };

    // --------------------------------------------------
    // 1. Tab Swapping Logic
    // --------------------------------------------------
    els.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.tabBtns.forEach(b => b.classList.remove('active'));
            els.tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // 특수 탭 진입 시 자동 포커스 처리
            if (targetId === 'typing-practice') {
                setTimeout(() => els.typeHiddenInput.focus(), 100);
            }
        });
    });

    // --------------------------------------------------
    // 2. Character Counter Logic
    // --------------------------------------------------
    function updateCharStats() {
        const text = els.charInput.value;
        const charWithSpace = text.length;
        const charNoSpace = text.replace(/\s/g, '').length;
        const spaces = charWithSpace - charNoSpace;
        
        // Word Count
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        // UTF-8 Bytes
        const bytes = new TextEncoder().encode(text).length;

        // Reading Time (500 Korean chars per minute)
        const readingTimeSec = Math.ceil((charWithSpace / 500) * 60);
        let readingTimeStr = '약 0초';
        if (readingTimeSec >= 60) {
            readingTimeStr = `약 ${Math.floor(readingTimeSec / 60)}분 ${readingTimeSec % 60}초`;
        } else if (readingTimeSec > 0) {
            readingTimeStr = `약 ${readingTimeSec}초`;
        }

        // Apply to UI
        els.statCharWithSpace.textContent = `${charWithSpace.toLocaleString()} 자`;
        els.statCharNoSpace.textContent = `${charNoSpace.toLocaleString()} 자`;
        els.statSpaces.textContent = spaces.toLocaleString();
        els.statWords.textContent = words.toLocaleString();
        els.statBytes.textContent = `${bytes.toLocaleString()} Byte`;
        els.statReadingTime.textContent = readingTimeStr;
    }

    els.charInput.addEventListener('input', updateCharStats);
    els.btnClearChar.addEventListener('click', () => {
        els.charInput.value = '';
        updateCharStats();
    });

    // --------------------------------------------------
    // 3. Ad & AI Phrase Cleaner Logic
    // --------------------------------------------------
    const cleanPhrases = [
        // AI 상투어 및 교정 패턴
        { pattern: /결론적으로/g, replace: '결과적으로', type: 'ai', desc: '결론적으로 (AI 문맥 축약 말투 -> 객관적 표현 대체 권장)' },
        { pattern: /더 나아가/g, replace: '나아가', type: 'ai', desc: '더 나아가 (불필요한 수식어구 정리)' },
        { pattern: /말할 필요도 없이/g, replace: '명백히', type: 'ai', desc: '말할 필요도 없이 (주관적인 과장 표현 순화)' },
        { pattern: /요약하자면/g, replace: '요약하면', type: 'ai', desc: '요약하자면 (구어체적 요약 지양)' },
        { pattern: /첫째로/g, replace: '첫째,', type: 'ai', desc: '첫째로 (어색한 접속 어미 순화)' },
        { pattern: /둘째로/g, replace: '둘째,', type: 'ai', desc: '둘째로 (어색한 접속 어미 순화)' },
        { pattern: /이에 대해/g, replace: '이에', type: 'ai', desc: '이에 대해 (중복성 연결 지양)' },
        { pattern: /의심할 여지 없이/g, replace: '분명히', type: 'ai', desc: '의심할 여지 없이 (연구 주장의 불필요한 단정 표현)' },
        { pattern: /살펴볼 수 있습니다/g, replace: '관찰된다', type: 'ai', desc: '살펴볼 수 있습니다 (구어체 종결 어미 -> 학술 문어체로 교정)' },
        
        // 광고 및 홍보성 스팸 문구
        { pattern: /대박/g, replace: '우수한', type: 'ad', desc: '대박 (자극적 비속어 필터링)' },
        { pattern: /최저가/g, replace: '합리적인 가격', type: 'ad', desc: '최저가 (상업용 광고 문구 교정)' },
        { pattern: /엄선된/g, replace: '선정된', type: 'ad', desc: '엄선된 (상업적 미사여구 필터)' },
        { pattern: /비법/g, replace: '방법론', type: 'ad', desc: '비법 (비학술적 주관 용어 교정)' },
        { pattern: /완벽한/g, replace: '검증된', type: 'ad', desc: '완벽한 (과장 광고 수식어 순화)' },
        { pattern: /최고의/g, replace: '주요한', type: 'ad', desc: '최고의 (최상급 과장 수식어구 배제)' },
        { pattern: /100% 보장/g, replace: '신뢰도 높은', type: 'ad', desc: '100% 보장 (사기적 수치 과장 지양)' }
    ];

    els.btnLoadCleanSample.addEventListener('click', () => {
        els.cleanInput.value = `의심할 여지 없이 이 연구는 대박입니다. 결론적으로 우리는 최고의 인공지능 윤문 도구를 구축했으며, 더 나아가 100% 보장하는 독창적인 표절 회피율을 살펴볼 수 있습니다. 요약하자면 최저가로 이용 가능한 엄선된 비법을 지금 즉시 체험해 보실 수 있습니다.`;
    });

    els.btnClearClean.addEventListener('click', () => {
        els.cleanInput.value = '';
        els.cleanOutput.innerHTML = '정제 완료된 글이 이곳에 표시되며 필터링된 문구가 하이라이트 표시됩니다.';
        els.cleanDetectedCount.textContent = '0개';
    });

    els.btnRunClean.addEventListener('click', () => {
        let text = els.cleanInput.value;
        if (text.trim() === '') {
            alert('정제할 텍스트를 먼저 입력해 주세요.');
            return;
        }

        let detectedCount = 0;
        let highlightedText = text;

        // 하이라이트 처리용 임시 문자 치환 로직 (중복 매칭 회피)
        cleanPhrases.forEach((phrase, idx) => {
            const matches = text.match(phrase.pattern);
            if (matches) {
                detectedCount += matches.length;
                // 정제 과정에서 눈에 띄게 span 태그로 감싸 하이라이트
                const replacement = `<span class="highlight-${phrase.type}" style="background-color: ${phrase.type === 'ad' ? '#ff174450' : '#7c4dff50'}; border-bottom: 2px solid ${phrase.type === 'ad' ? 'var(--danger)' : 'var(--primary)'}; padding: 0 2px; cursor: help;" title="${phrase.desc}">${matches[0]}</span>`;
                highlightedText = highlightedText.replace(phrase.pattern, replacement);
            }
        });

        // 텍스트 출력
        els.cleanOutput.innerHTML = highlightedText;
        els.cleanDetectedCount.textContent = `${detectedCount}개`;

        // 실제 제거 및 정제 정제본 생성 (콘솔/배경 처리용)
        let cleanedText = text;
        cleanPhrases.forEach(phrase => {
            cleanedText = cleanedText.replace(phrase.pattern, phrase.replace);
        });

        // 결과 복사 시에는 완벽히 정제된(치환된) 텍스트를 사용할 수 있도록 윈도우 캐시에 보관
        els.btnCopyClean.onclick = () => {
            navigator.clipboard.writeText(cleanedText).then(() => {
                alert('순화 및 정제가 완료된 최종 학술 텍스트가 클립보드에 복사되었습니다.');
            }).catch(err => {
                console.error('복사 실패', err);
            });
        };
    });

    // --------------------------------------------------
    // 4. Academic Document Search Logic (OpenAlex & Semantic Scholar Client API)
    // --------------------------------------------------
    els.btnSearchRun.addEventListener('click', async () => {
        const query = els.searchQuery.value.trim();
        if (query === '') {
            alert('검색할 키워드를 입력해 주세요.');
            return;
        }

        els.searchResultsBox.innerHTML = `
            <div style="text-align: center; color:var(--text-muted); padding-top:4rem;">
                <span class="logo-dot" style="width:12px; height:12px; display:inline-block; animation: pulse 1.5s infinite; background-color: var(--secondary);"></span>
                <p style="margin-top:1rem;">글로벌 학술 데이터베이스를 탐색하는 중입니다...</p>
            </div>
        `;

        try {
            // OpenAlex API 직접 호출 (CORS 허용됨)
            const openAlexUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=10`;
            const response = await fetch(openAlexUrl);
            
            if (!response.ok) throw new Error('학술 데이터 수집에 실패했습니다.');
            
            const data = await response.json();
            const results = data.results || [];

            if (results.length === 0) {
                els.searchResultsBox.innerHTML = `
                    <div style="text-align: center; color:var(--text-muted); padding-top:4rem;">
                        검색 조건에 부합하는 학술 정보가 없습니다. 다른 학술 전문 키워드로 검색해 보세요.
                    </div>
                `;
                return;
            }

            let html = '';
            results.forEach((paper, idx) => {
                const title = paper.title || paper.display_name || 'No Title';
                const authors = paper.authorships?.map(a => a.author?.display_name).slice(0, 5).join(', ') || '알 수 없는 저자';
                const year = paper.publication_year || '연도 미상';
                const venue = paper.primary_location?.source?.display_name || '학술 단체 / 학술지';
                const citations = paper.cited_by_count || 0;
                const doi = paper.doi || '';
                
                // APA Style Citation text builder
                const firstAuthorLastName = paper.authorships?.[0]?.author?.display_name?.split(' ')?.pop() || '무명씨';
                const apaCitation = `${firstAuthorLastName} (${year}). ${title}. ${venue}.`;

                html += `
                    <div class="search-paper-card" style="background-color: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; transition: var(--transition);">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <span class="badge" style="background-color: var(--primary-glow); color: var(--secondary); font-size:0.75rem; padding: 0.2rem 0.5rem;">[학술지] ${venue}</span>
                            <span style="font-size:0.8rem; color:var(--text-muted);">피인용수: <strong style="color:var(--success);">${citations}</strong>회</span>
                        </div>
                        <h4 style="font-size:1.1rem; font-weight:600; color:var(--text-main); line-height:1.4;">${title}</h4>
                        <p style="font-size:0.85rem; color:var(--text-muted);">저자: ${authors} (${year}년 발행)</p>
                        ${doi ? `<a href="${doi}" target="_blank" style="font-size:0.8rem; color:var(--secondary); text-decoration:underline;">DOI 연결 링크 &rarr;</a>` : ''}
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem; border-top:1px dashed var(--border-color); padding-top:0.75rem;">
                            <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace; max-width:80%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">APA 인용: ${apaCitation}</span>
                            <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${apaCitation.replace(/'/g, "\\'")}').then(() => alert('인용 서지 정보가 복사되었습니다.'))" style="padding:0.25rem 0.6rem; font-size:0.75rem;">인용 복사</button>
                        </div>
                    </div>
                `;
            });

            els.searchResultsBox.innerHTML = html;

        } catch (err) {
            console.error(err);
            els.searchResultsBox.innerHTML = `
                <div style="text-align: center; color:var(--danger); padding-top:4rem;">
                    API 연동 중 통신 에러가 발생했습니다. 다시 시도해 주십시오. (오류: ${err.message})
                </div>
            `;
        }
    });

    // --------------------------------------------------
    // 5. TOC Planner & Balancer Logic
    // --------------------------------------------------
    let chaptersData = [];

    els.btnTocInit.addEventListener('click', () => {
        const targetPages = parseInt(els.tocTargetPages.value) || 80;
        const degree = els.tocDegree.value;
        
        els.tocTargetSum.textContent = targetPages;
        els.tocEmptyPlaceholder.style.display = 'none';
        els.btnTocAddChapter.style.display = 'block';

        // 학위별 표준 장별 비율 정의
        let defaults = [];
        if (degree === 'bachelor') {
            defaults = [
                { name: '제 1 장 서론 및 연구배경', pages: Math.ceil(targetPages * 0.15) },
                { name: '제 2 장 이론적 배경 및 관련 연구', pages: Math.ceil(targetPages * 0.3) },
                { name: '제 3 장 연구 설계 및 모델 개발', pages: Math.ceil(targetPages * 0.3) },
                { name: '제 4 장 실증 분석 및 평가 결과', pages: Math.ceil(targetPages * 0.15) },
                { name: '제 5 장 결론 및 한계점', pages: Math.ceil(targetPages * 0.1) }
            ];
        } else if (degree === 'master') {
            defaults = [
                { name: '제 1 장 서론 (Introduction)', pages: Math.ceil(targetPages * 0.1) },
                { name: '제 2 장 이론적 고찰 및 선행연구 분석', pages: Math.ceil(targetPages * 0.25) },
                { name: '제 3 장 제안 방법론 및 프레임워크', pages: Math.ceil(targetPages * 0.3) },
                { name: '제 4 장 시스템 구현 및 성능 평가', pages: Math.ceil(targetPages * 0.25) },
                { name: '제 5 장 결론 및 제언', pages: Math.ceil(targetPages * 0.1) }
            ];
        } else { // doctor
            defaults = [
                { name: '제 1 장 서론 및 문제 제기', pages: Math.ceil(targetPages * 0.1) },
                { name: '제 2 장 문헌 연구 및 비판적 분석', pages: Math.ceil(targetPages * 0.2) },
                { name: '제 3 장 연구 가설 및 분석 모형', pages: Math.ceil(targetPages * 0.25) },
                { name: '제 4 장 수치 검증 및 논리적 증명', pages: Math.ceil(targetPages * 0.25) },
                { name: '제 5 장 학문적 시사점 및 고찰', pages: Math.ceil(targetPages * 0.12) },
                { name: '제 6 장 결론 및 향후 과제', pages: Math.ceil(targetPages * 0.08) }
            ];
        }

        chaptersData = defaults;
        renderChapters();
        recalculateBalancer();
    });

    function renderChapters() {
        els.tocChaptersContainer.innerHTML = '';
        chaptersData.forEach((chapter, idx) => {
            const chRow = document.createElement('div');
            chRow.style.display = 'grid';
            chRow.style.gridTemplateColumns = '3fr 1fr 1fr';
            chRow.style.gap = '0.5rem';
            chRow.style.alignItems = 'center';
            chRow.style.backgroundColor = 'rgba(255,255,255,0.01)';
            chRow.style.border = '1px solid var(--border-color)';
            chRow.style.borderRadius = '6px';
            chRow.style.padding = '0.5rem 0.75rem';

            chRow.innerHTML = `
                <input type="text" value="${chapter.name}" class="chapter-name-input" data-idx="${idx}" style="background:transparent; border:none; color:var(--text-main); font-size:0.95rem; outline:none;" />
                <div style="display:flex; align-items:center; gap:0.25rem;">
                    <button class="btn btn-secondary btn-page-adjust" data-idx="${idx}" data-dir="down" style="padding:0.2rem 0.5rem; font-size:0.8rem;">-</button>
                    <input type="number" value="${chapter.pages}" class="chapter-page-input" data-idx="${idx}" style="width:45px; text-align:center; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-main); border-radius:4px; font-size:0.9rem;" />
                    <button class="btn btn-secondary btn-page-adjust" data-idx="${idx}" data-dir="up" style="padding:0.2rem 0.5rem; font-size:0.8rem;">+</button>
                    <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.2rem;">p</span>
                </div>
                <button class="btn btn-secondary btn-chapter-delete" data-idx="${idx}" style="padding:0.3rem 0.6rem; font-size:0.8rem; color:var(--danger); border-color:rgba(255,23,68,0.1); margin-left:auto;">삭제</button>
            `;
            els.tocChaptersContainer.appendChild(chRow);
        });

        // Bind events to rendered elements
        document.querySelectorAll('.chapter-name-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                chaptersData[idx].name = e.target.value;
            });
        });

        document.querySelectorAll('.chapter-page-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                chaptersData[idx].pages = Math.max(1, parseInt(e.target.value) || 1);
                recalculateBalancer();
            });
        });

        document.querySelectorAll('.btn-page-adjust').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const dir = e.target.getAttribute('data-dir');
                if (dir === 'up') {
                    chaptersData[idx].pages++;
                } else {
                    chaptersData[idx].pages = Math.max(1, chaptersData[idx].pages - 1);
                }
                renderChapters();
                recalculateBalancer();
            });
        });

        document.querySelectorAll('.btn-chapter-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                chaptersData.splice(idx, 1);
                renderChapters();
                recalculateBalancer();
            });
        });
    }

    els.btnTocAddChapter.addEventListener('click', () => {
        chaptersData.push({ name: `제 ${chaptersData.length + 1} 장 새로운 부록 및 연구`, pages: 5 });
        renderChapters();
        recalculateBalancer();
    });

    function recalculateBalancer() {
        const targetPages = parseInt(els.tocTargetPages.value) || 80;
        const currentSum = chaptersData.reduce((sum, ch) => sum + ch.pages, 0);

        els.tocAllocatedSum.textContent = currentSum;
        
        // Progress Gauge bar
        const percent = Math.min(100, (currentSum / targetPages) * 100);
        els.tocGaugeBar.style.width = `${percent}%`;

        // Feedback status
        if (currentSum === targetPages) {
            els.tocAllocatedStatus.textContent = '분량 밸런싱 최적 상태 (일치)';
            els.tocAllocatedStatus.style.backgroundColor = 'var(--success)';
            els.tocAllocatedStatus.style.color = '#000';
            els.tocGaugeBar.style.background = 'var(--success)';
        } else if (currentSum > targetPages) {
            els.tocAllocatedStatus.textContent = `분량 초과 (+${currentSum - targetPages}p)`;
            els.tocAllocatedStatus.style.backgroundColor = 'var(--danger)';
            els.tocAllocatedStatus.style.color = '#fff';
            els.tocGaugeBar.style.background = 'var(--danger)';
        } else {
            els.tocAllocatedStatus.textContent = `분량 부족 (-${targetPages - currentSum}p)`;
            els.tocAllocatedStatus.style.backgroundColor = 'var(--warning)';
            els.tocAllocatedStatus.style.color = '#000';
            els.tocGaugeBar.style.background = 'var(--warning)';
        }
    }

    els.btnTocExport.addEventListener('click', () => {
        if (chaptersData.length === 0) {
            alert('목차를 먼저 구성해 주세요.');
            return;
        }

        const title = els.tocTitle.value || '학술 논문 계획서';
        const targetPages = els.tocTargetPages.value;
        
        let markdown = `# ${title}\n\n`;
        markdown += `* **본문 목표 페이지**: 총 ${targetPages} 페이지\n`;
        markdown += `* **작성 학위**: ${els.tocDegree.options[els.tocDegree.selectedIndex].text}\n`;
        markdown += `* **설계 도구**: VerifyAI TOC Balancer\n\n`;
        markdown += `## 📐 세부 논문 목차 및 분량 설계안\n\n`;

        chaptersData.forEach(chapter => {
            markdown += `- **${chapter.name}** : \`${chapter.pages} p\` 할당\n`;
        });

        markdown += `\n---\n*본 문서의 페이지 배분 배율은 최적의 학위 심사 규격 논리 구조에 적합하도록 정교하게 배분된 결과물입니다.*`;

        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title.replace(/\s/g, '_')}_TOC_Plan.md`;
        link.click();
    });

    // --------------------------------------------------
    // 6. Korean / English Typing Practice Logic
    // --------------------------------------------------
    const typingSentences = {
        ko: [
            "동해물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세",
            "세월은 흐르는 물과 같아서 한번 지나가면 다시 돌아오지 않는다",
            "실패는 성공을 향해 나아가는 가장 가치 있는 배움의 어머니이다",
            "말 한마디로 천 냥 빚을 갚는다는 속담은 언어의 힘을 증명한다",
            "가는 말이 고와야 오는 말이 곱다는 인간관계의 영원한 진리이다",
            "인간의 지혜는 실패 속에서 단련되며 역경 속에서 더욱 빛을 발한다",
            "배움에는 끝이 없으며 지식의 축적만이 자아를 실현하는 유일한 길이다",
            "시간은 누구에게나 공평하지만 그것을 활용하는 가치는 천차만별이다",
            "작은 일에 정성을 다하는 연구가 결국 거대한 진리를 이끌어낸다",
            "정직과 신뢰는 학문 연구뿐만 아니라 삶 전체를 관통하는 핵심 윤리이다"
        ],
        en: [
            "The quick brown fox jumps over the lazy dog in the sunny afternoon.",
            "Talk is cheap. Show me the code and prove your implementation details.",
            "Stay hungry, stay foolish, and never stop chasing your academic goals.",
            "To be or not to be, that is the question we must answer carefully.",
            "Success is not final, failure is not fatal: it is the courage to continue.",
            "Strive not to be a success, but rather to be of value to others.",
            "An investment in knowledge always pays the best interest for everyone.",
            "Quality is not an act, it is a habit that defines our work ethics.",
            "Logic will get you from A to B. Imagination will take you everywhere.",
            "Honesty is the first chapter in the book of wisdom and scientific progress."
        ]
    };

    let typeState = {
        lang: 'ko',
        currentIdx: 0,
        startTime: null,
        maxCpm: parseInt(localStorage.getItem('typing_max_cpm')) || 0,
        characterTyped: 0
    };

    els.typeStatMaxCpm.textContent = typeState.maxCpm;

    els.btnTypeLangKo.addEventListener('click', () => {
        els.btnTypeLangKo.classList.add('active');
        els.btnTypeLangEn.classList.remove('active');
        typeState.lang = 'ko';
        resetTyping();
    });

    els.btnTypeLangEn.addEventListener('click', () => {
        els.btnTypeLangEn.classList.add('active');
        els.btnTypeLangKo.classList.remove('active');
        typeState.lang = 'en';
        resetTyping();
    });

    els.btnTypeReset.addEventListener('click', resetTyping);

    // 타자입력 창 및 백그라운드 바인딩
    const typingContainer = els.typeHiddenInput.parentElement;
    typingContainer.addEventListener('click', () => {
        els.typeHiddenInput.focus();
    });

    function resetTyping() {
        typeState.currentIdx = 0;
        typeState.startTime = null;
        typeState.characterTyped = 0;
        els.typeHiddenInput.value = '';
        els.typeStatCpm.textContent = '0';
        els.typeStatAccuracy.textContent = '100%';
        loadSentence();
    }

    function loadSentence() {
        const sentences = typingSentences[typeState.lang];
        const target = sentences[typeState.currentIdx];

        els.typeStatProgress.textContent = `${typeState.currentIdx + 1} / ${sentences.length}`;

        // 마크업으로 한 자씩 스팬으로 쪼개서 표시 (실시간 오타 체크용)
        els.typeTargetSentence.innerHTML = '';
        for (let char of target) {
            const span = document.createElement('span');
            span.textContent = char;
            els.typeTargetSentence.appendChild(span);
        }

        els.typeFeedbackLine.textContent = '';
        els.typeHiddenInput.value = '';
    }

    els.typeHiddenInput.addEventListener('input', (e) => {
        const targetText = typingSentences[typeState.lang][typeState.currentIdx];
        const inputText = e.target.value;

        // 시작 시간 기록
        if (!typeState.startTime && inputText.length > 0) {
            typeState.startTime = new Date();
        }

        // 스팬들 가져오기
        const spans = els.typeTargetSentence.querySelectorAll('span');
        let correctCount = 0;
        let errorCount = 0;

        spans.forEach((span, idx) => {
            const targetChar = targetText[idx];
            const inputChar = inputText[idx];

            if (inputChar == null) {
                // 아직 입력 안 됨
                span.className = '';
                span.style.color = 'var(--text-muted)';
                span.style.backgroundColor = 'transparent';
            } else if (inputChar === targetChar) {
                // 정확히 맞음
                span.className = 'char-correct';
                span.style.color = 'var(--success)';
                span.style.backgroundColor = 'rgba(0, 230, 118, 0.05)';
                correctCount++;
            } else {
                // 틀림 (오타)
                span.className = 'char-error';
                span.style.color = 'var(--danger)';
                span.style.backgroundColor = 'rgba(255, 23, 68, 0.15)';
                errorCount++;
            }
        });

        // 실시간 입력 피드백 라인 노출
        els.typeFeedbackLine.textContent = inputText;

        // 정확도 계산
        const totalTyped = inputText.length;
        if (totalTyped > 0) {
            const accuracy = Math.round((correctCount / totalTyped) * 100);
            els.typeStatAccuracy.textContent = `${accuracy}%`;
        } else {
            els.typeStatAccuracy.textContent = '100%';
        }

        // 실시간 타수 (CPM) 계산
        if (typeState.startTime && totalTyped > 0) {
            const elapsedMin = (new Date() - typeState.startTime) / 1000 / 60;
            const currentCpm = Math.round(correctCount / elapsedMin);
            if (currentCpm < 1500) { // 비정상 수치 튀는거 방지
                els.typeStatCpm.textContent = currentCpm;
                
                // 최고 타수 달성 체크
                if (currentCpm > typeState.maxCpm && totalTyped > 5) {
                    typeState.maxCpm = currentCpm;
                    els.typeStatMaxCpm.textContent = currentCpm;
                    localStorage.setItem('typing_max_cpm', currentCpm);
                }
            }
        }

        // 다음 문장 전환 감지 (제시어 글자수를 완전히 다 채우거나 맞게 끝냈을 때)
        if (inputText.length >= targetText.length) {
            typeState.currentIdx++;
            typeState.startTime = null; // 다음 문장을 위해 시간 리셋
            
            const sentences = typingSentences[typeState.lang];
            if (typeState.currentIdx >= sentences.length) {
                alert(`축하합니다! ${typeState.lang === 'ko' ? '국문' : '영문'} 단문 타자 연습 세트를 완료하셨습니다!`);
                resetTyping();
            } else {
                loadSentence();
            }
        }
    });

    // 엔터키를 눌렀을 때 다음 문장 넘어가기
    els.typeHiddenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const targetText = typingSentences[typeState.lang][typeState.currentIdx];
            const inputText = els.typeHiddenInput.value;
            
            // 공백이 아닌 타이핑 기록이 있을 때만 넘김
            if (inputText.length > 0) {
                typeState.currentIdx++;
                typeState.startTime = null;
                
                const sentences = typingSentences[typeState.lang];
                if (typeState.currentIdx >= sentences.length) {
                    alert(`축하합니다! ${typeState.lang === 'ko' ? '국문' : '영문'} 단문 타자 연습 세트를 완료하셨습니다!`);
                    resetTyping();
                } else {
                    loadSentence();
                }
            }
        }
    });

    // 기본 로드 설정
    updateCharStats();
    loadSentence();
});
