export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-red-500 ml-0.5">*</span>
      <span className="sr-only">필수 입력</span>
    </>
  );
}
