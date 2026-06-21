// VerifyAI Custom Anonymous Comment System with Firebase Realtime Database
(function() {
    // 1. Firebase 설정값
    const firebaseConfig = {
        apiKey: "AIzaSyBpQ5h7KEWlODaPAMEdvcS17Tvfh5LT_KM",
        authDomain: "verifyai-comments.firebaseapp.com",
        databaseURL: "https://verifyai-comments-default-rtdb.firebaseio.com",
        projectId: "verifyai-comments",
        storageBucket: "verifyai-comments.firebasestorage.app",
        messagingSenderId: "380681944671",
        appId: "1:380681944671:web:c434b970153ce87557a5ea",
        measurementId: "G-H6PXC5MFBD"
    };

    // Firebase 초기화
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();

    // 2. 현재 포스트 고유 ID 추출 (예: post-12)
    const getPostId = () => {
        const path = window.location.pathname;
        const match = path.match(/post-(\d+)\.html/);
        return match ? `post-${match[1]}` : 'general';
    };
    const postId = getPostId();

    // 3. 비밀번호 단순 해시 함수 (데이터베이스에 암호 날것이 보이지 않도록 필터링)
    const hashPassword = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return "hash_" + Math.abs(hash).toString(16);
    };

    // 4. 날짜 포맷 함수
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${y}.${m}.${d} ${hh}:${mm}`;
    };

    // 5. 모달 및 핵심 상태 관리
    let deleteTargetKey = null;
    let deleteTargetHash = null;

    // 6. 댓글창 HTML 마크업 동적 렌더링
    const renderCommentSection = () => {
        const container = document.getElementById('comment-section-container');
        if (!container) return;

        container.innerHTML = `
            <h2>독자 피드백 & 댓글</h2>
            
            <!-- 댓글 등록 폼 -->
            <div class="comment-form">
                <div class="comment-form-row">
                    <input type="text" id="comment-nickname" class="comment-input" placeholder="닉네임 (최대 10자)" maxlength="10">
                    <input type="password" id="comment-password" class="comment-input" placeholder="비밀번호 (삭제용 4자리 이상)" maxlength="12">
                </div>
                <textarea id="comment-content" class="comment-textarea" placeholder="건전한 연구 토론과 피드백을 남겨주세요. (최대 300자)" maxlength="300"></textarea>
                <div style="text-align: right;">
                    <button id="btn-submit-comment" class="btn btn-primary" style="padding: 0.7rem 1.8rem; font-size: 0.9rem;">댓글 등록</button>
                </div>
            </div>

            <!-- 댓글 리스트 영역 -->
            <div class="comment-list" id="comment-display-list">
                <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 2rem 0;">댓글을 불러오는 중입니다...</div>
            </div>

            <!-- 비밀번호 검증 모달창 -->
            <div class="comment-modal" id="comment-delete-modal">
                <div class="comment-modal-content">
                    <h3>댓글 삭제 비밀번호 확인</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">작성 시 입력했던 비밀번호를 적어주세요.</p>
                    <input type="password" id="delete-password-input" class="comment-input" placeholder="비밀번호 입력" maxlength="12">
                    <div class="comment-modal-actions">
                        <button id="btn-close-modal" class="btn btn-secondary">취소</button>
                        <button id="btn-confirm-delete" class="btn btn-primary" style="background: #ff5252; border-color: #ff5252;">삭제 확정</button>
                    </div>
                </div>
            </div>
        `;

        // 이벤트 바인딩
        document.getElementById('btn-submit-comment').addEventListener('click', submitComment);
        document.getElementById('btn-close-modal').addEventListener('click', closeModal);
        document.getElementById('btn-confirm-delete').addEventListener('click', confirmDelete);
        
        // 엔터키 모달 닫기 방지 및 자동 제출 연동
        document.getElementById('delete-password-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') confirmDelete();
        });
    };

    // 7. 댓글 등록 액션
    const submitComment = () => {
        const nickname = document.getElementById('comment-nickname').value.trim();
        const password = document.getElementById('comment-password').value.trim();
        const content = document.getElementById('comment-content').value.trim();

        if (!nickname) {
            alert('닉네임을 입력해 주세요.');
            return;
        }
        if (!password || password.length < 4) {
            alert('비밀번호는 최소 4자리 이상 입력해 주세요.');
            return;
        }
        if (!content) {
            alert('댓글 내용을 작성해 주세요.');
            return;
        }

        // DB 적재 데이터 구성 (비밀번호는 해싱하여 안전 보관)
        const commentData = {
            nickname: nickname,
            passwordHash: hashPassword(password),
            content: content,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        // Firebase 데이터 푸시
        database.ref(`comments/${postId}`).push(commentData)
            .then(() => {
                // 성공 시 입력창 청소
                document.getElementById('comment-nickname').value = '';
                document.getElementById('comment-password').value = '';
                document.getElementById('comment-content').value = '';
            })
            .catch((err) => {
                console.error("댓글 적재 실패:", err);
                alert("댓글 등록 도중 오류가 발생했습니다.");
            });
    };

    // 8. 댓글 목록 실시간 감지 및 렌더링
    const listenComments = () => {
        const displayList = document.getElementById('comment-display-list');
        if (!displayList) return;

        database.ref(`comments/${postId}`).on('value', (snapshot) => {
            displayList.innerHTML = '';
            const data = snapshot.val();

            if (!data) {
                displayList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 3rem 0;">첫 번째 피드백 댓글을 남겨보세요! 😊</div>`;
                return;
            }

            // 역순(최신 댓글이 맨 위로) 출력을 위한 정렬 배열화
            const keys = Object.keys(data);
            const sortedComments = keys.map(key => ({
                key: key,
                ...data[key]
            })).sort((a, b) => b.timestamp - a.timestamp);

            sortedComments.forEach((comment) => {
                const item = document.createElement('div');
                item.className = 'comment-item';
                item.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-author">${escapeHtml(comment.nickname)}</span>
                        <div class="comment-date">
                            <span>${formatDate(comment.timestamp)}</span>
                            <button class="comment-delete-btn" data-key="${comment.key}" data-hash="${comment.passwordHash}">삭제</button>
                        </div>
                    </div>
                    <div class="comment-body-text">${escapeHtml(comment.content)}</div>
                `;
                displayList.appendChild(item);
            });

            // 삭제 버튼 이벤트 바인딩
            const deleteButtons = displayList.querySelectorAll('.comment-delete-btn');
            deleteButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    deleteTargetKey = e.target.getAttribute('data-key');
                    deleteTargetHash = e.target.getAttribute('data-hash');
                    openModal();
                });
            });
        });
    };

    // HTML 이스케이프 함수 (XSS 크로스 사이트 스크립팅 방어)
    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };

    // 9. 모달창 열기/닫기/삭제 액션
    const openModal = () => {
        const modal = document.getElementById('comment-delete-modal');
        if (modal) {
            modal.classList.add('active');
            const pwdInput = document.getElementById('delete-password-input');
            pwdInput.value = '';
            pwdInput.focus();
        }
    };

    const closeModal = () => {
        const modal = document.getElementById('comment-delete-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        deleteTargetKey = null;
        deleteTargetHash = null;
    };

    const confirmDelete = () => {
        const inputPassword = document.getElementById('delete-password-input').value;
        if (!inputPassword) {
            alert('비밀번호를 입력해 주세요.');
            return;
        }

        const inputHash = hashPassword(inputPassword);
        if (inputHash === deleteTargetHash) {
            database.ref(`comments/${postId}/${deleteTargetKey}`).remove()
                .then(() => {
                    closeModal();
                })
                .catch((err) => {
                    console.error("댓글 삭제 실패:", err);
                    alert("댓글 삭제 도중 에러가 발생했습니다.");
                });
        } else {
            alert('비밀번호가 올바르지 않습니다.');
        }
    };

    // 초기화 기동
    document.addEventListener('DOMContentLoaded', () => {
        renderCommentSection();
        listenComments();
    });
})();
