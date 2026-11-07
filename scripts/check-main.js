// 배포 전 안전장치: 배포 사이트에는 main 브랜치 코드만 올린다.
const { execSync } = require('node:child_process');

const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
if (branch !== 'main') {
  console.error(`\n✘ 배포는 main 브랜치에서만 할 수 있어요. (현재 브랜치: ${branch})`);
  console.error('  develop을 main에 합친 뒤 `git switch main` 하고 다시 실행하세요.\n');
  process.exit(1);
}

const dirty = execSync('git status --porcelain').toString().trim();
if (dirty) {
  console.error('\n✘ 커밋하지 않은 변경이 있어요. 커밋한 뒤 배포하세요.\n');
  process.exit(1);
}
