document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const isActive = navMenu.classList.contains('active');
            menuToggle.innerHTML = isActive ? '&#x2715;' : '&#x2630;'; // Close (X) vs Hamburger icon
        });
    }

    // 2. Plagiarism Checker Simulator Logic
    const textarea = document.getElementById('checker-textarea');
    const charCount = document.getElementById('char-count');
    const btnCheck = document.getElementById('btn-check');
    const btnClear = document.getElementById('btn-clear');
    const btnSample = document.getElementById('btn-sample');
    const loaderOverlay = document.getElementById('loader-overlay');
    const progressBar = document.getElementById('progress-bar');
    const loaderStatus = document.getElementById('loader-status');
    const resultsContainer = document.getElementById('results-container');

    // Sample text for user simulation
    const sampleText = `Artificial Intelligence (AI) has revolutionized academic writing and research. However, the integration of large language models (LLMs) in scholarly publications raises significant concerns regarding academic integrity and authorship. Recent studies suggest that AI-generated text often lacks the depth of human-guided critical analysis. Plagiarism detection tools must adapt to identify not only copy-pasted human content but also generated synthetic text. In this paper, we propose a novel framework for detecting AI-augmented plagiarism in scientific literature, evaluating its performance across multiple academic disciplines. Our experiments show a 94% accuracy in distinguishing hybrid texts from pure human writing.`;

    if (textarea && charCount) {
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            charCount.textContent = count;
        });
    }

    if (btnSample && textarea && charCount) {
        btnSample.addEventListener('click', () => {
            textarea.value = sampleText;
            charCount.textContent = textarea.value.length;
            // Scroll to textarea smoothly
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    if (btnClear && textarea && charCount && resultsContainer) {
        btnClear.addEventListener('click', () => {
            textarea.value = '';
            charCount.textContent = '0';
            resultsContainer.style.display = 'none';
        });
    }

    if (btnCheck && textarea && loaderOverlay && progressBar && loaderStatus && resultsContainer) {
        btnCheck.addEventListener('click', () => {
            const text = textarea.value.trim();

            if (!text) {
                alert('검증할 텍스트를 입력하거나 샘플을 불러와 주세요.');
                return;
            }

            if (text.length < 20) {
                alert('분석을 위해 최소 20자 이상 입력해 주세요.');
                return;
            }

            // Start simulation
            resultsContainer.style.display = 'none';
            loaderOverlay.style.display = 'flex';
            progressBar.style.width = '0%';
            
            const steps = [
                '문장 구조 분석 중...',
                'DB 논문 대조 작업 중...',
                'AI 생성 흔적 검출 중...',
                '신뢰성 등급 계산 중...',
                '최종 리포트 생성 완료!'
            ];

            let progress = 0;
            let stepIndex = 0;

            const interval = setInterval(() => {
                progress += 5;
                progressBar.style.width = `${progress}%`;

                // Update text at specific milestones
                if (progress >= (stepIndex + 1) * 20 && stepIndex < steps.length - 1) {
                    stepIndex++;
                    loaderStatus.textContent = steps[stepIndex];
                }

                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        loaderOverlay.style.display = 'none';
                        showResults(text);
                    }, 400);
                }
            }, 80);
        });
    }

    function showResults(text) {
        const resultsContainer = document.getElementById('results-container');
        const scoreValue = document.getElementById('score-value');
        const scoreStatus = document.getElementById('score-status');
        const scoreCircle = document.getElementById('score-circle');
        
        const detailsPlagiarism = document.getElementById('details-plagiarism');
        const detailsAiGenerated = document.getElementById('details-ai-generated');
        const detailsUniqueness = document.getElementById('details-uniqueness');
        const detailsSentences = document.getElementById('details-sentences');

        if (!resultsContainer) return;

        // Generate mock data based on input text characteristics
        let plagiarismRate = 0;
        let aiRate = 0;

        if (text.includes('Artificial Intelligence') || text.includes('AI-generated')) {
            // Sample text or typical academic-style text
            plagiarismRate = 12;
            aiRate = 85;
        } else {
            // General text
            plagiarismRate = Math.floor(Math.random() * 20) + 5; // 5 ~ 25
            aiRate = Math.floor(Math.random() * 40) + 10; // 10 ~ 50
        }

        const uniqueness = 100 - Math.max(plagiarismRate, aiRate);
        const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

        // Populate values
        scoreValue.textContent = `${uniqueness}%`;
        
        // Style and status according to safety score
        if (uniqueness < 60) {
            scoreStatus.textContent = '주의 (표절 의심)';
            scoreStatus.className = 'score-status status-danger';
            scoreCircle.className = 'score-circle';
            scoreCircle.style.borderColor = 'var(--danger)';
        } else {
            scoreStatus.textContent = '안전 (표절 위험 낮음)';
            scoreStatus.className = 'score-status status-success';
            scoreCircle.className = 'score-circle clean';
            scoreCircle.style.borderColor = 'var(--success)';
        }

        detailsPlagiarism.textContent = `${plagiarismRate}%`;
        detailsAiGenerated.textContent = `${aiRate}%`;
        detailsUniqueness.textContent = `${uniqueness}%`;
        detailsSentences.textContent = `${sentenceCount}개 문장`;

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 3. Highlight Active Menu Link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href)) {
            link.classList.add('active');
        } else if (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html'))) {
            link.classList.add('active');
        }
    });
});
