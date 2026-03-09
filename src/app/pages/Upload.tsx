import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Plus, Upload as UploadIcon, X, Info, Search, UserPlus, Palette } from 'lucide-react';
import { artists } from '../data';
import { workStore, draftStore } from '../store';
import type { Work } from '../data';
import { imageUrls } from '../imageUrls';
import { extractColorPalette, ColorPaletteResult } from '../utils/colorPalette';

// 드로잉 툴 더미 데이터 (초기 로드용)
const DUMMY_DRAWINGS = [
  { id: 'dummy-1', url: imageUrls['spring-memory'] || '', title: '봄날의 벚꽃', timestamp: Date.now() - 86400000 * 2, timelapseUrl: 'https://example.com/timelapse/spring' },
  { id: 'dummy-2', url: imageUrls['window-light'] || '', title: '창가의 아침빛', timestamp: Date.now() - 86400000 * 1, timelapseUrl: 'https://example.com/timelapse/window' },
  { id: 'dummy-3', url: imageUrls['quiet-water'] || '', title: '고요한 물결', timestamp: Date.now() - 3600000 * 5 },
  { id: 'dummy-4', url: imageUrls['line-aesthetics'] || '', title: '선의 미학', timestamp: Date.now() - 3600000 * 2 },
  { id: 'dummy-5', url: imageUrls['abstract-harmony'] || '', title: '추상적 조화', timestamp: Date.now() - 3600000 },
];

