import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Plus, X, Info, Search, UserPlus, Mail } from 'lucide-react';
import { artists } from '../data';
import { workStore, draftStore } from '../store';
import type { Work } from '../data';
import type { Draft } from '../store';
import { toast, Toaster } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// 작품 업로드 페이지 — Phase 1 MVP
export default function Upload() {
  const navigate = useNavigate();

  // --- 콘텐츠 ---
  const [contents, setContents] = useState<
    Array<{
      id: string;
      type: 'image';
      url?: string;
      title?: string;
      artist?: { id: string; name: string; avatar: string };
    }>
  >([]);

  // --- 캔버스 설정 ---
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [contentSpacing, setContentSpacing] = useState(16);

  // --- 세부 정보 ---
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [detailTags, setDetailTags] = useState<string[]>([]);
  const [detailTagInput, setDetailTagInput] = useState('');
  const [coOwnerSearch, setCoOwnerSearch] = useState('');
  const [selectedCoOwners, setSelectedCoOwners] = useState<
    Array<{ id: string; name: string; avatar: string }>
  >([]);
  const [groupName, setGroupName] = useState('');
  const [isOriginalWork, setIsOriginalWork] = useState(false);

  // --- 강사 대리 업로드 ---
  const [isInstructorUpload, setIsInstructorUpload] = useState(false);
  const [taggedEmails, setTaggedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  // --- 이미지 선택 상태 ---
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [artistSearch, setArtistSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- 파일 핸들러 -----

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const currentCount = contents.length;
    const allowed = Math.min(files.length, 10 - currentCount);
    if (allowed <= 0) {
      toast.error('이미지는 최대 10장까지 업로드할 수 있습니다.');
      return;
    }
    const incoming: typeof contents = [];
    for (let i = 0; i < allowed; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: 10MB 이하 파일만 업로드 가능합니다.`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name}: JPG, PNG, WEBP만 지원됩니다.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        incoming.push({
          id: `${file.name}-${Date.now()}-${i}`,
          type: 'image',
          url: ev.target?.result as string,
        });
        if (incoming.length === allowed || incoming.length === files.length) {
          setContents((prev) => [...prev, ...incoming]);
        }
      };
      reader.readAsDataURL(file);
    }
    // 파일 입력 초기화 (같은 파일 재선택 허용)
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;
    // 가상 input 이벤트로 위임
    const dt = new DataTransfer();
    for (let i = 0; i < files.length; i++) dt.items.add(files[i]);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // ----- 태그 핸들러 -----

  const handleAddDetailTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && detailTagInput.trim()) {
      e.preventDefault();
      if (!detailTags.includes(detailTagInput.trim())) {
        setDetailTags([...detailTags, detailTagInput.trim()]);
      }
      setDetailTagInput('');
    }
  };

  const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emailInput.trim()) {
      e.preventDefault();
      const email = emailInput.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('올바른 이메일 형식이 아닙니다.');
        return;
      }
      if (taggedEmails.includes(email)) {
        toast.error('이미 추가된 이메일입니다.');
        return;
      }
      setTaggedEmails([...taggedEmails, email]);
      setEmailInput('');
    }
  };

  // ----- 발행 -----

  const handlePublish = () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    const imageContents = contents.filter((c) => c.type === 'image' && c.url);
    if (imageContents.length === 0) {
      toast.error('이미지를 최소 1장 추가해주세요.');
      return;
    }
    if (!isOriginalWork) {
      toast.error(
        isInstructorUpload
          ? '수강생 업로드 동의에 체크해주세요.'
          : '본인 창작물 확인에 체크해주세요.'
      );
      return;
    }

    const currentUser = artists[0];
    const imageUrls = imageContents.map((c) => c.url!);

    const categoryMap: Record<string, Work['category']> = {
      '미술': 'art',
      '패션': 'fashion',
      '공예': 'craft',
      '제품 디자인': 'product',
    };

    const newWork: Work = {
      id: `user-${Date.now()}`,
      title: title.trim(),
      image: imageUrls.length === 1 ? imageUrls[0] : imageUrls,
      artistId: currentUser.id,
      artist: currentUser,
      likes: 0,
      saves: 0,
      comments: 0,
      description: '',
      tags: detailTags,
      category: categoryMap[selectedCategories[0]] || 'art',
      coOwners:
        selectedCoOwners.length > 0
          ? selectedCoOwners.map((co) => ({
              id: co.id,
              name: co.name,
              avatar: co.avatar,
            }))
          : undefined,
      groupName: groupName.trim() || undefined,
      isForSale: false,
    } as Work;

    workStore.addWork(newWork);
    setShowDetailsModal(false);

    // 강사 업로드 시 초대 토스트
    if (isInstructorUpload && taggedEmails.length > 0) {
      toast.success(`수강생 ${taggedEmails.length}명에게 초대 알림이 발송되었습니다`);
    } else {
      toast.success('작품이 성공적으로 등록되었습니다!');
    }

    setTimeout(() => navigate('/profile'), 600);
  };

  // ----- 초안 저장 -----

  const handleSaveDraft = () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    const draft: Draft = {
      id: generateRandomId(),
      title: title.trim(),
      contents: contents.map((c) => ({
        id: c.id,
        type: 'image' as const,
        url: c.url,
        title: c.title,
        artist: c.artist,
      })),
      tags: detailTags,
      categories: selectedCategories,
      savedAt: new Date().toISOString(),
    };

    draftStore.saveDraft(draft);
    toast.success('초안이 저장되었습니다.');
    navigate('/profile');
  };

  // ----- 렌더링 -----

  const confirmLabel = isInstructorUpload
    ? '수강생의 업로드 동의를 확인했습니다'
    : '본인이 직접 창작한 원작임을 확인합니다';

  return (
    <div className="h-screen bg-[#FAFAFA] flex overflow-hidden">
      <Toaster position="top-center" richColors />
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />

      {/* ===== 세부 정보 설정 모달 ===== */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDetailsModal(false)}
          />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-8 py-5">
              <h2 className="text-xl font-semibold text-gray-900">세부 정보 설정</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {/* 강사 대리 업로드 토글 */}
              <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div>
                  <p className="text-base font-medium text-indigo-900">
                    수강생 작품 대신 올리기
                  </p>
                  <p className="text-sm text-indigo-600 mt-0.5">
                    강사가 수강생 작품을 대리 업로드합니다
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsInstructorUpload(!isInstructorUpload);
                    setIsOriginalWork(false);
                  }}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    isInstructorUpload ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      isInstructorUpload ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 수강생 이메일 태그 (강사 모드) */}
              {isInstructorUpload && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                  <label className="block text-base font-medium text-gray-900">
                    <Mail className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                    수강생 이메일 태그
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleAddEmail}
                    placeholder="수강생 이메일 입력"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                  {taggedEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {taggedEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                        >
                          {email}
                          <button
                            onClick={() =>
                              setTaggedEmails(taggedEmails.filter((e) => e !== email))
                            }
                            className="hover:text-indigo-950"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    태그된 수강생에게 작품 전시 초대 알림이 발송됩니다
                  </p>
                </div>
              )}

              {/* 제목 */}
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">
                  제목 <span className="text-cyan-500">(필수)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">
                  카테고리 <span className="text-cyan-500">(필수)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['미술', '패션', '공예', '제품 디자인'].map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        if (selectedCategories.includes(category)) {
                          setSelectedCategories(
                            selectedCategories.filter((c) => c !== category)
                          );
                        } else {
                          setSelectedCategories([...selectedCategories, category]);
                        }
                      }}
                      className={`px-3 py-3 text-base rounded-lg border transition-colors min-h-[44px] ${
                        selectedCategories.includes(category)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">
                  태그
                </label>
                <input
                  type="text"
                  value={detailTagInput}
                  onChange={(e) => setDetailTagInput(e.target.value)}
                  onKeyDown={handleAddDetailTag}
                  placeholder="Enter로 구분하여 입력해주세요."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
                {detailTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {detailTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() =>
                            setDetailTags(detailTags.filter((_, i) => i !== index))
                          }
                          className="hover:text-gray-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 공동 소유자 */}
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">
                  <UserPlus className="h-4 w-4 inline-block mr-1" />
                  공동 소유자
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  프로젝트에 참여한 다른 작가들을 추가하세요.
                </p>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={coOwnerSearch}
                    onChange={(e) => setCoOwnerSearch(e.target.value)}
                    placeholder="작가 이름으로 검색"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>

                {/* 검색 결과 */}
                {coOwnerSearch && (
                  <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mb-3">
                    {artists
                      .filter(
                        (artist) =>
                          artist.name
                            .toLowerCase()
                            .includes(coOwnerSearch.toLowerCase()) &&
                          !selectedCoOwners.some((co) => co.id === artist.id)
                      )
                      .slice(0, 5)
                      .map((artist) => (
                        <button
                          key={artist.id}
                          onClick={() => {
                            setSelectedCoOwners([
                              ...selectedCoOwners,
                              {
                                id: artist.id,
                                name: artist.name,
                                avatar: artist.avatar,
                              },
                            ]);
                            setCoOwnerSearch('');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors text-left min-h-[44px]"
                        >
                          <img
                            src={artist.avatar}
                            alt={artist.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="text-base font-medium text-gray-900">
                              {artist.name}
                            </div>
                            <div className="text-sm text-gray-500">{artist.bio}</div>
                          </div>
                        </button>
                      ))}
                    {artists.filter(
                      (artist) =>
                        artist.name
                          .toLowerCase()
                          .includes(coOwnerSearch.toLowerCase()) &&
                        !selectedCoOwners.some((co) => co.id === artist.id)
                    ).length === 0 && (
                      <div className="px-4 py-3 text-base text-gray-500 text-center">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                )}

                {/* 선택된 공동 소유자 */}
                {selectedCoOwners.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {selectedCoOwners.map((coOwner) => (
                      <div
                        key={coOwner.id}
                        className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={coOwner.avatar}
                            alt={coOwner.name}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                          <span className="text-base font-medium text-gray-900">
                            {coOwner.name}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedCoOwners(
                              selectedCoOwners.filter((co) => co.id !== coOwner.id)
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 클래스 / 동호회명 */}
              <div>
                <label className="block text-base font-medium text-gray-900 mb-2">
                  클래스 / 동호회명 <span className="text-gray-500 font-normal text-sm">(선택사항)</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="예: 00문화센터 수채화반, 00동호회"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              {/* 창작물 확인 체크박스 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOriginalWork}
                    onChange={(e) => setIsOriginalWork(e.target.checked)}
                    className="mt-1 w-5 h-5 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
                  />
                  <div>
                    <span className="block text-base font-medium text-gray-900">
                      {confirmLabel} <span className="text-cyan-500">(필수)</span>
                    </span>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {isInstructorUpload
                        ? '수강생의 동의 없이 작품을 업로드할 경우 책임은 업로더에게 있습니다.'
                        : '타인의 저작물을 도용하여 업로드할 경우 저작권법에 의해 제재를 받을 수 있습니다.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-8 py-5">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
              >
                닫기
              </button>
              <button
                onClick={handlePublish}
                className="px-8 py-3 bg-cyan-500 text-white text-base font-medium rounded-lg hover:bg-cyan-600 transition-colors min-h-[44px]"
              >
                발행하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 좌측: 업로드 & 프리뷰 영역 ===== */}
      <div
        className={`relative flex-1 flex flex-col overflow-y-auto p-12 ${
          !contents.length
            ? 'items-center justify-center'
            : 'items-center justify-start pt-12'
        }`}
        style={contents.length > 0 ? { backgroundColor } : undefined}
      >
        {!contents.length ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-16 text-center transition-all hover:border-cyan-400 hover:bg-cyan-50/30"
          >
            <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-cyan-100 flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-cyan-500" />
            </div>
            <p className="mb-2 text-lg font-medium text-gray-700">
              이미지(최대 10장)를 드래그 또는 업로드해주세요.
            </p>
            <p className="text-base text-gray-500">
              최대 10MB의 JPG, PNG, WEBP 이미지 파일
            </p>
          </div>
        ) : (
          <div className="relative w-full pb-20 z-10">
            <div
              className="relative z-10"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: `${contentSpacing}px`,
              }}
            >
              {contents.map((content, index) => (
                <div key={content.id} className="relative">
                  <div
                    onClick={() => setSelectedContentId(content.id)}
                    className={`relative w-full cursor-pointer transition-all overflow-hidden rounded-lg ${
                      selectedContentId === content.id
                        ? 'ring-4 ring-cyan-400'
                        : ''
                    }`}
                  >
                    <ImageWithFallback
                      src={content.url}
                      alt={content.title || `이미지 ${index + 1}`}
                      className="w-full h-auto object-cover block"
                    />
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContents(contents.filter((c) => c.id !== content.id));
                        if (selectedContentId === content.id) {
                          setSelectedContentId(null);
                        }
                      }}
                      className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 z-10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 이미지 추가 버튼 */}
              {contents.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-base text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors bg-white/50 backdrop-blur-sm min-h-[44px]"
                >
                  <Plus className="h-5 w-5 inline-block mr-1 -mt-0.5" />
                  이미지 추가하기 ({contents.length}/10)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== 우측: 설정 사이드바 ===== */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto flex flex-col">
        {/* 이미지 추가 버튼 */}
        <div className="mb-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-cyan-400 transition-colors min-h-[44px]"
          >
            <ImageIcon className="h-5 w-5 text-gray-700" />
            <span className="text-base font-medium text-gray-700">이미지 추가</span>
          </button>
        </div>

        {/* 선택된 이미지 제목/작업자 편집 */}
        {selectedContentId &&
          (() => {
            const selectedIndex = contents.findIndex(
              (c) => c.id === selectedContentId
            );
            const selectedContent = contents[selectedIndex];
            if (!selectedContent) return null;

            return (
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    {selectedIndex + 1}번 이미지 제목{' '}
                    <span className="text-gray-500 font-normal text-sm">
                      (선택사항)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={selectedContent.title || ''}
                    onChange={(e) => {
                      setContents(
                        contents.map((c) =>
                          c.id === selectedContentId
                            ? { ...c, title: e.target.value }
                            : c
                        )
                      );
                    }}
                    placeholder="미입력 시 '무제'로 표시됩니다"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  />
                </div>

                {/* 작업자 검색 */}
                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    작업자{' '}
                    <span className="text-gray-500 font-normal text-sm">
                      (선택사항)
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    미입력 시 본인으로 표시됩니다.
                  </p>

                  {selectedContent.artist ? (
                    <div className="flex items-center justify-between px-3 py-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <img
                          src={selectedContent.artist.avatar}
                          alt={selectedContent.artist.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="text-base font-medium text-gray-900">
                          {selectedContent.artist.name}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setContents(
                            contents.map((c) =>
                              c.id === selectedContentId
                                ? { ...c, artist: undefined }
                                : c
                            )
                          );
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={artistSearch}
                          onChange={(e) => setArtistSearch(e.target.value)}
                          placeholder="작가 이름으로 검색"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                      {artistSearch && (
                        <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mt-2">
                          {artists
                            .filter((artist) =>
                              artist.name
                                .toLowerCase()
                                .includes(artistSearch.toLowerCase())
                            )
                            .slice(0, 5)
                            .map((artist) => (
                              <button
                                key={artist.id}
                                onClick={() => {
                                  setContents(
                                    contents.map((c) =>
                                      c.id === selectedContentId
                                        ? {
                                            ...c,
                                            artist: {
                                              id: artist.id,
                                              name: artist.name,
                                              avatar: artist.avatar,
                                            },
                                          }
                                        : c
                                    )
                                  );
                                  setArtistSearch('');
                                }}
                                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors text-left min-h-[44px]"
                              >
                                <img
                                  src={artist.avatar}
                                  alt={artist.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                                <div>
                                  <div className="text-base font-medium text-gray-900">
                                    {artist.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {artist.bio}
                                  </div>
                                </div>
                              </button>
                            ))}
                          {artists.filter((artist) =>
                            artist.name
                              .toLowerCase()
                              .includes(artistSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-3 text-base text-gray-500 text-center">
                              검색 결과가 없습니다
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

        {/* 하단 설정 영역 */}
        <div className="mt-auto pt-6 space-y-5">
          {/* 배경색상 설정 */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-2">
              배경색상 설정
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer flex-shrink-0"
                style={{ backgroundColor }}
                onClick={() =>
                  document.getElementById('bg-color-input')?.click()
                }
              />
              <input
                id="bg-color-input"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="hidden"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setBackgroundColor(value);
                  }
                }}
                placeholder="#FFFFFF"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* 콘텐츠 간격 설정 */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              콘텐츠 간격
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={contentSpacing}
                onChange={(e) => setContentSpacing(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${contentSpacing}%, #e5e7eb ${contentSpacing}%, #e5e7eb 100%)`,
                }}
              />
              <div className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-base text-center font-medium">
                {contentSpacing}
              </div>
            </div>
          </div>

          {/* 세부 정보 설정 버튼 */}
          <button
            onClick={() => setShowDetailsModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors min-h-[44px]"
          >
            <Info className="h-5 w-5 text-green-600" />
            <span className="text-base font-semibold text-green-700">
              세부 정보 설정
            </span>
          </button>

          {/* 창작물 확인 */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOriginalWork}
                onChange={(e) => setIsOriginalWork(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <span className="text-base text-amber-900 leading-relaxed select-none">
                <strong>{confirmLabel}</strong>
              </span>
            </label>
          </div>

          {/* 발행 버튼 */}
          <button
            disabled={contents.length === 0 || !isOriginalWork}
            onClick={() => setShowDetailsModal(true)}
            className={`w-full py-3.5 rounded-full text-base font-semibold transition-all min-h-[44px] ${
              contents.length > 0 && isOriginalWork
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            발행하기
          </button>

          {/* 초안 저장 */}
          <button
            disabled={contents.length === 0}
            onClick={handleSaveDraft}
            className={`w-full py-3.5 rounded-full text-base font-semibold transition-all min-h-[44px] ${
              contents.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            초안으로 저장
          </button>
        </div>
      </div>
    </div>
  );
}

function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 11);
}
