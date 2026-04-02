/** PRD 비기능: 최소 8자, 영문·숫자 포함 */
export function passwordMatchesPhase1Policy(p: string): boolean {
  if (p.length < 8) return false;
  return /[A-Za-z]/.test(p) && /\d/.test(p);
}
