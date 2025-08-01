import { useEffect } from 'react';

export default function HideLegalFooter() {
    useEffect(() => {
        // Shadow DOM을 재귀적으로 탐색하여 branding-only 클래스를 찾는 함수
        const hideBrandingInShadowDom = (element: Element | ShadowRoot) => {
            // 현재 ShadowRoot 또는 요소에서 branding-only 찾기
            const branding = element.querySelector('.branding-only');
            if (branding instanceof HTMLElement) {
                branding.style.display = 'none';
            }

            // 모든 자식 요소에서 ShadowRoot 탐색
            const elements = element.querySelectorAll('*');
            elements.forEach((el) => {
                if (el.shadowRoot) {
                    hideBrandingInShadowDom(el.shadowRoot);
                }
            });
        };

        const observer = new MutationObserver(() => {
            const modal = document.querySelector('w3m-modal');
            if (modal && modal.shadowRoot) {
                console.log('11')
                const wui = modal?.querySelector('wui-flex')
                if (wui && wui.shadowRoot) {
                    console.log('wui')
                    console.log('wui: ', wui)
                    hideBrandingInShadowDom(wui.shadowRoot);
                }
                // hideBrandingInShadowDom(modal.shadowRoot);
            }
        });

        // document.body를 관찰하여 동적 요소 추가 감지
        observer.observe(document.body, { childList: true, subtree: true });

        // 초기 렌더링 시에도 즉시 확인
        const modal = document.querySelector('w3m-modal');
        if (modal && modal.shadowRoot) {
            console.log('Modal found');
            hideBrandingInShadowDom(modal.shadowRoot);
            const branding = modal.shadowRoot.querySelector('.branding-only');
            console.log('branding: ', branding);
        }

        // cleanup
        return () => observer.disconnect();
    }, []);

    return null;
}