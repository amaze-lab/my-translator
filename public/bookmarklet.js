// public/bookmarklet.js
(function() {
  'use strict';

  // 중복 실행 방지
  if (document.getElementById('my-translator-overlay')) {
    document.getElementById('my-translator-overlay').remove();
  }

  // 1. 소설 본문 텍스트 추출 로직
  // 왓패드(Wattpad)는 일반 p 태그나 특정 컨테이너를 사용하므로, 본문 영역을 스마트하게 탐색합니다.
  let sourceText = "";
  
  // 예시 주소인 왓패드의 일반적인 본문 컨테이너 혹은 드래그 선택 영역 체크
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText) {
    sourceText = selectedText; // 사용자가 특정 문단만 드래그 선택했다면 해당 영역 번역
  } else {
    // 드래그가 없다면 전체 페이지에서 소설 본문이 될 만한 요소들을 긁어모읍니다.
    // 왓패드 본문 p 태그 기법 등 타겟팅
    const paragraphs = Array.from(document.querySelectorAll('p, pre'))
                            .map(el => el.innerText.trim())
                            .filter(txt => txt.length > 10); // 너무 짧은 메뉴 메뉴 제외
    
    // 상위 30개 문단 정도만 묶어서 보냄 (테스트 및 토큰 제한 안정성 확보)
    sourceText = paragraphs.slice(0, 35).join('\n\n');
  }

  if (!sourceText) {
    alert("번역할 본문 텍스트를 찾지 못했습니다. 번역할 영역을 마우스로 드래그한 뒤 다시 실행해보세요!");
    return;
  }

  // 2. 화면 하단에 띄울 반응형 내 번역기 UI 생성
  const overlay = document.createElement('div');
  overlay.id = 'my-translator-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    width: '100%',
    height: '60%',
    backgroundColor: '#ffffff',
    boxShadow: '0 -5px 25px rgba(0,0,0,0.15)',
    zIndex: '10000000',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'sans-serif',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    display: 'flex',
    flexDirection: 'column'
  });

  // 닫기 버튼 및 타이틀 영역
  const header = document.createElement('div');
  header.style.display = 'block';
  header.style.textAlign = 'right';
  header.style.marginBottom = '10px';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerText = '✕ 닫기';
  Object.assign(closeBtn.style, {
    background: '#e5e7eb',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  });
  closeBtn.onclick = () => overlay.remove();
  header.appendChild(closeBtn);
  overlay.appendChild(header);

  // 번역문 결과창 영역
  const contentContainer = document.createElement('div');
  Object.assign(contentContainer.style, {
    flex: '1',
    overflowY: 'auto',
    backgroundColor: '#f9fafb',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.7',
    fontSize: '16px',
    color: '#111827'
  });
  contentContainer.innerText = "⏳ AI가 문맥을 분석하여 번역 중입니다...";
  overlay.appendChild(contentContainer);

  document.body.appendChild(overlay);

  // 3. 내 Vercel 백엔드 API 서버로 번역 요청 보내기
  // 🔥 배포 후 'YOUR-PROJECT-NAME.vercel.app' 부분을 내 진짜 도메인 주소로 변경해야 합니다.
  const SERVER_URL = 'https://my-translator-blush.vercel.app/api/translate';

  fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sourceText })
  })
  .then(res => res.json())
  .then(data => {
    if (data.translated) {
      contentContainer.innerText = data.translated;
    } else {
      contentContainer.innerText = "❌ 번역 오류: " + (data.error || "알 수 없는 에러");
    }
  })
  .catch(err => {
    contentContainer.innerText = "❌ 서버 연결 실패. 배포 주소 또는 네트워크를 확인하세요.";
  });

})();
