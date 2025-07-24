# TapFi 실제 서비스 설정 가이드

## 🔧 필수 설정 단계

### 1. Infura 또는 Alchemy 계정 생성
\`\`\`bash
# 1. https://infura.io 또는 https://alchemy.com 가입
# 2. 새 프로젝트 생성
# 3. Project ID 복사
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/실제_프로젝트_ID
\`\`\`

### 2. Etherscan API Key 발급
\`\`\`bash
# 1. https://etherscan.io/apis 접속
# 2. 무료 계정 생성
# 3. API Key 발급
NEXT_PUBLIC_ETHERSCAN_API_KEY=실제_API_키
\`\`\`

### 3. TAP 토큰 컨트랙트 배포
```solidity
// TAP 토큰을 실제로 배포하거나
// 기존 ERC-20 토큰 주소 사용
NEXT_PUBLIC_TAP_TOKEN_ADDRESS=0x실제_토큰_주소