// 작품 업로드 페이지 - 1~10장의 이미지 업로드 지원
export default function Upload() {
  const navigate = useNavigate();
  const [selectedImageType, setSelectedImageType] = useState<string | null>(null);
  const [contents, setContents] = useState<Array<{ id: string; type: 'image' | 'text'; url?: string; text?: string; title?: string; artist?: { id: string; name: string; avatar: string }; fromDrawingTool?: boolean; timelapseUrl?: string }>>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [suggestedBackgrounds, setSuggestedBackgrounds] = useState<ColorPaletteResult['suggestedBackgrounds']>([]);
  const [contentSpacing, setContentSpacing] = useState(16);
  const [isPrivate, setIsPrivate] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isOriginalWork, setIsOriginalWork] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDrawingImportModal, setShowDrawingImportModal] = useState(false);
  /** 타임랩스 URL 입력 중인 드로잉 ID (해당 행만 확장) */
  const [timelapseInputDrawingId, setTimelapseInputDrawingId] = useState<string | null>(null);
  const [timelapseInputUrl, setTimelapseInputUrl] = useState('');
  const [title, setTitle] = useState(''); // 작품명 (필수)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [detailTags, setDetailTags] = useState<string[]>([]);
  const [detailTagInput, setDetailTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coOwnerSearch, setCoOwnerSearch] = useState('');
  const [selectedCoOwners, setSelectedCoOwners] = useState<Array<{ id: string; name: string; avatar: string }>>([]);
  const [groupName, setGroupName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [artistSearch, setArtistSearch] = useState(''); // 작업자 검색

  // 개별 이미지별 커스터마이징 설정 (액자, 조명만)
  const [imageCustomizations, setImageCustomizations] = useState<Record<string, {
    frame: string;
    lightingAngle: number;
    lightingIntensity: number;
  }>>({});

  // 드로잉 툴에서 완성한 작품 목록 (timelapseUrl: SGF 연동 시 작업 과정 영상)
  const [savedDrawings, setSavedDrawings] = useState<Array<{ id: string; url: string; title: string; timestamp: number; timelapseUrl?: string }>>([]);


  // 컴포넌트 마운트 시 localStorage에서 드로잉 작품 불러오기
  useEffect(() => {
    const loadSavedDrawings = () => {
      try {
        const raw = localStorage.getItem('artier_drawings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedDrawings(parsed);
            return;
          }
        }
        // 저장된 작품이 없으면 더미 데이터로 초기화
        const seedDrawings = DUMMY_DRAWINGS.filter(d => d.url);
        if (seedDrawings.length > 0) {
          localStorage.setItem('artier_drawings', JSON.stringify(seedDrawings));
          setSavedDrawings(seedDrawings);
        }
      } catch (error) {
        console.error('드로잉 작품 불러오기 실패:', error);
      }
    };

    loadSavedDrawings();

    // postMessage를 통한 드로잉 툴과의 통신 리스너
    const handleMessage = (event: MessageEvent) => {
      // 보안을 위해 origin 체크 (실제 환경에서는 드로잉 툴의 origin으로 변경)
      // if (event.origin !== 'https://your-drawing-tool.com') return;

      if (event.data.type === 'DRAWING_SAVED') {
        const newDrawing = {
          id: `drawing-${Date.now()}`,
          url: event.data.imageUrl,
          title: event.data.title || '제목 없음',
          timestamp: Date.now(),
          timelapseUrl: event.data.timelapseUrl,
        };

        // localStorage에 저장
        const currentDrawings = JSON.parse(localStorage.getItem('artier_drawings') || '[]');
        const updatedDrawings = [newDrawing, ...currentDrawings];
        localStorage.setItem('artier_drawings', JSON.stringify(updatedDrawings));
        setSavedDrawings(updatedDrawings);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 업로드한 이미지에 따라 배경색 추천 자동 갱신
  useEffect(() => {
    const imageContents = contents.filter(c => c.type === 'image' && c.url);
    if (imageContents.length === 0) {
      setSuggestedBackgrounds([]);
      return;
    }
    const firstUrl = imageContents[0].url!;
    extractColorPalette(firstUrl)
      .then((res) => {
        setSuggestedBackgrounds(res.suggestedBackgrounds);
        if (res.suggestedBackgrounds.length > 0) {
          setBackgroundColor(res.suggestedBackgrounds[0].bgValue);
        }
      })
      .catch(() => setSuggestedBackgrounds([]));
  }, [contents]);

  const imageTypes = [
    { id: 'image', icon: ImageIcon, label: '작품 추가' },
    { id: 'drawing', icon: Palette, label: '드로잉 툴에서 가져오기' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: Array<{ id: string; url: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({ id: `${file.name}-${Date.now()}-${i}`, url: e.target?.result as string });
          if (newImages.length === files.length) {
            setContents([...contents, ...newImages.map(img => ({ ...img, type: 'image' as const }))]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      const newImages: Array<{ id: string; url: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({ id: `${file.name}-${Date.now()}-${i}`, url: e.target?.result as string });
          if (newImages.length === files.length) {
            setContents([...contents, ...newImages.map(img => ({ ...img, type: 'image' as const }))]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleAddDetailTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && detailTagInput.trim()) {
      e.preventDefault();
      if (!detailTags.includes(detailTagInput.trim())) {
        setDetailTags([...detailTags, detailTagInput.trim()]);
      }
      setDetailTagInput('');
    }
  };

  return (
    <div className="h-screen bg-[#FAFAFA] flex overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />

      {/* 세부 정보 설정 모달 */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 딥 배경 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDetailsModal(false)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
              <h2 className="text-[20px] font-semibold text-gray-900">세부 정보 설정</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* 왼쪽: 커버 이미지 */}
                <div>
                  <h3 className="text-[15px] font-medium text-gray-900 mb-2">
                    커버 이미지 <span className="text-cyan-500">(필수)</span>
                  </h3>
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4"></div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-700 hover:bg-gray-50 transition-colors">
                      콘텐츠에서 선택
                    </button>
                    <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-700 hover:bg-gray-50 transition-colors">
                      직접 업로드
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-3">
                    권장 이미지 크기 사이즈는 780x780이며, 5MB 이상 허용되지 않습니다. GIF 파일은 업로드할 수 있습니다.
                  </p>
                </div>

                {/* 오른쪽: 제목, 카테고리, 태그 */}
                <div>
                  {/* 제목 */}
                  <div className="mb-6">
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">
                      제목 <span className="text-cyan-500">(필수)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="제목을 입력하세요."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>

                  {/* 카테고리 */}
                  <div className="mb-6">
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">
                      카테고리 <span className="text-cyan-500">(필수)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        '미술',
                        '패션',
                        '공예',
                        '제품 디자인',
                      ].map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            if (selectedCategories.includes(category)) {
                              setSelectedCategories(selectedCategories.filter(c => c !== category));
                            } else {
                              setSelectedCategories([...selectedCategories, category]);
                            }
                          }}
                          className={`px-3 py-2 text-[13px] rounded-lg border transition-colors ${selectedCategories.includes(category)
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
                  <div className="mb-6">
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">태그</label>
                    <input
                      type="text"
                      value={detailTagInput}
                      onChange={(e) => setDetailTagInput(e.target.value)}
                      onKeyDown={handleAddDetailTag}
                      placeholder="Tab, Enter로 구분하여 입력해주세요."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                    {detailTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {detailTags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-[12px] rounded-full flex items-center gap-2"
                          >
                            {tag}
                            <button
                              onClick={() => setDetailTags(detailTags.filter((_, i) => i !== index))}
                              className="hover:text-gray-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 그룹 소유자 및 크레딧 */}
                  <div className="mb-6">
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">
                      <UserPlus className="h-4 w-4 inline-block mr-1" />
                      그룹 소유자 및 크레딧
                    </label>
                    <p className="text-[12px] text-gray-500 mb-3">
                      프로젝트에 참여한 다른 작가들을 추가하세요. 작품 페이지에 함께 표시됩니다.
                    </p>

                    {/* 검색 입력 */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={coOwnerSearch}
                        onChange={(e) => setCoOwnerSearch(e.target.value)}
                        placeholder="작가 이름으로 검색"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>

                    {/* 검색 결과 */}
                    {coOwnerSearch && (
                      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mb-3">
                        {artists
                          .filter(artist =>
                            artist.name.toLowerCase().includes(coOwnerSearch.toLowerCase()) &&
                            !selectedCoOwners.some(co => co.id === artist.id)
                          )
                          .slice(0, 5)
                          .map(artist => (
                            <button
                              key={artist.id}
                              onClick={() => {
                                setSelectedCoOwners([...selectedCoOwners, {
                                  id: artist.id,
                                  name: artist.name,
                                  avatar: artist.avatar
                                }]);
                                setCoOwnerSearch('');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            >
                              <img src={artist.avatar} alt={artist.name} className="h-8 w-8 rounded-full object-cover" />
                              <div>
                                <div className="text-[13px] font-medium text-gray-900">{artist.name}</div>
                                <div className="text-[11px] text-gray-500">{artist.bio}</div>
                              </div>
                            </button>
                          ))
                        }
                        {artists.filter(artist =>
                          artist.name.toLowerCase().includes(coOwnerSearch.toLowerCase()) &&
                          !selectedCoOwners.some(co => co.id === artist.id)
                        ).length === 0 && (
                            <div className="px-4 py-3 text-[13px] text-gray-500 text-center">
                              검색 결과가 없습니다
                            </div>
                          )}
                      </div>
                    )}

                    {/* 선택된 그룹 소유자 목록 */}
                    {selectedCoOwners.length > 0 && (
                      <>
                        <div className="space-y-2 mb-3">
                          {selectedCoOwners.map(coOwner => (
                            <div
                              key={coOwner.id}
                              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <img src={coOwner.avatar} alt={coOwner.name} className="h-7 w-7 rounded-full object-cover" />
                                <span className="text-[13px] font-medium text-gray-900">{coOwner.name}</span>
                              </div>
                              <button
                                onClick={() => setSelectedCoOwners(selectedCoOwners.filter(co => co.id !== coOwner.id))}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* 그룹명 입력 */}
                        <div className="border-t border-gray-200 pt-3">
                          <label className="block text-[13px] font-medium text-gray-900 mb-2">
                            그룹명 <span className="text-gray-500">(선택사항)</span>
                          </label>
                          <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="예: 한국전통화컬렉티브, 컬러스케치팀"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          />
                          <p className="text-[11px] text-gray-500 mt-2">
                            그룹명을 입력하면 작품 페이지에서 개인 이름 대신 그룹명으로 표시됩니다.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 저작권 (CCL) */}
                  <div>
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">저작권 (CCL)</label>
                    <p className="text-[13px] text-gray-600">
                      저작권표시-비영리-변경금지 <a href="#" className="text-cyan-500 hover:underline ml-1">저작권 수정 &gt;</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-8 py-5">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2.5 text-[14px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  // 유효성 검사
                  if (!title.trim()) {
                    alert('제목을 입력해주세요.');
                    return;
                  }
                  const imageContents = contents.filter(c => c.type === 'image' && c.url);
                  if (imageContents.length === 0) {
                    alert('이미지를 최소 1장 추가해주세요.');
                    return;
                  }

                  // workStore에 작품 추가
                  const currentUser = artists[0];
                  const imageUrls = imageContents.map(c => c.url!);
                  const newWork: Work = {
                    id: `user-${Date.now()}`,
                    title: title.trim(),
                    image: imageUrls.length === 1 ? imageUrls[0] : imageUrls,
                    artistId: currentUser.id,
                    artist: currentUser,
                    likes: 0,
                    saves: 0,
                    comments: 0,
                    isForSale: false,
                    description: '',
                    tags: [...tags, ...detailTags],
                    category: selectedCategories[0] === '미술' ? 'art'
                      : selectedCategories[0] === '패션' ? 'fashion'
                        : selectedCategories[0] === '공예' ? 'craft'
                          : selectedCategories[0] === '제품 디자인' ? 'product'
                            : 'art',
                    coOwners: selectedCoOwners.length > 0 ? selectedCoOwners.map(co => ({
                      id: co.id,
                      name: co.name,
                      avatar: co.avatar,
                    })) : undefined,
                    groupName: groupName.trim() || undefined,
                    saleStatus: 'none',
                    timelapseUrl: contents.find(c => c.fromDrawingTool)?.timelapseUrl?.trim() || undefined,
                  };

                  workStore.addWork(newWork);
                  setShowDetailsModal(false);
                  alert('작품이 성공적으로 등록되었습니다!');
                  navigate('/profile');
                }}
                className="px-8 py-2.5 bg-cyan-500 text-white text-[14px] font-medium rounded-lg hover:bg-cyan-600 transition-colors"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 드로잉 툴에서 작품 가져오기 모달 */}
      {showDrawingImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 딥 배경 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDrawingImportModal(false)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
              <h2 className="text-[20px] font-semibold text-gray-900">드로잉 툴에서 작품 가져오기</h2>
              <button
                onClick={() => setShowDrawingImportModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {savedDrawings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <Palette className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-[16px] font-medium text-gray-900 mb-2">저장된 드로잉 작품이 없습니다</h3>
                  <p className="text-[14px] text-gray-500 mb-6">
                    드로잉 툴에서 작품을 완성하고 저장하면 여기에 표시됩니다.
                  </p>
                  <button
                    onClick={() => {
                      const drawingToolUrl = 'https://sgf.iproud.app/studio'; // 실제 드로잉 툴 URL로 변경
                      const urlWithParams = `${drawingToolUrl}?source=artier&returnUrl=${encodeURIComponent(window.location.origin + '/upload')}`;
                      window.open(urlWithParams, '_blank');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white text-[14px] font-medium rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    <Palette className="h-4 w-4" />
                    드로잉 툴 열기
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-8 mb-8">
                  {/* 왼쪽: 드로잉 작품 목록 */}
                  <div className="col-span-2">
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
                      저장된 작품 ({savedDrawings.length}개)
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {savedDrawings.map(drawing => (
                        <div key={drawing.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-gray-300 hover:shadow-sm transition-all">
                          <div className="flex gap-4 p-3">
                            {/* 썸네일 - 작품과 버튼 시각적 연관 강화 */}
                            <div className="flex-shrink-0">
                              <img src={drawing.url} alt={drawing.title} className="h-24 w-24 rounded-lg object-cover border border-gray-100" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                              <div className="text-[13px] font-semibold text-gray-900 truncate">{drawing.title}</div>
                              <div className="text-[11px] text-gray-500">
                                {new Date(drawing.timestamp).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {/* 버튼을 제목/날짜 바로 아래에 배치 - 어떤 작품의 액션인지 명확 */}
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    setContents([...contents, { id: drawing.id, type: 'image', url: drawing.url, fromDrawingTool: true }]);
                                    setShowDrawingImportModal(false);
                                    setTimelapseInputDrawingId(null);
                                  }}
                                  className="px-2.5 py-1.5 border border-gray-300 text-gray-700 text-[11px] font-medium rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                >
                                  이미지 가져오기
                                </button>
                                <button
                                  onClick={() => {
                                    if (drawing.timelapseUrl) {
                                      setContents([...contents, { id: drawing.id, type: 'image', url: drawing.url, fromDrawingTool: true, timelapseUrl: drawing.timelapseUrl }]);
                                      setShowDrawingImportModal(false);
                                      setTimelapseInputDrawingId(null);
                                    } else {
                                      setTimelapseInputDrawingId(timelapseInputDrawingId === drawing.id ? null : drawing.id);
                                      setTimelapseInputUrl('');
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-cyan-500 text-white text-[11px] font-medium rounded-md hover:bg-cyan-600 transition-colors"
                                >
                                  타임랩스로 가져오기
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* 타임랩스 URL 입력 (연동된 URL이 없을 때만) */}
                          {timelapseInputDrawingId === drawing.id && !drawing.timelapseUrl && (
                            <div className="border-t border-gray-100 bg-cyan-50/50 px-3 py-3 flex items-center gap-2">
                              <input
                                type="url"
                                value={timelapseInputUrl}
                                onChange={(e) => setTimelapseInputUrl(e.target.value)}
                                placeholder="타임랩스 영상 URL 입력"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setContents([...contents, { id: drawing.id, type: 'image', url: drawing.url, fromDrawingTool: true, timelapseUrl: timelapseInputUrl.trim() }]);
                                    setShowDrawingImportModal(false);
                                    setTimelapseInputDrawingId(null);
                                    setTimelapseInputUrl('');
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  setContents([...contents, { id: drawing.id, type: 'image', url: drawing.url, fromDrawingTool: true, timelapseUrl: timelapseInputUrl.trim() }]);
                                  setShowDrawingImportModal(false);
                                  setTimelapseInputDrawingId(null);
                                  setTimelapseInputUrl('');
                                }}
                                className="px-4 py-2 bg-cyan-500 text-white text-[13px] font-medium rounded-lg hover:bg-cyan-600 flex-shrink-0"
                              >
                                추가
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 오른쪽: 드로잉 툴 열기 */}
                  <div className="col-span-1">
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
                      새로운 작품 만들기
                    </h3>
                    <div className="border-2 border-dashed border-cyan-200 rounded-xl p-8 text-center bg-gradient-to-b from-cyan-50/50 to-white hover:border-cyan-300 transition-colors">
                      <div className="mx-auto mb-5 h-20 w-20 rounded-2xl bg-cyan-100 flex items-center justify-center shadow-inner">
                        <Palette className="h-10 w-10 text-cyan-600" />
                      </div>
                      <p className="text-[13px] text-gray-600 leading-relaxed mb-6 max-w-[220px] mx-auto">
                        드로잉 툴을 열어 새로운 작품을 만드세요.<br />
                        <span className="text-gray-500">완성된 작품은 자동으로 목록에 추가됩니다.</span>
                      </p>
                      <button
                        onClick={() => {
                          const drawingToolUrl = '/drawing-tool'; // 실제 드로잉 툴 URL로 변경
                          const urlWithParams = `${drawingToolUrl}?source=artier&returnUrl=${encodeURIComponent(window.location.origin + '/upload')}`;
                          window.open(urlWithParams, '_blank');
                        }}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-cyan-500 text-white text-[14px] font-semibold rounded-xl hover:bg-cyan-600 shadow-md hover:shadow-lg transition-all"
                      >
                        <Palette className="h-4 w-4" />
                        드로잉 툴 열기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-8 py-5">
              <button
                onClick={() => setShowDrawingImportModal(false)}
                className="px-6 py-2.5 text-[14px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 좌측: 업로드 & 프리뷰 영역 */}
      <div
        className={`relative flex-1 flex flex-col overflow-y-auto p-12 ${!contents.length ? 'items-center justify-center' : 'items-center justify-start pt-12'}`}
        style={contents.length > 0 ? { backgroundColor } : undefined}
      >
        {!contents.length ? (
          <>
            <h2 className="text-[20px] text-gray-600 mb-12">
              콘텐츠를 선택하여 업로드를 시작하세요.
            </h2>

            {/* 파일 업로드 드롭존 */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-16 text-center transition-all hover:border-cyan-400 hover:bg-cyan-50/30"
            >
              <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-cyan-100 flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-cyan-500" />
              </div>
              <p className="mb-2 text-[16px] font-medium text-gray-700">이미지(최대 10장)를 드래그 또는 업로드해주세요.</p>
              <p className="text-[14px] text-gray-500">최대 10MB의 JPG, JPEG, PNG, WEBP 이미지 파일</p>
            </div>
          </>
        ) : (
          <div className="relative w-full pb-20 z-10">
            {/* 콘텐츠 목록 */}
            <div
              className="relative z-10"
              style={{ display: 'flex', flexDirection: 'column', gap: `${contentSpacing}px` }}
            >
              {contents.map((content, index) => {
                // 개별 이미지 커스터마이징 설정 가져오기
                const customization = imageCustomizations[content.id] || {
                  frame: 'none',
                  lightingAngle: 45,
                  lightingIntensity: 70,
                };

                // 액자 스타일
                const getFrameStyle = (frame: string) => {
                  switch (frame) {
                    case 'none':
                      return { borderWidth: '0px' };
                    case 'modern':
                      return { borderColor: '#1a1a1a', borderWidth: '12px' };
                    case 'wood':
                      return { borderColor: '#8B6F47', borderWidth: '16px', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)' };
                    case 'gold':
                      return { borderColor: '#D4AF37', borderWidth: '14px', boxShadow: 'inset 0 0 12px rgba(255,215,0,0.4)' };
                    case 'white':
                      return { borderColor: '#FFFFFF', borderWidth: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' };
                    default:
                      return { borderWidth: '0px' };
                  }
                };

                return (
                  <div key={content.id} className="relative">
                    {content.type === 'image' ? (
                      <div
                        onClick={() => {
                          setSelectedContentId(content.id);
                        }}
                        className={`relative w-full cursor-pointer transition-all overflow-hidden ${selectedContentId === content.id ? 'ring-4 ring-cyan-400' : ''
                          }`}
                      >
                        {/* 조명 효과 레이어 */}
                        <div
                          className="absolute inset-0 pointer-events-none z-10"
                          style={{
                            background: `radial-gradient(ellipse at ${customization.lightingAngle}% 30%, rgba(255,255,255,${customization.lightingIntensity / 200}) 0%, transparent 70%)`,
                          }}
                        />

                        {/* 액자 + 이미지 */}
                        <div className="relative">
                          {/* 이미지 */}
                          <img
                            src={content.url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-auto object-cover"
                            style={{ display: 'block' }}
                          />

                          {/* 액자 오버레이 (이미지 위에 덮어씌움) */}
                          {customization.frame !== 'none' && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                border: 'solid',
                                ...getFrameStyle(customization.frame),
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                              }}
                            />
                          )}
                        </div>

                        {/* 우측 상단 버튼들 */}
                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                          {/* 삭제 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContents(contents.filter(c => c.id !== content.id));
                              if (selectedContentId === content.id) {
                                setSelectedContentId(null);
                              }
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setSelectedContentId(content.id);
                          if (editingTextId !== content.id) {
                            setEditingTextId(content.id);
                          }
                        }}
                        className={`relative w-full p-8 rounded-2xl bg-white border-2 cursor-pointer transition-all ${selectedContentId === content.id ? 'border-cyan-400' : 'border-gray-200'
                          }`}
                      >
                        {editingTextId === content.id ? (
                          <textarea
                            value={content.text}
                            onChange={(e) => {
                              setContents(
                                contents.map(c =>
                                  c.id === content.id ? { ...c, text: e.target.value } : c
                                )
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => {
                              setTimeout(() => setEditingTextId(null), 100);
                            }}
                            autoFocus
                            className="w-full min-h-[150px] text-[18px] text-gray-800 leading-relaxed resize-none focus:outline-none"
                          />
                        ) : (
                          <p className="text-[18px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {content.text}
                          </p>
                        )}

                        {/* 삭제 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContents(contents.filter(c => c.id !== content.id));
                            if (selectedContentId === content.id) {
                              setSelectedContentId(null);
                            }
                          }}
                          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 추가 업로드 안내 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-[14px] text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors bg-white/50 backdrop-blur-sm"
              >
                + 작품 추가하기
              </button>

              {/* 현재 적용된 테마 표시 */}
            </div>
          </div>
        )}
      </div>

      {/* 우측: 설정 사이드바 */}
      <div className="w-1/4 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        {/* 이미지/텍스트 추가 버튼 - 최상단으로 이동 */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            {imageTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedImageType(type.id);
                  if (type.id === 'image') {
                    fileInputRef.current?.click();
                  } else if (type.id === 'drawing') {
                    setShowDrawingImportModal(true);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-2 p-3 border-2 rounded-xl transition-colors ${selectedImageType === type.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent">
                  <type.icon className="h-5 w-5 text-gray-700" />
                </div>
                <span className="text-[12px] font-medium text-gray-700 text-center leading-tight">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 제목 입력 - 이미지가 선택된 경우 */}
        {selectedContentId && contents.find(c => c.id === selectedContentId)?.type === 'image' && (() => {
          const selectedIndex = contents.findIndex(c => c.id === selectedContentId);
          const selectedContent = contents[selectedIndex];
          const customization = imageCustomizations[selectedContentId] || {
            frame: 'none',
            lightingAngle: 45,
            lightingIntensity: 70,
          };

          return (
            <div className="space-y-6">
              {/* 이미지 제목 입력 */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                  {selectedIndex + 1}번 이미지 제목 <span className="text-gray-500 font-normal text-[12px]">(선택사항)</span>
                </label>
                <input
                  type="text"
                  value={selectedContent.title || ''}
                  onChange={(e) => {
                    setContents(
                      contents.map(c =>
                        c.id === selectedContentId ? { ...c, title: e.target.value } : c
                      )
                    );
                  }}
                  placeholder="미입력 시 '무제'로 표시됩니다"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              {/* 작업자 입력 */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                  작업자 <span className="text-gray-500 font-normal text-[12px]">(선택사항)</span>
                </label>
                <p className="text-[12px] text-gray-500 mb-2">
                  미입력 시 본인으로 표시됩니다.
                </p>

                {selectedContent.artist ? (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <img src={selectedContent.artist.avatar} alt={selectedContent.artist.name} className="h-8 w-8 rounded-full object-cover" />
                      <span className="text-[13px] font-medium text-gray-900">{selectedContent.artist.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setContents(
                          contents.map(c =>
                            c.id === selectedContentId ? { ...c, artist: undefined } : c
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
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>

                    {artistSearch && (
                      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mt-2">
                        {artists
                          .filter(artist =>
                            artist.name.toLowerCase().includes(artistSearch.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(artist => (
                            <button
                              key={artist.id}
                              onClick={() => {
                                setContents(
                                  contents.map(c =>
                                    c.id === selectedContentId ? {
                                      ...c,
                                      artist: {
                                        id: artist.id,
                                        name: artist.name,
                                        avatar: artist.avatar
                                      }
                                    } : c
                                  )
                                );
                                setArtistSearch('');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            >
                              <img src={artist.avatar} alt={artist.name} className="h-8 w-8 rounded-full object-cover" />
                              <div>
                                <div className="text-[13px] font-medium text-gray-900">{artist.name}</div>
                                <div className="text-[11px] text-gray-500">{artist.bio}</div>
                              </div>
                            </button>
                          ))
                        }
                        {artists.filter(artist =>
                          artist.name.toLowerCase().includes(artistSearch.toLowerCase())
                        ).length === 0 && (
                            <div className="px-4 py-3 text-[13px] text-gray-500 text-center">
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

        {/* 하단 액션 버튼 */}
        <div className="mt-auto pt-8 space-y-3">
          {/* 배경색상 설정 */}
          <div className="mb-6">
            <label className="block text-[14px] font-semibold text-gray-900 mb-2">
              배경색상 설정
              {suggestedBackgrounds.length > 0 && (
                <span className="ml-1.5 text-[11px] font-normal text-cyan-600">· 작품 색상 기반 자동 추천</span>
              )}
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer flex-shrink-0"
                style={{ backgroundColor }}
                onClick={() => document.getElementById('bg-color-input')?.click()}
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
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
            {suggestedBackgrounds.length > 0 && (
              <div className="mt-3">
                <p className="text-[12px] text-gray-500 mb-2">작품에서 추출한 추천 배경</p>
                <div className="grid grid-cols-4 gap-2">
                  {suggestedBackgrounds.map((bg) => {
                    const isSelected = backgroundColor === bg.bgValue;
                    const r = parseInt(bg.bgValue.slice(1, 3), 16);
                    const g = parseInt(bg.bgValue.slice(3, 5), 16);
                    const b = parseInt(bg.bgValue.slice(5, 7), 16);
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    const isDark = luminance < 0.5;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setBackgroundColor(bg.bgValue)}
                        className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-sm'
                            : 'border-gray-200/80 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="aspect-square min-h-12"
                          style={{ backgroundColor: bg.bgValue }}
                        />
                        <div
                          className={`flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium ${
                            isDark ? 'text-white/95' : 'text-gray-700'
                          }`}
                          style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.85)' }}
                        >
                          {isSelected && <span className="text-cyan-600">✓</span>}
                          <span className="truncate">{bg.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 콘텐츠 간격 설정 */}
          <div className="mb-6">
            <label className="block text-[14px] font-semibold text-gray-900 mb-3">
              콘텐츠 간격 설정
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={contentSpacing}
                onChange={(e) => setContentSpacing(Number(e.target.value))}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${contentSpacing}%, #e5e7eb ${contentSpacing}%, #e5e7eb 100%)`
                }}
              />
              <div className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-[14px] text-center font-medium">
                {contentSpacing}px
              </div>
            </div>
          </div>

          {/* 세부 정보 설정 */}
          <div className="mb-6">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Info className="h-5 w-5 text-green-600" />
              <span className="text-[14px] font-semibold text-green-700">세부 정보 설정</span>
            </button>
          </div>

          {/* 작품 소유권 확인 장치 */}
          <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="original-work-check"
                checked={isOriginalWork}
                onChange={(e) => setIsOriginalWork(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <label htmlFor="original-work-check" className="text-[13px] text-amber-900 leading-relaxed cursor-pointer select-none">
                <strong>본인이 직접 창작한 예술 작품</strong>임을 확인합니다. 단순 사진이나 스냅샷은 업로드가 제한될 수 있습니다.
              </label>
            </div>
          </div>

          <button
            disabled={contents.length === 0 || !isOriginalWork}
            onClick={() => {
              // 유효성 검사
              if (!title.trim()) {
                alert('작품명을 입력해주세요.');
                return;
              }

              if (contents.length === 0) {
                alert('최소 1개 이상의 이미지를 업로드해주세요.');
                return;
              }

              // 이미지만 필터링
              const imageContents = contents.filter(c => c.type === 'image' && c.url);

              // 새 작품 생성
              const newWork: Work = {
                id: generateRandomId(),
                title: title.trim(),
                artistId: artists[0].id, // 현재 로그인 사용자
                artist: artists[0],
                image: imageContents.map(c => c.url!),
                likes: 0,
                saves: 0,
                comments: 0,
                category: selectedCategories.length > 0 ? selectedCategories[0] as Work['category'] : 'art',
                tags: tags,
                description: `${title} - ${artists[0].name}의 작품`,
                saleStatus: 'none',
                isForSale: false,
              };

              // workStore에 추가
              const workId = workStore.addWork(newWork);

              // 성공 알림
              alert('✨ 작품이 성공적으로 게시되었습니다!');

              // 작품 상세 페이지로 이동
              navigate(`/work/${workId}`);
            }}
            className={`w-full py-3.5 rounded-full text-[15px] font-semibold transition-all ${contents.length > 0 && isOriginalWork
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            계속
          </button>

          <button
            disabled={contents.length === 0}
            onClick={() => {
              // 초안 저장
              if (!title.trim()) {
                alert('작품명을 입력해주세요.');
                return;
              }

              const draft = {
                id: generateRandomId(),
                title: title.trim(),
                contents: contents,
                tags: tags,
                categories: selectedCategories,
                imageCustomizations: imageCustomizations,
                savedAt: new Date().toISOString(),
              };

              draftStore.saveDraft(draft);
              alert('💾 초안으로 저장되었습니다!');

              // 프로필 페이지의 초안 탭으로 이동
              navigate('/profile');
            }}
            className={`w-full py-3.5 rounded-full text-[15px] font-semibold transition-all ${contents.length > 0 && isOriginalWork
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            초안으로 저장
          </button>

          <button
            disabled={contents.length === 0}
            onClick={() => {
              // 미리보기 기능 (간단하게 구현)
              if (contents.length === 0) return;

              alert('🔍 미리보기: 현재 ' + contents.length + '개의 이미지가 업로드되었습니다.\n전시명: ' + (title || '(미입력)'));
            }}
            className={`w-full py-2 text-[14px] transition-all ${contents.length > 0
              ? 'text-gray-700 hover:text-gray-900'
              : 'text-gray-300 cursor-not-allowed'
              }`}
          >
            미리보기 확인
          </button>
        </div>

      </div>
    </div>
  );
}

function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 11);
}