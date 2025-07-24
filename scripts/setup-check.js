#!/usr/bin/env node

// 설정 검증 스크립트
const fs = require("fs")
const path = require("path")

console.log("🔍 TapFi 설정 검증 중...\n")

// .env 파일 확인
const envPath = path.join(process.cwd(), ".env.local")
const envExamplePath = path.join(process.cwd(), ".env.example")

if (!fs.existsSync(envPath)) {
  console.log("❌ .env.local 파일이 없습니다.")
  console.log("📝 .env.example을 복사하여 .env.local을 생성하세요:\n")
  console.log("   cp .env.example .env.local\n")
  process.exit(1)
}

// 환경변수 읽기
require("dotenv").config({ path: envPath })

const requiredVars = [
  "NEXT_PUBLIC_USE_MOCK_DATA",
  "NEXT_PUBLIC_RPC_URL",
  "NEXT_PUBLIC_TAP_TOKEN_ADDRESS",
  "NEXT_PUBLIC_ETHERSCAN_API_KEY",
  "NEXT_PUBLIC_API_BASE_URL",
]

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

console.log(`📊 모드: ${useMockData ? "개발 (목업 데이터)" : "프로덕션 (실제 데이터)"}\n`)

let hasErrors = false

requiredVars.forEach((varName) => {
  const value = process.env[varName]
  const isSet = value && value !== "" && !value.includes("YOUR_")

  if (useMockData) {
    console.log(`✅ ${varName}: ${isSet ? "설정됨" : "목업 모드에서는 선택사항"}`)
  } else {
    if (isSet) {
      console.log(`✅ ${varName}: 설정됨`)
    } else {
      console.log(`❌ ${varName}: 설정 필요`)
      hasErrors = true
    }
  }
})

console.log("\n" + "=".repeat(50))

if (hasErrors && !useMockData) {
  console.log("❌ 실제 서비스 모드에서 필수 환경변수가 누락되었습니다.")
  console.log("📖 docs/SETUP_GUIDE.md를 참고하여 설정하세요.")
  process.exit(1)
} else {
  console.log("✅ 설정이 완료되었습니다!")
  console.log(`🚀 ${useMockData ? "개발을 시작" : "서비스를 배포"}할 수 있습니다.`)
}
