# 아웃바운드 채용 대시보드 설정 가이드

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에 접속하여 계정을 생성합니다.
2. "New project" 버튼을 클릭합니다.
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전(Asia Northeast - Tokyo 권장)을 설정합니다.
4. 프로젝트가 생성될 때까지 약 2분 정도 기다립니다.

## 2. 데이터베이스 스키마 설정

1. Supabase 프로젝트 대시보드에서 좌측 메뉴의 **SQL Editor**를 클릭합니다.
2. `supabase/schema.sql` 파일의 전체 내용을 복사합니다.
3. SQL Editor에 붙여넣고 **Run** 버튼을 클릭합니다.
4. 성공 메시지가 나타나면 완료입니다.

테이블 확인: 좌측 메뉴의 **Table Editor**에서 `positions`, `sourcing_platforms`, `candidates` 테이블이 생성되었는지 확인합니다.

## 3. 환경변수 설정

1. Supabase 프로젝트 대시보드에서 좌측 메뉴의 **Settings** > **API**를 클릭합니다.
2. 다음 값을 복사합니다:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL` 값
   - **anon public** 키: `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값

3. 프로젝트 루트에 `.env.local` 파일을 생성합니다:

```bash
cp .env.local.example .env.local
```

4. `.env.local` 파일을 열어 값을 채웁니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_PASSWORD=원하는_어드민_비밀번호
```

## 4. 로컬에서 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.
- 대시보드: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- 어드민: [http://localhost:3000/admin](http://localhost:3000/admin) (로그인 필요)

## 5. Vercel 배포

### 방법 1: GitHub 연동 (권장)

1. GitHub에 프로젝트를 push합니다:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/recruitment-dashboard.git
git push -u origin main
```

2. [vercel.com](https://vercel.com)에 접속하여 로그인합니다.
3. "Add New Project"를 클릭합니다.
4. GitHub 저장소를 선택하고 "Import"를 클릭합니다.
5. **Environment Variables** 섹션에서 환경변수를 추가합니다 (6번 참고).
6. "Deploy" 버튼을 클릭합니다.

### 방법 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

## 6. Vercel 환경변수 설정

Vercel 프로젝트 대시보드에서 **Settings** > **Environment Variables**로 이동하여 다음 변수를 추가합니다:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Production, Preview, Development |
| `ADMIN_PASSWORD` | 어드민 비밀번호 | Production, Preview, Development |

환경변수 추가 후 **Redeploy**를 클릭하여 반영합니다.

## 7. 어드민 비밀번호 설정

- `.env.local`의 `ADMIN_PASSWORD` 값이 어드민 로그인 비밀번호입니다.
- 로컬: `.env.local` 파일에서 설정
- Vercel: Vercel 대시보드 Environment Variables에서 설정
- 비밀번호 변경 후에는 기존 로그인 쿠키가 무효화됩니다.

## 사용 방법

### 대시보드 (`/dashboard`)
- 아웃바운드 채용 퍼널 현황을 시각적으로 확인합니다.
- 포지션별, 단계별 필터링이 가능합니다.
- 단계별 전환율을 확인할 수 있습니다.

### 어드민 (`/admin`)
- 후보자를 추가, 수정, 삭제합니다.
- URL 입력 시 중복 여부를 자동으로 확인합니다.

### 설정 (`/admin/settings`)
- 채용 포지션을 추가하거나 삭제합니다.
- 소싱 플랫폼(LinkedIn, Wanted 등)을 관리합니다.

## 채용 단계 설명

| 단계 | 설명 |
|------|------|
| 아웃바운드 시도 | LinkedIn 등에서 연락한 모든 후보자 |
| 지원 | 지원서를 제출한 후보자 |
| 서류 통과 | 서류 심사를 통과한 후보자 |
| 면접 진행 | 면접을 진행 중인 후보자 |
| 최종 합격 | 최종 합격 통보를 받은 후보자 |
| 최종 합류 | 실제로 입사한 후보자 |

퍼널 계산 방식: 각 단계의 수치는 해당 단계 이상에 있는 모든 후보자를 포함합니다. 탈락한 후보자도 도달한 단계까지는 카운트에 포함됩니다.
